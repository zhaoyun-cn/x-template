// ⭐ 难度枚举 - 9个等级
export enum DungeonDifficulty {
    EASY_1 = "easy_1",
    EASY_2 = "easy_2",
    EASY_3 = "easy_3",
    NORMAL_1 = "normal_1",
    NORMAL_2 = "normal_2",
    NORMAL_3 = "normal_3",
    HARD_1 = "hard_1",
    HARD_2 = "hard_2",
    HARD_3 = "hard_3"
}

// 难度显示名称映射
export const DIFFICULTY_NAMES: Record<DungeonDifficulty, string> = {
    [DungeonDifficulty.EASY_1]: "简单⭐",
    [DungeonDifficulty.EASY_2]: "简单⭐⭐",
    [DungeonDifficulty.EASY_3]: "简单⭐⭐⭐",
    [DungeonDifficulty.NORMAL_1]: "普通⭐",
    [DungeonDifficulty.NORMAL_2]: "普通⭐⭐",
    [DungeonDifficulty.NORMAL_3]: "普通⭐⭐⭐",
    [DungeonDifficulty.HARD_1]: "困难⭐",
    [DungeonDifficulty. HARD_2]: "困难⭐⭐",
    [DungeonDifficulty.HARD_3]: "困难⭐⭐⭐"
};

// 难度系数配置 (1.2倍递增)
export const DIFFICULTY_MULTIPLIERS: Record<DungeonDifficulty, number> = {
    [DungeonDifficulty.EASY_1]: 0.60,    // 基础 * 0.6
    [DungeonDifficulty. EASY_2]: 0.72,    // * 0.6 * 1.2
    [DungeonDifficulty.EASY_3]: 0.86,    // * 0.6 * 1.2 * 1.2
    [DungeonDifficulty. NORMAL_1]: 1.00,  // 基础难度
    [DungeonDifficulty.NORMAL_2]: 1.20,  // * 1.2
    [DungeonDifficulty.NORMAL_3]: 1.44,  // * 1.2 * 1. 2
    [DungeonDifficulty.HARD_1]: 1.73,    // * 1.2 * 1.2 * 1.2
    [DungeonDifficulty. HARD_2]: 2.07,    // * 1.2^4
    [DungeonDifficulty.HARD_3]: 2.49     // * 1.2^5
};

// 掉落物品配置
export interface ItemDrop {
    itemName: string;
    dropChance: number;
    minCount: number;
    maxCount: number;
}

// Boss掉落配置
export interface BossLoot {
    guaranteedItems: string[];
    randomItems: ItemDrop[];
    gold: { min: number; max: number };
}

// 通关奖励配置
export interface CompletionReward {
    gold: number;
    experience: number;
    items: string[];
}

// ⭐ 通关奖励配置 - 9个难度
export const DIFFICULTY_REWARDS: Record<DungeonDifficulty, CompletionReward> = {
    // 简单难度
    [DungeonDifficulty. EASY_1]: {
        gold: 300,
        experience: 200,
        items: ["item_branches", "item_tango"]
    },
    [DungeonDifficulty. EASY_2]: {
        gold: 500,
        experience: 350,
        items: ["item_boots", "item_magic_wand"]
    },
    [DungeonDifficulty. EASY_3]: {
        gold: 700,
        experience: 500,
        items: ["item_power_treads", "item_bracer"]
    },
    
    // 普通难度
    [DungeonDifficulty.NORMAL_1]: {
        gold: 1000,
        experience: 700,
        items: ["item_power_treads", "item_perseverance"]
    },
    [DungeonDifficulty.NORMAL_2]: {
        gold: 1500,
        experience: 1000,
        items: ["item_maelstrom", "item_vladmir"]
    },
    [DungeonDifficulty. NORMAL_3]: {
        gold: 2000,
        experience: 1400,
        items: ["item_orchid", "item_blink", "item_force_staff"]
    },
    
    // 困难难度
    [DungeonDifficulty.HARD_1]: {
        gold: 2500,
        experience: 1800,
        items: ["item_black_king_bar", "item_assault"]
    },
    [DungeonDifficulty.HARD_2]: {
        gold: 3500,
        experience: 2500,
        items: ["item_mjollnir", "item_heart", "item_butterfly"]
    },
    [DungeonDifficulty. HARD_3]: {
        gold: 5000,
        experience: 3500,
        items: ["item_bloodthorn", "item_satanic", "item_radiance", "item_refresher"]
    }
};

// ⭐ Boss掉落配置 - 9个难度
export const BOSS_LOOT: Record<DungeonDifficulty, BossLoot> = {
    // ========== 简单难度 ==========
    [DungeonDifficulty.EASY_1]: {
        guaranteedItems: ["item_branches"],
        randomItems: [
            { itemName: "item_tango", dropChance: 0.6, minCount: 1, maxCount: 2 },
            { itemName: "item_clarity", dropChance: 0.5, minCount: 1, maxCount: 2 }
        ],
        gold: { min: 100, max: 200 }
    },
    [DungeonDifficulty. EASY_2]: {
        guaranteedItems: ["item_boots"],
        randomItems: [
            { itemName: "item_magic_wand", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_ring_of_protection", dropChance: 0.6, minCount: 1, maxCount: 2 }
        ],
        gold: { min: 200, max: 400 }
    },
    [DungeonDifficulty.EASY_3]: {
        guaranteedItems: ["item_power_treads"],
        randomItems: [
            { itemName: "item_ring_of_health", dropChance: 0.8, minCount: 1, maxCount: 1 },
            { itemName: "item_void_stone", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_blade_of_alacrity", dropChance: 0.6, minCount: 1, maxCount: 1 }
        ],
        gold: { min: 400, max: 700 }
    },
    
    // ========== 普通难度 ==========
    [DungeonDifficulty. NORMAL_1]: {
        guaranteedItems: ["item_power_treads", "item_perseverance"],
        randomItems: [
            { itemName: "item_maelstrom", dropChance: 0.6, minCount: 1, maxCount: 1 },
            { itemName: "item_vladmir", dropChance: 0.5, minCount: 1, maxCount: 1 }
        ],
        gold: { min: 600, max: 1000 }
    },
    [DungeonDifficulty.NORMAL_2]: {
        guaranteedItems: ["item_maelstrom", "item_blink"],
        randomItems: [
            { itemName: "item_orchid", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_force_staff", dropChance: 0.8, minCount: 1, maxCount: 1 },
            { itemName: "item_ultimate_orb", dropChance: 0.5, minCount: 1, maxCount: 2 }
        ],
        gold: { min: 1000, max: 1500 }
    },
    [DungeonDifficulty.NORMAL_3]: {
        guaranteedItems: ["item_orchid", "item_vladmir", "item_hand_of_midas"],
        randomItems: [
            { itemName: "item_black_king_bar", dropChance: 0.5, minCount: 1, maxCount: 1 },
            { itemName: "item_armlet", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_ultimate_orb", dropChance: 0.6, minCount: 1, maxCount: 2 }
        ],
        gold: { min: 1500, max: 2200 }
    },
    
    // ========== 困难难度 ==========
    [DungeonDifficulty. HARD_1]: {
        guaranteedItems: ["item_black_king_bar", "item_assault"],
        randomItems: [
            { itemName: "item_mjollnir", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_heart", dropChance: 0.6, minCount: 1, maxCount: 1 },
            { itemName: "item_shivas_guard", dropChance: 0.6, minCount: 1, maxCount: 1 }
        ],
        gold: { min: 2000, max: 3000 }
    },
    [DungeonDifficulty.HARD_2]: {
        guaranteedItems: ["item_mjollnir", "item_heart", "item_butterfly"],
        randomItems: [
            { itemName: "item_bloodthorn", dropChance: 0.8, minCount: 1, maxCount: 1 },
            { itemName: "item_satanic", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_radiance", dropChance: 0.6, minCount: 1, maxCount: 1 },
            { itemName: "item_refresher", dropChance: 0.5, minCount: 1, maxCount: 1 }
        ],
        gold: { min: 3000, max: 4500 }
    },
    [DungeonDifficulty. HARD_3]: {
        guaranteedItems: ["item_bloodthorn", "item_satanic", "item_radiance"],
        randomItems: [
            { itemName: "item_refresher", dropChance: 0.9, minCount: 1, maxCount: 1 },
            { itemName: "item_abyssal_blade", dropChance: 0.8, minCount: 1, maxCount: 1 },
            { itemName: "item_monkey_king_bar", dropChance: 0.8, minCount: 1, maxCount: 1 },
            { itemName: "item_sheepstick", dropChance: 0.7, minCount: 1, maxCount: 1 },
            { itemName: "item_octarine_core", dropChance: 0.6, minCount: 1, maxCount: 1 }
        ],
        gold: { min: 5000, max: 8000 }
    }
};

// 宝箱物品池
export const CHEST_COMMON_ITEMS = [
    "item_branches", "item_tango", "item_clarity", "item_enchanted_mango"
];

export const CHEST_RARE_ITEMS = [
    "item_magic_wand", "item_boots", "item_power_treads", "item_ring_of_health"
];

export const CHEST_EPIC_ITEMS = [
    "item_maelstrom", "item_vladmir", "item_blink", "item_orchid"
];

export const CHEST_LEGENDARY_ITEMS = [
    "item_black_king_bar", "item_mjollnir", "item_heart", "item_butterfly", "item_radiance"
];