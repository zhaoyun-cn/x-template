import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { PhaseConfig } from "./shadow_fiend_cosmetics";

export class ShadowFiendBoss {
    private boss: CDOTA_BaseNPC;
    private currentPhase: number = 0;
    private playerId: PlayerID;
    private checkInterval?: string;
    private abilityInterval?: string;  // ✅ 技能释放定时器
    private phaseParticles: ParticleID[] = [];

    constructor(boss: CDOTA_BaseNPC, playerId: PlayerID) {
        this.boss = boss;
        this.playerId = playerId;
        
        print("[ShadowFiendBoss] Boss initialized!");
        
        // 延迟启动血量检测
        Timers.CreateTimer(1, () => {
            if (this.boss && this.boss.IsAlive()) {
                print("[ShadowFiendBoss] Starting health check...");
                this.StartHealthCheck();
                
                // ✅✅✅ 启动技能自动释放（每5秒） ✅✅✅
                this.StartAbilityCast();
            }
            return undefined;
        });
    }

    private StartHealthCheck(): void {
        this.checkInterval = Timers.CreateTimer(0.5, () => {
            if (this.boss && this. boss.IsAlive()) {
                this.CheckHealthThreshold();
                return 0.5;
            }
            return undefined;
        });
    }

    // ✅✅✅ 新增：自动释放技能系统 ✅✅✅
    private StartAbilityCast(): void {
        print("[ShadowFiendBoss] Starting auto ability cast (every 10s)...");
        
        this.abilityInterval = Timers.CreateTimer(10, () => {
            if (this. boss && this.boss.IsAlive()) {
                this.CastPhaseAbility();
                return 10;  // ✅ 每10秒重复
            }
            return undefined;
        });
    }

    private CheckHealthThreshold(): void {
        const healthPercent = this.boss.GetHealthPercent();
        
        if (healthPercent <= 66 && this.currentPhase === 0) {
            this.TriggerPhase(1);
        } else if (healthPercent <= 33 && this.currentPhase === 1) {
            this.TriggerPhase(2);
        } else if (healthPercent <= 10 && this.currentPhase === 2) {
            this. TriggerPhase(3);
        }
    }

    private TriggerPhase(phase: number): void {
        this.currentPhase = phase;
        const config = PhaseConfig[phase];
        
        print(`[ShadowFiendBoss] ========== PHASE ${phase}: ${config.name} ==========`);
        
        // 播放转阶段特效
        this.PlayPhaseTransitionEffect();
        
        // 给玩家提示
        const messages = [
            "",
            `<font color='#888888'>⚔️ Boss进入【${config.name}】！</font>`,
            `<font color='#FF6600'>🔥 Boss进入【${config.name}】！烈焰之力觉醒！</font>`,
            `<font color='#8B00FF'>💀 Boss进入【${config. name}】！恶魔真身降临！</font>`,
        ];
        
        GameRules.SendCustomMessage(messages[phase], this.playerId, 0);
        
        // 应用阶段变化
        Timers.CreateTimer(0.5, () => {
            if (! this.boss. IsAlive()) return undefined;
            
            this.ApplyPhaseChanges(phase, config);
            
            // ✅ 转阶段时立即释放一次技能
            Timers.CreateTimer(0.3, () => {
                if (! this.boss.IsAlive()) return undefined;
                this.CastPhaseAbility();
                return undefined;
            });
            
            return undefined;
        });
    }

    private PlayPhaseTransitionEffect(): void {
        ScreenShake(this.boss.GetAbsOrigin(), 10, 150, 0.5, 2000, 0, true);
        
        const particle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_nevermore/nevermore_shadowraze_a. vpcf",
            ParticleAttachment.ABSORIGIN,
            this.boss
        );
        ParticleManager.SetParticleControl(particle, 0, this.boss.GetAbsOrigin());
        ParticleManager.SetParticleControl(particle, 1, Vector(500, 500, 500));
        
        Timers.CreateTimer(2, () => {
            ParticleManager.DestroyParticle(particle, false);
            ParticleManager.ReleaseParticleIndex(particle);
            return undefined;
        });
        
        this.boss.EmitSound("Hero_Nevermore.Requiem");
    }

    private ApplyPhaseChanges(phase: number, config: typeof PhaseConfig[1]): void {
        print("[ShadowFiendBoss] Applying phase changes...");
        
        // 改变模型大小
        this.boss.SetModelScale(config.modelScale);
        print(`[ShadowFiendBoss] ✓ Model scale: ${config.modelScale}`);
        
        // 改变颜色
        this.boss. SetRenderColor(config.color. r, config.color.g, config.color.b);
        print(`[ShadowFiendBoss] ✓ Color: RGB(${config.color.r}, ${config.color.g}, ${config.color.b})`);
        
        // 改变攻击属性
        this.boss.SetBaseDamageMin(config.baseDamage);
        this.boss.SetBaseDamageMax(config. baseDamage + 50);
        this.boss.SetBaseAttackTime(config.attackSpeed);
        print(`[ShadowFiendBoss] ✓ Damage: ${config.baseDamage}, Attack Speed: ${config.attackSpeed}`);
        
        // ✅ 更新技能等级
        const ability = this.boss.FindAbilityByName("shadow_explosion");
        if (ability) {
            ability.SetLevel(phase);
            ability.EndCooldown();  // 重置冷却
            print(`[ShadowFiendBoss] ✓ Ability level: ${phase}, cooldown reset`);
        } else {
            print("[ShadowFiendBoss] ✗ shadow_explosion not found!");
        }
        
        // 添加阶段光环
        this.AddPhaseAura(phase);
        
        // 阶段3狂暴
        if (phase === 3) {
            this.boss.AddNewModifier(this. boss, undefined, "modifier_shadow_boss_enrage", {});
            print("[ShadowFiendBoss] ✓ Enrage modifier added");
        }
        
        print(`[ShadowFiendBoss] ========== Phase ${phase} Complete ==========`);
    }

    private CastPhaseAbility(): void {
        print("[ShadowFiendBoss] Attempting to cast phase ability...");
        
        const ability = this.boss.FindAbilityByName("shadow_explosion");
        if (!ability) {
            print("[ShadowFiendBoss] ✗ Ability not found!");
            return;
        }
        
        const level = ability.GetLevel();
        const cooldown = ability.GetCooldownTimeRemaining();
        print(`[ShadowFiendBoss] Ability: Level=${level}, Cooldown=${cooldown. toFixed(1)}s`);
        
        if (ability.IsFullyCastable()) {
            print("[ShadowFiendBoss] ✓ Casting ability...");
            this.boss.CastAbilityNoTarget(ability, -1);
        } else {
            print("[ShadowFiendBoss] Ability on cooldown or not ready, resetting.. .");
            ability.EndCooldown();
            
            Timers.CreateTimer(0.1, () => {
                if (this.boss && this.boss.IsAlive()) {
                    print("[ShadowFiendBoss] ✓ Casting ability after cooldown reset...");
                    this.boss.CastAbilityNoTarget(ability, -1);
                }
                return undefined;
            });
        }
    }

    private AddPhaseAura(phase: number): void {
        // 清除旧特效
        this.phaseParticles.forEach(p => {
            ParticleManager.DestroyParticle(p, false);
            ParticleManager.ReleaseParticleIndex(p);
        });
        this.phaseParticles = [];
        
        const config = PhaseConfig[phase];
        if (!config || !config.particleEffect) return;
        
        const particle = ParticleManager.CreateParticle(
            config. particleEffect,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.boss
        );
        ParticleManager.SetParticleControl(particle, 0, this.boss.GetAbsOrigin());
        this.phaseParticles.push(particle);
        
        // 阶段3额外特效
        if (phase === 3) {
            const particle2 = ParticleManager. CreateParticle(
                "particles/units/heroes/hero_shadow_demon/shadow_demon_soul_catcher. vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.boss
            );
            ParticleManager.SetParticleControl(particle2, 0, this. boss.GetAbsOrigin());
            this.phaseParticles.push(particle2);
        }
        
        print(`[ShadowFiendBoss] ✓ Phase ${phase} aura added`);
    }

    public Destroy(): void {
        print("[ShadowFiendBoss] Destroying.. .");
        
        // ✅ 停止血量检测
        if (this.checkInterval) {
            Timers.RemoveTimer(this.checkInterval);
            this.checkInterval = undefined;
        }
        
        // ✅ 停止技能释放
        if (this.abilityInterval) {
            Timers.RemoveTimer(this. abilityInterval);
            this. abilityInterval = undefined;
        }
        
        // 清理特效
        this. phaseParticles.forEach(p => {
            ParticleManager.DestroyParticle(p, false);
            ParticleManager.ReleaseParticleIndex(p);
        });
        
        print("[ShadowFiendBoss] ✓ Boss Manager destroyed");
    }
}

// 狂暴Modifier
@registerModifier()
export class modifier_shadow_boss_enrage extends BaseModifier {
    IsHidden(): boolean { return false; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    
    GetEffectName(): string {
        return "particles/units/heroes/hero_nevermore/nevermore_necro_souls. vpcf";
    }
    
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
    
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction. ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
        ];
    }
    
    GetModifierAttackSpeedBonus_Constant(): number {
        return 150;  // +150攻速
    }
    
    GetModifierIncomingDamage_Percentage(): number {
        return -25;  // 减伤25%
    }
    
    OnCreated(): void {
        if (! IsServer()) return;
        this.GetParent().EmitSound("Hero_Ursa. Enrage");
        print("[modifier_shadow_boss_enrage] Boss ENRAGED!");
    }
}
// ✅ 增加攻击距离的Modifier
@registerModifier()
export class modifier_shadow_boss_attack_range extends BaseModifier {
    IsHidden(): boolean { return true; }
    IsPurgable(): boolean { return false; }
    IsDebuff(): boolean { return false; }
    RemoveOnDeath(): boolean { return false; }
    
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction. ATTACK_RANGE_BONUS,
        ];
    }
    
    GetModifierAttackRangeBonus(): number {
        return 700;  // ✅ 增加700攻击距离（默认500 + 700 = 1200）
    }
    
    OnCreated(): void {
        if (! IsServer()) return;
        print("[modifier_shadow_boss_attack_range] Attack range increased to 1200");
    }
}