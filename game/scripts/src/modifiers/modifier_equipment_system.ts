import { BaseModifier, registerModifier } from "../utils/dota_ts_adapter";

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
    EquipmentBaseHealth: { [playerId: number]: number };
    EquipmentHealthBonus: { [playerId: number]: number };
};

if (!_G.EquipmentBaseHealth) {
    _G.EquipmentBaseHealth = {};
}
if (!_G.EquipmentHealthBonus) {
    _G.EquipmentHealthBonus = {};
}

@registerModifier()
export class modifier_equipment_system extends BaseModifier {
    private stats: EquipmentTotalStats = {
        strength: 0, agility: 0, intelligence: 0, armor: 0, health: 0, mana: 0,
        attack_damage: 0, attack_speed: 0, move_speed: 0, magic_resistance: 0,
        crit_chance: 0, crit_multiplier: 0, cooldown_reduction: 0,
        fire_resistance: 0, cold_resistance: 0, lightning_resistance: 0, evasion: 0,
    };
    
    // ⭐ 记录本次攻击是否暴击
    private isCrit: boolean = false;

    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }
    IsPermanent(): boolean { return true; }

    OnCreated(): void {
        if (!IsServer()) return;
        
        print(`[modifier_equipment_system] OnCreated 被调用`);
        
        const parent = this.GetParent();
        const playerId = parent.GetPlayerOwnerID();
        
        Timers.CreateTimer(0.5, () => {
            if (! IsValidEntity(parent)) return undefined;
            
            if (_G.EquipmentBaseHealth[playerId] === undefined) {
                _G.EquipmentBaseHealth[playerId] = parent.GetMaxHealth();
                _G.EquipmentHealthBonus[playerId] = 0;
            }
            
            this.LoadStatsFromGlobal();
            return undefined;
        });
        
        this.StartIntervalThink(1.0);
    }

    OnRefresh(): void {
        if (!IsServer()) return;
        print(`[modifier_equipment_system] OnRefresh 被调用`);
        this.LoadStatsFromGlobal();
    }
    
    OnIntervalThink(): void {
        if (! IsServer()) return;
        
        const parent = this.GetParent();
        if (!parent || parent.IsNull()) return;
        
        const playerId = parent.GetPlayerOwnerID();
        if (playerId < 0) return;
        
        const expectedBonus = _G.EquipmentHealthBonus[playerId] || 0;
        if (expectedBonus > 0) {
            const baseHealth = _G.EquipmentBaseHealth[playerId] || parent.GetMaxHealth();
            const expectedMax = baseHealth + expectedBonus;
            const currentMax = parent.GetMaxHealth();
            
            if (Math.abs(currentMax - expectedMax) > 5) {
                this.ForceApplyHealth(parent, playerId, expectedBonus);
            }
        }
    }

    private LoadStatsFromGlobal(): void {
        const parent = this.GetParent();
        if (!parent || parent.IsNull()) return;
        
        const playerId = parent.GetPlayerOwnerID();
        if (playerId === -1) return;
        
        if (! _G.EquipmentStats) {
            _G.EquipmentStats = {};
        }
        
        const globalStats = _G.EquipmentStats[playerId];
        const oldHealth = this.stats.health;
        
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
                crit_multiplier: globalStats.crit_multiplier || 150,
                cooldown_reduction: globalStats.cooldown_reduction || 0,
                fire_resistance: globalStats.fire_resistance || 0,
                cold_resistance: globalStats.cold_resistance || 0,
                lightning_resistance: globalStats.lightning_resistance || 0,
                evasion: globalStats.evasion || 0,
            };
            
            _G.EquipmentHealthBonus[playerId] = this.stats.health;
            
            if (this.stats.health !== oldHealth) {
                this.ForceApplyHealth(parent, playerId, this.stats.health);
            }
            
            print(`[modifier_equipment_system] 加载属性: 暴击率=${this.stats.crit_chance}%, 暴击伤害=${this.stats.crit_multiplier}%`);
        }
    }
    
    private ForceApplyHealth(parent: CDOTA_BaseNPC, playerId: number, healthBonus: number): void {
        Timers.CreateTimer(0.1, () => {
            if (!IsValidEntity(parent)) return undefined;
            
            const baseHealth = _G.EquipmentBaseHealth[playerId];
            if (baseHealth === undefined) return undefined;
            
            const newMaxHealth = baseHealth + healthBonus;
            const currentHealth = parent.GetHealth();
            const currentMax = parent.GetMaxHealth();
            const healthPercent = currentMax > 0 ?  currentHealth / currentMax : 1;
            
            parent.SetBaseMaxHealth(newMaxHealth);
            parent.SetMaxHealth(newMaxHealth);
            
            const newHealth = Math.max(1, Math.floor(newMaxHealth * healthPercent));
            parent.SetHealth(newHealth);
            
            return undefined;
        });
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.EXTRA_MANA_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.EVASION_CONSTANT,
            ModifierFunction.COOLDOWN_PERCENTAGE,
            ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
            // ⭐ 暴击需要这两个函数配合
            ModifierFunction.PREATTACK_CRITICALSTRIKE,
            ModifierFunction.TOOLTIP,
        ];
    }

    // ========== 基础属性 ==========
    GetModifierBonusStats_Strength(): number { return this.stats.strength; }
    GetModifierBonusStats_Agility(): number { return this.stats.agility; }
    GetModifierBonusStats_Intellect(): number { return this.stats.intelligence; }
    GetModifierPhysicalArmorBonus(): number { return this.stats.armor; }
    GetModifierExtraManaBonus(): number { return this.stats.mana; }
    GetModifierPreAttack_BonusDamage(): number { return this.stats.attack_damage; }
    GetModifierAttackSpeedBonus_Constant(): number { return this.stats.attack_speed; }
    GetModifierMoveSpeedBonus_Constant(): number { return this.stats.move_speed; }
    GetModifierMagicalResistanceBonus(): number { return this.stats.magic_resistance; }
    GetModifierEvasion_Constant(): number { return this.stats.evasion; }

    // ⭐⭐⭐ 暴击率实现 - 修复版
    GetModifierPreattack_CriticalStrike(): number {
        if (! IsServer()) return 0;
        
        const critChance = this.stats.crit_chance || 0;
        if (critChance <= 0) return 0;
        
        // 随机判断是否暴击
        const roll = RandomInt(1, 100);
        this.isCrit = roll <= critChance;
        
        if (this.isCrit) {
            const critDamage = this.stats.crit_multiplier || 200;
            print(`[modifier_equipment_system] 暴击!  Roll=${roll}, 暴击率=${critChance}%, 暴击伤害=${critDamage}%`);
            return critDamage;  // 返回暴击伤害百分比 (200 = 200%)
        }
        
        return 0;
    }
    
    // ⭐ Tooltip 用于显示暴击率
    OnTooltip(): number {
        return this.stats.crit_chance || 0;
    }

    // ⭐⭐⭐ 冷却缩减实现
    GetModifierPercentageCooldown(): number {
        return -(this.stats.cooldown_reduction || 0);
    }

    // ⭐⭐⭐ 元素抗性实现
    GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
        if (! IsServer()) return 0;
        
        const damageType = event.damage_type;
        let reduction = 0;
        
        if (damageType === DamageTypes.MAGICAL) {
            reduction = this.stats.magic_resistance || 0;
        }
        
        const attacker = event.attacker;
        if (attacker) {
            if (attacker.HasModifier("modifier_fire_damage") || 
                attacker.HasModifier("modifier_lina_fiery_soul") ||
                attacker.HasModifier("modifier_phoenix_fire_spirit_burn")) {
                reduction = Math.max(reduction, this.stats.fire_resistance || 0);
            }
            
            if (attacker.HasModifier("modifier_cold_damage") ||
                attacker.HasModifier("modifier_lich_frost_armor") ||
                attacker.HasModifier("modifier_crystal_maiden_frostbite")) {
                reduction = Math.max(reduction, this.stats.cold_resistance || 0);
            }
            
            if (attacker.HasModifier("modifier_lightning_damage") ||
                attacker.HasModifier("modifier_storm_spirit_overload") ||
                attacker.HasModifier("modifier_zuus_static_field")) {
                reduction = Math.max(reduction, this.stats.lightning_resistance || 0);
            }
        }
        
        return -reduction;
    }
}