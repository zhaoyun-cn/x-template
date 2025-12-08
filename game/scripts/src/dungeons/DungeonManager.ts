import { DungeonMapData } from './types';
import { DungeonInstance, DungeonInstanceState } from './DungeonInstance';
import { GetDungeonConfig } from './configs/index';
import { GetDungeonZoneManager } from './DungeonZoneManager';
import { MultiStageDungeonInstance } from './MultiStageDungeonInstance';
import { DUNGEON_FROST_TEMPLE_MULTI } from './configs/dungeon_frost_temple_multi';

/**
 * 副本管理器
 * 负责创建、管理和清理副本实例
 */
class DungeonManager {
    private static instance: DungeonManager;
    private instances: Map<string, DungeonInstance | MultiStageDungeonInstance> = new Map();
    private playerDungeonMap: Map<PlayerID, string> = new Map();
    private nextInstanceId: number = 1;
    private instanceZoneMap: Map<string, number> = new Map();
    
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
        // 检查是否是多阶段副本
        if (dungeonId === 'frost_temple_multi') {
            return this.CreateMultiStageDungeon(playerId);
        }
        
        // 原有的单阶段副本创建逻辑
        const config = GetDungeonConfig(dungeonId);
        if (! config) {
            print(`[DungeonManager] 错误：找不到副本配置 ${dungeonId}`);
            return null;
        }
        
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
        
        const spawnPosition = Vector(zone.centerX, zone.centerY, 128);
        const instance = new DungeonInstance(instanceId, spawnPosition, config);
        instance.Initialize();
        
        this.instances.set(instanceId, instance);
        this.instanceZoneMap.set(instanceId, zone.id);
        
        print(`[DungeonManager] 创建副本实例: ${instanceId} at 区域${zone.id}`);
        
        return instanceId;
    }
    
    /**
     * 创建多阶段副本
     */
    private CreateMultiStageDungeon(playerId?: PlayerID): string | null {
        const config = DUNGEON_FROST_TEMPLE_MULTI;
        const dungeonId = config.dungeonId;
        
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
        
        const spawnPosition = Vector(zone.centerX, zone.centerY, 128);
        const instance = new MultiStageDungeonInstance(instanceId, spawnPosition, config);
        instance.Initialize();
        
        this.instances.set(instanceId, instance);
        this.instanceZoneMap.set(instanceId, zone.id);
        
        print(`[DungeonManager] 创建多阶段副本: ${instanceId} at 区域${zone.id}`);
        
        return instanceId;
    }
    
    /**
     * 玩家进入副本
     */
    public EnterDungeon(playerId: PlayerID, instanceId: string): boolean {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            print(`[DungeonManager] 错误：找不到副本实例 ${instanceId}`);
            return false;
        }
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print(`[DungeonManager] 错误：玩家 ${playerId} 没有英雄`);
            return false;
        }
        
        // ✅ 添加传送提示
        GameRules.SendCustomMessage(
            '<font color="#00FFFF">正在传送到副本...</font>',
            playerId,
            0
        );
        
        // ✅ 定身1秒
        hero.AddNewModifier(hero, null, 'modifier_stunned', { duration: 1.5 });
        
        // ✅ 延迟1.5秒后传送
        Timers.CreateTimer(1.5, () => {
            instance.AddPlayer(playerId);
            this.playerDungeonMap.set(playerId, instanceId);
            
            // 获取地图数据
            let mapData;
            if (instance instanceof MultiStageDungeonInstance) {
                mapData = (instance as any).config?.stages[0]?.mapData;
            } else {
                mapData = (instance as DungeonInstance).GetMapData();
            }
            
            const entryPoint = mapData?.entryPoints?.[0] || { x: -2, y: 10 };
            
            // 获取生成器
            let generator;
            if (instance instanceof MultiStageDungeonInstance) {
                generator = (instance as any).currentGenerator;
            } else {
                generator = (instance as DungeonInstance).GetGenerator();
            }
            
            if (! generator) {
                print(`[DungeonManager] 错误：找不到副本生成器`);
                return undefined;
            }
            
            const worldPos = generator.GridToWorld(entryPoint.x, entryPoint.y);
            
            print(`[DungeonManager] 传送玩家 ${playerId} 到副本入口 (${worldPos.x}, ${worldPos.y})`);
            
            FindClearSpaceForUnit(hero, worldPos, true);
            hero.Stop();
            
            // 播放传送音效
            hero.EmitSound('Portal.Hero_Appear');
            
            // 开始副本
            if (instance.GetState() === DungeonInstanceState.WAITING) {
                instance.Start();
            }
            
            GameRules.SendCustomMessage(
                '<font color="#00FF00">已进入副本</font>',
                playerId,
                0
            );
            
            return undefined;
        });
        
        return true;
    }
    
    /**
     * 玩家离开副本
     */
    public LeaveDungeon(playerId: PlayerID, reason: 'manual' | 'complete' | 'death'): boolean {
        const instanceId = this.playerDungeonMap.get(playerId);
        if (!instanceId) {
            return false;
        }
        
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.RemovePlayer(playerId);
        }
        
        this.playerDungeonMap.delete(playerId);
        
        // 传送回主城
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            const townPos = Vector(0, 0, 192);
            FindClearSpaceForUnit(hero, townPos, true);
            hero.Stop();
            
            // 播放音效
            hero.EmitSound('Portal.Hero_Appear');
        }
        
        print(`[DungeonManager] 玩家 ${playerId} 离开副本 ${instanceId}，原因: ${reason}`);
        
        // 检查副本是否还有玩家
        if (instance && instance.GetPlayers().length === 0) {
            print(`[DungeonManager] 副本 ${instanceId} 无玩家，延迟清理`);
            
            const idToClean = instanceId;
            const manager = this;
            
            Timers.CreateTimer(5, () => {
                if (manager.instances.has(idToClean)) {
                    const inst = manager.instances.get(idToClean);
                    if (inst && inst.GetPlayers().length === 0) {
                        manager.CleanupDungeon(idToClean);
                    }
                }
                return undefined;
            });
        }
        
        return true;
    }
    
    /**
     * 清理副本实例
     */
    public CleanupDungeon(instanceId: string): void {
        const instance = this.instances.get(instanceId);
        if (! instance) return;
        
        print(`[DungeonManager] 清理副本实例: ${instanceId}`);
        
        instance.Cleanup();
        
        const zoneId = this.instanceZoneMap.get(instanceId);
        if (zoneId !== undefined) {
            const zoneManager = GetDungeonZoneManager();
            zoneManager.ReleaseZone(zoneId);
            this.instanceZoneMap.delete(instanceId);
        }
        
        this.instances.delete(instanceId);
    }
    
    /**
     * 清理所有副本
     */
    public CleanupAll(): void {
        print('[DungeonManager] 清理所有副本');
        
        for (const [instanceId, instance] of this.instances.entries()) {
            instance.Cleanup();
            
            const zoneId = this.instanceZoneMap.get(instanceId);
            if (zoneId !== undefined) {
                const zoneManager = GetDungeonZoneManager();
                zoneManager.ReleaseZone(zoneId);
            }
        }
        
        this.instances.clear();
        this.playerDungeonMap.clear();
        this.instanceZoneMap.clear();
    }
    
    /**
     * 获取副本实例
     */
    public GetDungeonInstance(instanceId: string): DungeonInstance | MultiStageDungeonInstance | undefined {
        return this.instances.get(instanceId);
    }
    
    /**
     * 获取玩家所在的副本ID
     */
    public GetPlayerDungeon(playerId: PlayerID): string | undefined {
        return this.playerDungeonMap.get(playerId);
    }
    
    /**
     * 获取所有副本实例
     */
    public GetAllInstances(): Map<string, DungeonInstance | MultiStageDungeonInstance> {
        return this.instances;
    }
}

/**
 * 获取副本管理器单例
 */
export function GetDungeonManager(): DungeonManager {
    return DungeonManager.GetInstance();
}