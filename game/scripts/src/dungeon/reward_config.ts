// 装备类型枚举
export enum ItemType {
    WEAPON = "武器",
    ARMOR = "护甲",
    HELMET = "头盔",
    BELT = "腰带",
    BOOTS = "鞋子",
    RING = "戒指",
    NECKLACE = "项链",
    TRINKET = "饰品"
}

// 装备定义
export interface RewardItem {
    name: string;        // 装备名称
    type: ItemType;      // 类型（武器/护甲等）
    icon: string;        // 图片路径
    attribute: string;   // 属性类型（如力量/护甲）
    value: number;       // 属性值
}

// 奖励装备池
export const REWARD_POOL: RewardItem[] = [
    { name: "铁剑", type: ItemType.WEAPON, icon: "file://{images}/custom_game/sword.png", attribute: "力量", value: 5 },
    { name: "钢剑", type: ItemType.WEAPON, icon: "file://{images}/custom_game/sword_steel.png", attribute: "力量", value: 8 },
    { name: "皮甲", type: ItemType.ARMOR, icon: "file://{images}/custom_game/armor.png", attribute: "护甲", value: 3 },
    { name: "链甲", type: ItemType.ARMOR, icon: "file://{images}/custom_game/armor_chain.png", attribute: "护甲", value: 6 },
    { name: "轻型头盔", type: ItemType.HELMET, icon: "file://{images}/custom_game/helmet.png", attribute: "护甲", value: 2 },
    { name: "重型头盔", type: ItemType.HELMET, icon: "file://{images}/custom_game/helmet_heavy.png", attribute: "护甲", value: 4 },
    { name: "法力项链", type: ItemType.NECKLACE, icon: "file://{images}/custom_game/necklace.png", attribute: "智力", value: 10 },
    { name: "敏捷戒指", type: ItemType.RING, icon: "file://{images}/custom_game/ring.png", attribute: "敏捷", value: 7 }
];