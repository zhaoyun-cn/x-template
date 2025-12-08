import { GetDungeonManager } from './DungeonManager';
import { GetAllDungeonConfigs } from './configs/index';
import { GetDungeonZoneManager } from './DungeonZoneManager';

/**
 * 注册副本相关的调试命令
 */
export function RegisterDungeonCommands(): void {
    print('[Commands] 注册副本命令...');
    
    // 列出所有副本
    Convars.RegisterCommand('-dungeons', () => {
        const allConfigs = GetAllDungeonConfigs();
        print('========================================');
        print('可用副本列表:');
        print('========================================');
        allConfigs.forEach(({ id, config }) => {
            print(`  ${id}: ${config.mapName}`);
            print(`    描述: ${config.description || '无'}`);
            print(`    尺寸: ${config.width}x${config.height}`);
        });
        print('========================================');
    }, '列出所有副本', 0);
    
    // 创建副本
    Convars.RegisterCommand('-create_dungeon', (dungeonId: string) => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        
        if (! dungeonId) {
            print('[Commands] 用法: -create_dungeon <dungeon_id>');
            print('[Commands] 可用副本: test_simple, my_dungeon, frost_temple');
            return;
        }
        
        const manager = GetDungeonManager();
        const instanceId = manager.CreateDungeon(dungeonId, playerId);
        
        if (instanceId) {
            manager.EnterDungeon(playerId, instanceId);
            print(`[Commands] 创建并进入副本: ${instanceId}`);
        } else {
            print(`[Commands] 创建副本失败`);
        }
    }, '创建并进入指定副本', 0);
    
    // 离开副本
    Convars.RegisterCommand('-leave_dungeon', () => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        const manager = GetDungeonManager();
        
        if (manager.LeaveDungeon(playerId, 'manual')) {
            print(`[Commands] 玩家 ${playerId} 离开副本`);
        } else {
            print(`[Commands] 你不在任何副本中`);
        }
    }, '离开当前副本', 0);
    
    // 手动完成副本
    Convars.RegisterCommand('-complete_dungeon', () => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        const manager = GetDungeonManager();
        const instanceId = manager.GetPlayerDungeon(playerId);
        
        if (! instanceId) {
            print('[Commands] 你不在任何副本中');
            GameRules.SendCustomMessage(
                '<font color="#FF0000">你不在任何副本中</font>',
                playerId,
                0
            );
            return;
        }
        
        const instance = manager.GetDungeonInstance(instanceId);
        if (instance) {
            print(`[Commands] 手动完成副本: ${instanceId}`);
            
            // 直接调用完成方法
            (instance as any).CompleteDungeon?.();
            
            GameRules.SendCustomMessage(
                '<font color="#00FF00">副本已手动完成！3秒后返回主城</font>',
                playerId,
                0
            );
        }
    }, '手动完成当前副本', 0);
    
    // 查看副本状态
    Convars.RegisterCommand('-dungeon_status', () => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        const manager = GetDungeonManager();
        const instanceId = manager.GetPlayerDungeon(playerId);
        
        if (!instanceId) {
            print('[Commands] 你不在任何副本中');
            return;
        }
        
        const instance = manager.GetDungeonInstance(instanceId);
        if (instance) {
            print('========================================');
            print('[Commands] 副本状态');
            print('========================================');
            print(`  实例ID: ${instanceId}`);
            print(`  状态: ${(instance as any).GetState()}`);
            print(`  玩家数量: ${(instance as any).GetPlayers().length}`);
            
            const triggered = (instance as any).GetTriggeredEvents();
            print(`  已触发事件 (${triggered.size}):`);
            for (const id of triggered) {
                print(`    - ${id}`);
            }
            
            const spawnedUnits = (instance as any).GetSpawnedUnits();
            print(`  刷怪触发器 (${spawnedUnits.size}):`);
            for (const [triggerId, units] of spawnedUnits.entries()) {
                const aliveCount = units.filter((u: CDOTA_BaseNPC) => 
                    u && IsValidEntity(u) && u.IsAlive()
                ).length;
                print(`    - ${triggerId}: ${aliveCount}/${units.length} 存活`);
            }
            print('========================================');
        }
    }, '查看当前副本状态', 0);
    
    // 查看区域状态
    Convars.RegisterCommand('-zones', () => {
        const zoneManager = GetDungeonZoneManager();
        print(zoneManager.GetZonesInfo());
    }, '查看副本区域状态', 0);
    
    // 清理所有副本
    Convars.RegisterCommand('-cleanup_dungeons', () => {
        const manager = GetDungeonManager();
        manager.CleanupAll();
        print('[Commands] 已清理所有副本');
    }, '清理所有副本实例', 0);
    
    print('[Commands] 副本命令已注册');
}