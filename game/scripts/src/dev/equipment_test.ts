/**
 * 装备系统测试命令
 */

import { EquipmentVaultSystem } from '../systems/equipment/vault_system';
import { ElementalDamageSystem, ElementType } from '../systems/elemental_damage_system';

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

export function InitEquipmentTestCommands(): void {
    print('[EquipmentTest] 初始化测试命令...');
    
    ListenToGameEvent('player_chat', (event: any) => {
        const playerId = event.playerid as PlayerID;
        const text = event.text as string;
        const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
        
        if (! hero || hero.IsNull()) return;
        
        // ========== 属性测试 ==========
        
        if (text === '-eqstats') {
            const stats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
            if (stats) {
                GameRules.SendCustomMessage(`===== 装备属性 =====`, playerId, 0);
                GameRules.SendCustomMessage(`力量: +${stats.strength} | 敏捷: +${stats.agility} | 智力: +${stats.intelligence}`, playerId, 0);
                GameRules.SendCustomMessage(`生命: +${stats.health} | 护甲: +${stats.armor} | 魔法: +${stats.mana}`, playerId, 0);
                GameRules.SendCustomMessage(`暴击率: ${stats.crit_chance}% | 攻击力: +${stats.attack_damage} | 攻速: +${stats.attack_speed}%`, playerId, 0);
                GameRules.SendCustomMessage(`移速: +${stats.move_speed}% | 冷却缩减: ${stats.cooldown_reduction}% | 闪避: ${stats.evasion}%`, playerId, 0);
                GameRules.SendCustomMessage(`火抗: ${stats.fire_resistance}% | 冰抗: ${stats.cold_resistance}% | 电抗: ${stats.lightning_resistance}%`, playerId, 0);
            } else {
                GameRules.SendCustomMessage(`暂无装备属性数据`, playerId, 0);
            }
            
            // 检查 modifier 状态
            const hasModifier = hero.HasModifier("modifier_equipment_system");
            GameRules.SendCustomMessage(`Modifier状态: ${hasModifier ? '已添加' : '未添加'}`, playerId, 0);
        }
        
        // ========== 暴击测试 ==========
        
        if (text.startsWith('-setcrit ')) {
            const value = parseInt(text.replace('-setcrit ', ''));
            if (! isNaN(value)) {
                ensureStats(playerId);
                _G.EquipmentStats[playerId].crit_chance = value;
                _G.EquipmentStats[playerId].crit_multiplier = 200;
                
                // ⭐ 确保 modifier 存在
                ensureModifier(hero);
                refreshModifier(hero);
                
                GameRules.SendCustomMessage(`暴击率已设置为 ${value}%, 暴击伤害 200%`, playerId, 0);
            }
        }
        
        if (text === '-testcrit') {
            // ⭐ 先确保 modifier 存在
            ensureModifier(hero);
            
            const pos = (hero.GetAbsOrigin() + hero.GetForwardVector() * 300) as Vector;
            const dummy = CreateUnitByName(
                "npc_dota_creep_badguys_melee",
                pos,
                true,
                undefined,
                undefined,
                DotaTeam.BADGUYS
            );
            
            if (dummy) {
                dummy.SetBaseMaxHealth(50000);
                dummy.SetMaxHealth(50000);
                dummy.SetHealth(50000);
                dummy.SetMoveCapability(UnitMoveCapability.NONE);
                dummy.Stop();
                
                // 禁用攻击但不无敌
                dummy.AddNewModifier(hero, undefined, "modifier_disarmed", { duration: 20 });
                
                Timers.CreateTimer(20, () => {
                    if (IsValidEntity(dummy) && dummy.IsAlive()) {
                        dummy.ForceKill(false);
                    }
                    return undefined;
                });
                
                const stats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
                const critChance = stats ?  (stats.crit_chance || 0) : 0;
                const critMult = stats ? (stats.crit_multiplier || 150) : 150;
                const hasModifier = hero.HasModifier("modifier_equipment_system");
                
                GameRules.SendCustomMessage(`已生成测试假人 (20秒)，攻击它测试暴击！`, playerId, 0);
                GameRules.SendCustomMessage(`当前暴击率: ${critChance}%, 暴击伤害: ${critMult}%`, playerId, 0);
                GameRules.SendCustomMessage(`Modifier状态: ${hasModifier ? '已添加' : '未添加'}`, playerId, 0);
                
                if (critChance <= 0) {
                    GameRules.SendCustomMessage(`警告: 暴击率为0！先用 -setcrit 50 设置暴击率`, playerId, 0);
                }
                
                if (! hasModifier) {
                    GameRules.SendCustomMessage(`警告: Modifier未添加！正在尝试添加...`, playerId, 0);
                    ensureModifier(hero);
                }
            }
        }
        
        // ========== 元素抗性测试 ==========
        
        if (text.startsWith('-setfire ')) {
            const value = parseInt(text.replace('-setfire ', ''));
            if (!isNaN(value)) {
                ensureStats(playerId);
                _G.EquipmentStats[playerId].fire_resistance = value;
                ensureModifier(hero);
                refreshModifier(hero);
                GameRules.SendCustomMessage(`火焰抗性已设置为 ${value}%`, playerId, 0);
            }
        }
        
        if (text.startsWith('-setcold ')) {
            const value = parseInt(text.replace('-setcold ', ''));
            if (! isNaN(value)) {
                ensureStats(playerId);
                _G.EquipmentStats[playerId].cold_resistance = value;
                ensureModifier(hero);
                refreshModifier(hero);
                GameRules.SendCustomMessage(`冰霜抗性已设置为 ${value}%`, playerId, 0);
            }
        }
        
        if (text.startsWith('-setlight ')) {
            const value = parseInt(text.replace('-setlight ', ''));
            if (!isNaN(value)) {
                ensureStats(playerId);
                _G.EquipmentStats[playerId].lightning_resistance = value;
                ensureModifier(hero);
                refreshModifier(hero);
                GameRules.SendCustomMessage(`闪电抗性已设置为 ${value}%`, playerId, 0);
            }
        }
        
        if (text === '-testfire') {
            const damage = 500;
            const reduction = ElementalDamageSystem.CalculateElementalReduction(hero, ElementType.FIRE);
            const finalDamage = damage * (1 - reduction / 100);
            
            ApplyDamage({
                victim: hero,
                attacker: hero,
                damage: finalDamage,
                damage_type: DamageTypes.MAGICAL,
            });
            
            GameRules.SendCustomMessage(`火焰伤害: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)`, playerId, 0);
        }
        
        if (text === '-testcold') {
            const damage = 500;
            const reduction = ElementalDamageSystem.CalculateElementalReduction(hero, ElementType.COLD);
            const finalDamage = damage * (1 - reduction / 100);
            
            ApplyDamage({
                victim: hero,
                attacker: hero,
                damage: finalDamage,
                damage_type: DamageTypes.MAGICAL,
            });
            
            GameRules.SendCustomMessage(`冰霜伤害: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)`, playerId, 0);
        }
        
        if (text === '-testlight') {
            const damage = 500;
            const reduction = ElementalDamageSystem.CalculateElementalReduction(hero, ElementType.LIGHTNING);
            const finalDamage = damage * (1 - reduction / 100);
            
            ApplyDamage({
                victim: hero,
                attacker: hero,
                damage: finalDamage,
                damage_type: DamageTypes.MAGICAL,
            });
            
            GameRules.SendCustomMessage(`闪电伤害: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)`, playerId, 0);
        }
        
        // ========== 冷却缩减测试 ==========
        
        if (text.startsWith('-setcdr ')) {
            const value = parseInt(text.replace('-setcdr ', ''));
            if (!isNaN(value)) {
                ensureStats(playerId);
                _G.EquipmentStats[playerId].cooldown_reduction = value;
                ensureModifier(hero);
                refreshModifier(hero);
                GameRules.SendCustomMessage(`冷却缩减已设置为 ${value}%`, playerId, 0);
            }
        }
        
        if (text === '-testcdr') {
            GameRules.SendCustomMessage(`===== 技能冷却时间 =====`, playerId, 0);
            
            for (let i = 0; i < 6; i++) {
                const ability = hero.GetAbilityByIndex(i);
                if (ability && ! ability.IsNull() && ability.GetLevel() > 0) {
                    const baseCd = ability.GetCooldown(ability.GetLevel() - 1);
                    const stats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
                    const cdr = stats ? (stats.cooldown_reduction || 0) : 0;
                    const expectedCd = baseCd * (1 - cdr / 100);
                    
                    GameRules.SendCustomMessage(
                        `${ability.GetAbilityName()}: 基础=${baseCd.toFixed(1)}s -> 预期=${expectedCd.toFixed(1)}s`,
                        playerId, 0
                    );
                }
            }
        }
        
        // ========== 调试命令 ==========
        
        // ⭐ 强制添加 modifier
        if (text === '-addmod') {
            ensureModifier(hero);
            const hasModifier = hero.HasModifier("modifier_equipment_system");
            GameRules.SendCustomMessage(`Modifier状态: ${hasModifier ? '已添加' : '添加失败'}`, playerId, 0);
        }
        
        // ========== 帮助命令 ==========
        
        if (text === '-eqhelp') {
            GameRules.SendCustomMessage(`===== 装备测试命令 =====`, playerId, 0);
            GameRules.SendCustomMessage(`-eqstats - 显示当前装备属性`, playerId, 0);
            GameRules.SendCustomMessage(`-setcrit [值] - 设置暴击率 (例: -setcrit 50)`, playerId, 0);
            GameRules.SendCustomMessage(`-testcrit - 生成假人测试暴击`, playerId, 0);
            GameRules.SendCustomMessage(`-setfire/-setcold/-setlight [值] - 设置抗性`, playerId, 0);
            GameRules.SendCustomMessage(`-testfire/-testcold/-testlight - 测试元素伤害`, playerId, 0);
            GameRules.SendCustomMessage(`-setcdr [值] - 设置冷却缩减`, playerId, 0);
            GameRules.SendCustomMessage(`-testcdr - 显示技能冷却时间`, playerId, 0);
            GameRules.SendCustomMessage(`-addmod - 强制添加装备Modifier`, playerId, 0);
        }
        
    }, null);
    
    print('[EquipmentTest] 测试命令已注册，输入 -eqhelp 查看帮助');
}

function ensureStats(playerId: PlayerID): void {
    if (!_G.EquipmentStats) {
        _G.EquipmentStats = {};
    }
    if (!_G.EquipmentStats[playerId]) {
        _G.EquipmentStats[playerId] = {
            strength: 0, agility: 0, intelligence: 0, armor: 0, health: 0, mana: 0,
            attack_damage: 0, attack_speed: 0, move_speed: 0, magic_resistance: 0,
            crit_chance: 0, crit_multiplier: 150, cooldown_reduction: 0,
            fire_resistance: 0, cold_resistance: 0, lightning_resistance: 0, evasion: 0,
        };
    }
}

// ⭐ 确保 modifier 存在
function ensureModifier(hero: CDOTA_BaseNPC_Hero): void {
    if (!hero.HasModifier("modifier_equipment_system")) {
        const modifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
        if (modifier) {
            print(`[EquipmentTest] 已添加 modifier_equipment_system`);
        } else {
            print(`[EquipmentTest] 添加 modifier 失败！`);
        }
    }
}

function refreshModifier(hero: CDOTA_BaseNPC_Hero): void {
    const modifier = hero.FindModifierByName("modifier_equipment_system");
    if (modifier && ! modifier.IsNull()) {
        (modifier as any).OnRefresh({});
        print(`[EquipmentTest] Modifier 已刷新`);
    } else {
        print(`[EquipmentTest] 未找到 modifier，尝试添加...`);
        ensureModifier(hero);
    }
}