import { BaseModifier, registerModifier } from "../utils/dota_ts_adapter";

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

@registerModifier()
export class modifier_equipment_system extends BaseModifier {
    private stats: EquipmentTotalStats = this.CreateEmptyStats();

    private CreateEmptyStats(): EquipmentTotalStats {
        return {
            strength: 0, agility: 0, intelligence: 0, armor: 0, health: 0, mana: 0,
            attack_damage: 0, attack_speed: 0, move_speed: 0, magic_resistance: 0,
            crit_chance: 0, crit_multiplier: 0, cooldown_reduction: 0,
            fire_resistance: 0, cold_resistance: 0, lightning_resistance: 0, evasion: 0,
        };
    }

    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }
    IsPermanent(): boolean { return true; }

    OnCreated(): void {
        if (!IsServer()) return;
        this.LoadStatsFromGlobal();
    }

    OnRefresh(): void {
        if (!IsServer()) return;
        this.LoadStatsFromGlobal();
    }

    // ⭐ 不使用 OnIntervalThink，避免覆盖

    private LoadStatsFromGlobal(): void {
        const parent = this.GetParent();
        if (! parent || parent.IsNull()) return;
        
        const playerId = parent.GetPlayerOwnerID();
        if (playerId === -1) return;
        
        if (!_G.EquipmentStats) {
            _G.EquipmentStats = {};
        }
        
        const globalStats = _G.EquipmentStats[playerId];
        
        if (globalStats) {
            this.stats = {
                strength: globalStats.strength || 0,
                agility: globalStats.agility || 0,
                intelligence: globalStats.intelligence || 0,
                armor: globalStats.armor || 0,
                health: globalStats.health || 0,
                mana: globalStats.mana || 0,
                attack_damage: globalStats.attack_damage || 0,
                attack_speed: globalStats.attack_speed || 0,
                move_speed: globalStats.move_speed || 0,
                magic_resistance: globalStats.magic_resistance || 0,
                crit_chance: globalStats.crit_chance || 0,
                crit_multiplier: globalStats.crit_multiplier || 0,
                cooldown_reduction: globalStats.cooldown_reduction || 0,
                fire_resistance: globalStats.fire_resistance || 0,
                cold_resistance: globalStats.cold_resistance || 0,
                lightning_resistance: globalStats.lightning_resistance || 0,
                evasion: globalStats.evasion || 0,
            }; // ⭐ 打印调试信息
            print(`[modifier_equipment_system] 加载属性: 力量=${this.stats.strength}, 生命=${this.stats.health}, 攻速=${this.stats. attack_speed}`);
        } else {
            this.stats = this.CreateEmptyStats();
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.EXTRA_HEALTH_BONUS,
            ModifierFunction.EXTRA_MANA_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.EVASION_CONSTANT,
            ModifierFunction.PREATTACK_CRITICALSTRIKE,  // ⭐ 暴击率
        ];
    }

    GetModifierBonusStats_Strength(): number { return this.stats.strength; }
    GetModifierBonusStats_Agility(): number { return this.stats.agility; }
    GetModifierBonusStats_Intellect(): number { return this.stats.intelligence; }
    GetModifierPhysicalArmorBonus(): number { return this.stats.armor; }
    GetModifierExtraHealthBonus(): number { return this.stats.health; }
    GetModifierExtraManaBonus(): number { return this.stats.mana; }
    GetModifierPreAttack_BonusDamage(): number { return this.stats.attack_damage; }
    GetModifierAttackSpeedBonus_Constant(): number { return this.stats.attack_speed; }
    GetModifierMoveSpeedBonus_Constant(): number { return this.stats.move_speed; }
    GetModifierMagicalResistanceBonus(): number { return this.stats.magic_resistance; }
    GetModifierEvasion_Constant(): number { return this.stats.evasion; }
      // ⭐ 暴击率
    GetModifierPreattack_CriticalStrike(): number {
        if (this.stats.crit_chance > 0) {
            // 返回暴击率百分比
            return this.stats.crit_chance;
        }
        return 0;
    }
}