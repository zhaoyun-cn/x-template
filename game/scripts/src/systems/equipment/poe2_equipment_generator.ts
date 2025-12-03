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
    
    public static GenerateRandomEquipment(
        itemLevel: number,
        rarity?: ItemRarity,
        slot?: EquipSlot
    ): POE2EquipmentInstance | null {
        // 1.选择基底
        const baseType = this.SelectRandomBaseType(itemLevel, slot);
        if (! baseType) {
            print('[POE2Generator] 没有可用的基底类型');
            return null;
        }

        // 2.决定稀有度
        const finalRarity = rarity !== undefined ? rarity : this.RollRarity(itemLevel);

        // 3.创建装备实例
        const equipment: POE2EquipmentInstance = {
            id: this.GenerateItemId(),
            baseTypeId: baseType.id,
            name: '',
            rarity: finalRarity,
            itemLevel: itemLevel,
            prefixes: [],
            suffixes: [],
            identified: true,
            corrupted: false,
        };

        // 4.生成词缀
        this.RollAffixes(equipment);

        // 5.生成名称
        equipment.name = this.GenerateEquipmentName(equipment, baseType.name);

        print(`[POE2Generator] 生成装备: ${equipment.name} (iLvl:${itemLevel}, ${RARITY_NAMES[finalRarity]})`);
        return equipment;
    }

    // ==================== 基底选择 ====================

    private static SelectRandomBaseType(itemLevel: number, slot?: EquipSlot) {
        let availableBases = GetBaseTypesByLevel(itemLevel);

        if (slot) {
            availableBases = availableBases.filter(base => {
                if (slot === EquipSlot.RING2) {
                    return base.slot === EquipSlot.RING1 || base.slot === slot;
                }
                return base.slot === slot;
            });
        }

        if (availableBases.length === 0) return null;

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

    private static RollRarity(itemLevel: number): ItemRarity {
        const roll = RandomInt(1, 1000);

        const legendaryChance = Math.min(10, 2 + itemLevel / 15);
        const rareChance = Math.min(180, 60 + itemLevel * 3);
        const magicChance = Math.min(450, 220 + itemLevel * 4);

        if (roll <= legendaryChance) return ItemRarity.LEGENDARY;
        if (roll <= legendaryChance + rareChance) return ItemRarity.RARE;
        if (roll <= legendaryChance + rareChance + magicChance) return ItemRarity.MAGIC;
        return ItemRarity.NORMAL;
    }

    // ==================== 词缀生成 ====================

    private static RollAffixes(equipment: POE2EquipmentInstance): void {
        const limits = RARITY_AFFIX_LIMITS[equipment.rarity];
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (!baseType) return;

        // ⭐ 根据稀有度决定初始词缀数量
        let prefixCount = 0;
        let suffixCount = 0;

        switch (equipment.rarity) {
            case ItemRarity.NORMAL:
                prefixCount = 1;
                suffixCount = 0;
                break;
            case ItemRarity.MAGIC:
                prefixCount = 1;
                suffixCount = 1;
                break;
            case ItemRarity.RARE:
                // ⭐ 稀有装备初始2-3条前缀，1-2条后缀
                prefixCount = RandomInt(2, 3);
                suffixCount = RandomInt(1, 2);
                break;
            case ItemRarity.LEGENDARY:
                // ⭐ 传说装备初始3条前缀，2-3条后缀
                prefixCount = 3;
                suffixCount = RandomInt(2, 3);
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
    public static RollOneAffix(
        equipment: POE2EquipmentInstance,
        position: AffixPosition,
        slot: EquipSlot
    ): AffixInstance | null {
        const availableAffixes = POE2_AFFIX_POOL.filter(affixDef => {
            if (affixDef.position !== position) return false;

            if (affixDef.allowedSlots.length > 0) {
                let checkSlot = slot;
                if (slot === EquipSlot.RING2) checkSlot = EquipSlot.RING1;
                
                if (! affixDef.allowedSlots.includes(checkSlot) && 
                    !affixDef.allowedSlots.includes(slot)) {
                    return false;
                }
            }

            const existingAffixes = position === AffixPosition.PREFIX 
                ? equipment.prefixes 
                : equipment.suffixes;
            if (existingAffixes.some(a => a.affixId === affixDef.id)) {
                return false;
            }

            const availableTiers = affixDef.tiers.filter(
                tier => tier.requiredItemLevel <= equipment.itemLevel
            );
            return availableTiers.length > 0;
        });

        if (availableAffixes.length === 0) {
            return null;
        }

        const selectedAffix = this.WeightedRandomSelectAffix(availableAffixes, equipment.itemLevel);
        if (!selectedAffix) return null;

        const availableTiers = selectedAffix.tiers.filter(
            tier => tier.requiredItemLevel <= equipment.itemLevel
        );
        const selectedTier = this.WeightedRandomSelectTier(availableTiers);
        if (!selectedTier) return null;

        const value = RandomInt(selectedTier.minValue, selectedTier.maxValue);

        return {
            affixId: selectedAffix.id,
            tier: selectedTier.tier,
            value: value,
            position: position,
        };
    }

    private static WeightedRandomSelectAffix(affixes: typeof POE2_AFFIX_POOL, itemLevel: number) {
        let totalWeight = 0;
        const weights: number[] = [];

        for (const affix of affixes) {
            const availableTiers = affix.tiers.filter(t => t.requiredItemLevel <= itemLevel);
            if (availableTiers.length === 0) {
                weights.push(0);
                continue;
            }
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

    private static GenerateEquipmentName(equipment: POE2EquipmentInstance, baseName: string): string {
        if (equipment.rarity === ItemRarity.NORMAL) {
            if (equipment.prefixes.length > 0) {
                const affix = GetAffixById(equipment.prefixes[0].affixId);
                return affix ?  `${affix.name}${baseName}` : baseName;
            }
            return baseName;
        }

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
                return affix ?  `${baseName}${affix.name}` : baseName;
            }
            return baseName;
        }

        const prefixNames = ['锋利的', '坚固的', '强力的', '迅捷的', '炽热的', '寒冰的', '雷霆的', '神圣的', '黑暗的', '古老的', '永恒的', '无尽的'];
        const suffixNames = ['之力', '之怒', '之心', '之魂', '守护', '毁灭', '征服', '荣耀', '永恒', '命运', '传说', '神话'];

        const randomPrefix = prefixNames[RandomInt(0, prefixNames.length - 1)];
        const randomSuffix = suffixNames[RandomInt(0, suffixNames.length - 1)];

        return `${randomPrefix}${baseName}${randomSuffix}`;
    }

    // ==================== 混沌石：随机重置一条词缀 ====================

    public static RerollOneAffix(equipment: POE2EquipmentInstance): {
        success: boolean;
        oldAffix?: string;
        newAffix?: string;
        oldValue?: number;
        newValue?: number;
    } {
        if (equipment.rarity !== ItemRarity.RARE && equipment.rarity !== ItemRarity.LEGENDARY) {
            print('[POE2Generator] 只能对稀有/传说装备使用混沌石');
            return { success: false };
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return { success: false };
        }

        // 收集所有词缀
        const allAffixes: { affix: AffixInstance; isPrefix: boolean; index: number }[] = [];
        
        for (let i = 0; i < equipment.prefixes.length; i++) {
            allAffixes.push({ affix: equipment.prefixes[i], isPrefix: true, index: i });
        }
        for (let i = 0; i < equipment.suffixes.length; i++) {
            allAffixes.push({ affix: equipment.suffixes[i], isPrefix: false, index: i });
        }

        if (allAffixes.length === 0) {
            print('[POE2Generator] 装备没有词缀');
            return { success: false };
        }

        // 随机选择一条词缀
        const selectedIndex = RandomInt(0, allAffixes.length - 1);
        const selected = allAffixes[selectedIndex];
        
        const oldAffixDef = GetAffixById(selected.affix.affixId);
        const oldAffixName = oldAffixDef ? oldAffixDef.name : '未知';
        const oldValue = selected.affix.value;

        // 获取基底信息
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (!baseType) return { success: false };

        // 移除选中的词缀
        if (selected.isPrefix) {
            equipment.prefixes.splice(selected.index, 1);
        } else {
            equipment.suffixes.splice(selected.index, 1);
        }

        // 生成新词缀
        const position = selected.isPrefix ? AffixPosition.PREFIX : AffixPosition.SUFFIX;
        const newAffix = this.RollOneAffix(equipment, position, baseType.slot);

        if (newAffix) {
            if (selected.isPrefix) {
                equipment.prefixes.push(newAffix);
            } else {
                equipment.suffixes.push(newAffix);
            }
            
            const newAffixDef = GetAffixById(newAffix.affixId);
            const newAffixName = newAffixDef ?  newAffixDef.name : '未知';
            
            print(`[POE2Generator] 混沌石: ${oldAffixName} -> ${newAffixName}`);
            
            return {
                success: true,
                oldAffix: oldAffixName,
                newAffix: newAffixName,
                oldValue: oldValue,
                newValue: newAffix.value
            };
        } else {
            // 恢复原词缀
            if (selected.isPrefix) {
                equipment.prefixes.push(selected.affix);
            } else {
                equipment.suffixes.push(selected.affix);
            }
            print('[POE2Generator] 混沌石: 没有可用的新词缀，保持原样');
            return { success: false };
        }
    }

    // ==================== 崇高石：添加一条词缀 ====================

    public static AddRandomAffix(equipment: POE2EquipmentInstance): {
        success: boolean;
        newAffix?: string;
        newValue?: number;
        position?: string;
    } {
        if (equipment.rarity !== ItemRarity.RARE && equipment.rarity !== ItemRarity.LEGENDARY) {
            print('[POE2Generator] 只能对稀有/传说装备使用崇高石');
            return { success: false };
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return { success: false };
        }

        const limits = RARITY_AFFIX_LIMITS[equipment.rarity];
        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (!baseType) return { success: false };

        const canAddPrefix = equipment.prefixes.length < limits.maxPrefix;
        const canAddSuffix = equipment.suffixes.length < limits.maxSuffix;

        print(`[POE2Generator] 当前词缀: ${equipment.prefixes.length}/${limits.maxPrefix}前缀, ${equipment.suffixes.length}/${limits.maxSuffix}后缀`);

        if (! canAddPrefix && ! canAddSuffix) {
            print('[POE2Generator] 装备词缀已满');
            return { success: false };
        }

        let position: AffixPosition;
        if (canAddPrefix && canAddSuffix) {
            position = RandomInt(0, 1) === 0 ? AffixPosition.PREFIX : AffixPosition.SUFFIX;
        } else if (canAddPrefix) {
            position = AffixPosition.PREFIX;
        } else {
            position = AffixPosition.SUFFIX;
        }

        const newAffix = this.RollOneAffix(equipment, position, baseType.slot);
        if (! newAffix) {
            print('[POE2Generator] 没有可用的词缀');
            return { success: false };
        }

        if (position === AffixPosition.PREFIX) {
            equipment.prefixes.push(newAffix);
        } else {
            equipment.suffixes.push(newAffix);
        }

        const affixDef = GetAffixById(newAffix.affixId);
        const affixName = affixDef ?  affixDef.name : '未知';

        print(`[POE2Generator] 崇高石: 添加了一条${position === AffixPosition.PREFIX ? '前缀' : '后缀'} - ${affixName}`);
        
        return { 
            success: true, 
            newAffix: affixName, 
            newValue: newAffix.value,
            position: position === AffixPosition.PREFIX ? '前缀' : '后缀'
        };
    }

    // ==================== 神圣石：重随数值 ====================

    public static RerollAffixValues(equipment: POE2EquipmentInstance): {
        success: boolean;
        changes: Array<{ name: string; oldValue: number; newValue: number }>;
    } {
        if (equipment.rarity === ItemRarity.NORMAL) {
            print('[POE2Generator] 普通装备没有词缀');
            return { success: false, changes: [] };
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return { success: false, changes: [] };
        }

        if (equipment.prefixes.length === 0 && equipment.suffixes.length === 0) {
            print('[POE2Generator] 装备没有词缀');
            return { success: false, changes: [] };
        }

        const changes: Array<{ name: string; oldValue: number; newValue: number }> = [];

        for (const affix of equipment.prefixes) {
            const oldValue = affix.value;
            this.RerollAffixValue(affix);
            const affixDef = GetAffixById(affix.affixId);
            changes.push({
                name: affixDef ? affixDef.name : '未知',
                oldValue: oldValue,
                newValue: affix.value
            });
        }
        
        for (const affix of equipment.suffixes) {
            const oldValue = affix.value;
            this.RerollAffixValue(affix);
            const affixDef = GetAffixById(affix.affixId);
            changes.push({
                name: affixDef ? affixDef.name : '未知',
                oldValue: oldValue,
                newValue: affix.value
            });
        }

        print(`[POE2Generator] 神圣石: 重随了 ${changes.length} 条词缀的数值`);
        return { success: true, changes: changes };
    }

    private static RerollAffixValue(affix: AffixInstance): void {
        const affixDef = GetAffixById(affix.affixId);
        if (!affixDef) return;

        const tier = affixDef.tiers.find(t => t.tier === affix.tier);
        if (! tier) return;

        affix.value = RandomInt(tier.minValue, tier.maxValue);
    }

    // ==================== 重置所有词缀（备用） ====================

    public static RerollAllAffixes(equipment: POE2EquipmentInstance): boolean {
        if (equipment.rarity !== ItemRarity.RARE && equipment.rarity !== ItemRarity.LEGENDARY) {
            print('[POE2Generator] 只能对稀有/传说装备使用');
            return false;
        }

        if (equipment.corrupted) {
            print('[POE2Generator] 腐化装备无法修改');
            return false;
        }

        equipment.prefixes = [];
        equipment.suffixes = [];

        this.RollAffixes(equipment);

        const baseType = GetBaseTypeById(equipment.baseTypeId);
        if (baseType) {
            equipment.name = this.GenerateEquipmentName(equipment, baseType.name);
        }

        print(`[POE2Generator] 重置所有词缀完成`);
        return true;
    }
}

// ==================== 调试信息 ====================

if (IsServer()) {
    Timers.CreateTimer(0.3, () => {
        print('========================================');
        print('[POE2Generator] 装备生成器已加载');
        print('[POE2Generator] 词缀上限: 稀有/传说 = 3前缀+3后缀');
        print('========================================');
        
        return undefined;
    });
}