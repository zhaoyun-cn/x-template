import { BaseAbility, registerAbility } from "../../../utils/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../utils/dota_ts_adapter";
import { PhaseConfig } from "../shadow_fiend_cosmetics";

@registerAbility()
export class shadow_explosion extends BaseAbility {
    OnSpellStart(): void {
        const caster = this.GetCaster();
        const origin = caster.GetAbsOrigin();
        
        // ✅ 根据等级（阶段）决定弹道数量
        const phase = this.GetLevel();
        const projectileCount = PhaseConfig[phase]?.projectileCount || 4;
        
        print(`[shadow_explosion] Casting!  Phase ${phase}, ${projectileCount} projectiles`);
        
        // 添加吟唱状态
        caster.AddNewModifier(
            caster,
            this,
            "modifier_shadow_casting",
            { duration: 1.5 }
        );
        
        // 播放音效
        caster.EmitSound("Hero_Nevermore.Shadowraze");
        
        // 1. 5秒后显示预警
        Timers.CreateTimer(1.5, () => {
            this.ShowWarnings(origin, projectileCount);
            
            // 再过1. 5秒发射弹道
            Timers.CreateTimer(1.5, () => {
                this.LaunchProjectiles(caster, origin, projectileCount);
                return undefined;
            });
            
            return undefined;
        });
    }

    private ShowWarnings(origin: Vector, count: number): void {
        print(`[shadow_explosion] Showing ${count} warnings! `);
        
        EmitSoundOnLocationWithCaster(origin, "Hero_PhoenixSun.LaunchSound", this.GetCaster());
        
        const angleStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const angle = (i * angleStep * Math.PI) / 180;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            // 在弹道路径上创建预警圈
            for (let dist = 200; dist <= 1200; dist += 200) {
                const posX = origin.x + dirX * dist;
                const posY = origin.y + dirY * dist;
                const pos = Vector(posX, posY, origin.z);
                
                const particle = ParticleManager.CreateParticle(
                    "particles/units/heroes/hero_leshrac/leshrac_split_earth.vpcf",
                    ParticleAttachment. WORLDORIGIN,
                    undefined
                );
                ParticleManager.SetParticleControl(particle, 0, pos);
                ParticleManager.SetParticleControl(particle, 1, Vector(150, 1.5, 150));
                
                Timers.CreateTimer(1.5, () => {
                    ParticleManager.DestroyParticle(particle, false);
                    ParticleManager. ReleaseParticleIndex(particle);
                    return undefined;
                });
            }
        }
    }

    private LaunchProjectiles(caster: CDOTA_BaseNPC, origin: Vector, count: number): void {
        print(`[shadow_explosion] Launching ${count} projectiles! `);
        
        const speed = this.GetSpecialValueFor("projectile_speed") || 800;
        const phase = this.GetLevel();
        const damage = PhaseConfig[phase]?. baseDamage || 200;
        
        caster.EmitSound("Hero_Nevermore.Shadowraze");
        
        const angleStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const angle = (i * angleStep * Math. PI) / 180;
            const velX = Math.cos(angle) * speed;
            const velY = Math.sin(angle) * speed;
            const velocity = Vector(velX, velY, 0);
            
            ProjectileManager.CreateLinearProjectile({
                Ability: this,
                EffectName: "particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf",
                vSpawnOrigin: origin,
                fDistance: 1200,
                fStartRadius: 150,
                fEndRadius: 150,
                Source: caster,
                bHasFrontalCone: false,
                iUnitTargetTeam: UnitTargetTeam.ENEMY,
                iUnitTargetFlags: UnitTargetFlags. NONE,
                iUnitTargetType: UnitTargetType. HERO + UnitTargetType.BASIC,
                fExpireTime: GameRules.GetGameTime() + 2.0,
               
                vVelocity: velocity,
                bProvidesVision: false
            });
        }
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined, location: Vector): boolean {
        if (!target) return false;
        
        const caster = this.GetCaster();
        const phase = this.GetLevel();
        const damage = PhaseConfig[phase]?.baseDamage || 200;
        const stunDuration = this.GetSpecialValueFor("stun_duration") || 1.5;
        
        // 造成伤害
        ApplyDamage({
            victim: target,
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.MAGICAL,
            ability: this
        });
        
        // 眩晕
        target.AddNewModifier(
            caster,
            this,
            "modifier_stunned",
            { duration: stunDuration }
        );
        
        // 击中特效
        const particle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_nevermore/nevermore_shadowraze_a.vpcf",
            ParticleAttachment. ABSORIGIN,
            target
        );
        ParticleManager.ReleaseParticleIndex(particle);
        
        target.EmitSound("Hero_Nevermore.Shadowraze");
        
        return true;
    }
}

// 吟唱状态
@registerModifier()
export class modifier_shadow_casting extends BaseModifier {
    IsHidden(): boolean { return false; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    
    GetEffectName(): string {
        return "particles/units/heroes/hero_nevermore/nevermore_necro_souls.vpcf";
    }
    
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment. ABSORIGIN_FOLLOW;
    }
    
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState. DISARMED]: true,
            [ModifierState. ROOTED]: true,
        };
    }
    
    OnCreated(): void {
        if (!IsServer()) return;
        this.GetParent().StartGesture(GameActivity.DOTA_CAST_ABILITY_4);
    }
    
    OnDestroy(): void {
        if (!IsServer()) return;
        this. GetParent().FadeGesture(GameActivity.DOTA_CAST_ABILITY_4);
    }
}