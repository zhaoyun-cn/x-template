/**
 * POE2 装备系统 - 集成适配器
 * 将 POE2 装备转换为现有仓库系统格式
 */

import { POE2EquipmentInstance, RARITY_COLORS, RARITY_NAMES, EquipSlot, ItemRarity, AffixPosition } from './poe2_equipment_types';
import { GetBaseTypeById } from './poe2_base_types';
import { GetAffixById } from './poe2_affix_pool';
import { POE2EquipmentGenerator } from './poe2_equipment_generator';
import { EquipmentVaultSystem } from '../equipment_vault_system';
import { LootType, ZoneLootSystem } from '../../zone/zone_loot';

import { 
    ExternalRewardItem, 
    ExternalItemType, 
    EquipmentAttribute, 
    EquipmentStat,
    AffixDetail
} from '../../dungeon/external_reward_pool';

export class POE2Integration {
    
    // ==================== 装备实例缓存 ====================
    
    // 存储 POE2 装备原始实例，用于货币操作
    private static equipmentInstances: Map<string, POE2EquipmentInstance> = new Map();

    // ==================== 转换函数 ====================

    /**
     * 将 POE2 装备实例转换为仓库系统格式
     */
    public static ConvertToVaultItem(poe2Item: POE2EquipmentInstance): ExternalRewardItem {
        const baseType = GetBaseTypeById(poe2Item.baseTypeId);
        if (!baseType) {
            print('[POE2Integration] 无法找到基底类型: ' + poe2Item.baseTypeId);
            return {
                name: poe2Item.name,
                type: ExternalItemType.TRINKET,
                icon: 'item_mystery',
                stats: [],
            };
        }

        const slotToTypeMap: Record<EquipSlot, ExternalItemType> = {
            [EquipSlot.WEAPON]: ExternalItemType.WEAPON,
            [EquipSlot.HELMET]: ExternalItemType.HELMET,
            [EquipSlot.ARMOR]: ExternalItemType.ARMOR,
            [EquipSlot.GLOVES]: ExternalItemType.TRINKET,
            [EquipSlot.BOOTS]: ExternalItemType.BOOTS,
            [EquipSlot.BELT]: ExternalItemType.BELT,
            [EquipSlot.RING1]: ExternalItemType.RING,
            [EquipSlot.RING2]: ExternalItemType.RING,
            [EquipSlot.AMULET]: ExternalItemType.NECKLACE,
        };

        // stats 和 affixDetails 使用相同的描述文本
        const stats: EquipmentStat[] = [];
        const affixDetails: AffixDetail[] = [];

        // 添加前缀
        for (const affix of poe2Item.prefixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                
                // 找到当前层级的数值范围
                const tierData = affixDef.tiers.find(t => t.tier === affix.tier);
                
                stats.push({
                    attribute: desc,
                    value: affix.value,
                });
                
                affixDetails.push({
                    position: 'prefix',
                    tier: affix.tier,
                    name: affixDef.name,
                    description: desc,
                    color: '#8888ff',
                    value: affix.value,
                    minValue: tierData?.minValue || 0,
                    maxValue: tierData?.maxValue || 0,
                });
            }
        }

        // 添加后缀
        for (const affix of poe2Item.suffixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                
                const tierData = affixDef.tiers.find(t => t.tier === affix.tier);
                
                stats.push({
                    attribute: desc,
                    value: affix.value,
                });
                
                affixDetails.push({
                    position: 'suffix',
                    tier: affix.tier,
                    name: affixDef.name,
                    description: desc,
                    color: '#ffff77',
                    value: affix.value,
                    minValue: tierData?.minValue || 0,
                    maxValue: tierData?.maxValue || 0,
                });
            }
        }

        return {
            name: poe2Item.name,
            type: slotToTypeMap[baseType.slot] || ExternalItemType.TRINKET,
            icon: baseType.icon,
            stats: stats,
            rarity: poe2Item.rarity,
            affixDetails: affixDetails,
        };
    }

    private static AffixTypeToEquipmentAttribute(affixType: string): EquipmentAttribute | null {
        const mapping: Record<string, EquipmentAttribute> = {
            'flat_strength': EquipmentAttribute.STRENGTH,
            'flat_agility': EquipmentAttribute.AGILITY,
            'flat_intelligence': EquipmentAttribute.INTELLIGENCE,
            'flat_health': EquipmentAttribute.HEALTH,
            'flat_armor': EquipmentAttribute.ARMOR,
            'flat_mana': EquipmentAttribute.MANA,
            'flat_attack_damage': EquipmentAttribute.ATTACK_DAMAGE,
            'percent_physical_damage': EquipmentAttribute.ATTACK_DAMAGE,
            'percent_attack_speed': EquipmentAttribute.ATTACK_SPEED,
            'percent_max_health': EquipmentAttribute.HEALTH,
            'percent_armor': EquipmentAttribute.ARMOR,
            'percent_move_speed': EquipmentAttribute.MOVE_SPEED,
            'flat_move_speed': EquipmentAttribute.MOVE_SPEED,
            'fire_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'cold_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'lightning_resistance': EquipmentAttribute.MAGIC_RESISTANCE,
            'crit_chance': EquipmentAttribute.ATTACK_DAMAGE,
            'crit_damage': EquipmentAttribute.ATTACK_DAMAGE,
            'life_leech': EquipmentAttribute.HEALTH,
            'life_regen': EquipmentAttribute.HEALTH,
            'skill_level_all': EquipmentAttribute.INTELLIGENCE,
            'cooldown_reduction': EquipmentAttribute.INTELLIGENCE,
            'evasion_percent': EquipmentAttribute.AGILITY,
        };
        
        return mapping[affixType] || null;
    }

    // ==================== 便捷生成函数 ====================

    /**
     * 生成装备并添加到仓库（带缓存）
     */
    public static GenerateAndAddToVault(
        playerId: PlayerID,
        itemLevel: number,
        rarity?: ItemRarity,
        slot?: EquipSlot
    ): void {
        const poe2Item = POE2EquipmentGenerator.GenerateRandomEquipment(itemLevel, rarity, slot);
        if (!poe2Item) {
            print('[POE2Integration] 生成装备失败');
            return;
        }

        // ⭐ 缓存装备实例
        this.equipmentInstances.set(poe2Item.id, poe2Item);

        // 详细日志
        print('========================================');
        print(`[POE2] 装备详情:`);
        print(`  名称: ${poe2Item.name}`);
        print(`  ID: ${poe2Item.id}`);
        print(`  稀有度: ${RARITY_NAMES[poe2Item.rarity]}`);
        print(`  物品等级: ${poe2Item.itemLevel}`);
        print(`  前缀 (${poe2Item.prefixes.length}):`);
        for (const affix of poe2Item.prefixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print(`  后缀 (${poe2Item.suffixes.length}):`);
        for (const affix of poe2Item.suffixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print('========================================');

        // 转换为仓库格式
        const vaultItem = this.ConvertToVaultItem(poe2Item);
        
        // ⭐ 在仓库物品中保存原始ID引用
        (vaultItem as any).poe2InstanceId = poe2Item.id;

        // 添加到仓库
        EquipmentVaultSystem.SaveToVault(playerId, vaultItem);

        const rarityName = RARITY_NAMES[poe2Item.rarity];
        print(`[POE2Integration] 已添加装备到仓库: ${vaultItem.name} [${rarityName}]`);
    }

    /**
     * 批量生成掉落
     */
    public static GenerateLootDrop(
        playerId: PlayerID,
        itemLevel: number,
        count: number
    ): void {
        for (let i = 0; i < count; i++) {
            this.GenerateAndAddToVault(playerId, itemLevel);
        }
    }

    // ==================== 通货使用集成 ====================

    /**
     * 使用混沌石：随机重置一条词缀
     */
    public static UseChaosOrbOnEquipment(playerId: PlayerID, vaultIndex: number): boolean {
        // 1.检查通货数量
        const chaosCount = ZoneLootSystem.GetItemCount(playerId, LootType.POE2_CHAOS_ORB);
        if (chaosCount < 1) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 混沌石不足！</font>`, playerId, 0);
            return false;
        }

        // 2. 获取仓库中的装备
        const vault = EquipmentVaultSystem.GetVault(playerId);
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无效的装备索引！</font>`, playerId, 0);
            return false;
        }

        const vaultItem = vault[vaultIndex];
        const instanceId = (vaultItem as any).poe2InstanceId;
        
        if (!instanceId) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 该装备不支持使用通货！</font>`, playerId, 0);
            return false;
        }

        // 3.获取装备实例
        const equipment = this.equipmentInstances.get(instanceId);
        if (!equipment) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 装备数据丢失！</font>`, playerId, 0);
            return false;
        }

        // 4.使用混沌石（随机重置一条词缀）
        const success = POE2EquipmentGenerator.RerollOneAffix(equipment);
        if (!success) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无法对该装备使用混沌石！</font>`, playerId, 0);
            return false;
        }

        // 5.消耗通货
        ZoneLootSystem.ConsumeItem(playerId, LootType.POE2_CHAOS_ORB, 1);

        // 6. 更新仓库中的装备
        const newVaultItem = this.ConvertToVaultItem(equipment);
        (newVaultItem as any).poe2InstanceId = instanceId;
        vault[vaultIndex] = newVaultItem;

        // 7.刷新数据
        EquipmentVaultSystem.PushDataToClient(playerId);

        GameRules.SendCustomMessage(
            `<font color="#aa00ff">🔮 混沌石使用成功！${newVaultItem.name} 的一条词缀已重置</font>`,
            playerId, 0
        );

        this.PrintEquipmentAffixes(equipment);
        return true;
    }

    /**
     * 使用崇高石：添加一条随机词缀
     */
    public static UseExaltedOrbOnEquipment(playerId: PlayerID, vaultIndex: number): boolean {
        // 1.检查通货数量
        const exaltCount = ZoneLootSystem.GetItemCount(playerId, LootType.POE2_EXALTED_ORB);
        if (exaltCount < 1) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 崇高石不足！</font>`, playerId, 0);
            return false;
        }

        // 2.获取仓库中的装备
        const vault = EquipmentVaultSystem.GetVault(playerId);
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无效的装备索引！</font>`, playerId, 0);
            return false;
        }

        const vaultItem = vault[vaultIndex];
        const instanceId = (vaultItem as any).poe2InstanceId;
        
        if (!instanceId) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 该装备不支持使用通货！</font>`, playerId, 0);
            return false;
        }

        // 3.获取装备实例
        const equipment = this.equipmentInstances.get(instanceId);
        if (!equipment) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 装备数据丢失！</font>`, playerId, 0);
            return false;
        }

        // 4.使用崇高石
        const success = POE2EquipmentGenerator.AddRandomAffix(equipment);
        if (!success) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 装备词缀已满，无法添加！</font>`, playerId, 0);
            return false;
        }

        // 5.消耗通货
        ZoneLootSystem.ConsumeItem(playerId, LootType.POE2_EXALTED_ORB, 1);

        // 6.更新仓库中的装备
        const newVaultItem = this.ConvertToVaultItem(equipment);
        (newVaultItem as any).poe2InstanceId = instanceId;
        vault[vaultIndex] = newVaultItem;

        // 7.刷新数据
        EquipmentVaultSystem.PushDataToClient(playerId);

        GameRules.SendCustomMessage(
            `<font color="#ffd700">✨ 崇高石使用成功！${newVaultItem.name} 添加了新词缀</font>`,
            playerId, 0
        );

        this.PrintEquipmentAffixes(equipment);
        return true;
    }

    /**
     * 使用神圣石：重新随机词缀数值
     */
    public static UseDivineOrbOnEquipment(playerId: PlayerID, vaultIndex: number): boolean {
        // 1.检查通货数量
        const divineCount = ZoneLootSystem.GetItemCount(playerId, LootType.POE2_DIVINE_ORB);
        if (divineCount < 1) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 神圣石不足！</font>`, playerId, 0);
            return false;
        }

        // 2. 获取仓库中的装备
        const vault = EquipmentVaultSystem.GetVault(playerId);
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无效的装备索引！</font>`, playerId, 0);
            return false;
        }

        const vaultItem = vault[vaultIndex];
        const instanceId = (vaultItem as any).poe2InstanceId;
        
        if (!instanceId) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 该装备不支持使用通货！</font>`, playerId, 0);
            return false;
        }

        // 3.获取装备实例
        const equipment = this.equipmentInstances.get(instanceId);
        if (!equipment) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 装备数据丢失！</font>`, playerId, 0);
            return false;
        }

        // 4.使用神圣石
        const success = POE2EquipmentGenerator.RerollAffixValues(equipment);
        if (!success) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无法对该装备使用神圣石！</font>`, playerId, 0);
            return false;
        }

        // 5.消耗通货
        ZoneLootSystem.ConsumeItem(playerId, LootType.POE2_DIVINE_ORB, 1);

        // 6.更新仓库中的装备
        const newVaultItem = this.ConvertToVaultItem(equipment);
        (newVaultItem as any).poe2InstanceId = instanceId;
        vault[vaultIndex] = newVaultItem;

        // 7.刷新数据
        EquipmentVaultSystem.PushDataToClient(playerId);

        GameRules.SendCustomMessage(
            `<font color="#00ffff">💎 神圣石使用成功！${newVaultItem.name} 的词缀数值已重置</font>`,
            playerId, 0
        );

        this.PrintEquipmentAffixes(equipment);
        return true;
    }

    /**
     * 分解装备获得碎片
     */
    public static DisassembleEquipment(playerId: PlayerID, vaultIndex: number): boolean {
        const vault = EquipmentVaultSystem.GetVault(playerId);
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无效的装备索引！</font>`, playerId, 0);
            return false;
        }

        const vaultItem = vault[vaultIndex];
        const rarity = vaultItem.rarity || 0;
        const itemName = vaultItem.name;

        // 根据稀有度决定碎片数量
        let scrapCount: number;
        switch (rarity) {
            case 3: scrapCount = RandomInt(8, 15); break;  // 传说
            case 2: scrapCount = RandomInt(4, 8); break;   // 稀有
            case 1: scrapCount = RandomInt(2, 4); break;   // 魔法
            default: scrapCount = RandomInt(1, 2); break;  // 普通
        }

        // 从仓库移除装备
        vault.splice(vaultIndex, 1);

        // 清理缓存
        const instanceId = (vaultItem as any).poe2InstanceId;
        if (instanceId) {
            this.equipmentInstances.delete(instanceId);
        }

        // 添加碎片
        ZoneLootSystem.AddItem(playerId, LootType.POE2_SCRAP, scrapCount);

        // 刷新数据
        EquipmentVaultSystem.PushDataToClient(playerId);

        GameRules.SendCustomMessage(
            `<font color="#888888">🔨 分解 ${itemName} 获得 ${scrapCount} 个装备碎片</font>`,
            playerId, 0
        );

        return true;
    }

    /**
     * 碎片合成通货
     */
    public static CraftCurrency(playerId: PlayerID, currencyType: LootType): boolean {
        // 合成配方
        const recipes: Record<string, number> = {
            [LootType.POE2_CHAOS_ORB]: 10,      // 10碎片 = 1混沌石
            [LootType.POE2_EXALTED_ORB]: 30,   // 30碎片 = 1崇高石
            [LootType.POE2_DIVINE_ORB]: 50,    // 50碎片 = 1神圣石
        };

        const requiredScrap = recipes[currencyType];
        if (! requiredScrap) {
            GameRules.SendCustomMessage(`<font color="#ff4444">❌ 无效的通货类型！</font>`, playerId, 0);
            return false;
        }

        const currentScrap = ZoneLootSystem.GetItemCount(playerId, LootType.POE2_SCRAP);
        if (currentScrap < requiredScrap) {
            GameRules.SendCustomMessage(
                `<font color="#ff4444">❌ 碎片不足！需要 ${requiredScrap}，当前 ${currentScrap}</font>`,
                playerId, 0
            );
            return false;
        }

        // 消耗碎片
        ZoneLootSystem.ConsumeItem(playerId, LootType.POE2_SCRAP, requiredScrap);

        // 添加通货
        ZoneLootSystem.AddItem(playerId, currencyType, 1);

        const currencyNames: Record<string, string> = {
            [LootType.POE2_CHAOS_ORB]: '混沌石',
            [LootType.POE2_EXALTED_ORB]: '崇高石',
            [LootType.POE2_DIVINE_ORB]: '神圣石',
        };

        GameRules.SendCustomMessage(
            `<font color="#ffd700">⚗️ 合成成功！消耗 ${requiredScrap} 碎片，获得 1 个${currencyNames[currencyType]}</font>`,
            playerId, 0
        );

        return true;
    }

    /**
     * 打印装备词缀信息
     */
    private static PrintEquipmentAffixes(equipment: POE2EquipmentInstance): void {
        print('========================================');
        print(`[POE2] ${equipment.name} 当前词缀:`);
        print(`  前缀 (${equipment.prefixes.length}):`);
        for (const affix of equipment.prefixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print(`  后缀 (${equipment.suffixes.length}):`);
        for (const affix of equipment.suffixes) {
            const affixDef = GetAffixById(affix.affixId);
            if (affixDef) {
                const desc = affixDef.description.replace('{value}', affix.value.toString());
                print(`    [T${affix.tier}] ${affixDef.name} - ${desc}`);
            }
        }
        print('========================================');
    }

    /**
     * 获取装备实例（供外部使用）
     */
    public static GetEquipmentInstance(instanceId: string): POE2EquipmentInstance | undefined {
        return this.equipmentInstances.get(instanceId);
    }

    /**
     * 清理玩家的装备缓存
     */
    public static ClearPlayerCache(playerId: PlayerID): void {
        const vault = EquipmentVaultSystem.GetVault(playerId);
        const validIds = new Set<string>();
        
        for (const item of vault) {
            const instanceId = (item as any).poe2InstanceId;
            if (instanceId) {
                validIds.add(instanceId);
            }
        }

        // 清理不在仓库中的缓存
        const toDelete: string[] = [];
        this.equipmentInstances.forEach((_, id) => {
            if (!validIds.has(id)) {
                toDelete.push(id);
            }
        });
        
        for (const id of toDelete) {
            this.equipmentInstances.delete(id);
        }
    }
}

// ==================== 测试命令 ====================

if (IsServer()) {
    Timers.CreateTimer(1, () => {
        ListenToGameEvent('player_chat', (event) => {
            const playerId = event.playerid as PlayerID;
            const text = event.text as string;

            // ==================== 生成装备 ====================
            
            if (text === '-poe2test') {
                print(`[POE2Integration] 为玩家 ${playerId} 生成测试装备`);
                POE2Integration.GenerateLootDrop(playerId, 20, 5);
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">✨ 已生成 5 件随机装备到仓库！</font>',
                    playerId, 0
                );
            }

            if (text === '-poe2rare') {
                POE2Integration.GenerateAndAddToVault(playerId, 25, ItemRarity.RARE);
                GameRules.SendCustomMessage(
                    '<font color="#ffff77">⚡ 已生成稀有装备！</font>',
                    playerId, 0
                );
            }

            if (text === '-poe2legendary') {
                POE2Integration.GenerateAndAddToVault(playerId, 30, ItemRarity.LEGENDARY);
                GameRules.SendCustomMessage(
                    '<font color="#ff8800">🔥 已生成传说装备！</font>',
                    playerId, 0
                );
            }

            // ==================== 通货操作 ====================

            // 给予测试通货
            if (text === '-givecurrency') {
                ZoneLootSystem.AddItem(playerId, LootType.POE2_CHAOS_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_EXALTED_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_DIVINE_ORB, 10);
                ZoneLootSystem.AddItem(playerId, LootType.POE2_SCRAP, 50);
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">💰 已获得测试通货：混沌石x10, 崇高石x10, 神圣石x10, 碎片x50</font>',
                    playerId, 0
                );
            }

            // ==================== 打造系统 ====================

            // 选择装备
            if (text.startsWith('-select ')) {
                const index = parseInt(text.replace('-select ', ''));
                if (! isNaN(index)) {
                    const { POE2CraftSystem } = require('./poe2_craft_system');
                    POE2CraftSystem.SelectVaultEquipment(playerId, index);
                }
            }

            // 取消选择
            if (text === '-unselect') {
                const { POE2CraftSystem } = require('./poe2_craft_system');
                POE2CraftSystem.CancelSelection(playerId);
            }

            // 对选中装备使用通货
            if (text === '-usechaos') {
                const { POE2CraftSystem } = require('./poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_CHAOS_ORB);
            }
            if (text === '-useexalt') {
                const { POE2CraftSystem } = require('./poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_EXALTED_ORB);
            }
            if (text === '-usedivine') {
                const { POE2CraftSystem } = require('./poe2_craft_system');
                POE2CraftSystem.UseCurrency(playerId, LootType.POE2_DIVINE_ORB);
            }

            // 分解选中装备
            if (text === '-disasm') {
                const { POE2CraftSystem } = require('./poe2_craft_system');
                POE2CraftSystem.DisassembleSelected(playerId);
            }

            // ==================== 合成 ====================

            if (text === '-craftchaos') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_CHAOS_ORB);
            }
            if (text === '-craftexalt') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_EXALTED_ORB);
            }
            if (text === '-craftdivine') {
                POE2Integration.CraftCurrency(playerId, LootType.POE2_DIVINE_ORB);
            }

            // ==================== 帮助 ====================

            if (text === '-poe2help') {
                GameRules.SendCustomMessage('===== POE2 货币系统命令 =====', playerId, 0);
                GameRules.SendCustomMessage('-poe2test - 生成5件随机装备', playerId, 0);
                GameRules.SendCustomMessage('-poe2rare - 生成稀有装备', playerId, 0);
                GameRules.SendCustomMessage('-poe2legendary - 生成传说装备', playerId, 0);
                GameRules.SendCustomMessage('-givecurrency - 获取测试通货', playerId, 0);
                GameRules.SendCustomMessage('', playerId, 0);
                GameRules.SendCustomMessage('===== 打造流程 =====', playerId, 0);
                GameRules.SendCustomMessage('-select [索引] - 选择仓库中的装备', playerId, 0);
                GameRules.SendCustomMessage('-unselect - 取消选择', playerId, 0);
                GameRules.SendCustomMessage('-usechaos - 对选中装备使用混沌石', playerId, 0);
                GameRules.SendCustomMessage('-useexalt - 对选中装备使用崇高石', playerId, 0);
                GameRules.SendCustomMessage('-usedivine - 对选中装备使用神圣石', playerId, 0);
                GameRules.SendCustomMessage('-disasm - 分解选中装备', playerId, 0);
                GameRules.SendCustomMessage('', playerId, 0);
                GameRules.SendCustomMessage('===== 合成 =====', playerId, 0);
                GameRules.SendCustomMessage('-craftchaos - 合成混沌石(10碎片)', playerId, 0);
                GameRules.SendCustomMessage('-craftexalt - 合成崇高石(30碎片)', playerId, 0);
                GameRules.SendCustomMessage('-craftdivine - 合成神圣石(50碎片)', playerId, 0);
            }
        }, null);

        print('========================================');
        print('[POE2Integration] 货币系统已加载');
        print('[POE2Integration] 输入 -poe2help 查看命令');
        print('========================================');

        return undefined;
    });
}