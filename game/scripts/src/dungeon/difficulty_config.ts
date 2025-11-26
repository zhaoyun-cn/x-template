// 副本难度配置
export enum DungeonDifficulty {
    EASY = "easy",
    NORMAL = "normal",
    HARD = "hard"
}

// 难度系数配置
export interface DifficultyModifier {
    healthMultiplier: number;      // 生命倍数
    damageMultiplier: number;      // 伤害倍数
    goldReward: number;            // 金币奖励
    expReward: number;             // 经验奖励
    dropChance: number;            // 掉落概率 (0-1)
    materialCount: number;         // 材料数量
    displayName: string;           // 显示名称
    color: string;                 // 颜色
}

// 难度配置表
export const DIFFICULTY_CONFIG: Record<DungeonDifficulty, DifficultyModifier> = {
    [DungeonDifficulty.EASY]: {
        healthMultiplier: 0.7,
        damageMultiplier: 0.8,
        goldReward: 500,
        expReward: 300,
        dropChance: 0.3,
        materialCount: 1,
        displayName: "简单",
        color: "#4CAF50"
    },
    [DungeonDifficulty.NORMAL]: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        goldReward: 1000,
        expReward: 500,
        dropChance: 0.5,
        materialCount: 2,
        displayName: "普通",
        color: "#FFA500"
    },
    [DungeonDifficulty. HARD]: {
        healthMultiplier: 1.5,
        damageMultiplier: 1.3,
        goldReward: 2000,
        expReward: 1000,
        dropChance: 0.8,
        materialCount: 3,
        displayName: "困难",
        color: "#F44336"
    }
};