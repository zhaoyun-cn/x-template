/**
 * 元素伤害系统
 * 用于标记和计算元素伤害
 */

export enum ElementType {
    NONE = 0,
    FIRE = 1,
    COLD = 2,
    LIGHTNING = 3,
}

/** @luaTable */
declare const _G: {
    ElementalDamageMarkers: { [entityIndex: number]: ElementType };
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

if (!_G.ElementalDamageMarkers) {
    _G.ElementalDamageMarkers = {};
}

export class ElementalDamageSystem {
    
    /**
     * 标记单位的下次伤害为元素伤害
     */
    static MarkNextDamageAsElemental(attacker: CDOTA_BaseNPC, element: ElementType): void {
        _G.ElementalDamageMarkers[attacker.GetEntityIndex()] = element;
    }
    
    /**
     * 获取并清除元素标记
     */
    static GetAndClearElementMark(attacker: CDOTA_BaseNPC): ElementType {
        const index = attacker.GetEntityIndex();
        const element = _G.ElementalDamageMarkers[index] || ElementType.NONE;
        _G.ElementalDamageMarkers[index] = ElementType.NONE;
        return element;
    }
    
    /**
     * 计算元素伤害减免
     */
    static CalculateElementalReduction(target: CDOTA_BaseNPC, element: ElementType): number {
        const playerId = target.GetPlayerOwnerID();
        if (playerId < 0) return 0;
        
        const stats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
        if (!stats) return 0;
        
        switch (element) {
            case ElementType.FIRE:
                return stats.fire_resistance || 0;
            case ElementType.COLD:
                return stats.cold_resistance || 0;
            case ElementType.LIGHTNING:
                return stats.lightning_resistance || 0;
            default:
                return 0;
        }
    }
    
    /**
     * 应用元素伤害（带抗性计算）
     */
    static ApplyElementalDamage(
        attacker: CDOTA_BaseNPC,
        target: CDOTA_BaseNPC,
        damage: number,
        element: ElementType,
        ability?: CDOTABaseAbility
    ): number {
        // 计算抗性减免
        const reduction = this.CalculateElementalReduction(target, element);
        const finalDamage = damage * (1 - reduction / 100);
        
        // 应用伤害
        ApplyDamage({
            victim: target,
            attacker: attacker,
            damage: finalDamage,
            damage_type: DamageTypes.MAGICAL,
            ability: ability,
        });
        
        // 显示元素伤害特效
        this.ShowElementalDamageEffect(target, element, finalDamage);
        
        print(`[ElementalDamage] ${ElementType[element]} 伤害: ${damage} -> ${finalDamage.toFixed(0)} (${reduction}% 抗性)`);
        
        return finalDamage;
    }
    
    /**
     * 显示元素伤害特效
     */
    private static ShowElementalDamageEffect(target: CDOTA_BaseNPC, element: ElementType, damage: number): void {
        let particlePath = "";
        let color = Vector(255, 255, 255);
        
        switch (element) {
            case ElementType.FIRE:
                particlePath = "particles/units/heroes/hero_lina/lina_spell_light_strike_array_explosion.vpcf";
                color = Vector(255, 100, 0);
                break;
            case ElementType.COLD:
                particlePath = "particles/units/heroes/hero_crystalmaiden/maiden_frostbite_buff.vpcf";
                color = Vector(100, 200, 255);
                break;
            case ElementType.LIGHTNING:
                particlePath = "particles/units/heroes/hero_zuus/zuus_lightning_bolt_impact.vpcf";
                color = Vector(255, 255, 100);
                break;
        }
        
        if (particlePath) {
            const particle = ParticleManager.CreateParticle(
                particlePath,
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.SetParticleControl(particle, 0, target.GetAbsOrigin());
            ParticleManager.ReleaseParticleIndex(particle);
        }
    }
}

// ==================== 初始化 ====================
if (IsServer()) {
    print('[ElementalDamageSystem] 元素伤害系统已加载');
}