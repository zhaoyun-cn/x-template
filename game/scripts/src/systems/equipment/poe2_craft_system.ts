/**
 * POE2 打造系统
 * 处理装备选择和通货使用的完整流程
 */

import { POE2Integration } from './poe2_integration';
import { LootType, ZoneLootSystem, LOOT_ITEMS } from '../../dungeon/zone/zone_loot';
import { EquipmentVaultSystem } from './vault_system';

// 玩家当前选中的装备信息
interface SelectedEquipment {
    source: 'vault' | 'equipped';
    index: number;
    slot?: string;
    itemName: string;
    timestamp: number;
}

export class POE2CraftSystem {
    
    private static selectedEquipment: Map<PlayerID, SelectedEquipment> = new Map();
    private static readonly SELECTION_TIMEOUT = 60;

    /**
     * 初始化打造系统
     */
    public static Init(): void {
        print('[POE2CraftSystem] 初始化打造系统...');
        
        CustomGameEventManager.RegisterListener(
            'poe2_select_equipment',
            (_, event: any) => this.OnSelectEquipment(event)
        );
        
        CustomGameEventManager.RegisterListener(
            'poe2_use_currency',
            (_, event: any) => this.OnUseCurrency(event)
        );
        
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
        print(`[POE2CraftSystem] 玩家${playerId} 尝试选择仓库装备[${vaultIndex}]`);
        
        const vault = EquipmentVaultSystem.GetVault(playerId);
        
        if (vaultIndex < 0 || vaultIndex >= vault.length) {
            this.SendError(playerId, '无效的装备索引');
            print(`[POE2CraftSystem] ❌ 无效索引: ${vaultIndex}, 仓库大小: ${vault.length}`);
            return false;
        }

        const item = vault[vaultIndex];
        const instanceId = (item as any).poe2InstanceId;
        
        if (! instanceId) {
            this.SendError(playerId, '该装备不支持打造（非POE2装备）');
            print(`[POE2CraftSystem] ❌ 装备没有 poe2InstanceId: ${item.name}`);
            return false;
        }

        this.selectedEquipment.set(playerId, {
            source: 'vault',
            index: vaultIndex,
            itemName: item.name,
            timestamp: GameRules.GetGameTime()
        });

        this.SendSelectionUpdate(playerId, item.name, vaultIndex, 'vault');
        
        GameRules.SendCustomMessage(
            `<font color="#ffd700">🎯 已选中: ${item.name}</font>`,
            playerId, 0
        );
        
        print(`[POE2CraftSystem] ✓ 玩家${playerId} 选中仓库装备[${vaultIndex}]: ${item.name}`);
        return true;
    }

    /**
     * 取消选择
     */
    public static CancelSelection(playerId: PlayerID): void {
        if (this.selectedEquipment.has(playerId)) {
            const selected = this.selectedEquipment.get(playerId);
            this.selectedEquipment.delete(playerId);
            this.SendSelectionUpdate(playerId, null, -1, null);
            
            GameRules.SendCustomMessage(
                `<font color="#888888">✖ 已取消选择${selected?.itemName || ''}</font>`,
                playerId, 0
            );
            print(`[POE2CraftSystem] 玩家${playerId} 取消选择`);
        }
    }

    /**
     * 获取当前选中的装备
     */
    public static GetSelectedEquipment(playerId: PlayerID): SelectedEquipment | null {
        const selected = this.selectedEquipment.get(playerId);
        
        if (!selected) {
            print(`[POE2CraftSystem] 玩家${playerId} 没有选中任何装备`);
            return null;
        }

        const elapsed = GameRules.GetGameTime() - selected.timestamp;
        if (elapsed > this.SELECTION_TIMEOUT) {
            this.selectedEquipment.delete(playerId);
            this.SendSelectionUpdate(playerId, null, -1, null);
            print(`[POE2CraftSystem] 玩家${playerId} 选择已超时`);
            return null;
        }

        return selected;
    }

    /**
     * 检查是否有选中装备
     */
    public static HasSelection(playerId: PlayerID): boolean {
        return this.GetSelectedEquipment(playerId) !== null;
    }

    /**
     * 使用通货（核心方法）
     */
    public static UseCurrency(playerId: PlayerID, currencyType: LootType): boolean {
        print(`[POE2CraftSystem] 玩家${playerId} 尝试使用通货: ${currencyType}`);
        
        // 1.检查是否有选中的装备
        const selected = this.GetSelectedEquipment(playerId);
        if (!selected) {
            this.SendError(playerId, '请先在仓库中选择一件装备！');
            GameRules.SendCustomMessage(
                `<font color="#ff4444">❌ 请先选择一件装备！使用 -select [索引] 或在UI中点击装备</font>`,
                playerId, 0
            );
            return false;
        }

        print(`[POE2CraftSystem] 当前选中: ${selected.itemName} (索引: ${selected.index})`);

        // 2. 检查通货数量
        const count = ZoneLootSystem.GetItemCount(playerId, currencyType);
        if (count < 1) {
            const currencyName = LOOT_ITEMS[currencyType]?.name || currencyType;
            this.SendError(playerId, `${currencyName}不足！`);
            return false;
        }

        // 3.根据通货类型执行操作
        let success = false;
        
        switch (currencyType) {
            case LootType.POE2_CHAOS_ORB: {
                const result = POE2Integration.UseChaosOrbOnEquipment(playerId, selected.index);
                success = result.success;
                break;
            }
                
            case LootType.POE2_EXALTED_ORB: {
                const result = POE2Integration.UseExaltedOrbOnEquipment(playerId, selected.index);
                success = result.success;
                break;
            }
                
            case LootType.POE2_DIVINE_ORB: {
                const result = POE2Integration.UseDivineOrbOnEquipment(playerId, selected.index);
                success = result.success;
                break;
            }
                
            default:
                this.SendError(playerId, '该物品不能用于打造');
                return false;
        }

        if (success) {
            // 刷新选中状态（装备属性可能已改变）
            const vault = EquipmentVaultSystem.GetVault(playerId);
            if (selected.index < vault.length) {
                const newItem = vault[selected.index];
                this.selectedEquipment.set(playerId, {
                    ...selected,
                    itemName: newItem.name,
                    timestamp: GameRules.GetGameTime()
                });
                this.SendSelectionUpdate(playerId, newItem.name, selected.index, 'vault');
            }
            print(`[POE2CraftSystem] ✓ 通货使用成功`);
        } else {
            print(`[POE2CraftSystem] ❌ 通货使用失败（可能是装备不符合条件）`);
        }

        return success;
    }

    /**
     * 分解选中的装备
     */
    public static DisassembleSelected(playerId: PlayerID): boolean {
        const selected = this.GetSelectedEquipment(playerId);
        if (!selected) {
            this.SendError(playerId, '请先选择一件装备！');
            GameRules.SendCustomMessage(
                `<font color="#ff4444">❌ 请先选择一件装备！</font>`,
                playerId, 0
            );
            return false;
        }

        const success = POE2Integration.DisassembleEquipment(playerId, selected.index);
        
        if (success) {
            this.selectedEquipment.delete(playerId);
            this.SendSelectionUpdate(playerId, null, -1, null);
        }

        return success;
    }

    // ==================== 事件处理 ====================

    private static OnSelectEquipment(event: { PlayerID: PlayerID; source: string; index: number; slot?: string }): void {
        const playerId = event.PlayerID;
        print(`[POE2CraftSystem] 收到选择装备事件: source=${event.source}, index=${event.index}`);
        
        if (event.source === 'vault') {
            this.SelectVaultEquipment(playerId, event.index);
        }
    }

    private static OnUseCurrency(event: { PlayerID: PlayerID; currencyType: string }): void {
        const playerId = event.PlayerID;
        const currencyType = event.currencyType as LootType;
        print(`[POE2CraftSystem] 收到使用通货事件: ${currencyType}`);
        
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

    /**
     * 获取当前选中状态（供UI查询）
     */
    public static GetSelectionInfo(playerId: PlayerID): { hasSelection: boolean; itemName: string; index: number } {
        const selected = this.GetSelectedEquipment(playerId);
        if (selected) {
            return {
                hasSelection: true,
                itemName: selected.itemName,
                index: selected.index
            };
        }
        return {
            hasSelection: false,
            itemName: '',
            index: -1
        };
    }
}

// ==================== 初始化 ====================

if (IsServer()) {
    Timers.CreateTimer(0.5, () => {
        POE2CraftSystem.Init();
        return undefined;
    });
}