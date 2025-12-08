import { DungeonMapData } from './types';
import { DungeonInstance, DungeonInstanceState } from './DungeonInstance';
import { GetDungeonConfig } from './configs/index';
import { CameraSystem } from '../systems/camera/camera_system';
import { GetDungeonZoneManager, DungeonZone } from './DungeonZoneManager';  // 新增

export class DungeonManager {
    private static instance: DungeonManager;
    private instances: Map<string, DungeonInstance> = new Map();
    private playerDungeonMap: Map<PlayerID, string> = new Map();
    private instanceZoneMap: Map<string, number> = new Map();  // 新增：副本ID -> 区域ID
    private nextInstanceId: number = 1;
    
    private constructor() {
        print('[DungeonManager] 副本管理器初始化');
    }
    
    public static GetInstance(): DungeonManager {
        if (!DungeonManager.instance) {
            DungeonManager.instance = new DungeonManager();
        }
        return DungeonManager.instance;
    }
    
    
/**
 * 创建新的副本实例
 */
public CreateDungeon(dungeonId: string, playerId?: PlayerID): string | null {
    const config = GetDungeonConfig(dungeonId);
    if (!config) {
        print(`[DungeonManager] 错误：找不到副本配置 ${dungeonId}`);
        return null;
    }
    
    // 从区域管理器分配区域
    const instanceId = `${dungeonId}_${this.nextInstanceId++}`;
    const zoneManager = GetDungeonZoneManager();
    const zone = zoneManager.AllocateZone(instanceId);
    
    if (!zone) {
        print(`[DungeonManager] 错误：无法分配区域给副本 ${instanceId}`);
        if (playerId !== undefined) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>副本区域已满，请稍后再试</font>`,
                playerId,
                0
            );
        }
        return null;
    }
    
    // 使用区域中心位置创建副本
    const spawnPosition = Vector(zone.centerX, zone.centerY, 128);
    
    const instance = new DungeonInstance(instanceId, spawnPosition, config);
    instance.Initialize();
    
    this.instances.set(instanceId, instance);
    this.instanceZoneMap.set(instanceId, zone.id);
    
    print(`[DungeonManager] 创建副本实例: ${instanceId} at 区域${zone.id} (${spawnPosition.x}, ${spawnPosition.y}, ${spawnPosition.z})`);
    
    return instanceId;
}
    
    /**
     * 玩家进入副本
     */
    public EnterDungeon(playerId: PlayerID, instanceId: string): boolean {
        const instance = this.instances.get(instanceId);
        if (! instance) {
            print(`[DungeonManager] 错误：副本实例不存在 ${instanceId}`);
            return false;
        }
        
        const currentInstanceId = this.playerDungeonMap.get(playerId);
        if (currentInstanceId) {
            print(`[DungeonManager] 警告：玩家 ${playerId} 已经在副本 ${currentInstanceId} 中`);
            return false;
        }
        
        instance.AddPlayer(playerId);
        this.playerDungeonMap.set(playerId, instanceId);
        
        if (instance.GetState() === DungeonInstanceState.WAITING) {
            instance.Start();
        }
        
        this.TeleportPlayerToDungeon(playerId, instanceId);
        
        print(`[DungeonManager] 玩家 ${playerId} 进入副本 ${instanceId}`);
        
        return true;
    }
    
    /**
     * 玩家离开副本
     */
    public LeaveDungeon(playerId: PlayerID, reason: 'complete' | 'death' | 'manual' = 'manual'): boolean {
        const instanceId = this.playerDungeonMap.get(playerId);
        if (! instanceId) {
            print(`[DungeonManager] 警告：玩家 ${playerId} 不在任何副本中`);
            return false;
        }
        
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.RemovePlayer(playerId);
            
            // 根据离开原因显示不同消息
            let message = '';
            switch (reason) {
                case 'complete':
                    message = '<font color=\'#00FF00\'>副本完成！返回主城</font>';
                    break;
                case 'death':
                    message = '<font color=\'#FF0000\'>你已死亡，离开副本</font>';
                    break;
                case 'manual':
                    message = '<font color=\'#FFFF00\'>离开副本</font>';
                    break;
            }
            GameRules.SendCustomMessage(message, playerId, 0);
        }
        
        this.playerDungeonMap.delete(playerId);
        
        // 返回主城并切换摄像头
        CameraSystem.ReturnToTown(playerId);
        
        print(`[DungeonManager] 玩家 ${playerId} 离开副本 ${instanceId}，原因: ${reason}`);
        
        // 检查副本是否应该清理
        if (instance && instance.GetPlayers().length === 0) {
            print(`[DungeonManager] 副本 ${instanceId} 无玩家，延迟清理`);
            Timers.CreateTimer(5, () => {  // 5秒后清理
                this.CleanupDungeon(instanceId);
                return undefined;
            });
        }
        
        return true;
    }
    
    /**
     * 传送玩家到副本入口
     */
    private TeleportPlayerToDungeon(playerId: PlayerID, instanceId: string): void {
        const instance = this.instances.get(instanceId);
        if (! instance) return;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        const config = instance.GetMapData();
        const generator = instance.GetGenerator();
        
        let entrancePos: Vector;
        
        if (config.entryPoints && config.entryPoints.length > 0) {
            const entryPoint = config.entryPoints[0];
            entrancePos = generator.GridToWorld(entryPoint.x, entryPoint.y);
            print(`[DungeonManager] 使用配置的入口点 (${entryPoint.x}, ${entryPoint.y})`);
        } else {
            entrancePos = generator.GridToWorld(-2, 10);
            print(`[DungeonManager] 使用默认入口点`);
        }
        
        print(`[DungeonManager] 计算出的入口位置: (${entrancePos.x.toFixed(1)}, ${entrancePos.y.toFixed(1)}, ${entrancePos.z.toFixed(1)})`);
        
        CameraSystem.EnterDungeon(playerId, entrancePos);
        
        print(`[DungeonManager] 传送玩家 ${playerId} 到副本入口完成`);
    }
    
    /**
     * 清理副本实例
     */
    public CleanupDungeon(instanceId: string): void {
        const instance = this.instances.get(instanceId);
        if (! instance) return;
        
        // 清理副本
        instance.Cleanup();
        
        // 移除所有玩家映射
        for (const [playerId, dungeonId] of this.playerDungeonMap.entries()) {
            if (dungeonId === instanceId) {
                this.playerDungeonMap.delete(playerId);
            }
        }
        
        // 释放区域
        const zoneId = this.instanceZoneMap.get(instanceId);
        if (zoneId !== undefined) {
            GetDungeonZoneManager().ReleaseZone(zoneId);
            this.instanceZoneMap.delete(instanceId);
        }
        
        this.instances.delete(instanceId);
        
        print(`[DungeonManager] 清理副本实例: ${instanceId}`);
    }
    
    /**
     * 获取玩家当前所在的副本ID
     */
    public GetPlayerDungeon(playerId: PlayerID): string | null {
        return this.playerDungeonMap.get(playerId) || null;
    }
    
    /**
     * 获取副本实例
     */
    public GetDungeonInstance(instanceId: string): DungeonInstance | null {
        return this.instances.get(instanceId) || null;
    }
    
    /**
     * 获取所有副本实例
     */
    public GetAllInstances(): DungeonInstance[] {
        return Array.from(this.instances.values());
    }
    
    /**
     * 清理所有副本
     */
    public CleanupAll(): void {
        print('[DungeonManager] 清理所有副本实例');
        
        for (const instanceId of this.instances.keys()) {
            this.CleanupDungeon(instanceId);
        }
        
        this.instances.clear();
        this.playerDungeonMap.clear();
        this.instanceZoneMap.clear();
    }
}

export function GetDungeonManager(): DungeonManager {
    return DungeonManager.GetInstance();
}