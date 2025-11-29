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
        icon: "item_ultimate_orb",
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
];

// 精英怪掉落表
export const ELITE_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_COMMON, chance: 1.0, minCount: 2, maxCount: 4 },
    { type: LootType.MATERIAL_FINE, chance: 0.5, minCount: 1, maxCount: 2 },
    { type: LootType.MATERIAL_RARE, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_ADD_AFFIX, chance: 0.15, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_REROLL_AFFIX, chance: 0.1, minCount: 1, maxCount: 1 },
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

export class MaterialUseSystem {
    
    public static Init(): void {
        print('[MaterialUseSystem] 初始化材料使用系统');
        
        CustomGameEventManager.RegisterListener(
            'use_material',
            (_: any, event: any) => this.OnUseMaterial(event)
        );
    }
    
    private static OnUseMaterial(event: { PlayerID: PlayerID; materialType: string }): void {
        const playerId = event.PlayerID;
        const materialType = event.materialType as LootType;
        
        print(`[MaterialUseSystem] 玩家 ${playerId} 尝试使用 ${materialType}`);
        
        const config = LOOT_ITEMS[materialType];
        if (! config || !config.usable) {
            print(`[MaterialUseSystem] 材料 ${materialType} 不可使用`);
            return;
        }
        
        const count = ZoneLootSystem.GetItemCount(playerId, materialType);
        if (count < 1) {
            print(`[MaterialUseSystem] 玩家 ${playerId} 没有足够的 ${materialType}`);
            return;
        }
        
        if (! ZoneLootSystem.ConsumeItem(playerId, materialType, 1)) {
            return;
        }
        
        switch (materialType) {
            case LootType.CHEST:
                this.OpenChest(playerId);
                break;
            case LootType.TICKET_A:
                this.UseTicketA(playerId);
                break;
            case LootType.TICKET_B:
                this.UseTicketB(playerId);
                break;
        }
    }
    
    private static OpenChest(playerId: PlayerID): void {
        print(`[MaterialUseSystem] 玩家 ${playerId} 打开宝箱`);
        
        const rewards = [
            { type: LootType.MATERIAL_RARE, min: 2, max: 5 },
            { type: LootType.MATERIAL_LEGENDARY, min: 1, max: 2 },
            { type: LootType.CRAFT_ADD_AFFIX, min: 1, max: 3 },
            { type: LootType.CRAFT_REROLL_AFFIX, min: 1, max: 2 },
            { type: LootType.CRAFT_REROLL_STAT, min: 1, max: 2 },
        ];
        
        const numRewards = RandomInt(1, 3);
        const selectedRewards: string[] = [];
        
        for (let i = 0; i < numRewards; i++) {
            const reward = rewards[RandomInt(0, rewards.length - 1)];
            const count = RandomInt(reward.min, reward.max);
            ZoneLootSystem.AddItem(playerId, reward.type, count);
            
            const config = LOOT_ITEMS[reward.type];
            selectedRewards.push(`<font color='${config.color}'>${config.name} x${count}</font>`);
        }
        
        const message = `🎁 打开宝箱获得: ${selectedRewards.join(", ")}`;
        GameRules.SendCustomMessage(message, playerId, 0);
        
        this.SendUseResult(playerId, LootType.CHEST, true, message);
    }
    
    private static UseTicketA(playerId: PlayerID): void {
        print(`[MaterialUseSystem] 玩家 ${playerId} 使用挑战票`);
        
        const message = "🎫 挑战票使用成功！刷怪区域难度提升！";
        GameRules.SendCustomMessage(message, playerId, 0);
        
        this.SendUseResult(playerId, LootType.TICKET_A, true, message);
    }
    
    private static UseTicketB(playerId: PlayerID): void {
        print(`[MaterialUseSystem] 玩家 ${playerId} 使用副本票`);
        
        const message = "🎫 副本票使用成功！传送门已开启！";
        GameRules.SendCustomMessage(message, playerId, 0);
        
        this.SendUseResult(playerId, LootType.TICKET_B, true, message);
    }
    
    private static SendUseResult(playerId: PlayerID, materialType: LootType, success: boolean, message: string): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'material_used', {
                success: success,
                materialType: materialType,
                message: message
            });
        }
    }
}