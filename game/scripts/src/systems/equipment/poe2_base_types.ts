/**
 * POE2 装备系统 - 基底类型配置
 * 9个槽位 × 5种基底 = 45种基底
 */

import { BaseTypeDefinition, EquipSlot } from './poe2_equipment_types';

// ==================== 武器基底（5种）====================
// 包含双持武器作为独立类型

const WEAPON_BASES: BaseTypeDefinition[] = [
    {
        id: 'weapon_sword',
        name: '长剑',
        slot: EquipSlot.WEAPON,
        icon: 'item_broadsword',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'weapon_axe',
        name: '战斧',
        slot: EquipSlot.WEAPON,
        icon: 'item_quelling_blade',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'weapon_mace',
        name: '钉锤',
        slot: EquipSlot.WEAPON,
        icon: 'item_armlet',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'weapon_dual_blades',
        name: '双持短剑',
        slot: EquipSlot.WEAPON,
        icon: 'item_butterfly',
        requiredLevel: 5,
        dropWeight: 80,
    },
    {
        id: 'weapon_staff',
        name: '法杖',
        slot: EquipSlot.WEAPON,
        icon: 'item_force_staff',
        requiredLevel: 1,
        dropWeight: 90,
    },
];

// ==================== 头盔基底（5种）====================

const HELMET_BASES: BaseTypeDefinition[] = [
    {
        id: 'helmet_leather',
        name: '皮革头盔',
        slot: EquipSlot.HELMET,
        icon: 'item_hood_of_defiance',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'helmet_chain',
        name: '锁链头盔',
        slot: EquipSlot.HELMET,
        icon: 'item_helm_of_the_dominator',
        requiredLevel: 5,
        dropWeight: 90,
    },
    {
        id: 'helmet_plate',
        name: '板甲头盔',
        slot: EquipSlot.HELMET,
        icon: 'item_assault',
        requiredLevel: 10,
        dropWeight: 80,
    },
    {
        id: 'helmet_cloth',
        name: '布甲头盔',
        slot: EquipSlot. HELMET,
        icon: 'item_cloak',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'helmet_bone',
        name: '骸骨头盔',
        slot: EquipSlot. HELMET,
        icon: 'item_crown',
        requiredLevel: 15,
        dropWeight: 60,
    },
];

// ==================== 护甲基底（5种）====================

const ARMOR_BASES: BaseTypeDefinition[] = [
    {
        id: 'armor_cloth',
        name: '布甲',
        slot: EquipSlot.ARMOR,
        icon: 'item_cloak',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'armor_leather',
        name: '皮甲',
        slot: EquipSlot.ARMOR,
        icon: 'item_poor_mans_shield',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'armor_chain',
        name: '锁甲',
        slot: EquipSlot.ARMOR,
        icon: 'item_platemail',
        requiredLevel: 8,
        dropWeight: 85,
    },
    {
        id: 'armor_plate',
        name: '板甲',
        slot: EquipSlot.ARMOR,
        icon: 'item_shivas_guard',
        requiredLevel: 12,
        dropWeight: 70,
    },
    {
        id: 'armor_mage_robe',
        name: '法师长袍',
        slot: EquipSlot. ARMOR,
        icon: 'item_robe',
        requiredLevel: 5,
        dropWeight: 90,
    },
];

// ==================== 手套基底（5种）====================

const GLOVES_BASES: BaseTypeDefinition[] = [
    {
        id: 'gloves_cloth',
        name: '布手套',
        slot: EquipSlot.GLOVES,
        icon: 'item_gloves_of_haste',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'gloves_leather',
        name: '皮手套',
        slot: EquipSlot. GLOVES,
        icon: 'item_hand_of_midas',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'gloves_chain',
        name: '锁甲手套',
        slot: EquipSlot.GLOVES,
        icon: 'item_armlet',
        requiredLevel: 6,
        dropWeight: 85,
    },
    {
        id: 'gloves_plate',
        name: '板甲手套',
        slot: EquipSlot. GLOVES,
        icon: 'item_gauntlets',
        requiredLevel: 10,
        dropWeight: 75,
    },
    {
        id: 'gloves_silk',
        name: '丝绸手套',
        slot: EquipSlot. GLOVES,
        icon: 'item_mystic_staff',
        requiredLevel: 5,
        dropWeight: 90,
    },
];

// ==================== 鞋子基底（5种）====================

const BOOTS_BASES: BaseTypeDefinition[] = [
    {
        id: 'boots_cloth',
        name: '布鞋',
        slot: EquipSlot.BOOTS,
        icon: 'item_boots',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'boots_leather',
        name: '皮靴',
        slot: EquipSlot.BOOTS,
        icon: 'item_power_treads',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'boots_chain',
        name: '锁甲靴',
        slot: EquipSlot.BOOTS,
        icon: 'item_phase_boots',
        requiredLevel: 6,
        dropWeight: 85,
    },
    {
        id: 'boots_plate',
        name: '板甲靴',
        slot: EquipSlot.BOOTS,
        icon: 'item_guardian_greaves',
        requiredLevel: 10,
        dropWeight: 75,
    },
    {
        id: 'boots_travel',
        name: '旅行者之靴',
        slot: EquipSlot.BOOTS,
        icon: 'item_travel_boots',
        requiredLevel: 8,
        dropWeight: 80,
    },
];

// ==================== 腰带基底（5种）====================

const BELT_BASES: BaseTypeDefinition[] = [
    {
        id: 'belt_leather',
        name: '皮革腰带',
        slot: EquipSlot.BELT,
        icon: 'item_ring_of_health',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'belt_chain',
        name: '锁链腰带',
        slot: EquipSlot.BELT,
        icon: 'item_vanguard',
        requiredLevel: 5,
        dropWeight: 90,
    },
    {
        id: 'belt_plate',
        name: '板甲腰带',
        slot: EquipSlot. BELT,
        icon: 'item_crimson_guard',
        requiredLevel: 10,
        dropWeight: 75,
    },
    {
        id: 'belt_cloth',
        name: '布带',
        slot: EquipSlot.BELT,
        icon: 'item_ring_of_regen',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'belt_runic',
        name: '符文腰带',
        slot: EquipSlot. BELT,
        icon: 'item_arcane_ring',
        requiredLevel: 12,
        dropWeight: 65,
    },
];

// ==================== 戒指基底（5种）====================

const RING_BASES: BaseTypeDefinition[] = [
    {
        id: 'ring_iron',
        name: '铁戒指',
        slot: EquipSlot.RING1, // 戒指可装备到 RING1 或 RING2
        icon: 'item_ring_of_protection',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'ring_gold',
        name: '金戒指',
        slot: EquipSlot.RING1,
        icon: 'item_ring_of_basilius',
        requiredLevel: 3,
        dropWeight: 90,
    },
    {
        id: 'ring_sapphire',
        name: '蓝宝石戒指',
        slot: EquipSlot.RING1,
        icon: 'item_ring_of_aquila',
        requiredLevel: 8,
        dropWeight: 75,
    },
    {
        id: 'ring_ruby',
        name: '红宝石戒指',
        slot: EquipSlot. RING1,
        icon: 'item_ring_of_tarrasque',
        requiredLevel: 10,
        dropWeight: 70,
    },
    {
        id: 'ring_diamond',
        name: '钻石戒指',
        slot: EquipSlot. RING1,
        icon: 'item_aghanims_shard',
        requiredLevel: 15,
        dropWeight: 50,
    },
];

// ==================== 项链基底（5种）====================

const AMULET_BASES: BaseTypeDefinition[] = [
    {
        id: 'amulet_bronze',
        name: '青铜护符',
        slot: EquipSlot.AMULET,
        icon: 'item_talisman_of_evasion',
        requiredLevel: 1,
        dropWeight: 100,
    },
    {
        id: 'amulet_silver',
        name: '白银护符',
        slot: EquipSlot.AMULET,
        icon: 'item_medallion_of_courage',
        requiredLevel: 5,
        dropWeight: 85,
    },
    {
        id: 'amulet_gold',
        name: '黄金护符',
        slot: EquipSlot. AMULET,
        icon: 'item_solar_crest',
        requiredLevel: 10,
        dropWeight: 70,
    },
    {
        id: 'amulet_jade',
        name: '翡翠护符',
        slot: EquipSlot. AMULET,
        icon: 'item_aghanims_scepter',
        requiredLevel: 12,
        dropWeight: 65,
    },
    {
        id: 'amulet_crystal',
        name: '水晶护符',
        slot: EquipSlot.AMULET,
        icon: 'item_ethereal_blade',
        requiredLevel: 18,
        dropWeight: 45,
    },
];

// ==================== 导出所有基底 ====================

export const POE2_BASE_TYPES: BaseTypeDefinition[] = [
    ...WEAPON_BASES,      // 5种武器
    ...HELMET_BASES,      // 5种头盔
    ...ARMOR_BASES,       // 5种护甲
    ...GLOVES_BASES,      // 5种手套
    ...BOOTS_BASES,       // 5种鞋子
    ...BELT_BASES,        // 5种腰带
    ... RING_BASES,        // 5种戒指
    ... AMULET_BASES,      // 5种项链
];

// 总计：45种基底

// ==================== 辅助函数 ====================

/**
 * 根据ID获取基底定义
 */
export function GetBaseTypeById(id: string): BaseTypeDefinition | undefined {
    return POE2_BASE_TYPES.find(base => base.id === id);
}

/**
 * 根据槽位获取所有基底
 */
export function GetBaseTypesBySlot(slot: EquipSlot): BaseTypeDefinition[] {
    return POE2_BASE_TYPES.filter(base => {
        // 戒指特殊处理：RING1 和 RING2 共用基底
        if (slot === EquipSlot. RING2) {
            return base.slot === EquipSlot.RING1;
        }
        return base.slot === slot;
    });
}

/**
 * 根据等级获取可掉落的基底
 */
export function GetBaseTypesByLevel(level: number): BaseTypeDefinition[] {
    return POE2_BASE_TYPES.filter(base => base.requiredLevel <= level);
}

/**
 * 随机选择一个基底（带权重）
 */
export function GetRandomBaseType(availableBases: BaseTypeDefinition[]): BaseTypeDefinition | null {
    if (availableBases.length === 0) return null;

    // 计算总权重
    let totalWeight = 0;
    for (const base of availableBases) {
        totalWeight += base.dropWeight;
    }

    // 加权随机选择
    let random = RandomInt(1, totalWeight);
    for (const base of availableBases) {
        random -= base. dropWeight;
        if (random <= 0) {
            return base;
        }
    }

    return availableBases[availableBases.length - 1];
}

// ==================== 调试信息 ====================

// 启动时打印基底统计
if (IsServer()) {
    Timers.CreateTimer(0.1, () => {
        print('========================================');
        print('[POE2 BaseTypes] 基底配置加载完成');
        print(`[POE2 BaseTypes] 总共 ${POE2_BASE_TYPES.length} 种基底`);
        
        const slotCounts: Record<string, number> = {};
        for (const base of POE2_BASE_TYPES) {
            const slotName = base.slot;
            slotCounts[slotName] = (slotCounts[slotName] || 0) + 1;
        }
        
        for (const slot in slotCounts) {
            print(`[POE2 BaseTypes]   ${slot}: ${slotCounts[slot]} 种`);
        }
        print('========================================');
        
        return undefined;
    });
}