import { GetDungeonManager } from './DungeonManager';
import { GetAllDungeonConfigs } from './configs/index';
import { GetDungeonZoneManager } from './DungeonZoneManager';
import { MultiStageDungeonInstance } from './MultiStageDungeonInstance';

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
            const mapName = (config as any).mapName || (config as any).dungeonName || id;
            print(`  ${id}: ${mapName}`);
            print(`    描述: ${config.description || '无'}`);
            if ((config as any).width) {
                print(`    尺寸: ${(config as any).width}x${(config as any).height}`);
            }
        });
        print('========================================');
    }, '列出所有副本', 0);
    
    // 创建副本
    Convars.RegisterCommand('-create_dungeon', (dungeonId: string) => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        
        if (!dungeonId) {
            print('[Commands] 用法: -create_dungeon <dungeon_id>');
            print('[Commands] 可用副本: test_simple, my_dungeon, frost_temple, frost_temple_multi');
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
    
   // ✅ 修复：进入下一阶段
Convars.RegisterCommand('-next', (_, playerIdStr: string) => {
    // ✅ 从命令参数获取玩家ID
    let playerId: PlayerID = 0;
    
    const player = Convars.GetCommandClient();
    if (player) {
        playerId = player.GetPlayerID();
    } else {
        // 如果无法获取玩家，尝试使用第一个玩家（单人测试）
        playerId = 0;
    }
    
    print(`[Commands] 玩家 ${playerId} 尝试使用传送门`);
    
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
    
    const instance = manager. GetDungeonInstance(instanceId);
    if (instance && instance instanceof MultiStageDungeonInstance) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print('[Commands] 错误：找不到英雄');
            return;
        }
        
        const portalEntity = (instance as any).portalEntity;
        if (! portalEntity || portalEntity.IsNull()) {
            print('[Commands] 找不到传送门');
            GameRules.SendCustomMessage(
                '<font color="#FF0000">找不到传送门，请先完成当前阶段</font>',
                playerId,
                0
            );
            return;
        }
        
        // 检查距离
        const heroPos = hero.GetAbsOrigin();
        const portalPos = portalEntity.GetAbsOrigin();
        const dx = portalPos.x - heroPos. x;
        const dy = portalPos.y - heroPos. y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        print(`[Commands] 玩家距离传送门: ${distance. toFixed(2)}`);
        
        if (distance > 800) {
            GameRules.SendCustomMessage(
                `<font color="#FF0000">你离传送门太远了（当前${distance.toFixed(0)}，需要<800）</font>`,
                playerId,
                0
            );
            return;
        }
        
        // 开始传送
        print(`[Commands] 玩家 ${playerId} 使用传送门`);
        instance.StartPortalChanneling(playerId);
    } else {
        GameRules.SendCustomMessage(
            '<font color="#FF0000">当前副本不支持此命令</font>',
            playerId,
            0
        );
    }
}, '进入下一阶段', 0);
    
    // ✅ 查看传送门位置
    Convars.RegisterCommand('-portal_pos', () => {
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
        if (instance && instance instanceof MultiStageDungeonInstance) {
            const portalEntity = (instance as any).portalEntity;
            if (portalEntity && ! portalEntity.IsNull()) {
                const pos = portalEntity.GetAbsOrigin();
                print(`[Commands] 传送门位置: (${pos.x}, ${pos.y}, ${pos.z})`);
                
                const hero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (hero) {
                    const heroPos = hero.GetAbsOrigin();
                    const dx = pos.x - heroPos.x;
                    const dy = pos.y - heroPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    print(`[Commands] 你的位置: (${heroPos.x}, ${heroPos.y}, ${heroPos.z})`);
                    print(`[Commands] 距离传送门: ${distance.toFixed(2)}`);
                    
                    GameRules.SendCustomMessage(
                        `<font color="#FFFF00">传送门距离: ${distance.toFixed(0)}</font>`,
                        playerId,
                        0
                    );
                }
            } else {
                print('[Commands] 传送门不存在');
                GameRules.SendCustomMessage(
                    '<font color="#FF0000">传送门不存在</font>',
                    playerId,
                    0
                );
            }
        }
    }, '查看传送门位置', 0);
    
    // 手动完成副本
    Convars.RegisterCommand('-complete_dungeon', () => {
        const player = Convars.GetCommandClient();
        if (! player) return;
        
        const playerId = player.GetPlayerID();
        const manager = GetDungeonManager();
        const instanceId = manager.GetPlayerDungeon(playerId);
        
        if (!instanceId) {
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
            
            const triggered = (instance as any).GetTriggeredEvents?.();
            if (triggered) {
                print(`  已触发事件 (${triggered.size}):`);
                for (const id of triggered) {
                    print(`    - ${id}`);
                }
            }
            
            const spawnedUnits = (instance as any).GetSpawnedUnits?.();
            if (spawnedUnits) {
                print(`  刷怪触发器 (${spawnedUnits.size}):`);
                for (const [triggerId, units] of spawnedUnits.entries()) {
                    const aliveCount = units.filter((u: CDOTA_BaseNPC) => 
                        u && IsValidEntity(u) && u.IsAlive()
                    ).length;
                    print(`    - ${triggerId}: ${aliveCount}/${units.length} 存活`);
                }
            }
            print('========================================');
        }
    }, '查看当前副本状态', 0);
    
    // 查看自己位置
    Convars.RegisterCommand('-pos', () => {
        const player = Convars.GetCommandClient();
        if (!player) return;
        
        const playerId = player.GetPlayerID();
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        
        if (hero) {
            const pos = hero.GetAbsOrigin();
            print(`[Commands] 你的位置: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
            
            GameRules.SendCustomMessage(
                `<font color="#FFFF00">位置: (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})</font>`,
                playerId,
                0
            );
        }
    }, '查看自己位置', 0);
    
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