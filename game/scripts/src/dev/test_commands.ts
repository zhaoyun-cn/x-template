/**
 * 统一测试命令管理器
 * 整合从 poe2_init.ts 和 poe2_integration.ts 迁移的测试命令
 */

import { POE2Integration } from '../systems/equipment/poe2_integration';
import { ItemRarity } from '../systems/equipment/poe2_equipment_types';
import { LootType, ZoneLootSystem } from '../zone/zone_loot';
import { EquipmentVaultSystem } from '../systems/equipment/vault_system';
import { ClassSystem } from '../systems/class_system';

export class TestCommands {
    /**
     * 注册所有测试命令
     */
    public static RegisterAllCommands(): void {
        print('[TestCommands] 注册测试命令...');

        this.RegisterPOE2Commands();
        this.RegisterConvarCommands();

        print('[TestCommands] ✓ 所有测试命令已注册');
    }

    /**
     * 注册 POE2 聊天命令
     */
    private static RegisterPOE2Commands(): void {
        ListenToGameEvent('player_chat', (event) => {
            const playerId = event.playerid as PlayerID;
            const text = event.text as string;

            // ===== POE2 装备系统命令 =====
            
            if (text === '-poe2help') {
                this.ShowPOE2Help(playerId);
            }

            if (text === '-poe2status') {
                GameRules.SendCustomMessage(
                    '<font color="#00ff00">✓ POE2 装备系统状态: 运行中</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#00ffff">基底类型: 45 种 | 词缀类型: 20 种</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#00ffff">稀有度: 普通/魔法/稀有/传说</font>',
                    playerId,
                    0
                );
            }

            if (text === '-poe2stats') {
                GameRules.SendCustomMessage(
                    '<font color="#00ff00">装备稀有度说明:</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#c8c8c8">普通（白色）: 0 词缀</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#8888ff">魔法（蓝色）: 1-2 词缀</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#ffff77">稀有（黄色）: 4-6 词缀</font>',
                    playerId,
                    0
                );
                GameRules.SendCustomMessage(
                    '<font color="#ff8800">传说（橙色）: 6 词缀（满）</font>',
                    playerId,
                    0
                );
            }

            if (text === '-poe2test') {
                print(`[TestCommands] 玩家 ${playerId} 使用 -poe2test 命令`);
                
                try {
                    POE2Integration.GenerateLootDrop(playerId, 20, 5);
                    
                    GameRules.SendCustomMessage(
                        '<font color="#ffd700">✨ 已生成 5 件随机装备到仓库！</font>',
                        playerId,
                        0
                    );
                    GameRules.SendCustomMessage(
                        '<font color="#ffff00">按 B 键打开仓库查看</font>',
                        playerId,
                        0
                    );
                } catch (error) {
                    print(`[TestCommands] ❌ 生成装备失败: ${error}`);
                    GameRules.SendCustomMessage(
                        '<font color="#ff0000">❌ 生成装备失败，请查看日志</font>',
                        playerId,
                        0
                    );
                }
            }

            if (text === '-poe2rare') {
                print(`[TestCommands] 玩家 ${playerId} 使用 -poe2rare 命令`);
                
                try {
                    POE2Integration.GenerateAndAddToVault(playerId, 25, ItemRarity.RARE);
                    
                    GameRules.SendCustomMessage(
                        '<font color="#ffff77">⚡ 已生成稀有装备到仓库！</font>',
                        playerId,
                        0
                    );
                } catch (error) {
                    print(`[TestCommands] ❌ 生成稀有装备失败: ${error}`);
                    GameRules.SendCustomMessage(
                        '<font color="#ff0000">❌ 生成失败</font>',
                        playerId,
                        0
                    );
                }
            }

            if (text === '-poe2legendary') {
                print(`[TestCommands] 玩家 ${playerId} 使用 -poe2legendary 命令`);
                
                try {
                    POE2Integration.GenerateAndAddToVault(playerId, 30, ItemRarity.LEGENDARY);
                    
                    GameRules.SendCustomMessage(
                        '<font color="#ff8800">🔥 已生成传说装备到仓库！</font>',
                        playerId,
                        0
                    );
                } catch (error) {
                    print(`[TestCommands] ❌ 生成传说装备失败: ${error}`);
                    GameRules.SendCustomMessage(
                        '<font color="#ff0000">❌ 生成失败</font>',
                        playerId,
                        0
                    );
                }
            }

            // ===== 通货命令 =====

            if (text === '-givecurrency') {
                ZoneLootSystem.AddItem(playerId, LootType.POE2_CHAOS_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_EXALTED_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_DIVINE_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_SCRAP, 50);
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">💰 已获得测试通货：混沌石x10, 崇高石x10, 神圣石x10, 碎片x50</font>',
                    playerId,
                    0
                );
            }

            // ===== 打造命令 =====

            if (text.startsWith('-select ')) {
                const index = parseInt(text.replace('-select ', ''));
                if (!isNaN(index)) {
                    const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                    POE2CraftSystem.SelectVaultEquipment(playerId, index);
                }
            }

            if (text === '-unselect') {
                const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                POE2CraftSystem.CancelSelection(playerId);
            }

            if (text === '-usechaos') {
                const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_CHAOS_ORB);
            }

            if (text === '-useexalt') {
                const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_EXALTED_ORB);
            }

            if (text === '-usedivine') {
                const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_DIVINE_ORB);
            }

            if (text === '-disasm') {
                const { POE2CraftSystem } = require('../systems/equipment/poe2_craft_system');
                POE2CraftSystem.DisassembleSelected(playerId);
            }

            // ===== 合成命令 =====

            if (text === '-craftchaos') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_CHAOS_ORB);
            }

            if (text === '-craftexalt') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_EXALTED_ORB);
            }

            if (text === '-craftdivine') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_DIVINE_ORB);
            }
        }, null);

        print('[TestCommands] ✓ POE2 聊天命令已注册');
    }

    /**
     * 注册控制台命令
     */
    private static RegisterConvarCommands(): void {
        Convars.RegisterCommand("equip", (itemIndex: string) => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player.GetPlayerID() : 0 as PlayerID;
            const index = parseInt(itemIndex);
            
            if (EquipmentVaultSystem.EquipItem(playerId, index)) {
                print(`[TestCommands] ✓ 玩家${playerId}装备了索引${index}的装备`);
            } else {
                print(`[TestCommands] ❌ 装备失败`);
            }
        }, "装备仓库中的装备", 0);
        
        Convars.RegisterCommand("vault", () => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player.GetPlayerID() : 0 as PlayerID;
            const vault = EquipmentVaultSystem.GetVault(playerId);
            
            print(`[TestCommands] 玩家${playerId}的仓库 (${vault.length}件装备):`);
            vault.forEach((item, index) => {
                const statsStr = item.stats.map(s => `${s.attribute} +${s.value}`).join(", ");
                print(`  [${index}] ${item.name} - ${item.type} (${statsStr})`);
            });
        }, "查看装备仓库", 0);

        Convars.RegisterCommand("myclass", () => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player.GetPlayerID() : 0 as PlayerID;
            const classConfig = ClassSystem.GetPlayerClassConfig(playerId);
            
            if (classConfig) {
                print(`[TestCommands] 玩家${playerId}的职业: ${classConfig.name}`);
            } else {
                print(`[TestCommands] 玩家${playerId}尚未选择职业`);
            }
        }, "查看当前职业", 0);

        print('[TestCommands] ✓ 控制台命令已注册');
    }

    /**
     * 显示 POE2 帮助信息
     */
    private static ShowPOE2Help(playerId: PlayerID): void {
        GameRules.SendCustomMessage(
            '<font color="#00ff00">========== POE2 装备系统命令 ==========</font>',
            playerId,
            0
        );
        GameRules.SendCustomMessage(
            '<font color="#ffff00">-poe2test</font> - 生成 5 件随机装备',
            playerId,
            0
        );
        GameRules.SendCustomMessage(
            '<font color="#ffff00">-poe2rare</font> - 生成 1 件稀有装备',
            playerId,
            0
        );
        GameRules.SendCustomMessage(
            '<font color="#ffff00">-poe2legendary</font> - 生成 1 件传说装备',
            playerId,
            0
        );
        GameRules.SendCustomMessage(
            '<font color="#ffff00">-poe2status</font> - 查看系统状态',
            playerId,
            0
        );
        GameRules.SendCustomMessage(
            '<font color="#ffff00">-poe2stats</font> - 查看装备稀有度说明',
            playerId,
            0
        );
        GameRules.SendCustomMessage('', playerId, 0);
        GameRules.SendCustomMessage('===== 通货系统 =====', playerId, 0);
        GameRules.SendCustomMessage('-givecurrency - 获取测试通货', playerId, 0);
        GameRules.SendCustomMessage('', playerId, 0);
        GameRules.SendCustomMessage('===== 打造流程 =====', playerId, 0);
        GameRules.SendCustomMessage('-select [索引] - 选择仓库中的装备', playerId, 0);
        GameRules.SendCustomMessage('-unselect - 取消选择', playerId, 0);
        GameRules.SendCustomMessage('-usechaos - 对选中装备使用混沌石', playerId, 0);
        GameRules.SendCustomMessage('-useexalt - 对选中装备使用崇高石', playerId, 0);
        GameRules.SendCustomMessage('-usedivine - 对选中装备使用神圣石', playerId, 0);
        GameRules.SendCustomMessage('-disasm - 分解选中装备', playerId, 0);
        GameRules.SendCustomMessage('', playerId, 0);
        GameRules.SendCustomMessage('===== 合成 =====', playerId, 0);
        GameRules.SendCustomMessage('-craftchaos - 合成混沌石(10碎片)', playerId, 0);
        GameRules.SendCustomMessage('-craftexalt - 合成崇高石(30碎片)', playerId, 0);
        GameRules.SendCustomMessage('-craftdivine - 合成神圣石(50碎片)', playerId, 0);
    }
}
