/**
 * 装备系统测试命令
 * 用于测试暴击、元素抗性、冷却缩减等功能
 */

import { EquipmentVaultSystem } from './equipment_vault_system';
import { ElementalDamageSystem, ElementType } from './elemental_damage_system';

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
        
        // 显示当前装备属性
        if (text === '-eqstats') {
            const stats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
            if (stats) {
                GameRules.SendCustomMessage(`<font color='#ffd700'>===== 装备属性 =====</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#ff6666'>力量: +${stats.strength}</font> | <font color='#66ff66'>敏捷: +${stats.agility}</font> | <font color='#6699ff'>智力: +${stats.intelligence}</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00ff00'>生命: +${stats.health}</font> | <font color='#aaa'>护甲: +${stats.armor}</font> | <font color='#6699ff'>魔法: +${stats.mana}</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#ff4444'>暴击率: ${stats.crit_chance}%</font> | <font color='#ff8800'>攻击力: +${stats.attack_damage}</font> | <font color='#ffaa00'>攻速: +${stats.attack_speed}%</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00ccff'>移速: +${stats.move_speed}%</font> | <font color='#aaaaff'>冷却缩减: ${stats.cooldown_reduction}%</font> | <font color='#99ff99'>闪避: ${stats.evasion}%</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#ff6600'>火抗: ${stats.fire_resistance}%</font> | <font color='#66ccff'>冰抗: ${stats.cold_resistance}%</font> | <font color='#ffff00'>电抗: ${stats.lightning_resistance}%</font>`, playerId, 0);
            } else {
                GameRules.SendCustomMessage(`<font color='#ff0'>暂无装备属性数据</font>`, playerId, 0);
            }
        }
        
        // ========== 暴击测试 ==========
        
        // 设置暴击率
        if (text.startsWith('-setcrit ')) {
            const value = parseInt(text.replace('-setcrit ', ''));
            if (! isNaN(value) && _G.EquipmentStats && _G.EquipmentStats[playerId]) {
                _G.EquipmentStats[playerId].crit_chance = value;
                refreshModifier(hero);
                GameRules.SendCustomMessage(`<font color='#ff4444'>暴击率已设置为 ${value}%</font>`, playerId, 0);
            }
        }
        
        // 测试暴击（生成一个假人让你打）
        if (text === '-testcrit') {
            const pos = hero.GetAbsOrigin() + hero.GetForwardVector() * 200 as Vector;
            const dummy = CreateUnitByName(
                "npc_dota_creep_badguys_melee",
                pos,
                true,
                undefined,
                undefined,
                DotaTeam.BADGUYS
            );
            
            if (dummy) {
                dummy.SetBaseMaxHealth(10000);
                dummy.SetMaxHealth(10000);
                dummy.SetHealth(10000);
                
                // 让假人不会动
                dummy.SetMoveCapability(UnitMoveCapability.NONE);
                dummy.AddNewModifier(dummy, undefined, "modifier_invulnerable", { duration: -1 });
                
                // 10秒后移除
                Timers.CreateTimer(10, () => {
                    if (IsValidEntity(dummy)) {
                        dummy.RemoveModifierByName("modifier_invulnerable");
                        dummy.ForceKill(false);
                    }
                    return undefined;
                });
                
                GameRules.SendCustomMessage(`<font color='#0f0'>已生成测试假人，攻击它测试暴击！(10秒后消失)</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#888'>当前暴击率: ${_G.EquipmentStats?.[playerId]?.crit_chance || 0}%</font>`, playerId, 0);
            }
        }
        
        // ========== 元素抗性测试 ==========
        
        // 设置火焰抗性
        if (text.startsWith('-setfire ')) {
            const value = parseInt(text.replace('-setfire ', ''));
            if (!isNaN(value) && _G.EquipmentStats && _G.EquipmentStats[playerId]) {
                _G.EquipmentStats[playerId].fire_resistance = value;
                refreshModifier(hero);
                GameRules.SendCustomMessage(`<font color='#ff6600'>火焰抗性已设置为 ${value}%</font>`, playerId, 0);
            }
        }
        
        // 设置冰霜抗性
        if (text.startsWith('-setcold ')) {
            const value = parseInt(text.replace('-setcold ', ''));
            if (! isNaN(value) && _G.EquipmentStats && _G.EquipmentStats[playerId]) {
                _G.EquipmentStats[playerId].cold_resistance = value;
                refreshModifier(hero);
                GameRules.SendCustomMessage(`<font color='#66ccff'>冰霜抗性已设置为 ${value}%</font>`, playerId, 0);
            }
        }
        
        // 设置闪电抗性
        if (text.startsWith('-setlight ')) {
            const value = parseInt(text.replace('-setlight ', ''));
            if (!isNaN(value) && _G.EquipmentStats && _G.EquipmentStats[playerId]) {
                _G.EquipmentStats[playerId].lightning_resistance = value;
                refreshModifier(hero);
                GameRules.SendCustomMessage(`<font color='#ffff00'>闪电抗性已设置为 ${value}%</font>`, playerId, 0);
            }
        }
        
        // 测试火焰伤害
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
            
            GameRules.SendCustomMessage(`<font color='#ff6600'>🔥 火焰伤害测试: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)</font>`, playerId, 0);
        }
        
        // 测试冰霜伤害
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
            
            GameRules.SendCustomMessage(`<font color='#66ccff'>❄️ 冰霜伤害测试: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)</font>`, playerId, 0);
        }
        
        // 测试闪电伤害
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
            
            GameRules.SendCustomMessage(`<font color='#ffff00'>⚡ 闪电伤害测试: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)</font>`, playerId, 0);
        }
        
        // ========== 冷却缩减测试 ==========
        
        // 设置冷却缩减
        if (text.startsWith('-setcdr ')) {
            const value = parseInt(text.replace('-setcdr ', ''));
            if (!isNaN(value) && _G.EquipmentStats && _G.EquipmentStats[playerId]) {
                _G.EquipmentStats[playerId].cooldown_reduction = value;
                refreshModifier(hero);
                GameRules.SendCustomMessage(`<font color='#aaaaff'>冷却缩减已设置为 ${value}%</font>`, playerId, 0);
            }
        }
        
        // 测试冷却缩减（显示技能实际冷却时间）
        if (text === '-testcdr') {
            GameRules.SendCustomMessage(`<font color='#aaaaff'>===== 技能冷却时间 =====</font>`, playerId, 0);
            
            for (let i = 0; i < 6; i++) {
                const ability = hero.GetAbilityByIndex(i);
                if (ability && ! ability.IsNull()) {
                    const baseCd = ability.GetCooldown(ability.GetLevel() - 1);
                    const actualCd = ability.GetCooldownTimeRemaining();
                    const cdr = _G.EquipmentStats?.[playerId]?.cooldown_reduction || 0;
                    const expectedCd = baseCd * (1 - cdr / 100);
                    
                    GameRules.SendCustomMessage(
                        `<font color='#fff'>${ability.GetAbilityName()}: 基础=${baseCd.toFixed(1)}s, 预期=${expectedCd.toFixed(1)}s</font>`,
                        playerId, 0
                    );
                }
            }
        }
        
        // ========== 帮助命令 ==========
        
        if (text === '-eqhelp') {
            GameRules.SendCustomMessage(`<font color='#ffd700'>===== 装备测试命令 =====</font>`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-eqstats</font> - 显示当前装备属性`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-setcrit [值]</font> - 设置暴击率`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-testcrit</font> - 生成假人测试暴击`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-setfire [值]</font> - 设置火焰抗性`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-setcold [值]</font> - 设置冰霜抗性`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-setlight [值]</font> - 设置闪电抗性`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-testfire</font> - 测试火焰伤害 (500点)`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-testcold</font> - 测试冰霜伤害 (500点)`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-testlight</font> - 测试闪电伤害 (500点)`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-setcdr [值]</font> - 设置冷却缩减`, playerId, 0);
            GameRules.SendCustomMessage(`<font color='#fff'>-testcdr</font> - 显示技能冷却时间`, playerId, 0);
        }
        
    }, null);
    
    print('[EquipmentTest] ✓ 测试命令已注册，输入 -eqhelp 查看帮助');
}

// 刷新 modifier
function refreshModifier(hero: CDOTA_BaseNPC_Hero): void {
    const modifier = hero.FindModifierByName("modifier_equipment_system");
    if (modifier && ! modifier.IsNull()) {
        (modifier as any).OnRefresh({});
    }
}