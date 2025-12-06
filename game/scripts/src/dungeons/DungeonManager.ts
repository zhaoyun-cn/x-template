import { DungeonMapData } from './types';
import { DungeonInstance, DungeonInstanceState } from './DungeonInstance';
import { GetDungeonConfig } from './configs/index';

/**
 * 副本管理器
 * 全局单例，管理所有副本实例
 */
export class DungeonManager {
    private static instance: DungeonManager;
    private instances: Map<string, DungeonInstance> = new Map();
    private playerDungeonMap: Map<PlayerID, string> = new Map(); // 玩家ID -> 副本实例ID
    private nextInstanceId: number = 1;
    
    private constructor() {
        print('[DungeonManager] 副本管理器初始化');
    }
    
    /**
     * 获取单例实例
     */
    public static GetInstance(): DungeonManager {
        if (!DungeonManager.instance) {
            DungeonManager.instance = new DungeonManager();
        }
        return DungeonManager.instance;
    }
    
    /**
     * 创建新的副本实例
     * @param dungeonId 副本配置ID
     * @param spawnPosition 副本生成位置
     * @returns 副本实例ID，失败返回 null
     */
    public CreateDungeon(dungeonId: string, spawnPosition: Vector): string | null {
        const config = GetDungeonConfig(dungeonId);
        if (!config) {
            print(`[DungeonManager] 错误：找不到副本配置 ${dungeonId}`);
            return null;
        }
        
        // 生成唯一的实例ID
        const instanceId = `${dungeonId}_${this.nextInstanceId++}`;
        
        // 创建副本实例
        const instance = new DungeonInstance(instanceId, spawnPosition, config);
        instance.Initialize();
        
        // 保存到管理器
        this.instances.set(instanceId, instance);
        
        print(`[DungeonManager] 创建副本实例: ${instanceId} at (${spawnPosition.x}, ${spawnPosition.y}, ${spawnPosition.z})`);
        
        return instanceId;
    }
    
    /**
     * 玩家进入副本
     * @param playerId 玩家ID
     * @param instanceId 副本实例ID
     * @returns 是否成功进入
     */
    public EnterDungeon(playerId: PlayerID, instanceId: string): boolean {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            print(`[DungeonManager] 错误：副本实例不存在 ${instanceId}`);
            return false;
        }
        
        // 检查玩家是否已经在副本中
        const currentInstanceId = this.playerDungeonMap.get(playerId);
        if (currentInstanceId) {
            print(`[DungeonManager] 警告：玩家 ${playerId} 已经在副本 ${currentInstanceId} 中`);
            return false;
        }
        
        // 添加玩家到副本
        instance.AddPlayer(playerId);
        this.playerDungeonMap.set(playerId, instanceId);
        
        // 如果副本还在等待状态，开始副本
        if (instance.GetState() === DungeonInstanceState.WAITING) {
            instance.Start();
        }
        
        // 传送玩家到副本入口
        this.TeleportPlayerToDungeon(playerId, instanceId);
        
        print(`[DungeonManager] 玩家 ${playerId} 进入副本 ${instanceId}`);
        
        return true;
    }
    
    /**
     * 玩家离开副本
     * @param playerId 玩家ID
     * @returns 是否成功离开
     */
    public LeaveDungeon(playerId: PlayerID): boolean {
        const instanceId = this.playerDungeonMap.get(playerId);
        if (!instanceId) {
            print(`[DungeonManager] 警告：玩家 ${playerId} 不在任何副本中`);
            return false;
        }
        
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.RemovePlayer(playerId);
        }
        
        this.playerDungeonMap.delete(playerId);
        
        print(`[DungeonManager] 玩家 ${playerId} 离开副本 ${instanceId}`);
        
        return true;
    }
    
    /**
     * 传送玩家到副本入口
     */
    private TeleportPlayerToDungeon(playerId: PlayerID, instanceId: string): void {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        // 计算入口位置（副本左下角）
        const mapData = (instance as any).generator.GetMapData();
        const entrancePos = (instance as any).generator.GridToWorld(0, 0);
        
        // 传送英雄
        hero.SetAbsOrigin(entrancePos);
        FindClearSpaceForUnit(hero, entrancePos, true);
        
        print(`[DungeonManager] 传送玩家 ${playerId} 到副本入口`);
    }
    
    /**
     * 清理副本实例
     * @param instanceId 副本实例ID
     */
    public CleanupDungeon(instanceId: string): void {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // 清理副本
        instance.Cleanup();
        
        // 移除所有在此副本中的玩家记录
        for (const [playerId, dungeonId] of this.playerDungeonMap.entries()) {
            if (dungeonId === instanceId) {
                this.playerDungeonMap.delete(playerId);
            }
        }
        
        // 从管理器中移除
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
    }
}

/**
 * 获取副本管理器的便捷函数
 */
export function GetDungeonManager(): DungeonManager {
    return DungeonManager.GetInstance();
}