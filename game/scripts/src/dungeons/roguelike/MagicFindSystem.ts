/**
 * Magic Find 系统
 * 管理整个副本的 MF 值计算和掉落增益
 */

export interface MFModifier {
    source: string;          // 来源（装备、天赋、buff等）
    value: number;           // MF 值（百分比，如 50 表示 +50%）
    type: 'equipment' | 'talent' | 'buff' | 'debuff' | 'difficulty';
    description: string;     // 描述
}

export interface RoomChoice {
    id: string;
    name: string;
    description: string;
    type: 'buff' | 'debuff' | 'neutral';
    mfModifier: number;      // MF 修正值
    effects: {
        playerDamage?:  number;      // 玩家伤害修正（%）
        playerHealth?: number;      // 玩家生命修正（%）
        playerSpeed?: number;       // 玩家速度修正（%）
        monsterDamage?: number;     // 怪物伤害修正（%）
        monsterHealth?: number;     // 怪物生命修正（%）
        monsterSpeed?:  number;      // 怪物速度修正（%）
        monsterCount?: number;      // 怪物数量修正（%）
    };
}

export class MagicFindSystem {
    private static playerMF: Map<PlayerID, MFModifier[]> = new Map();
    private static activeChoices: Map<PlayerID, RoomChoice[]> = new Map();
    
    /**
     * 初始化玩家 MF
     */
    public static InitializePlayer(playerId: PlayerID): void {
        this.playerMF.set(playerId, []);
        this.activeChoices.set(playerId, []);
        print(`[MagicFind] 初始化玩家 ${playerId} 的 MF 系统`);
    }
    
    /**
     * 添加 MF 修正
     */
    public static AddModifier(playerId: PlayerID, modifier: MFModifier): void {
        const modifiers = this.playerMF. get(playerId) || [];
        modifiers.push(modifier);
        this.playerMF.set(playerId, modifiers);
        
        print(`[MagicFind] 玩家 ${playerId} 获得 MF:  ${modifier.value}% (${modifier.source})`);
        this.NotifyPlayer(playerId);
    }
    
    /**
     * 移除特定类型的 MF 修正
     */
    public static RemoveModifiersByType(playerId: PlayerID, type: MFModifier['type']): void {
        const modifiers = this.playerMF.get(playerId) || [];
        const filtered = modifiers.filter(m => m.type !== type);
        this.playerMF.set(playerId, filtered);
    }
    
    /**
     * 计算总 MF 值
     */
    public static GetTotalMF(playerId: PlayerID): number {
        const modifiers = this.playerMF.get(playerId) || [];
        let total = 0;
        
        for (const modifier of modifiers) {
            total += modifier.value;
        }
        
        print(`[MagicFind] 玩家 ${playerId} 总 MF: ${total}%`);
        return total;
    }
    
    /**
     * 获取 MF 详情
     */
    public static GetMFBreakdown(playerId: PlayerID): MFModifier[] {
        return this.playerMF.get(playerId) || [];
    }
    
    /**
     * 应用房间选择
     */
    public static ApplyRoomChoice(playerId: PlayerID, choice:  RoomChoice): void {
        // 添加 MF 修正
        this.AddModifier(playerId, {
            source: choice.name,
            value: choice.mfModifier,
            type:  choice.type === 'buff' ? 'buff' : 'debuff',
            description: choice.description
        });
        
        // 保存选择以应用效果
        const choices = this.activeChoices.get(playerId) || [];
        choices.push(choice);
        this.activeChoices.set(playerId, choices);
        
        // 应用效果到玩家
        this.ApplyEffects(playerId, choice);
        
        print(`[MagicFind] 玩家 ${playerId} 选择:  ${choice.name}, MF ${choice.mfModifier > 0 ? '+' : ''}${choice.mfModifier}%`);
    }
    
    /**
     * 应用效果到玩家
     */
    private static ApplyEffects(playerId: PlayerID, choice: RoomChoice): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        const effects = choice.effects;
        
        // 伤害修正
        if (effects.playerDamage) {
            const modifier = hero.AddNewModifier(hero, undefined, 'modifier_mf_damage', {});
            if (modifier) {
                (modifier as any)._damageBonus = effects.playerDamage;
            }
        }
        
        // 生命修正
        if (effects.playerHealth) {
            const currentHealth = hero.GetHealth();
            const maxHealth = hero.GetMaxHealth();
            const newMaxHealth = maxHealth * (1 + effects. playerHealth / 100);
            hero.SetBaseMaxHealth(newMaxHealth);
            hero.SetMaxHealth(newMaxHealth);
            hero.SetHealth(currentHealth * (1 + effects.playerHealth / 100));
        }
        
        // 速度修正
        if (effects.playerSpeed) {
            const modifier = hero.AddNewModifier(hero, undefined, 'modifier_mf_speed', {});
            if (modifier) {
                (modifier as any)._speedBonus = effects.playerSpeed;
            }
        }
        
        // 通知玩家
        let message = `<font color='${choice.type === 'buff' ? '#00FF00' : '#FF6600'}'>`;
        message += choice.type === 'buff' ? '✅ 获得增益' : '⚠️ 接受挑战';
        message += `：${choice.name}</font>`;
        GameRules.SendCustomMessage(message, playerId, 0);
    }
    
    /**
     * 清除房间选择效果
     */
    public static ClearRoomChoices(playerId: PlayerID): void {
        this.RemoveModifiersByType(playerId, 'buff');
        this.RemoveModifiersByType(playerId, 'debuff');
        this.activeChoices.set(playerId, []);
        
        // 移除所有 MF 相关 modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            hero.RemoveModifierByName('modifier_mf_damage');
            hero.RemoveModifierByName('modifier_mf_speed');
        }
    }
    
    /**
     * 计算掉落增益
     */
    public static CalculateLootMultiplier(playerId: PlayerID): number {
        const mf = this.GetTotalMF(playerId);
        return 1 + (mf / 100);
    }
    
    /**
     * 通知玩家当前 MF
     */
    private static NotifyPlayer(playerId: PlayerID): void {
        const total = this.GetTotalMF(playerId);
        const player = PlayerResource.GetPlayer(playerId);
        
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(player, 'update_magic_find' as never, {
                total: total,
                breakdown: this.GetMFBreakdown(playerId)
            } as never);
        }
    }
    
    /**
     * 获取活跃的房间选择
     */
    public static GetActiveChoices(playerId: PlayerID): RoomChoice[] {
        return this.activeChoices.get(playerId) || [];
    }
}