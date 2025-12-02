/**
 * POE2 装备系统 - 词缀池配置
 * 10种前缀（进攻性）+ 10种后缀（防御性）= 20种词缀
 * 包含槽位专属词缀
 */

import { AffixDefinition, AffixType, AffixPosition, EquipSlot } from './poe2_equipment_types';

// ==================== 前缀词缀（进攻性/技能）- 10种 ====================

const PREFIX_AFFIXES: AffixDefinition[] = [
    // ===== 1. 固定攻击伤害（武器专属）=====
    {
        id: AffixType.FLAT_ATTACK_DAMAGE,
        position: AffixPosition.PREFIX,
        name: '锋利的',
        description: '+{value} 攻击伤害',
        isPercent: false,
        allowedSlots: [EquipSlot.WEAPON],
        tiers: [
            { tier: 1, minValue: 25, maxValue: 35, requiredItemLevel: 20, weight: 50 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 12, weight: 100 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 6, weight: 150 },
            { tier: 4, minValue: 8, maxValue: 11, requiredItemLevel: 1, weight: 200 },
        ],
    },

    // ===== 2. 物理伤害百分比（武器专属）=====
    {
        id: AffixType.PERCENT_PHYSICAL_DAMAGE,
        position: AffixPosition.PREFIX,
        name: '残暴的',
        description: '+{value}% 物理伤害',
        isPercent: true,
        allowedSlots: [EquipSlot.WEAPON],
        tiers: [
            { tier: 1, minValue: 35, maxValue: 50, requiredItemLevel: 25, weight: 40 },
            { tier: 2, minValue: 25, maxValue: 34, requiredItemLevel: 15, weight: 80 },
            { tier: 3, minValue: 18, maxValue: 24, requiredItemLevel: 8, weight: 120 },
            { tier: 4, minValue: 12, maxValue: 17, requiredItemLevel: 1, weight: 180 },
        ],
    },

    // ===== 3.攻击速度（武器/手套）=====
    {
        id: AffixType.PERCENT_ATTACK_SPEED,
        position: AffixPosition.PREFIX,
        name: '迅捷的',
        description: '+{value}% 攻击速度',
        isPercent: true,
        allowedSlots: [EquipSlot.WEAPON, EquipSlot.GLOVES],
        tiers: [
            { tier: 1, minValue: 18, maxValue: 25, requiredItemLevel: 22, weight: 45 },
            { tier: 2, minValue: 13, maxValue: 17, requiredItemLevel: 14, weight: 90 },
            { tier: 3, minValue: 9, maxValue: 12, requiredItemLevel: 7, weight: 140 },
            { tier: 4, minValue: 5, maxValue: 8, requiredItemLevel: 1, weight: 200 },
        ],
    },

    // ===== 4.暴击率（武器/项链）=====
    {
        id: AffixType.CRIT_CHANCE,
        position: AffixPosition.PREFIX,
        name: '致命的',
        description: '+{value}% 暴击率',
        isPercent: true,
        allowedSlots: [EquipSlot.WEAPON, EquipSlot.AMULET],
        tiers: [
            { tier: 1, minValue: 8, maxValue: 12, requiredItemLevel: 28, weight: 35 },
            { tier: 2, minValue: 6, maxValue: 7, requiredItemLevel: 18, weight: 70 },
            { tier: 3, minValue: 4, maxValue: 5, requiredItemLevel: 10, weight: 110 },
            { tier: 4, minValue: 2, maxValue: 3, requiredItemLevel: 1, weight: 160 },
        ],
    },

    // ===== 5.全技能等级（头盔/项链专属）=====
    {
        id: AffixType.SKILL_LEVEL_ALL,
        position: AffixPosition.PREFIX,
        name: '大师的',
        description: '+{value} 全技能等级',
        isPercent: false,
        allowedSlots: [EquipSlot.HELMET, EquipSlot.AMULET],
        tiers: [
            { tier: 1, minValue: 2, maxValue: 2, requiredItemLevel: 30, weight: 25 },
            { tier: 2, minValue: 1, maxValue: 1, requiredItemLevel: 15, weight: 60 },
        ],
    },

    // ===== 6.技能冷却减少（头盔专属）=====
    {
        id: AffixType.COOLDOWN_REDUCTION,
        position: AffixPosition.PREFIX,
        name: '流畅的',
        description: '-{value}% 技能冷却',
        isPercent: true,
        allowedSlots: [EquipSlot.HELMET],
        tiers: [
            { tier: 1, minValue: 15, maxValue: 20, requiredItemLevel: 25, weight: 40 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 15, weight: 80 },
            { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 8, weight: 130 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 1, weight: 180 },
        ],
    },

    // ===== 7.生命偷取（手套专属）=====
    {
        id: AffixType.LIFE_LEECH,
        position: AffixPosition.PREFIX,
        name: '吸血的',
        description: '+{value}% 生命偷取',
        isPercent: true,
        allowedSlots: [EquipSlot.GLOVES],
        tiers: [
            { tier: 1, minValue: 4, maxValue: 6, requiredItemLevel: 24, weight: 45 },
            { tier: 2, minValue: 3, maxValue: 3, requiredItemLevel: 14, weight: 90 },
            { tier: 3, minValue: 2, maxValue: 2, requiredItemLevel: 6, weight: 140 },
            { tier: 4, minValue: 1, maxValue: 1, requiredItemLevel: 1, weight: 200 },
        ],
    },

    // ===== 8. 力量（通用）=====
    {
        id: AffixType.FLAT_STRENGTH,
        position: AffixPosition.PREFIX,
        name: '强力的',
        description: '+{value} 力量',
        isPercent: false,
        allowedSlots: [], // 空数组表示所有槽位
        tiers: [
            { tier: 1, minValue: 20, maxValue: 30, requiredItemLevel: 20, weight: 60 },
            { tier: 2, minValue: 14, maxValue: 19, requiredItemLevel: 12, weight: 110 },
            { tier: 3, minValue: 10, maxValue: 13, requiredItemLevel: 6, weight: 160 },
            { tier: 4, minValue: 5, maxValue: 9, requiredItemLevel: 1, weight: 220 },
        ],
    },

    // ===== 9.敏捷（通用）=====
    {
        id: AffixType.FLAT_AGILITY,
        position: AffixPosition.PREFIX,
        name: '灵巧的',
        description: '+{value} 敏捷',
        isPercent: false,
        allowedSlots: [],
        tiers: [
            { tier: 1, minValue: 20, maxValue: 30, requiredItemLevel: 20, weight: 60 },
            { tier: 2, minValue: 14, maxValue: 19, requiredItemLevel: 12, weight: 110 },
            { tier: 3, minValue: 10, maxValue: 13, requiredItemLevel: 6, weight: 160 },
            { tier: 4, minValue: 5, maxValue: 9, requiredItemLevel: 1, weight: 220 },
        ],
    },

    // ===== 10. 智力（通用）=====
    {
        id: AffixType.FLAT_INTELLIGENCE,
        position: AffixPosition.PREFIX,
        name: '智慧的',
        description: '+{value} 智力',
        isPercent: false,
        allowedSlots: [],
        tiers: [
            { tier: 1, minValue: 20, maxValue: 30, requiredItemLevel: 20, weight: 60 },
            { tier: 2, minValue: 14, maxValue: 19, requiredItemLevel: 12, weight: 110 },
            { tier: 3, minValue: 10, maxValue: 13, requiredItemLevel: 6, weight: 160 },
            { tier: 4, minValue: 5, maxValue: 9, requiredItemLevel: 1, weight: 220 },
        ],
    },
];

// ==================== 后缀词缀（防御性/生存）- 10种 ====================

const SUFFIX_AFFIXES: AffixDefinition[] = [
    // ===== 1.固定生命（通用）=====
    {
        id: AffixType.FLAT_HEALTH,
        position: AffixPosition.SUFFIX,
        name: '...的生命',
        description: '+{value} 生命',
        isPercent: false,
        allowedSlots: [],
        tiers: [
            { tier: 1, minValue: 80, maxValue: 120, requiredItemLevel: 22, weight: 55 },
            { tier: 2, minValue: 55, maxValue: 79, requiredItemLevel: 14, weight: 105 },
            { tier: 3, minValue: 35, maxValue: 54, requiredItemLevel: 7, weight: 155 },
            { tier: 4, minValue: 20, maxValue: 34, requiredItemLevel: 1, weight: 210 },
        ],
    },

    // ===== 2.最大生命百分比（护甲/腰带专属）=====
    {
        id: AffixType.PERCENT_MAX_HEALTH,
        position: AffixPosition.SUFFIX,
        name: '...的活力',
        description: '+{value}% 最大生命',
        isPercent: true,
        allowedSlots: [EquipSlot.ARMOR, EquipSlot.BELT],
        tiers: [
            { tier: 1, minValue: 12, maxValue: 18, requiredItemLevel: 26, weight: 40 },
            { tier: 2, minValue: 9, maxValue: 11, requiredItemLevel: 16, weight: 80 },
            { tier: 3, minValue: 6, maxValue: 8, requiredItemLevel: 8, weight: 125 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 1, weight: 180 },
        ],
    },

    // ===== 3.固定护甲（护甲专属）=====
    {
        id: AffixType.FLAT_ARMOR,
        position: AffixPosition.SUFFIX,
        name: '...的护甲',
        description: '+{value} 护甲',
        isPercent: false,
        allowedSlots: [EquipSlot.ARMOR],
        tiers: [
            { tier: 1, minValue: 15, maxValue: 22, requiredItemLevel: 24, weight: 50 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 14, weight: 95 },
            { tier: 3, minValue: 7, maxValue: 9, requiredItemLevel: 7, weight: 145 },
            { tier: 4, minValue: 4, maxValue: 6, requiredItemLevel: 1, weight: 200 },
        ],
    },

    // ===== 4.护甲百分比（护甲专属）=====
    {
        id: AffixType.PERCENT_ARMOR,
        position: AffixPosition.SUFFIX,
        name: '...的坚固',
        description: '+{value}% 护甲',
        isPercent: true,
        allowedSlots: [EquipSlot.ARMOR],
        tiers: [
            { tier: 1, minValue: 30, maxValue: 45, requiredItemLevel: 28, weight: 35 },
            { tier: 2, minValue: 22, maxValue: 29, requiredItemLevel: 18, weight: 75 },
            { tier: 3, minValue: 15, maxValue: 21, requiredItemLevel: 9, weight: 120 },
            { tier: 4, minValue: 10, maxValue: 14, requiredItemLevel: 1, weight: 170 },
        ],
    },

    // ===== 5.火焰抗性（戒指/护甲）=====
    {
        id: AffixType.FIRE_RESISTANCE,
        position: AffixPosition.SUFFIX,
        name: '...的抗火',
        description: '+{value}% 火焰抗性',
        isPercent: true,
        allowedSlots: [EquipSlot.RING1, EquipSlot.ARMOR],
        tiers: [
            { tier: 1, minValue: 30, maxValue: 40, requiredItemLevel: 24, weight: 45 },
            { tier: 2, minValue: 22, maxValue: 29, requiredItemLevel: 14, weight: 90 },
            { tier: 3, minValue: 15, maxValue: 21, requiredItemLevel: 7, weight: 140 },
            { tier: 4, minValue: 10, maxValue: 14, requiredItemLevel: 1, weight: 190 },
        ],
    },

    // ===== 6.冰霜抗性（戒指/护甲）=====
    {
        id: AffixType.COLD_RESISTANCE,
        position: AffixPosition.SUFFIX,
        name: '...的抗冰',
        description: '+{value}% 冰霜抗性',
        isPercent: true,
        allowedSlots: [EquipSlot.RING1, EquipSlot.ARMOR],
        tiers: [
            { tier: 1, minValue: 30, maxValue: 40, requiredItemLevel: 24, weight: 45 },
            { tier: 2, minValue: 22, maxValue: 29, requiredItemLevel: 14, weight: 90 },
            { tier: 3, minValue: 15, maxValue: 21, requiredItemLevel: 7, weight: 140 },
            { tier: 4, minValue: 10, maxValue: 14, requiredItemLevel: 1, weight: 190 },
        ],
    },

    // ===== 7.闪电抗性（戒指/护甲）=====
    {
        id: AffixType.LIGHTNING_RESISTANCE,
        position: AffixPosition.SUFFIX,
        name: '...的抗电',
        description: '+{value}% 闪电抗性',
        isPercent: true,
        allowedSlots: [EquipSlot.RING1, EquipSlot.ARMOR],
        tiers: [
            { tier: 1, minValue: 30, maxValue: 40, requiredItemLevel: 24, weight: 45 },
            { tier: 2, minValue: 22, maxValue: 29, requiredItemLevel: 14, weight: 90 },
            { tier: 3, minValue: 15, maxValue: 21, requiredItemLevel: 7, weight: 140 },
            { tier: 4, minValue: 10, maxValue: 14, requiredItemLevel: 1, weight: 190 },
        ],
    },

    // ===== 8.移动速度百分比（鞋子专属）=====
    {
        id: AffixType.PERCENT_MOVE_SPEED,
        position: AffixPosition.SUFFIX,
        name: '...的迅捷',
        description: '+{value}% 移动速度',
        isPercent: true,
        allowedSlots: [EquipSlot.BOOTS],
        tiers: [
            { tier: 1, minValue: 25, maxValue: 35, requiredItemLevel: 25, weight: 40 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 15, weight: 80 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 8, weight: 130 },
            { tier: 4, minValue: 8, maxValue: 11, requiredItemLevel: 1, weight: 180 },
        ],
    },

    // ===== 9.生命回复（腰带专属）=====
    {
        id: AffixType.LIFE_REGEN,
        position: AffixPosition.SUFFIX,
        name: '...的再生',
        description: '+{value} 生命回复/秒',
        isPercent: false,
        allowedSlots: [EquipSlot.BELT],
        tiers: [
            { tier: 1, minValue: 8, maxValue: 12, requiredItemLevel: 22, weight: 50 },
            { tier: 2, minValue: 5, maxValue: 7, requiredItemLevel: 13, weight: 95 },
            { tier: 3, minValue: 3, maxValue: 4, requiredItemLevel: 6, weight: 145 },
            { tier: 4, minValue: 1, maxValue: 2, requiredItemLevel: 1, weight: 200 },
        ],
    },

    // ===== 10.闪避率（鞋子专属）=====
    {
        id: AffixType.EVASION_PERCENT,
        position: AffixPosition.SUFFIX,
        name: '...的闪避',
        description: '+{value}% 闪避率',
        isPercent: true,
        allowedSlots: [EquipSlot.BOOTS],
        tiers: [
            { tier: 1, minValue: 18, maxValue: 25, requiredItemLevel: 26, weight: 40 },
            { tier: 2, minValue: 13, maxValue: 17, requiredItemLevel: 16, weight: 80 },
            { tier: 3, minValue: 9, maxValue: 12, requiredItemLevel: 8, weight: 130 },
            { tier: 4, minValue: 5, maxValue: 8, requiredItemLevel: 1, weight: 180 },
        ],
    },
];

// ==================== 导出词缀池 ====================

export const POE2_AFFIX_POOL: AffixDefinition[] = [
    ...PREFIX_AFFIXES,  // 10种前缀
    ...SUFFIX_AFFIXES,  // 10种后缀
];

// 总计：20种词缀

// ==================== 辅助函数 ====================

/**
 * 根据ID获取词缀定义
 */
export function GetAffixById(id: AffixType): AffixDefinition | undefined {
    return POE2_AFFIX_POOL.find(affix => affix.id === id);
}

/**
 * 根据位置获取所有词缀
 */
export function GetAffixesByPosition(position: AffixPosition): AffixDefinition[] {
    return POE2_AFFIX_POOL.filter(affix => affix.position === position);
}

/**
 * 获取槽位可用的词缀
 */
export function GetAffixesBySlot(slot: EquipSlot, position: AffixPosition): AffixDefinition[] {
    return POE2_AFFIX_POOL.filter(affix => {
        if (affix.position !== position) return false;
        
        // 空数组表示通用词缀
        if (affix.allowedSlots.length === 0) return true;
        
        // 戒指特殊处理
        if (slot === EquipSlot.RING2) {
            return affix.allowedSlots.includes(EquipSlot.RING1) || affix.allowedSlots.includes(slot);
        }
        
        return affix.allowedSlots.includes(slot);
    });
}

/**
 * 获取指定物品等级可用的词缀
 */
export function GetAffixesByItemLevel(itemLevel: number, position: AffixPosition): AffixDefinition[] {
    return POE2_AFFIX_POOL.filter(affix => {
        if (affix.position !== position) return false;
        
        // 检查是否有至少一个层级可用
        return affix.tiers.some(tier => tier.requiredItemLevel <= itemLevel);
    });
}

// ==================== 调试信息 ====================

if (IsServer()) {
    Timers.CreateTimer(0.2, () => {
        print('========================================');
        print('[POE2 AffixPool] 词缀池配置加载完成');
        print(`[POE2 AffixPool] 总共 ${POE2_AFFIX_POOL.length} 种词缀`);
        
        const prefixCount = PREFIX_AFFIXES.length;
        const suffixCount = SUFFIX_AFFIXES.length;
        
        print(`[POE2 AffixPool]   前缀: ${prefixCount} 种`);
        print(`[POE2 AffixPool]   后缀: ${suffixCount} 种`);
        
        // 统计专属词缀
        let universalCount = 0;
        let specificCount = 0;
        
        for (const affix of POE2_AFFIX_POOL) {
            if (affix.allowedSlots.length === 0) {
                universalCount++;
            } else {
                specificCount++;
            }
        }
        
        print(`[POE2 AffixPool]   通用词缀: ${universalCount} 种`);
        print(`[POE2 AffixPool]   专属词缀: ${specificCount} 种`);
        print('========================================');
        
        return undefined;
    });
}