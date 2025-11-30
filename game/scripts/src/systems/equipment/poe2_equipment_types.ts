/**
 * POE2 装备系统 - 核心类型定义
 */

// ==================== 稀有度 ====================
export enum ItemRarity {
    NORMAL = 0,      // 普通（白色）
    MAGIC = 1,       // 魔法（蓝色）
    RARE = 2,        // 稀有（黄色）
    LEGENDARY = 3,   // 传说（橙色）
}

export const RARITY_NAMES: Record<ItemRarity, string> = {
    [ItemRarity. NORMAL]: '普通',
    [ItemRarity.MAGIC]: '魔法',
    [ItemRarity.RARE]: '稀有',
    [ItemRarity. LEGENDARY]: '传说',
};

export const RARITY_COLORS: Record<ItemRarity, string> = {
    [ItemRarity.NORMAL]: '#c8c8c8',    // 灰白色
    [ItemRarity. MAGIC]: '#8888ff',     // 蓝色
    [ItemRarity. RARE]: '#ffff77',      // 黄色
    [ItemRarity.LEGENDARY]: '#ff8800', // 橙色
};

// 稀有度词缀数量限制
export const RARITY_AFFIX_LIMITS: Record<ItemRarity, { maxPrefix: number; maxSuffix: number }> = {
    [ItemRarity.NORMAL]: { maxPrefix: 0, maxSuffix: 0 },
    [ItemRarity.MAGIC]: { maxPrefix: 1, maxSuffix: 1 },
    [ItemRarity.RARE]: { maxPrefix: 3, maxSuffix: 3 },
    [ItemRarity.LEGENDARY]: { maxPrefix: 3, maxSuffix: 3 },
};

// ==================== 装备槽位 ====================
export enum EquipSlot {
    WEAPON = 'weapon',
    HELMET = 'helmet',
    ARMOR = 'armor',
    GLOVES = 'gloves',
    BOOTS = 'boots',
    BELT = 'belt',
    RING1 = 'ring1',
    RING2 = 'ring2',
    AMULET = 'amulet',
}

export const SLOT_NAMES: Record<EquipSlot, string> = {
    [EquipSlot.WEAPON]: '武器',
    [EquipSlot.HELMET]: '头盔',
    [EquipSlot.ARMOR]: '护甲',
    [EquipSlot.GLOVES]: '手套',
    [EquipSlot.BOOTS]: '鞋子',
    [EquipSlot.BELT]: '腰带',
    [EquipSlot.RING1]: '戒指',
    [EquipSlot.RING2]: '戒指',
    [EquipSlot.AMULET]: '项链',
};

// ==================== 词缀类型 ====================
export enum AffixPosition {
    PREFIX = 'prefix',   // 前缀（进攻性）
    SUFFIX = 'suffix',   // 后缀（防御性）
}

// 词缀属性类型（简化版）
export enum AffixType {
    // ===== 通用属性 =====
    FLAT_STRENGTH = 'flat_strength',
    FLAT_AGILITY = 'flat_agility',
    FLAT_INTELLIGENCE = 'flat_intelligence',
    FLAT_HEALTH = 'flat_health',
    FLAT_ARMOR = 'flat_armor',
    
    // ===== 攻击属性 =====
    FLAT_ATTACK_DAMAGE = 'flat_attack_damage',
    PERCENT_PHYSICAL_DAMAGE = 'percent_physical_damage',
    PERCENT_ATTACK_SPEED = 'percent_attack_speed',
    CRIT_CHANCE = 'crit_chance',
    CRIT_DAMAGE = 'crit_damage',
    
    // ===== 防御属性 =====
    PERCENT_MAX_HEALTH = 'percent_max_health',
    PERCENT_ARMOR = 'percent_armor',
    LIFE_REGEN = 'life_regen',
    
    // ===== 元素抗性 =====
    FIRE_RESISTANCE = 'fire_resistance',
    COLD_RESISTANCE = 'cold_resistance',
    LIGHTNING_RESISTANCE = 'lightning_resistance',
    
    // ===== 特殊属性 =====
    PERCENT_MOVE_SPEED = 'percent_move_speed',      // 移动速度%
    FLAT_MOVE_SPEED = 'flat_move_speed',            // 移动速度固定值
    LIFE_LEECH = 'life_leech',                      // 生命偷取
    SKILL_LEVEL_ALL = 'skill_level_all',            // 全技能等级
    SKILL_LEVEL_SINGLE = 'skill_level_single',      // 单一技能等级
    COOLDOWN_REDUCTION = 'cooldown_reduction',       // 技能冷却
    EVASION_PERCENT = 'evasion_percent',            // 闪避率
}

// ==================== 词缀层级 ====================
export interface AffixTier {
    tier: number;                 // 层级（1=最好，5=最差）
    minValue: number;             // 最小数值
    maxValue: number;             // 最大数值
    requiredItemLevel: number;    // 需要物品等级
    weight: number;               // 权重（随机概率）
}

// ==================== 词缀定义 ====================
export interface AffixDefinition {
    id: AffixType;
    position: AffixPosition;
    name: string;                 // 词缀名称（如"锋利的"）
    description: string;          // 描述模板（{value}会被替换）
    isPercent: boolean;           // 是否是百分比
    allowedSlots: EquipSlot[];    // 允许的槽位（空=全部）
    tiers: AffixTier[];           // 层级配置
}

// ==================== 词缀实例 ====================
export interface AffixInstance {
    affixId: AffixType;
    tier: number;
    value: number;
    position: AffixPosition;
}

// ==================== 基底类型 ====================
export interface BaseTypeDefinition {
    id: string;                   // 唯一ID（如 "sword_iron"）
    name: string;                 // 显示名称（如"铁剑"）
    slot: EquipSlot;              // 装备槽位
    icon: string;                 // 图标路径
    requiredLevel: number;        // 需求等级
    dropWeight: number;           // 掉落权重
}

// ==================== 装备实例 ====================
export interface POE2EquipmentInstance {
    id: string;                   // 唯一ID
    baseTypeId: string;           // 基底类型ID
    name: string;                 // 装备名称
    rarity: ItemRarity;           // 稀有度
    itemLevel: number;            // 物品等级
    prefixes: AffixInstance[];    // 前缀列表
    suffixes: AffixInstance[];    // 后缀列表
    identified: boolean;          // 是否已鉴定
    corrupted: boolean;           // 是否已腐化
}

// ==================== 通货类型 ====================
// 注意：通货已集成到材料系统（zone_loot. ts）中
// 这里的枚举用于代码中的类型引用

export enum CurrencyType {
    CHAOS = 'poe2_chaos_orb',           // 混沌石
    EXALTED = 'poe2_exalted_orb',       // 崇高石
    DIVINE = 'poe2_divine_orb',         // 神圣石
    SCRAP = 'poe2_scrap',               // 装备碎片
}

export const CURRENCY_NAMES: Record<CurrencyType, string> = {
    [CurrencyType.CHAOS]: '混沌石',
    [CurrencyType.EXALTED]: '崇高石',
    [CurrencyType. DIVINE]: '神圣石',
    [CurrencyType.SCRAP]: '装备碎片',
};

// 通货图标（使用 DOTA2 自带物品图标）
export const CURRENCY_ICONS: Record<CurrencyType, string> = {
    [CurrencyType.CHAOS]: 'item_octarine_core',      // 混沌石 - 八分仪
    [CurrencyType. EXALTED]: 'item_ultimate_orb',     // 崇高石 - 极限法球
    [CurrencyType. DIVINE]: 'item_refresher',         // 神圣石 - 刷新球
    [CurrencyType. SCRAP]: 'item_branches',           // 碎片 - 树枝
};

// 通货描述
export const CURRENCY_DESCRIPTIONS: Record<CurrencyType, string> = {
    [CurrencyType.CHAOS]: '重新随机稀有装备的所有词缀',
    [CurrencyType. EXALTED]: '为稀有装备添加一条随机词缀',
    [CurrencyType.DIVINE]: '重新随机装备词缀的数值范围',
    [CurrencyType.SCRAP]: '分解装备获得，可用于合成通货',
};