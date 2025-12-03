/**
 * 材料使用系统 - 从 zone_loot.ts 分离
 */

import { LootType, LOOT_ITEMS, ZoneLootSystem } from '../../zone/zone_loot';

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
        if (!config || !config.usable) {
            print(`[MaterialUseSystem] 材料 ${materialType} 不可使用`);
            return;
        }
        
        const count = ZoneLootSystem.GetItemCount(playerId, materialType);
        if (count < 1) {
            print(`[MaterialUseSystem] 玩家 ${playerId} 没有足够的 ${materialType}`);
            return;
        }
        
        // POE2 通货特殊处理：不在这里消耗，交给打造系统
        if (this.IsPOE2Currency(materialType)) {
            print(`[MaterialUseSystem] 玩家 ${playerId} 使用 ${config.name}`);
            this.UsePOE2Currency(playerId, materialType);
            return;
        }
        
        // 其他材料：先消耗再使用
        if (!ZoneLootSystem.ConsumeItem(playerId, materialType, 1)) {
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
    
    /**
     * 检查是否是 POE2 通货
     */
    private static IsPOE2Currency(materialType: LootType): boolean {
        return materialType === LootType.POE2_CHAOS_ORB ||
               materialType === LootType.POE2_EXALTED_ORB ||
               materialType === LootType.POE2_DIVINE_ORB;
    }
    
    /**
     * 使用 POE2 通货 - 交给打造系统处理
     */
    private static UsePOE2Currency(playerId: PlayerID, currencyType: LootType): void {
        // 动态导入避免循环依赖
        const { POE2CraftSystem } = require('../../systems/equipment/poe2_craft_system');
        
        // 打造系统会检查是否选中装备，并处理通货消耗
        const success = POE2CraftSystem.UseCurrency(playerId, currencyType);
        
        if (!success) {
            // 如果失败，打造系统已经发送了错误提示
            print(`[MaterialUseSystem] 通货使用失败`);
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
            // 宝箱也可能开出通货
            { type: LootType.POE2_CHAOS_ORB, min: 1, max: 2 },
            { type: LootType.POE2_EXALTED_ORB, min: 1, max: 1 },
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
