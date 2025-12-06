import { GetDungeonManager } from './DungeonManager';
import { GetAllDungeonIds } from './configs/index';

/**
 * 注册副本测试命令
 */
export function RegisterDungeonCommands(): void {
    // 创建副本
    Convars.RegisterCommand(
        'dungeon_create',
        (name: string, dungeonId: string) => {
            const commandClient = Convars.GetCommandClient();
            if (!commandClient) return;
            
            const playerId = commandClient.GetPlayerID();
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (!hero) {
                print('[命令] 错误：找不到英雄');
                return;
            }
            
            // 在英雄前方500单位创建副本
            const heroPos = hero.GetAbsOrigin();
            const heroForward = hero.GetForwardVector();
            const spawnPos = Vector(
                heroPos.x + heroForward.x * 500,
                heroPos.y + heroForward.y * 500,
                heroPos.z
            );
            
            const manager = GetDungeonManager();
            const instanceId = manager.CreateDungeon(dungeonId, spawnPos);
            
            if (instanceId) {
                print(`[命令] 副本创建成功: ${instanceId}`);
            } else {
                print(`[命令] 副本创建失败`);
            }
        },
        '创建副本 - 用法: dungeon_create <dungeonId>',
        0
    );
    
    // 进入副本
    Convars.RegisterCommand(
        'dungeon_enter',
        (name: string, instanceId: string) => {
            const commandClient = Convars.GetCommandClient();
            if (! commandClient) return;
            
            const playerId = commandClient.GetPlayerID();
            const manager = GetDungeonManager();
            const success = manager.EnterDungeon(playerId, instanceId);
            
            if (success) {
                print(`[命令] 进入副本成功: ${instanceId}`);
            } else {
                print(`[命令] 进入副本失败`);
            }
        },
        '进入副本 - 用法: dungeon_enter <instanceId>',
        0
    );
    
    // 离开副本
    Convars.RegisterCommand(
        'dungeon_leave',
        () => {
            const commandClient = Convars.GetCommandClient();
            if (!commandClient) return;
            
            const playerId = commandClient.GetPlayerID();
            const manager = GetDungeonManager();
            const success = manager.LeaveDungeon(playerId);
            
            if (success) {
                print(`[命令] 离开副本成功`);
            } else {
                print(`[命令] 你不在任何副本中`);
            }
        },
        '离开当前副本',
        0
    );
    
    // 快速进入副本（创建并进入）
    Convars.RegisterCommand(
        'dungeon_quick',
        (name: string, dungeonId: string) => {
            const commandClient = Convars.GetCommandClient();
            if (!commandClient) return;
            
            const playerId = commandClient.GetPlayerID();
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (! hero) {
                print('[命令] 错误：找不到英雄');
                return;
            }
            
            // 在英雄前方创建副本
            const heroPos = hero.GetAbsOrigin();
            const heroForward = hero.GetForwardVector();
            const spawnPos = Vector(
                heroPos.x + heroForward.x * 1000,
                heroPos.y + heroForward.y * 1000,
                heroPos.z
            );
            
            const manager = GetDungeonManager();
            const instanceId = manager.CreateDungeon(dungeonId, spawnPos);
            
            if (instanceId) {
                manager.EnterDungeon(playerId, instanceId);
                print(`[命令] 快速进入副本: ${instanceId}`);
            } else {
                print(`[命令] 副本创建失败`);
            }
        },
        '快速创建并进入副本 - 用法: dungeon_quick <dungeonId>',
        0
    );
    
    // 列出所有可用副本
    Convars.RegisterCommand(
        'dungeon_list',
        () => {
            const dungeonIds = GetAllDungeonIds();
            print('[命令] 可用副本列表:');
            for (const id of dungeonIds) {
                print(`  - ${id}`);
            }
        },
        '列出所有可用副本',
        0
    );
    
    // 清理所有副本
    Convars.RegisterCommand(
        'dungeon_cleanup_all',
        () => {
            const manager = GetDungeonManager();
            manager.CleanupAll();
            print('[命令] 已清理所有副本实例');
        },
        '清理所有副本实例',
        0
    );
    
    print('[DungeonCommands] 副本命令已注册');
}