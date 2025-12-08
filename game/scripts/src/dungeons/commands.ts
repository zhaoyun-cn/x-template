import { GetDungeonManager } from './DungeonManager';
import { GetAllDungeonConfigs } from './configs/index';
import { GetDungeonZoneManager } from './DungeonZoneManager';
import { MultiStageDungeonInstance } from './MultiStageDungeonInstance';

/**
 * 获取数组长度（Lua兼容）
 */
function GetArrayLength(arr: any): number {
    if (!arr) return 0;
    let count = 0;
    for (const _ in arr) {
        count++;
    }
    return count;
}

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
    Convars.RegisterCommand('-create_dungeon', (_, dungeonId: string) => {
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
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
            return;
        }
    }, '创建并进入指定副本', 0);
    
    // 离开副本
    Convars.RegisterCommand('-leave_dungeon', () => {
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
            const manager = GetDungeonManager();
            
            if (manager.LeaveDungeon(playerId, 'manual')) {
                print(`[Commands] 玩家 ${playerId} 离开副本`);
            } else {
                print(`[Commands] 你不在任何副本中`);
            }
            return;
        }
    }, '离开当前副本', 0);
    
    // ✅ 选择关卡
    Convars.RegisterCommand('-stage', (_, stageIndexStr: string) => {
        print(`[Commands] 收到关卡选择命令，参数: "${stageIndexStr}"`);
        
        const manager = GetDungeonManager();
        
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
            const instanceId = manager.GetPlayerDungeon(playerId);
            if (!instanceId) {
                print(`[Commands] 玩家 ${playerId} 不在副本中`);
                continue;
            }
            
            const instance = manager.GetDungeonInstance(instanceId);
            if (!instance || !(instance instanceof MultiStageDungeonInstance)) {
                print(`[Commands] 玩家 ${playerId} 不在多阶段副本中`);
                continue;
            }
            
            if (!stageIndexStr || stageIndexStr === '') {
                GameRules.SendCustomMessage(
                    '<font color="#FF0000">用法: -stage 1 / -stage 2</font>',
                    playerId,
                    0
                );
                return;
            }
            
            const index = tonumber(stageIndexStr) as number;
            
            print(`[Commands] 解析的索引: ${index}`);
            
            if (!index || index < 1) {
                GameRules.SendCustomMessage(
                    '<font color="#FF0000">用法: -stage 1 / -stage 2</font>',
                    playerId,
                    0
                );
                return;
            }
            
            const success = instance.SelectNextStage(index - 1);
            
            if (success) {
                print(`[Commands] 玩家 ${playerId} 成功选择关卡 ${index}`);
                GameRules.SendCustomMessage(
                    `<font color="#00FF00">✅ 已选择关卡 ${index}</font>`,
                    playerId,
                    0
                );
            } else {
                print(`[Commands] 玩家 ${playerId} 选择关卡失败`);
                GameRules.SendCustomMessage(
                    '<font color="#FF0000">❌ 无效的关卡编号</font>',
                    playerId,
                    0
                );
            }
            
            return;
        }
        
        print('[Commands] 没有找到在副本中的玩家');
    }, '选择下一关卡 (-stage 1)', 0);
    
    // 手动完成副本
    Convars.RegisterCommand('-complete_dungeon', () => {
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
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
            return;
        }
    }, '手动完成当前副本', 0);
    
    // ✅ 添加积分（调试用）
    Convars.RegisterCommand('-add_score', (_, scoreStr: string) => {
        print(`[Commands] 收到添加积分命令，参数: "${scoreStr}"`);
        
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
            const manager = GetDungeonManager();
            const instanceId = manager.GetPlayerDungeon(playerId);
            
            if (! instanceId) {
                print('[Commands] 你不在任何副本中');
                return;
            }
            
            const instance = manager.GetDungeonInstance(instanceId);
            if (instance && instance instanceof MultiStageDungeonInstance) {
                const scoreNum = tonumber(scoreStr) as number || 10;
                
                print(`[Commands] 解析的积分: ${scoreNum}`);
                
                // 直接调用内部方法（调试用）
                (instance as any).currentScore = ((instance as any).currentScore || 0) + scoreNum;
                const current = (instance as any).currentScore;
                const required = (instance as any).requiredScore;
                
                print(`[Commands] 添加 ${scoreNum} 分，当前: ${current}/${required}`);
                
                GameRules.SendCustomMessage(
                    `<font color="#FFD700">+${scoreNum}分！当前: ${current}/${required}</font>`,
                    playerId,
                    0
                );
                
                // 检查是否达标
                if (current >= required) {
                    (instance as any).OnStageComplete();
                }
            }
            return;
        }
    }, '添加积分 (-add_score 10)', 0);
    
   // ✅ 强制清理所有怪物（调试用）
Convars.RegisterCommand('-clear_all', () => {
    for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
        if (!PlayerResource.IsValidPlayerID(playerId)) continue;
        
        const manager = GetDungeonManager();
        const instanceId = manager.GetPlayerDungeon(playerId);
        
        if (!instanceId) {
            print('[Commands] 你不在任何副本中');
            return;
        }
        
        const instance = manager.GetDungeonInstance(instanceId);
        if (instance && instance instanceof MultiStageDungeonInstance) {
            print('[Commands] 强制清理所有怪物...');
            
            // ✅ 查找所有生物单位，强制转换类型
            const allUnits = Entities.FindAllByClassname('npc_dota_creature') as CDOTA_BaseNPC[];
            let cleared = 0;
            
            for (let i = 0; i < allUnits.length; i++) {
                const unit = allUnits[i] as CDOTA_BaseNPC;  // ✅ 强制转换
                if (unit && IsValidEntity(unit) && !unit.IsNull() && unit.IsAlive()) {
                    // 检查是否在副本区域内
                    const unitPos = unit.GetAbsOrigin();
                    const generator = (instance as any).currentGenerator;
                    if (generator) {
                        const basePos = (generator as any).basePosition;
                        const dx = Math.abs(unitPos.x - basePos.x);
                        const dy = Math.abs(unitPos.y - basePos.y);
                        
                        // 在副本区域内（5000范围内）
                        if (dx < 5000 && dy < 5000) {
                            const unitName = unit.GetUnitName();
                            print(`[Commands] 清理: ${unitName} at (${unitPos.x.toFixed(0)}, ${unitPos.y.toFixed(0)})`);
                            unit.ForceKill(false);
                            cleared++;
                        }
                    }
                }
            }
            
            print(`[Commands] ✅ 强制清理完成，共清理 ${cleared} 个单位`);
            
            GameRules.SendCustomMessage(
                `<font color="#00FF00">已清理 ${cleared} 个怪物</font>`,
                playerId,
                0
            );
        }
        return;
    }
}, '强制清理所有怪物', 0);
    
    // 查看副本状态
    Convars.RegisterCommand('-dungeon_status', () => {
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
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
                
                const players = (instance as any).GetPlayers();
                // ✅ 使用自定义函数获取长度
                const playerCount = GetArrayLength(players);
                print(`  玩家数量: ${playerCount}`);
                
                if (instance instanceof MultiStageDungeonInstance) {
                    const currentScore = (instance as any).currentScore || 0;
                    const requiredScore = (instance as any).requiredScore || 10;
                    const spawnedUnits = (instance as any).spawnedUnits || [];
                    
                    const unitsLength = GetArrayLength(spawnedUnits);
                    print(`[Commands] spawnedUnits 数量 = ${unitsLength}`);
                    
                    let aliveCount = 0;
                    for (const key in spawnedUnits) {
                        const u = spawnedUnits[key];
                        if (u && IsValidEntity(u) && ! u.IsNull() && u.IsAlive()) {
                            aliveCount++;
                        }
                    }
                    
                    print(`  当前阶段: ${(instance as any).currentStageId}`);
                    print(`  积分: ${currentScore}/${requiredScore}`);
                    print(`  怪物: ${aliveCount}/${unitsLength} 存活`);
                    
                    // 也发送到聊天
                    GameRules.SendCustomMessage(
                        `<font color="#FFFF00">积分: ${currentScore}/${requiredScore} | 怪物: ${aliveCount}/${unitsLength}</font>`,
                        playerId,
                        0
                    );
                }
                
                print('========================================');
            }
            return;
        }
    }, '查看当前副本状态', 0);
    
    // 查看自己位置
    Convars.RegisterCommand('-pos', () => {
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
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
            return;
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
    
    // ✅ 列出可选关卡
    Convars.RegisterCommand('-stages', () => {
        const manager = GetDungeonManager();
        
        for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
            if (!PlayerResource.IsValidPlayerID(playerId)) continue;
            
            const instanceId = manager.GetPlayerDungeon(playerId);
            if (!instanceId) continue;
            
            const instance = manager.GetDungeonInstance(instanceId);
            if (instance && instance instanceof MultiStageDungeonInstance) {
                const availableStages = (instance as any).GetAvailableNextStages() || [];
                const stagesCount = GetArrayLength(availableStages);
                
                print('========================================');
                print('[Commands] 可选关卡:');
                print(`[Commands] availableStages 数量 = ${stagesCount}`);
                print('========================================');
                
                if (stagesCount === 0) {
                    print('  没有可选关卡');
                    GameRules.SendCustomMessage(
                        '<font color="#FF0000">没有可选关卡</font>',
                        playerId,
                        0
                    );
                } else {
                    let index = 1;
                    for (const key in availableStages) {
                        const stage = availableStages[key];
                        print(`  ${index}.${stage.stageName} - ${stage.description}`);
                        GameRules.SendCustomMessage(
                            `<font color="#FFFF00">${index}.${stage.stageName} - ${stage.description}</font>`,
                            playerId,
                            0
                        );
                        index++;
                    }
                    GameRules.SendCustomMessage(
                        '<font color="#00FF00">输入 -stage 1 选择关卡</font>',
                        playerId,
                        0
                    );
                }
                
                print('========================================');
                return;
            }
        }
        
        print('[Commands] 你不在多阶段副本中');
    }, '列出可选关卡', 0);
    
    print('[Commands] 副本命令已注册');
    print('[Commands] 可用命令:');
    print('  -dungeons          列出所有副本');
    print('  -create_dungeon <id>  创建副本');
    print('  -leave_dungeon     离开副本');
    print('  -stage <n>         选择关卡');
    print('  -stages            列出可选关卡');
    print('  -add_score <n>     添加积分（调试）');
    print('  -clear_all         强制清理所有怪物');
    print('  -dungeon_status    查看副本状态');
    print('  -complete_dungeon  手动完成副本');
    print('  -pos               查看位置');
    print('  -zones             查看区域状态');
    print('  -cleanup_dungeons  清理所有副本');
}