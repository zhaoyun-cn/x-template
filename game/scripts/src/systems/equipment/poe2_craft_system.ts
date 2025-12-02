/**
 * POE2 打造系统
 * 处理装备选择和通货使用的完整流程
 */

import { POE2Integration } from './poe2_integration';
import { LootType, ZoneLootSystem } from '../../zone/zone_loot';
import { EquipmentVaultSystem } from '../equipment_vault_system';

// 玩家当前选中的装备信息
interface SelectedEquipment {
    source: 'vault' | 'equipped';  // 来源：仓库 或 已装备
    index: number;                  // 仓库索引
    slot?: string;                  // 装备槽位（如果是已装备的）
    timestamp: number;              // 选中时间
}

export class POE2CraftSystem {
    
    // 存储每个玩家当前选中的装备
    private static selectedEquipment: Map<PlayerID, SelectedEquipment> = new Map();
    
    // 选中超时时间（秒）
    private static readonly SELECTION_TIMEOUT = 30;

    /**
     * 初始化打造系统
     */
    public static Init(): void {
        print('[POE2CraftSystem] 初始化打造系统...');
        
        // 监听装备选择事件（来自客户端）
        CustomGameEventManager.RegisterListener(
            'poe2_select_equipment',
            (_, event: any) => this.OnSelectEquipment(event)
        );
        
        // 监听通货使用事件（来自客户端）
        CustomGameEventManager.RegisterListener(
            'poe2_use_currency',
            (_, event: any) => this.OnUseCurrency(event)
        );
        
        // 监听取消选择事件
        CustomGameEventManager.RegisterListener(
            'poe2_cancel_selection',
            (_, event: any) => this.OnCancelSelection(event)
        );
        
        print('[POE2CraftSystem] 打造系统已初始化');
    }

    /**
     * 选择装备（来自仓库）
     */
    public static SelectVaultEquipment(playerId: PlayerID, vaultIndex: number): boolean {
        const vault = EquipmentVaultSystem.GetVault(playerId);
        
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            this.SendError(playerId, '无效的装备索引');
            return false;
        }

        const item = vault[vaultIndex];
        const instanceId = (item as any).poe2InstanceId;
        
        if (! instanceId) {
            this.SendError(playerId, '该装备不支持打造');
            return false;
        }

        // 设置选中状态
        this.selectedEquipment.set(playerId, {
            source: 'vault',
            index: vaultIndex,
            timestamp: GameRules.GetGameTime()
        });

        // 通知客户端
        this.SendSelectionUpdate(playerId, item.name, vaultIndex, 'vault');
        
        GameRules.SendCustomMessage(
            `<font color="#ffd700">🎯 已选中: ${item.name}</font>`,
            playerId, 0
        );
        
        print(`[POE2CraftSystem] 玩家${playerId} 选中仓库装备[${vaultIndex}]: ${item.name}`);
        return true;
    }

    /**
     * 取消选择
     */
    public static CancelSelection(playerId: PlayerID): void {
        if (this.selectedEquipment.has(playerId)) {
            this.selectedEquipment.delete(playerId);
            this.SendSelectionUpdate(playerId, null, -1, null);
            
            GameRules.SendCustomMessage(
                `<font color="#888888">✖ 已取消选择</font>`,
                playerId, 0
            );
        }
    }

    /**
     * 获取当前选中的装备
     */
    public static GetSelectedEquipment(playerId: PlayerID): SelectedEquipment | null {
        const selected = this.selectedEquipment.get(playerId);
        
        if (!selected) {
            return null;
        }

        // 检查是否超时
        const elapsed = GameRules.GetGameTime() - selected.timestamp;
        if (elapsed > this.SELECTION_TIMEOUT) {
            this.selectedEquipment.delete(playerId);
            this.SendSelectionUpdate(playerId, null, -1, null);
            return null;
        }

        return selected;
    }

    /**
     * 使用通货（核心方法）
     */
    public static UseCurrency(playerId: PlayerID, currencyType: LootType): boolean {
        // 1.检查是否有选中的装备
        const selected = this.GetSelectedEquipment(playerId);
        if (!selected) {
            this.SendError(playerId, '请先选择一件装备！');
            return false;
        }

        // 2. 检查通货数量
        const count = ZoneLootSystem.GetItemCount(playerId, currencyType);
        if (count < 1) {
            this.SendError(playerId, '通货不足！');
            return false;
        }

        // 3. 根据通货类型执行操作
        let success = false;
        
        switch (currencyType) {
            case LootType.POE2_CHAOS_ORB:
                success = POE2Integration.UseChaosOrbOnEquipment(playerId, selected.index);
                break;
                
            case LootType.POE2_EXALTED_ORB:
                success = POE2Integration.UseExaltedOrbOnEquipment(playerId, selected.index);
                break;
                
            case LootType.POE2_DIVINE_ORB:
                success = POE2Integration.UseDivineOrbOnEquipment(playerId, selected.index);
                break;
                
            default:
                this.SendError(playerId, '该物品不能用于打造');
                return false;
        }

        if (success) {
            // 刷新选中状态（装备可能已改变）
            const vault = EquipmentVaultSystem.GetVault(playerId);
            if (selected.index < vault.length) {
                const newItem = vault[selected.index];
                this.SendSelectionUpdate(playerId, newItem.name, selected.index, 'vault');
            }
        }

        return success;
    }

    /**
     * 分解装备
     */
    public static DisassembleSelected(playerId: PlayerID): boolean {
        const selected = this.GetSelectedEquipment(playerId);
        if (!selected) {
            this.SendError(playerId, '请先选择一件装备！');
            return false;
        }

        const success = POE2Integration.DisassembleEquipment(playerId, selected.index);
        
        if (success) {
            // 清除选中状态
            this.CancelSelection(playerId);
        }

        return success;
    }

    // ==================== 事件处理 ====================

    private static OnSelectEquipment(event: { PlayerID: PlayerID; source: string; index: number; slot?: string }): void {
        const playerId = event.PlayerID;
        
        if (event.source === 'vault') {
            this.SelectVaultEquipment(playerId, event.index);
        }
        // 可以扩展支持已装备的装备
    }

    private static OnUseCurrency(event: { PlayerID: PlayerID; currencyType: string }): void {
        const playerId = event.PlayerID;
        const currencyType = event.currencyType as LootType;
        
        this.UseCurrency(playerId, currencyType);
    }

    private static OnCancelSelection(event: { PlayerID: PlayerID }): void {
        this.CancelSelection(event.PlayerID);
    }

    // ==================== 客户端通信 ====================

    private static SendError(playerId: PlayerID, message: string): void {
        GameRules.SendCustomMessage(
            `<font color="#ff4444">❌ ${message}</font>`,
            playerId, 0
        );

        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                'poe2_craft_error' as never,
                { message: message } as never
            );
        }
    }

    private static SendSelectionUpdate(
        playerId: PlayerID, 
        itemName: string | null, 
        index: number, 
        source: string | null
    ): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                'poe2_selection_update' as never,
                {
                    hasSelection: itemName !== null,
                    itemName: itemName || '',
                    index: index,
                    source: source || ''
                } as never
            );
        }
    }
}

// ==================== 初始化 ====================

if (IsServer()) {
    Timers.CreateTimer(0.5, () => {
        POE2CraftSystem.Init();
        return undefined;
    });
}