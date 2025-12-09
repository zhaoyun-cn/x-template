import { RewardConfig, DungeonStats } from '../types_roguelike';

/**
 * 奖励详情
 */
export interface RewardBreakdown {
    baseReward: number;
    roomBonus: number;
    bossReward: number;
    perfectClearBonus: number;
    killBonus: number;
    totalReward: number;
}

/**
 * Roguelike奖励结算系统
 */
export class RoguelikeRewardSystem {
    /**
     * 计算奖励
     */
    public static CalculateReward(config: RewardConfig, stats: DungeonStats): RewardBreakdown {
        const baseReward = config.baseReward;
        const roomBonus = stats.roomsCompleted * config.perRoomBonus;
        const bossReward = config.bossReward;
        const perfectClearBonus = stats.totalDeaths === 0 ? config.perfectClearBonus : 0;
        const killBonus = stats.totalKills * (config.perKillBonus || 0);
        
        const totalReward = baseReward + roomBonus + bossReward + perfectClearBonus + killBonus;
        
        return {
            baseReward,
            roomBonus,
            bossReward,
            perfectClearBonus,
            killBonus,
            totalReward
        };
    }
    
    /**
     * 显示奖励结算UI
     */
    public static ShowRewardUI(playerId: PlayerID, breakdown: RewardBreakdown, stats: DungeonStats): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) return;
        
        // 发送奖励数据到客户端
        CustomGameEventManager.Send_ServerToPlayer(
    player, 
    'roguelike_show_reward' as any, 
    {
        baseReward: breakdown.baseReward,
        roomBonus: breakdown.roomBonus,
        bossReward: breakdown.bossReward,
        perfectClearBonus: breakdown.perfectClearBonus,
        killBonus: breakdown.killBonus,
        totalReward: breakdown. totalReward,
        totalKills: stats.totalKills,
        totalDeaths: stats. totalDeaths,
        roomsCompleted: stats.roomsCompleted
    } as any
);
        
        print(`[RoguelikeReward] 玩家 ${playerId} 获得奖励: ${breakdown.totalReward}`);
    }
    
    /**
     * 显示奖励摘要（聊天消息）
     */
    public static ShowRewardSummary(playerId: PlayerID, breakdown: RewardBreakdown): void {
        const messages = [
            '<font color="#FFD700">========== 副本奖励结算 ==========</font>',
            `<font color="#FFFFFF">基础奖励: ${breakdown.baseReward} 金币</font>`,
            `<font color="#FFFFFF">房间奖励: ${breakdown.roomBonus} 金币</font>`,
            `<font color="#FFFFFF">Boss奖励: ${breakdown.bossReward} 金币</font>`,
        ];
        
        if (breakdown.perfectClearBonus > 0) {
            messages.push(`<font color="#00FF00">完美通关: ${breakdown.perfectClearBonus} 金币 ✨</font>`);
        }
        
        if (breakdown.killBonus > 0) {
            messages.push(`<font color="#FFFFFF">击杀奖励: ${breakdown.killBonus} 金币</font>`);
        }
        
        messages.push(`<font color="#FFD700">总计: ${breakdown.totalReward} 金币 🎉</font>`);
        messages.push('<font color="#FFD700">===================================</font>');
        
        for (const message of messages) {
            GameRules.SendCustomMessage(message, playerId, 0);
        }
    }
}
