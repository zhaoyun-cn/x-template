/**
 * POE2 装备系统 - 装备生成器
 * 负责随机生成装备、词缀分配、名称生成等
 */

import {
    POE2EquipmentInstance,
    ItemRarity,
    RARITY_NAMES,
    RARITY_COLORS,
    RARITY_AFFIX_LIMITS,
    EquipSlot,
    AffixInstance,
    AffixPosition,
    AffixType,
} from './poe2_equipment_types';

import { POE2_BASE_TYPES, GetBaseTypeById, GetBaseTypesByLevel } from './poe2_base_types';
import { POE2_AFFIX_POOL, GetAffixById } from './poe2_affix_pool';

// ==================== 装备生成器类 ====================

export class POE2EquipmentGenerator {
    private static itemIdCounter: number = 0;

    // ==================== 生成唯一ID ====================
    private static GenerateItemId(): string {
        this.itemIdCounter++;
        return `poe2_item_${this.itemIdCounter}_${RandomInt(1000, 9999)}`;
    }

    // ==================== 主生成函数 ====================
    
    /**
     * 生成随机装备
     * @param itemLevel 物品等级（影响词缀层级）
     * @param rarity 稀有度（可选，不传则随机）
     * @param slot 指定槽位（可选，不传则随机）
     * @returns 生成的装备实例
     */
    public static GenerateRandomEquipment(
        itemLevel: number,
        rarity?: ItemRarity,
        slot?: EquipSlot
    ): POE2EquipmentInstance | null {
        // 1.选择基底
        const baseType = this.SelectRandomBaseType(itemLevel, slot);
        if (!baseType) {
            print('[POE2Generator] 没有可用的基底类型');
            return null;
        }

        // 2.决定稀有度
        const finalRarity = rarity !== undefined ? rarity : this.RollRarity(itemLevel);

        // 3. 创建装备实例
        const equipment: POE2EquipmentInstance = {
            id: this.GenerateItemId(),
            baseTypeId: baseType.id,
            name: '', // 稍后生成
            rarity: finalRarity,
            itemLevel: itemLevel,
            prefixes: [],
            suffixes: [],
            identified: true, // ⭐ 所有装备默认鉴定
            corrupted: false,
        };

        // 4.⭐ 生成词缀（所有稀有度都生成）
        this.RollAffixes(equipment);

        // 5.生成名称
        equipment.name = this.GenerateEquipmentName(equipment, baseType.name);

        print(`[POE2Generator] 生成装备: ${equipment.name} (iLvl:${itemLevel}, ${RARITY_NAMES[finalRarity]})`);
        return equipment;
    }

    // ==================== 基底选择 ====================

    /**
     * 选择随机基底类型
     */
    private static SelectRandomBaseType(itemLevel: number, slot?: EquipSlot) {
        let availableBases = GetBaseTypesByLevel(itemLevel);

        // 如果指定了槽位，过滤
        if (slot) {
            availableBases = availableBases.filter(base => {
                // 戒指特殊处理
                if (slot === EquipSlot.RING2) {
                    return base.slot === EquipSlot.RING1 || base.slot === slot;
                }
                return base.slot === slot;
            });
        }

        if (availableBases.length === 0) return null;

        // 加权随机选择
        return this.WeightedRandomSelectBase(availableBases);
    }

    private static WeightedRandomSelectBase(bases: typeof POE2_BASE_TYPES) {
        let totalWeight = 0;
        for (const base of bases) {
            totalWeight += base.dropWeight;
        }

        let random = RandomInt(1, totalWeight);
        for (const base of bases) {
            random -= base.dropWeight;
            if (random <= 0) {
                return base;
            }
        }

        return bases[bases.length - 1];
    }

    // ==================== 稀有度随机 ====================

    /**
     * 根据物品等级随机稀有度
     * 等级越高，高稀有度概率越大
     */
    private static RollRarity(itemLevel: number): ItemRarity {
        const roll = RandomInt(1, 1000);

        // 基础概率随物品等级提升
        const legendaryChance = Math.min(10, 2 + itemLevel / 15);      // 0.2% - 1.0%
        const rareChance = Math.min(180, 60 + itemLevel * 3);          // 6% - 18%
        const magicChance = Math.min(450, 220 + itemLevel * 4);        // 22% - 45%

        if (roll <= legendaryChance) return ItemRarity.LEGENDARY;
        if (roll <= legendaryChance + rareChance) return ItemRarity.RARE;
        if (roll <= legendaryChance + rareChance + magicChance) return ItemRarity.MAGIC;
        return ItemRarity.NORMAL;
    }

    // ==================== 词缀生成 ====================

    /**
     * ⭐ 为装备随机生成词缀（修改版：普通=1，魔法=2，稀有=3，传说=4）
     */
    private static RollAffixes(equipment: POE2EquipmentInstance): void {
        const limits = RARITY_AFFIX_LIMITS[equipment.rarity];
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (!baseType) return;

        // ⭐ 决定词缀数量
        let prefixCount = 0;
        let suffixCount = 0;

        switch (equipment.rarity) {
            case ItemRarity.NORMAL:
                // 普通装备：1条词缀（只有前缀）
                prefixCount = 1;
                suffixCount = 0;
                break;

            case ItemRarity.MAGIC:
                // 魔法装备：2条词缀（1前缀+1后缀）
                prefixCount = 1;
                suffixCount = 1;
                break;

            case ItemRarity.RARE:
                // 稀有装备：3条词缀（2前缀+1后缀）
                prefixCount = 2;
                suffixCount = 1;
                break;

            case ItemRarity.LEGENDARY:
                // 传说装备：4条词缀（2前缀+2后缀）
                prefixCount = 2;
                suffixCount = 2;
                break;
        }

        // 生成前缀
        equipment.prefixes = [];
        for (let i = 0; i < prefixCount; i++) {
            const affix = this.RollOneAffix(equipment, AffixPosition.PREFIX, baseType.slot);
            if (affix) {
                equipment.prefixes.push(affix);
            }
        }

        // 生成后缀
        equipment.suffixes = [];
        for (let i = 0; i < suffixCount; i++) {
            const affix = this.RollOneAffix(equipment, AffixPosition.SUFFIX, baseType.slot);
            if (affix) {
                equipment.suffixes.push(affix);
            }
        }

        print(`[POE2Generator]   词缀: ${equipment.prefixes.length}前缀 + ${equipment.suffixes.length}后缀`);
    }

    /**
     * 随机一条词缀
     */
    private static RollOneAffix(
        equipment: POE2EquipmentInstance,
        position: AffixPosition,
        slot: EquipSlot
    ): AffixInstance | null {
        // 获取可用词缀
        const availableAffixes = POE2_AFFIX_POOL.filter(affixDef => {
            // 1.位置匹配
            if (affixDef.position !== position) return false;

            // 2.槽位限制
            if (affixDef.allowedSlots.length > 0) {
                let checkSlot = slot;
                // 戒指特殊处理
                if (slot === EquipSlot.RING2) checkSlot = EquipSlot.RING1;
                
                if (! affixDef.allowedSlots.includes(checkSlot) && 
                    !affixDef.allowedSlots.includes(slot)) {
                    return false;
                }
            }

            // 3.检查是否已有相同词缀（避免重复）
            const existingAffixes = position === AffixPosition.PREFIX 
                ? equipment.prefixes 
                : equipment.suffixes;
            if (existingAffixes.some(a => a.affixId === affixDef.id)) {
                return false;
            }

            // 4. 检查是否有可用层级
            const availableTiers = affixDef.tiers.filter(
                tier => tier.requiredItemLevel <= equipment.itemLevel
            );
            return availableTiers.length > 0;
        });

        if (availableAffixes.length === 0) {
            return null;
        }

        // 加权随机选择词缀
        const selectedAffix = this.WeightedRandomSelectAffix(availableAffixes, equipment.itemLevel);
        if (! selectedAffix) return null;

        // 选择层级
        const availableTiers = selectedAffix.tiers.filter(
            tier => tier.requiredItemLevel <= equipment.itemLevel
        );
        const selectedTier = this.WeightedRandomSelectTier(availableTiers);
        if (!selectedTier) return null;

        // 随机数值
        const value = RandomInt(selectedTier.minValue, selectedTier.maxValue);

        return {
            affixId: selectedAffix.id,
            tier: selectedTier.tier,
            value: value,
            position: position,
        };
    }

    /**
     * 加权随机选择词缀
     */
    private static WeightedRandomSelectAffix(affixes: typeof POE2_AFFIX_POOL, itemLevel: number) {
        let totalWeight = 0;
        const weights: number[] = [];

        for (const affix of affixes) {
            // 使用最高可用层级的权重
            const availableTiers = affix.tiers.filter(t => t.requiredItemLevel <= itemLevel);
            if (availableTiers.length === 0) {
                weights.push(0);
                continue;
            }
            // 找到层级最低（最好）的那个
            const bestTier = availableTiers.reduce((a, b) => a.tier < b.tier ? a : b);
            weights.push(bestTier.weight);
            totalWeight += bestTier.weight;
        }

        if (totalWeight === 0) return null;

        let random = RandomInt(1, totalWeight);
        for (let i = 0; i < affixes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return affixes[i];
            }
        }

        return affixes[affixes.length - 1];
    }

    /**
     * 加权随机选择层级
     */
    private static WeightedRandomSelectTier(tiers: any[]) {
        if (tiers.length === 0) return null;

        let totalWeight = 0;
        for (const tier of tiers) {
            totalWeight += tier.weight;
        }

        let random = RandomInt(1, totalWeight);
        for (const tier of tiers) {
            random -= tier.weight;
            if (random <= 0) {
                return tier;
            }
        }

        return tiers[tiers.length - 1];
    }

    // ==================== 名称生成 ====================

    /**
     * 生成装备名称
     * 普通：基底名
     * 魔法：前缀/后缀 + 基底名
     * 稀有/传说：前缀 + 基底名 + 后缀
     */
    private static GenerateEquipmentName(equipment: POE2EquipmentInstance, baseName: string): string {
        if (equipment.rarity === ItemRarity.NORMAL) {
            // ⭐ 普通装备也可能有词缀，显示词缀名
            if (equipment.prefixes.length > 0) {
                const affix = GetAffixById(equipment.prefixes[0].affixId);
                return affix ?  `${affix.name}${baseName}` : baseName;
            }
            return baseName;
        }

        // 魔法物品
        if (equipment.rarity === ItemRarity.MAGIC) {
            if (equipment.prefixes.length > 0 && equipment.suffixes.length > 0) {
                const prefix = GetAffixById(equipment.prefixes[0].affixId);
                const suffix = GetAffixById(equipment.suffixes[0].affixId);
                return `${prefix?.name || ''}${baseName}${suffix?.name || ''}`;
            }
            if (equipment.prefixes.length > 0) {
                const affix = GetAffixById(equipment.prefixes[0].affixId);
                return affix ? `${affix.name}${baseName}` : baseName;
            }
            if (equipment.suffixes.length > 0) {
                const affix = GetAffixById(equipment.suffixes[0].affixId);
                return affix ? `${baseName}${affix.name}` : baseName;
            }
            return baseName;
        }

        // 稀有/传说物品：随机名称
        const prefixNames = ['锋利的', '坚固的', '强力的', '迅捷的', '炽热的', '寒冰的', '雷霆的', '神圣的', '黑暗的', '古老的', '永恒的', '无尽的'];
        const suffixNames = ['之力', '之怒', '之心', '之魂', '守护', '毁灭', '征服', '荣耀', '永恒', '命运', '传说', '神话'];

        const randomPrefix = prefixNames[RandomInt(0, prefixNames.length - 1)];
        const randomSuffix = suffixNames[RandomInt(0, suffixNames.length - 1)];

        return `${randomPrefix}${baseName}${randomSuffix}`;
    }

    // ==================== 重铸功能 ====================

    /**
     * 使用混沌石：重随所有词缀
     */
    public static RerollAllAffixes(equipment: POE2EquipmentInstance): boolean {
        if (equipment.rarity !== ItemRarity.RARE && equipment.rarity !== ItemRarity.LEGENDARY) {
            print('[POE2Generator] 只能对稀有/传说装备使用混沌石');
            return false;
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return false;
        }

        // 清空现有词缀
        equipment.prefixes = [];
        equipment.suffixes = [];

        // 重新生成词缀
        this.RollAffixes(equipment);

        // 重新生成名称
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (baseType) {
            equipment.name = this.GenerateEquipmentName(equipment, baseType.name);
        }

        print(`[POE2Generator] 混沌石: ${equipment.name} 重随完成`);
        return true;
    }

    /**
     * 使用崇高石：添加一条词缀
     */
    public static AddRandomAffix(equipment: POE2EquipmentInstance): boolean {
        if (equipment.rarity !== ItemRarity.RARE && equipment.rarity !== ItemRarity.LEGENDARY) {
            print('[POE2Generator] 只能对稀有/传说装备使用崇高石');
            return false;
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return false;
        }

        const limits = RARITY_AFFIX_LIMITS[equipment.rarity];
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (!baseType) return false;

        // 检查是否还能添加词缀
        const canAddPrefix = equipment.prefixes.length < limits.maxPrefix;
        const canAddSuffix = equipment.suffixes.length < limits.maxSuffix;

        if (!canAddPrefix && !canAddSuffix) {
            print('[POE2Generator] 装备词缀已满');
            return false;
        }

        // 随机选择添加前缀还是后缀
        let position: AffixPosition;
        if (canAddPrefix && canAddSuffix) {
            position = RandomInt(0, 1) === 0 ? AffixPosition.PREFIX : AffixPosition.SUFFIX;
        } else if (canAddPrefix) {
            position = AffixPosition.PREFIX;
        } else {
            position = AffixPosition.SUFFIX;
        }

        const newAffix = this.RollOneAffix(equipment, position, baseType.slot);
        if (!newAffix) {
            print('[POE2Generator] 没有可用的词缀');
            return false;
        }

        if (position === AffixPosition.PREFIX) {
            equipment.prefixes.push(newAffix);
        } else {
            equipment.suffixes.push(newAffix);
        }

        print(`[POE2Generator] 崇高石: 添加了一条${position === AffixPosition.PREFIX ?  '前缀' : '后缀'}`);
        return true;
    }

    /**
     * 使用神圣石：重随数值
     */
    public static RerollAffixValues(equipment: POE2EquipmentInstance): boolean {
        if (equipment.rarity === ItemRarity.NORMAL) {
            print('[POE2Generator] 普通装备没有词缀');
            return false;
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return false;
        }

        if (equipment.prefixes.length === 0 && equipment.suffixes.length === 0) {
            print('[POE2Generator] 装备没有词缀');
            return false;
        }

        // 重随所有词缀的数值
        for (const affix of equipment.prefixes) {
            this.RerollAffixValue(affix);
        }
        for (const affix of equipment.suffixes) {
            this.RerollAffixValue(affix);
        }

        print(`[POE2Generator] 神圣石: 重随了 ${equipment.prefixes.length + equipment.suffixes.length} 条词缀的数值`);
        return true;
    }

    private static RerollAffixValue(affix: AffixInstance): void {
        const affixDef = GetAffixById(affix.affixId);
        if (!affixDef) return;

        const tier = affixDef.tiers.find(t => t.tier === affix.tier);
        if (!tier) return;

        affix.value = RandomInt(tier.minValue, tier.maxValue);
    }
}

// ==================== 调试信息 ====================

if (IsServer()) {
    Timers.CreateTimer(0.3, () => {
        print('========================================');
        print('[POE2Generator] 装备生成器已加载');
        print('[POE2Generator] 可用功能:');
        print('[POE2Generator]   - GenerateRandomEquipment()');
        print('[POE2Generator]   - RerollAllAffixes()');
        print('[POE2Generator]   - AddRandomAffix()');
        print('[POE2Generator]   - RerollAffixValues()');
        print('========================================');
        
        return undefined;
    });
}