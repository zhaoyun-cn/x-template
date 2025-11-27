// 装备属性类型枚举
export enum EquipmentAttribute {
    STRENGTH = "力量",
    AGILITY = "敏捷",
    INTELLIGENCE = "智力",
    ARMOR = "护甲",
    HEALTH = "生命",
    MANA = "魔法",
    ATTACK_DAMAGE = "攻击力",
    ATTACK_SPEED = "攻击速度",
    MOVE_SPEED = "移动速度",
    MAGIC_RESISTANCE = "魔抗"
}

// 局外装备类型枚举
export enum ExternalItemType {
    WEAPON = "武器",
    ARMOR = "护甲",
    HELMET = "头盔",
    BELT = "腰带",
    BOOTS = "鞋子",
    RING = "戒指",
    NECKLACE = "项链",
    TRINKET = "饰品"
}

// 装备属性定义（单个属性条目）
export interface EquipmentStat {
    attribute: EquipmentAttribute;  // 属性类型
    value: number;                  // 属性值
}

// 局外装备定义（完全多属性）
export interface ExternalRewardItem {
    name: string;                   // 装备名称
    type: ExternalItemType;         // 装备类型
    icon: string;                   // 图片路径
    stats: EquipmentStat[];         // 属性列表（必定是数组）
    rarity?: number;                // 稀有度（可选）
    description?: string;           // 描述（可选）
}

// 局外奖励池 - 所有装备都是多属性
export const EXTERNAL_REWARD_POOL: ExternalRewardItem[] = [
    // 武器示例
    { 
        name: "铁剑", 
        type: ExternalItemType.WEAPON, 
        icon: "file://{images}/items/blades_of_attack.png", 
        stats: [
            { attribute: EquipmentAttribute.STRENGTH, value: 5 },
            { attribute: EquipmentAttribute.ATTACK_DAMAGE, value: 10 }
        ]
    },
    { 
        name: "钢剑", 
        type: ExternalItemType.WEAPON, 
        icon: "file://{images}/items/claymore.png", 
        stats: [
            { attribute: EquipmentAttribute.STRENGTH, value: 8 },
            { attribute: EquipmentAttribute. ATTACK_DAMAGE, value: 18 }
        ]
    },
    
    // 护甲示例
    { 
        name: "皮甲", 
        type: ExternalItemType.ARMOR, 
        icon: "file://{images}/items/ring_of_protection.png", 
        stats: [
            { attribute: EquipmentAttribute. ARMOR, value: 3 },
            { attribute: EquipmentAttribute.HEALTH, value: 100 }
        ]
    },
    { 
        name: "链甲", 
        type: ExternalItemType.ARMOR, 
        icon: "file://{images}/items/platemail.png", 
        stats: [
            { attribute: EquipmentAttribute.ARMOR, value: 6 },
            { attribute: EquipmentAttribute.HEALTH, value: 200 },
            { attribute: EquipmentAttribute.AGILITY, value: 3 }
        ]
    },
    
    // 头盔示例
    { 
        name: "轻型头盔", 
        type: ExternalItemType.HELMET, 
        icon: "file://{images}/items/helm_of_iron_will.png", 
        stats: [
            { attribute: EquipmentAttribute.ARMOR, value: 2 },
            { attribute: EquipmentAttribute.STRENGTH, value: 4 }
        ]
    },
    { 
        name: "重型头盔", 
        type: ExternalItemType.HELMET, 
        icon: "file://{images}/items/armlet.png", 
        stats: [
            { attribute: EquipmentAttribute.ARMOR, value: 4 },
            { attribute: EquipmentAttribute.STRENGTH, value: 7 }
        ]
    },
    
    // 项链示例
    { 
        name: "法力项链", 
        type: ExternalItemType.NECKLACE, 
        icon: "file://{images}/items/aether_lens.png", 
        stats: [
            { attribute: EquipmentAttribute.INTELLIGENCE, value: 10 },
            { attribute: EquipmentAttribute.MANA, value: 200 }
        ]
    },
    
    // 戒指示例
    { 
        name: "敏捷戒指", 
        type: ExternalItemType.RING, 
        icon: "file://{images}/items/ring_of_aquila. png", 
        stats: [
            { attribute: EquipmentAttribute.AGILITY, value: 7 },
            { attribute: EquipmentAttribute.ARMOR, value: 2 }
        ]
    }
];