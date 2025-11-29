import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { RuneSystem, RuneEffectType } from "../../systems/rune_system";

@registerAbility()
export class warrior_thunder_strike extends BaseAbility {
    
    OnAbilityPhaseStart(): boolean {
        const caster = this. GetCaster();
        const caster_position = caster.GetAbsOrigin();
        
        // 蓄力特效
        const charge = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_zuus/zuus_arc_lightning.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.SetParticleControl(charge, 0, caster_position);
        ParticleManager.ReleaseParticleIndex(charge);
        
        caster.EmitSound("Hero_Zuus.ArcLightning.Cast");
        
        return true;
    }
    
    OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const caster_position = caster.GetAbsOrigin();
        const playerId = caster.GetPlayerOwnerID();
        
        // ========== 基础数值 ==========
        const baseRadius = this.GetSpecialValueFor("radius") || 600;
        const baseDamagePct = this.GetSpecialValueFor("damage_pct") || 1.5;
        const attackDamage = (caster. GetBaseDamageMin() + caster.GetBaseDamageMax()) / 2;
        const baseDamage = attackDamage * baseDamagePct;
        
        // ========== 获取护石加成 ==========
        const damageBonus = RuneSystem. getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType.DAMAGE_PERCENT);
        const rangeBonus = RuneSystem.getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType.RANGE_PERCENT);
        const lifestealBonus = RuneSystem. getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType.LIFESTEAL);
        const critChanceBonus = RuneSystem.getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType. CRIT_CHANCE);
        const critDamageBonus = RuneSystem.getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType.CRIT_DAMAGE);
        const burnDamageBonus = RuneSystem.getSkillRuneBonus(playerId, 'warrior_thunder_strike', RuneEffectType.BURN_DAMAGE);
        
        // ========== 应用护石加成 ==========
        const finalDamage = baseDamage * (1 + damageBonus / 100);
        const finalRadius = baseRadius * (1 + rangeBonus / 100);
        
        // 暴击计算
        const baseCritChance = 0; // 基础暴击率（可从其他地方获取）
        const totalCritChance = baseCritChance + critChanceBonus;
        const baseCritMultiplier = 200; // 基础暴击伤害 200%
        const totalCritMultiplier = baseCritMultiplier + critDamageBonus;
        
        print('[ThunderStrike] ========== 护石加成 ==========');
        print('[ThunderStrike] 伤害加成: +' + damageBonus + '%');
        print('[ThunderStrike] 范围加成: +' + rangeBonus + '%');
        print('[ThunderStrike] 生命偷取: +' + lifestealBonus + '%');
        print('[ThunderStrike] 暴击率: +' + critChanceBonus + '%');
        print('[ThunderStrike] 暴击伤害: +' + critDamageBonus + '%');
        print('[ThunderStrike] 燃烧伤害: +' + burnDamageBonus + '%');
        print('[ThunderStrike] ========== 最终数值 ==========');
        print('[ThunderStrike] 基础伤害: ' + baseDamage. toFixed(0) + ' -> 最终伤害: ' + finalDamage.toFixed(0));
        print('[ThunderStrike] 基础范围: ' + baseRadius + ' -> 最终范围: ' + finalRadius. toFixed(0));
        
        // ========== 特效 ==========
        // 熊猫雷霆一击（地面冲击波）
        const thunder_clap = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_brewmaster/brewmaster_thunder_clap.vpcf",
            ParticleAttachment. ABSORIGIN,
            caster
        );
        ParticleManager.SetParticleControl(thunder_clap, 0, caster_position);
        ParticleManager. SetParticleControl(thunder_clap, 1, Vector(finalRadius, finalRadius, finalRadius));
        ParticleManager.ReleaseParticleIndex(thunder_clap);
        
        // 音效 + 屏幕震动
        EmitSoundOnLocationWithCaster(caster_position, "Hero_Brewmaster. ThunderClap", caster);
        ScreenShake(caster_position, 350, 450, 1.2, finalRadius * 2, 0, true);
        
        caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_3);
        
        // ========== 寻找敌人（使用最终范围） ==========
        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster_position,
            undefined,
            finalRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO + UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        print('[ThunderStrike] 命中 ' + enemies.length + ' 个敌人');
        
        // ========== 统计总伤害（用于生命偷取） ==========
        let totalDamageDealt = 0;
        
        // ========== 对每个敌人造成伤害 ==========
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || !enemy.IsAlive()) continue;
            
            Timers.CreateTimer(i * 0.08, () => {
                if (!enemy || !enemy.IsAlive()) return;
                
                const enemy_position = enemy.GetAbsOrigin();
                
                // 闪电起点（敌人上方 1000 单位）
                const lightning_start = enemy_position.__add(Vector(0, 0, 1000)) as Vector;
                
                // 创建宙斯闪电（从天而降）
                const lightning = ParticleManager.CreateParticle(
                    "particles/units/heroes/hero_zuus/zuus_lightning_bolt. vpcf",
                    ParticleAttachment.WORLDORIGIN,
                    undefined
                );
                ParticleManager.SetParticleControl(lightning, 0, lightning_start);
                ParticleManager.SetParticleControl(lightning, 1, enemy_position);
                ParticleManager. SetParticleControl(lightning, 2, Vector(0, 0, 0));
                ParticleManager.ReleaseParticleIndex(lightning);
                
                // 闪电音效
                EmitSoundOnLocationWithCaster(enemy_position, "Hero_Zuus.LightningBolt", caster);
                
                // ========== 计算最终伤害（含暴击） ==========
                let actualDamage = finalDamage;
                let isCrit = false;
                
                // 暴击判定
                if (totalCritChance > 0 && RandomInt(1, 100) <= totalCritChance) {
                    actualDamage = finalDamage * (totalCritMultiplier / 100);
                    isCrit = true;
                    print('[ThunderStrike] ★ 暴击!  伤害: ' + actualDamage.toFixed(0));
                    
                    // 暴击特效（可选）
                    const critEffect = ParticleManager.CreateParticle(
                        "particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact.vpcf",
                        ParticleAttachment.ABSORIGIN_FOLLOW,
                        enemy
                    );
                    ParticleManager.ReleaseParticleIndex(critEffect);
                }
                
                // ========== 造成伤害 ==========
                ApplyDamage({
                    victim: enemy,
                    attacker: caster,
                    damage: actualDamage,
                    damage_type: DamageTypes.MAGICAL,
                    ability: this,
                });
                
                totalDamageDealt += actualDamage;
                
                // ========== 燃烧效果 ==========
                if (burnDamageBonus > 0) {
                    const burnDamage = actualDamage * (burnDamageBonus / 100);
                    const burnDuration = 3; // 3秒燃烧
                    const burnDps = burnDamage / burnDuration;
                    
                    // 添加燃烧 Modifier（如果有的话）
                    // 或者直接用定时器造成持续伤害
                    this.ApplyBurnEffect(caster, enemy, burnDps, burnDuration);
                    
                    print('[ThunderStrike] 🔥 燃烧伤害: ' + burnDamage.toFixed(0) + ' (' + burnDuration + '秒)');
                }
                
                // ========== 应用重伤 ==========
                this.ApplyDeepWound(caster, enemy);
                
                print('[ThunderStrike] ⚡ 闪电击中 ' + enemy.GetUnitName() + ' 伤害: ' + actualDamage.toFixed(0) + (isCrit ? ' (暴击!)' : ''));
            });
        }
        
        // ========== 生命偷取（延迟执行，等所有伤害结算完） ==========
        if (lifestealBonus > 0) {
            Timers.CreateTimer(enemies.length * 0.08 + 0.1, () => {
                const healAmount = totalDamageDealt * (lifestealBonus / 100);
                if (healAmount > 0 && caster. IsAlive()) {
                    caster.Heal(healAmount, this);
                    
                    // 治疗特效
                    const healEffect = ParticleManager.CreateParticle(
                        "particles/items3_fx/octarine_core_lifesteal.vpcf",
                        ParticleAttachment. ABSORIGIN_FOLLOW,
                        caster
                    );
                    ParticleManager. ReleaseParticleIndex(healEffect);
                    
                    print('[ThunderStrike] 💚 生命偷取: +' + healAmount.toFixed(0) + ' HP');
                }
            });
        }
        
        this. UseResources(false, false, false, true);
    }
    
    // 应用燃烧效果
    ApplyBurnEffect(attacker: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC, dps: number, duration: number): void {
        // 燃烧特效
        const burnParticle = ParticleManager. CreateParticle(
            "particles/units/heroes/hero_huskar/huskar_burning_spear_debuff.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        
        // 持续伤害
        let ticks = 0;
        const maxTicks = duration * 2; // 每0.5秒一次
        const damagePerTick = dps / 2;
        
        Timers.CreateTimer(0.5, function() {
            if (! target || !target.IsAlive()) {
                ParticleManager.DestroyParticle(burnParticle, false);
                ParticleManager.ReleaseParticleIndex(burnParticle);
                return undefined;
            }
            
            ApplyDamage({
                victim: target,
                attacker: attacker,
                damage: damagePerTick,
                damage_type: DamageTypes. MAGICAL,
            });
            
            ticks++;
            if (ticks >= maxTicks) {
                ParticleManager. DestroyParticle(burnParticle, false);
                ParticleManager.ReleaseParticleIndex(burnParticle);
                return undefined;
            }
            
            return 0.5;
        });
    }
    
    // 应用重伤
    ApplyDeepWound(attacker: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): void {
        const deepWoundAbility = attacker.FindAbilityByName("warrior_deep_wound");
        if (! deepWoundAbility) {
            print("[ThunderStrike] ✗ Deep Wound ability not found!");
            return;
        }
        
        const duration = deepWoundAbility.GetSpecialValueFor("duration") || 6;
        const attackDamage = (attacker. GetBaseDamageMin() + attacker.GetBaseDamageMax()) / 2;
        
        const base_multiplier = deepWoundAbility.GetSpecialValueFor("base_multiplier") || 0.7;
        const damage_multiplier = deepWoundAbility.GetSpecialValueFor("damage_multiplier") || 0.6;
        const damage_to_add = attackDamage * base_multiplier * damage_multiplier * duration;
        
        const existingDebuff = target.FindModifierByName("modifier_warrior_deep_wound_debuff");
        
        if (existingDebuff) {
            const debuffInstance = existingDebuff as any;
            if (debuffInstance.AddDamageToPool) {
                debuffInstance.AddDamageToPool(damage_to_add);
            }
            target.EmitSound("Hero_PhantomAssassin.CoupDeGrace");
        } else {
            target.AddNewModifier(
                attacker,
                deepWoundAbility,
                "modifier_warrior_deep_wound_debuff",
                {
                    duration: duration,
                    initial_damage: damage_to_add,
                }
            );
            target.EmitSound("Hero_Bloodseeker.Rupture");
        }
    }
}