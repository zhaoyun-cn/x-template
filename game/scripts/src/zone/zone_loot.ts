/**
 * 刷怪区域掉落系统
 */

// ==================== 材料等级定义 ====================

export enum MaterialTier {
    COMMON = "common",
    FINE = "fine",
    RARE = "rare",
    LEGENDARY = "legendary"
}

// ==================== 材料分类定义 ====================

export enum MaterialCategory {
    EXCHANGE = "exchange",     // 兑换材料
    CRAFT = "craft",           // 打造材料
    TICKET = "ticket",         // 门票
    CHEST = "chest"            // 宝箱
}

// ==================== 掉落物品定义 ====================

export enum LootType {
    // 兑换材料
    MATERIAL_COMMON = "material_common",
    MATERIAL_FINE = "material_fine",
    MATERIAL_RARE = "material_rare",
    MATERIAL_LEGENDARY = "material_legendary",
    
    // 打造材料
    CRAFT_ADD_AFFIX = "craft_add_affix",
    CRAFT_REROLL_AFFIX = "craft_reroll_affix",
    CRAFT_REROLL_STAT = "craft_reroll_stat",
    
    // ⭐ POE2 通货
    POE2_CHAOS_ORB = "poe2_chaos_orb",           // 混沌石
    POE2_EXALTED_ORB = "poe2_exalted_orb",       // 崇高石
    POE2_DIVINE_ORB = "poe2_divine_orb",         // 神圣石
    POE2_SCRAP = "poe2_scrap",                   // 装备碎片
    
    // 门票
    TICKET_A = "ticket_a",
    TICKET_B = "ticket_b",
    
    // 宝箱
    CHEST = "chest"
}

// ==================== 掉落物品配置接口 ====================

export interface LootItemConfig {
    type: LootType;
    name: string;
    icon: string;
    color: string;
    stackable: boolean;
    category: MaterialCategory;
    description: string;
    usable: boolean;
}

// ==================== 掉落物品配置 ====================

export const LOOT_ITEMS: Record<LootType, LootItemConfig> = {
    // 兑换材料
    [LootType.MATERIAL_COMMON]: {
        type: LootType.MATERIAL_COMMON,
        name: "普通材料",
        icon: "item_branches",
        color: "#FFFFFF",
        stackable: true,
        category: MaterialCategory.EXCHANGE,
        description: "基础兑换材料，可在商店兑换物品",
        usable: false
    },
    [LootType.MATERIAL_FINE]: {
        type: LootType.MATERIAL_FINE,
        name: "精良材料",
        icon: "item_magic_stick",
        color: "#00FF00",
        stackable: true,
        category: MaterialCategory.EXCHANGE,
        description: "精良兑换材料，可兑换更好的物品",
        usable: false
    },
    [LootType.MATERIAL_RARE]: {
        type: LootType.MATERIAL_RARE,
        name: "稀有材料",
        icon: "item_point_booster",
        color: "#0088FF",
        stackable: true,
        category: MaterialCategory.EXCHANGE,
        description: "稀有兑换材料，可兑换稀有物品",
        usable: false
    },
    [LootType.MATERIAL_LEGENDARY]: {
        type: LootType.MATERIAL_LEGENDARY,
        name: "传说材料",
        icon: "item_reaver",
        color: "#FF8800",
        stackable: true,
        category: MaterialCategory.EXCHANGE,
        description: "传说兑换材料，可兑换传说物品",
        usable: false
    },
    
    // 打造材料
    [LootType.CRAFT_ADD_AFFIX]: {
        type: LootType.CRAFT_ADD_AFFIX,
        name: "词条石",
        icon: "item_recipe",
        color: "#FF00FF",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "为装备添加一条随机词条",
        usable: false
    },
    [LootType.CRAFT_REROLL_AFFIX]: {
        type: LootType.CRAFT_REROLL_AFFIX,
        name: "洗词石",
        icon: "item_recipe",
        color: "#AA00FF",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "重新随机装备的所有词条类型",
        usable: false
    },
    [LootType.CRAFT_REROLL_STAT]: {
        type: LootType.CRAFT_REROLL_STAT,
        name: "重铸石",
        icon: "item_recipe",
        color: "#FF00AA",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "重新随机装备词条的数值",
        usable: false
    },
    
    // ⭐ POE2 通货配置
    [LootType.POE2_CHAOS_ORB]: {
        type: LootType.POE2_CHAOS_ORB,
        name: "混沌石",
        icon: "item_octarine_core",
        color: "#AA00FF",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "随机重置装备的一条词缀",
        usable: true
    },
    [LootType.POE2_EXALTED_ORB]: {
        type: LootType.POE2_EXALTED_ORB,
        name: "崇高石",
        icon: "item_ultimate_orb",
        color: "#FFD700",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "为稀有装备添加一条随机词缀",
        usable: true
    },
    [LootType.POE2_DIVINE_ORB]: {
        type: LootType.POE2_DIVINE_ORB,
        name: "神圣石",
        icon: "item_refresher",
        color: "#00FFFF",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "重新随机装备词缀的数值范围",
        usable: true
    },
    [LootType.POE2_SCRAP]: {
        type: LootType.POE2_SCRAP,
        name: "装备碎片",
        icon: "item_branches",
        color: "#888888",
        stackable: true,
        category: MaterialCategory.CRAFT,
        description: "分解装备获得，可用于合成通货",
        usable: false
    },
    
    // 门票
    [LootType.TICKET_A]: {
        type: LootType.TICKET_A,
        name: "挑战票",
        icon: "item_tome_of_knowledge",
        color: "#FFD700",
        stackable: true,
        category: MaterialCategory.TICKET,
        description: "使用后提升刷怪区域难度，获得更好的奖励",
        usable: true
    },
    [LootType.TICKET_B]: {
        type: LootType.TICKET_B,
        name: "副本票",
        icon: "item_refresher_shard",
        color: "#00FFFF",
        stackable: true,
        category: MaterialCategory.TICKET,
        description: "使用后可进入特殊副本",
        usable: true
    },
    
    // 宝箱
    [LootType.CHEST]: {
        type: LootType.CHEST,
        name: "神秘宝箱",
        icon: "item_present",
        color: "#FFD700",
        stackable: false,
        category: MaterialCategory.CHEST,
        description: "打开后随机获得稀有材料或装备",
        usable: true
    }
};

// ==================== 掉落表配置 ====================

export interface DropEntry {
    type: LootType;
    chance: number;
    minCount: number;
    maxCount: number;
}

// 普通怪掉落表
export const NORMAL_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_COMMON, chance: 0.6, minCount: 1, maxCount: 2 },
    { type: LootType.MATERIAL_FINE, chance: 0.05, minCount: 1, maxCount: 1 },
    // ⭐ 普通怪小概率掉落碎片
    { type: LootType.POE2_SCRAP, chance: 0.15, minCount: 1, maxCount: 2 },
];

// 精英怪掉落表
export const ELITE_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_COMMON, chance: 1.0, minCount: 2, maxCount: 4 },
    { type: LootType.MATERIAL_FINE, chance: 0.5, minCount: 1, maxCount: 2 },
    { type: LootType.MATERIAL_RARE, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_ADD_AFFIX, chance: 0.15, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_REROLL_AFFIX, chance: 0.1, minCount: 1, maxCount: 1 },
    // ⭐ POE2 通货掉落
    { type: LootType.POE2_SCRAP, chance: 0.4, minCount: 2, maxCount: 5 },
    { type: LootType.POE2_CHAOS_ORB, chance: 0.08, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_A, chance: 0.2, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_B, chance: 0.05, minCount: 1, maxCount: 1 },
];

// Boss掉落表
export const BOSS_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_FINE, chance: 1.0, minCount: 3, maxCount: 5 },
    { type: LootType.MATERIAL_RARE, chance: 0.6, minCount: 1, maxCount: 3 },
    { type: LootType.MATERIAL_LEGENDARY, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_ADD_AFFIX, chance: 0.4, minCount: 1, maxCount: 2 },
    { type: LootType.CRAFT_REROLL_AFFIX, chance: 0.3, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_REROLL_STAT, chance: 0.2, minCount: 1, maxCount: 1 },
    // ⭐ POE2 通货掉落（Boss掉落更多）
    { type: LootType.POE2_SCRAP, chance: 0.9, minCount: 5, maxCount: 10 },
    { type: LootType.POE2_CHAOS_ORB, chance: 0.35, minCount: 1, maxCount: 3 },
    { type: LootType.POE2_EXALTED_ORB, chance: 0.18, minCount: 1, maxCount: 2 },
    { type: LootType.POE2_DIVINE_ORB, chance: 0.12, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_A, chance: 0.5, minCount: 1, maxCount: 2 },
    { type: LootType.TICKET_B, chance: 0.2, minCount: 1, maxCount: 1 },
    { type: LootType.CHEST, chance: 0.3, minCount: 1, maxCount: 1 },
];

// ==================== 玩家背包系统 ====================

interface PlayerInventory {
    items: Map<LootType, number>;
}

const playerInventories: Map<PlayerID, PlayerInventory> = new Map();

function GetOrCreateInventory(playerId: PlayerID): PlayerInventory {
    let inventory = playerInventories.get(playerId);
    if (! inventory) {
        inventory = { items: new Map() };
        playerInventories.set(playerId, inventory);
    }
    return inventory;
}

// ==================== 掉落系统主类 ====================

export class ZoneLootSystem {
    
    public static ProcessLoot(
        monsterType: "normal" | "elite" | "boss",
        playerIds: PlayerID[],
        dropBonus: number = 1.0
    ): void {
        let dropTable: DropEntry[];
        switch (monsterType) {
            case "elite":
                dropTable = ELITE_DROP_TABLE;
                break;
            case "boss":
                dropTable = BOSS_DROP_TABLE;
                break;
            default:
                dropTable = NORMAL_DROP_TABLE;
        }
        
        for (const playerId of playerIds) {
            const drops = this.RollDrops(dropTable, dropBonus);
            
            if (drops.length > 0) {
                this.GiveDropsToPlayer(playerId, drops);
                this.NotifyPlayer(playerId, drops, monsterType);
            }
        }
    }
    
    private static RollDrops(dropTable: DropEntry[], dropBonus: number): { type: LootType; count: number }[] {
        const drops: { type: LootType; count: number }[] = [];
        
        for (const entry of dropTable) {
            const adjustedChance = Math.min(entry.chance * dropBonus, 1.0);
            
            if (RandomFloat(0, 1) <= adjustedChance) {
                const count = RandomInt(entry.minCount, entry.maxCount);
                drops.push({ type: entry.type, count });
            }
        }
        
        return drops;
    }
    
    private static GiveDropsToPlayer(playerId: PlayerID, drops: { type: LootType; count: number }[]): void {
        const inventory = GetOrCreateInventory(playerId);
        
        for (const drop of drops) {
            const currentCount = inventory.items.get(drop.type) || 0;
            inventory.items.set(drop.type, currentCount + drop.count);
            
            print(`[ZoneLoot] 玩家${playerId} 获得 ${LOOT_ITEMS[drop.type].name} x${drop.count}`);
            this.SyncMaterialsToNetTable(playerId);
        }
    }
    
    private static NotifyPlayer(
        playerId: PlayerID, 
        drops: { type: LootType; count: number }[],
        monsterType: string
    ): void {
        const dropTexts = drops.map(drop => {
            const config = LOOT_ITEMS[drop.type];
            return `<font color='${config.color}'>${config.name} x${drop.count}</font>`;
        });
        
        const message = `💰 ${dropTexts.join(", ")}`;
        
        GameRules.SendCustomMessage(message, playerId, 0);
    }
    
    public static GetInventory(playerId: PlayerID): Map<LootType, number> {
        const inventory = GetOrCreateInventory(playerId);
        return new Map(inventory.items);
    }
    
    public static GetItemCount(playerId: PlayerID, itemType: LootType): number {
        const inventory = GetOrCreateInventory(playerId);
        return inventory.items.get(itemType) || 0;
    }
    
    public static ConsumeItem(playerId: PlayerID, itemType: LootType, count: number): boolean {
        const inventory = GetOrCreateInventory(playerId);
        const currentCount = inventory.items.get(itemType) || 0;
        
        if (currentCount < count) {
            return false;
        }
        
        inventory.items.set(itemType, currentCount - count);
        this.SyncMaterialsToNetTable(playerId);
        return true;
    }
    
    public static AddItem(playerId: PlayerID, itemType: LootType, count: number): void {
        const inventory = GetOrCreateInventory(playerId);
        const currentCount = inventory.items.get(itemType) || 0;
        inventory.items.set(itemType, currentCount + count);
        this.SyncMaterialsToNetTable(playerId);
    }
    
    public static SyncMaterialsToNetTable(playerId: PlayerID): void {
        const inventory = this.GetInventory(playerId);
        
        const items: Array<{
            type: string;
            name: string;
            icon: string;
            color: string;
            count: number;
            category: string;
            description: string;
            usable: boolean;
        }> = [];
        
        inventory.forEach((count, itemType) => {
            if (count > 0) {
                const config = LOOT_ITEMS[itemType];
                if (config) {
                    items.push({
                        type: itemType,
                        name: config.name,
                        icon: `s2r://panorama/images/items/${config.icon}_png.vtex`,
                        color: config.color,
                        count: count,
                        category: config.category,
                        description: config.description,
                        usable: config.usable
                    });
                }
            }
        });
        
        CustomNetTables.SetTableValue('player_materials', playerId.toString(), {
            items: items,
            timestamp: GameRules.GetGameTime()
        });
        
        print(`[ZoneLoot] 同步玩家 ${playerId} 的材料数据到网表，共 ${items.length} 种材料`);
    }
}

// ==================== 材料使用系统 ====================
// MaterialUseSystem 已迁移到 systems/inventory/material_system.ts