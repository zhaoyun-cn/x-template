import React, { useState, useEffect, useRef } from 'react';
import { useXNetTableKey } from '../hooks/useXNetTable';

// ========== 常量 ==========
const QCOLOR: Record<number, string> = { 0: '#9d9d9d', 1: '#4169E1', 2: '#ffd700', 3: '#ff8c00' };
const QNAME: Record<number, string> = { 0: '普通', 1: '魔法', 2: '稀有', 3: '传说' };

const SLOT_NAMES: Record<string, string> = {
    weapon: '武器',
    armor: '护甲',
    helmet: '头盔',
    boots: '鞋子',
    gloves: '手套',
    belt: '腰带',
    necklace: '项链',
    ring: '戒指',
    trinket: '饰品',
};

// ⭐ 默认空属性
const DEFAULT_STATS: EquipmentTotalStats = {
    strength: 0,
    agility: 0,
    intelligence: 0,
    armor: 0,
    health: 0,
    mana: 0,
    attack_damage: 0,
    attack_speed: 0,
    move_speed: 0,
    magic_resistance: 0,
    crit_chance: 0,
    crit_multiplier: 0,
    cooldown_reduction: 0,
    fire_resistance: 0,
    cold_resistance: 0,
    lightning_resistance: 0,
    evasion: 0,
};

// ⭐ 安全转换为数组
function toArray(data: any): any[] {
    if (! data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
        return Object.values(data);
    }
    return [];
}

// ⭐ 词缀信息接口
interface AffixInfo {
    position?: string;
    tier?: number;
    name?: string;
    description?: string;
    value?: number;
    minValue?: number;
    maxValue?: number;
    color?: string;
}

// ⭐ 属性信息接口
interface StatInfo {
    attribute?: string;
    value?: number;
}

// ⭐ 装备物品接口
interface VaultItemData {
    id?: string;
    name?: string;
    type?: string;
    icon?: string;
    rarity?: number;
    stats?: StatInfo[];
    affixDetails?: AffixInfo[];
}

// ⭐ 总属性接口
interface EquipmentTotalStats {
    strength: number;
    agility: number;
    intelligence: number;
    armor: number;
    health: number;
    mana: number;
    attack_damage: number;
    attack_speed: number;
    move_speed: number;
    magic_resistance: number;
    crit_chance: number;
    crit_multiplier: number;
    cooldown_reduction: number;
    fire_resistance: number;
    cold_resistance: number;
    lightning_resistance: number;
    evasion: number;
}

// ========== 主组件 ==========
export const VaultUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    // ⭐ 使用 XNetTable Hook 获取数据
    const vaultData = useXNetTableKey('equipment_data', 'vault', { items: [], maxSize: 40 });
    const equippedData = useXNetTableKey('equipment_data', 'equipped', {});
    const statsData = useXNetTableKey('equipment_data', 'stats', DEFAULT_STATS);
    
    const [selItem, setSelItem] = useState<VaultItemData | null>(null);
    const [selIndex, setSelIndex] = useState<number>(-1);
    const [hoverItem, setHoverItem] = useState<VaultItemData | null>(null);
    const [equipping, setEquipping] = useState(false);
    const [craftSelected, setCraftSelected] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);  // ⭐ 用于强制刷新
    
    const hoverTimeoutRef = useRef<number | null>(null);

    // 安全获取仓库物品
    const items: VaultItemData[] = toArray(vaultData?.items);
    const maxSize = vaultData?.maxSize || 40;

    // ⭐ 监听装备变化事件
    useEffect(() => {
        const listenerId = GameEvents.Subscribe('poe2_equipment_changed' as never, (data: any) => {
            $.Msg('[VaultUI] 收到装备变化事件:', JSON.stringify(data));
            
            // ⭐ 强制刷新组件
            setRefreshKey(prev => prev + 1);
            
            // 如果变化的是当前选中的装备，更新选中信息
            if (data && data.vaultIndex !== undefined && data.vaultIndex === selIndex) {
                // 延迟一点重新获取数据
                $.Schedule(0.1, () => {
                    const newItems = toArray(vaultData?.items);
                    if (newItems[selIndex]) {
                        setSelItem(newItems[selIndex]);
                    }
                });
            }
        });

        // ⭐ 监听选择更新事件
        const selectionListenerId = GameEvents.Subscribe('poe2_selection_update' as never, (data: any) => {
            $.Msg('[VaultUI] 收到选择更新事件:', JSON.stringify(data));
            if (data) {
                setCraftSelected(data.hasSelection || false);
                if (data.hasSelection && data.index >= 0) {
                    // 更新选中的装备名称
                    const newItems = toArray(vaultData?.items);
                    if (newItems[data.index]) {
                        setSelItem(newItems[data.index]);
                        setSelIndex(data.index);
                    }
                }
            }
        });

        // ⭐ 监听打造错误事件
        const errorListenerId = GameEvents.Subscribe('poe2_craft_error' as never, (data: any) => {
            $.Msg('[VaultUI] 打造错误:', data?.message);
        });

        return () => {
            GameEvents.Unsubscribe(listenerId);
            GameEvents.Unsubscribe(selectionListenerId);
            GameEvents.Unsubscribe(errorListenerId);
        };
    }, [selIndex, vaultData]);

    useEffect(() => {
        if (! visible) {
            setSelItem(null);
            setSelIndex(-1);
            setHoverItem(null);
            setCraftSelected(false);
        }
    }, [visible]);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    if (!visible) return null;

    // ========== 悬停处理 ==========
    const handleItemMouseOver = (item: VaultItemData) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setHoverItem(item);
    };

    const handleItemMouseOut = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverItem(null);
        }, 200) as any;
    };

    const keepHoverPanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    // ⭐ 选择装备用于打造
    const handleSelectForCraft = (item: VaultItemData, index: number) => {
        const isSel = selItem?.id === item.id;
        
        if (isSel) {
            // 取消选择
            setSelItem(null);
            setSelIndex(-1);
            setCraftSelected(false);
            
            // 通知服务器取消选择
            GameEvents.SendCustomGameEventToServer('poe2_cancel_selection' as never, {
                PlayerID: Players.GetLocalPlayer()
            } as never);
        } else {
            // 选择装备
            setSelItem(item);
            setSelIndex(index);
            
            // ⭐ 发送选择事件到服务器
            GameEvents.SendCustomGameEventToServer('poe2_select_equipment' as never, {
                PlayerID: Players.GetLocalPlayer(),
                source: 'vault',
                index: index
            } as never);
            
            $.Msg('[VaultUI] 选择装备用于打造: index=' + index + ', name=' + item.name);
        }
    };

    // ========== 装备操作 ==========
    const handleEquip = () => {
        if (equipping || !selItem || selIndex < 0) return;
        setEquipping(true);
        
        GameEvents.SendCustomGameEventToServer('equip_item_from_vault' as never, {
            PlayerID: Players.GetLocalPlayer(),
            index: selIndex
        } as never);
        
        Game.EmitSound('ui.crafting_gem_create');
        setSelItem(null);
        setSelIndex(-1);
        setCraftSelected(false);
        setTimeout(() => setEquipping(false), 1000);
    };

    // ========== 获取已装备的同类型物品 ==========
    const getEquippedByType = (type: string): VaultItemData | null => {
        if (!equippedData) return null;
        for (const slot in equippedData) {
            const item = (equippedData as any)[slot] as VaultItemData | null;
            if (item && item.type === type) {
                return item;
            }
        }
        return null;
    };

    // ========== 渲染物品详情面板 ==========
    const renderItemPanel = (item: VaultItemData | null, title: string, isEquipped: boolean) => {
        if (!item) {
            return (
                <Panel style={{ width: '240px', backgroundColor: '#0c0c08', border: '1px solid #333', padding: '10px', flowChildren: 'down' }}>
                    <Label text={title} style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }} />
                    <Label text="无" style={{ fontSize: '11px', color: '#444', horizontalAlign: 'center', marginTop: '30px' }} />
                </Panel>
            );
        }

        const color = QCOLOR[item.rarity || 0] || '#9d9d9d';
        const qualityName = QNAME[item.rarity || 0] || '普通';

        const affixList: AffixInfo[] = toArray(item.affixDetails);
        const prefixes = affixList.filter(a => a.position === 'prefix');
        const suffixes = affixList.filter(a => a.position === 'suffix');

        return (
            <Panel 
                hittest={true}
                style={{ width: '260px', backgroundColor: '#1a1a1aee', border: '2px solid ' + color, padding: '12px', flowChildren: 'down' }}
                onmouseover={keepHoverPanel}
                onmouseout={handleItemMouseOut}
            >
                <Label text={title} style={{ fontSize: '11px', color: isEquipped ? '#888' : '#ffd700', marginBottom: '8px' }} />
                <Panel style={{ width: '100%', height: '1px', backgroundColor: '#444', marginBottom: '10px' }} />
                
                {/* 名称和图标 */}
                <Panel style={{ flowChildren: 'right', marginBottom: '10px' }}>
                    <Panel style={{ 
                        width: '44px', 
                        height: '44px', 
                        border: '1px solid ' + color, 
                        marginRight: '10px', 
                        backgroundImage: item.icon ? 'url("' + item.icon + '")' : 'none', 
                        backgroundSize: 'cover' 
                    }} />
                    <Panel style={{ flowChildren: 'down' }}>
                        <Label text={item.name || '未知'} style={{ fontSize: '14px', color: color, fontWeight: 'bold' }} />
                        <Label text={qualityName + ' ' + (item.type || '')} style={{ fontSize: '10px', color: '#888' }} />
                    </Panel>
                </Panel>

                {/* 前缀词缀 */}
                {prefixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '8px' }}>
                        <Label text={'前缀(' + prefixes.length + '/3)'} style={{ fontSize: '10px', color: '#9999ff', marginBottom: '3px' }} />
                        {prefixes.map((affix, i) => (
                            <Panel key={'p' + i} style={{ flowChildren: 'down', marginLeft: '5px', marginBottom: '4px' }}>
                                <Label 
                                    text={'[T' + (affix.tier || 1) + '] ' + (affix.name || '') + ' ' + (affix.description || '')}
                                    style={{ fontSize: '11px', color: '#7799ff' }} 
                                />
                                {affix.minValue !== undefined && affix.maxValue !== undefined && affix.minValue > 0 && (
                                    <Label 
                                        text={'    范围: ' + affix.minValue + ' - ' + affix.maxValue}
                                        style={{ fontSize: '9px', color: '#555' }} 
                                    />
                                )}
                            </Panel>
                        ))}
                    </Panel>
                )}
                
                {/* 后缀词缀 */}
                {suffixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '8px' }}>
                        <Label text={'后缀(' + suffixes.length + '/3)'} style={{ fontSize: '10px', color: '#ffdd77', marginBottom: '3px' }} />
                        {suffixes.map((affix, i) => (
                            <Panel key={'x' + i} style={{ flowChildren: 'down', marginLeft: '5px', marginBottom: '4px' }}>
                                <Label 
                                    text={'[T' + (affix.tier || 1) + '] ' + (affix.name || '') + ' ' + (affix.description || '')}
                                    style={{ fontSize: '11px', color: '#ddaa00' }} 
                                />
                                {affix.minValue !== undefined && affix.maxValue !== undefined && affix.minValue > 0 && (
                                    <Label 
                                        text={'    范围: ' + affix.minValue + ' - ' + affix.maxValue}
                                        style={{ fontSize: '9px', color: '#555' }} 
                                    />
                                )}
                            </Panel>
                        ))}
                    </Panel>
                )}
            </Panel>
        );
    };

    // ========== 当前显示的物品 ==========
    const displayItem = hoverItem || selItem;
    const equippedSameType = displayItem ? getEquippedByType(displayItem.type || '') : null;

    return (
        <Panel key={refreshKey} style={{ width: '1100px', height: '680px', backgroundColor: '#111', border: '3px solid #8b6914', flowChildren: 'down' }}>

            {/* 标题栏 */}
            <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                <Label text="装备仓库" style={{ fontSize: '18px', color: '#ffd700', marginLeft: '20px', marginTop: '13px' }} />
                <Label text={'仓库: ' + items.length + '/' + maxSize} style={{ fontSize: '12px', color: '#888', marginLeft: '20px', marginTop: '17px' }} />
                
                {/* 显示总属性 */}
                <Label 
                    text={'力量+' + (statsData?.strength || 0) + ' 敏捷+' + (statsData?.agility || 0) + ' 智力+' + (statsData?.intelligence || 0) + ' 生命+' + (statsData?.health || 0)} 
                    style={{ fontSize: '11px', color: '#0f0', marginLeft: '30px', marginTop: '18px' }} 
                />
                
                <Panel style={{ width: '100px' }} />
                
                {/* 显示打造选中状态 */}
                <Label 
                    text={craftSelected ? '🎯 已选中打造目标' : (selItem ? '已选择: ' + selItem.name : '点击选择装备')} 
                    style={{ 
                        fontSize: '11px', 
                        color: craftSelected ? '#ffd700' : (selItem ? '#0f0' : '#666'), 
                        marginTop: '18px' 
                    }} 
                />
            </Panel>

            {/* 内容区域 */}
            <Panel style={{ width: '100%', height: '570px', flowChildren: 'right' }}>
                
                {/* 左侧：仓库物品列表 */}
                <Panel style={{ width: '550px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                    <Label text="仓库物品（点击选择用于打造）" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '10px' }} />
                    <Panel style={{ width: '100%', height: '520px', flowChildren: 'right-wrap', overflow: 'scroll' }}>
                        {items.map((item, index) => {
                            if (! item) return null;
                            const color = QCOLOR[item.rarity || 0] || '#9d9d9d';
                            const isSel = selItem?.id === item.id;
                            const isCraftTarget = craftSelected && isSel;
                            return (
                                <Panel
                                    key={item.id || ('item_' + index)}
                                    hittest={true}
                                    onactivate={() => handleSelectForCraft(item, index)}
                                    onmouseover={() => handleItemMouseOver(item)}
                                    onmouseout={handleItemMouseOut}
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        margin: '4px',
                                        backgroundColor: isCraftTarget ? '#3a3a1a' : (isSel ? '#2a3a2a' : '#151515'),
                                        border: (isSel ?  '3px' : '2px') + ' solid ' + (isCraftTarget ?  '#ffd700' : color),
                                        backgroundImage: item.icon ? 'url("' + item.icon + '")' : 'none',
                                        backgroundSize: 'cover',
                                    }}
                                >
                                    {/* 打造目标标记 */}
                                    {isCraftTarget && (
                                        <Label 
                                            text="🎯" 
                                            style={{ 
                                                fontSize: '16px', 
                                                color: '#ffd700', 
                                                horizontalAlign: 'right', 
                                                verticalAlign: 'top',
                                                marginTop: '-2px',
                                                marginRight: '-2px'
                                            }} 
                                        />
                                    )}
                                </Panel>
                            );
                        })}
                        {/* 空格子 */}
                        {Array.from({ length: Math.max(0, maxSize - items.length) }).map((_, i) => (
                            <Panel key={'e' + i} style={{ width: '64px', height: '64px', margin: '4px', backgroundColor: '#0c0c0c', border: '1px solid #333' }} />
                        ))}
                    </Panel>
                </Panel>

                {/* 右侧：对比面板 */}
                <Panel style={{ width: '540px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                    <Label text="装备对比" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '15px' }} />
                    
                    {displayItem ?  (
                        <Panel style={{ flowChildren: 'right' }}>
                            {/* 悬停/选中的物品 */}
                            {renderItemPanel(displayItem, hoverItem ?  '预览' : (craftSelected ? '🎯 打造目标' : '已选择'), false)}
                            
                            {/* VS */}
                            <Panel style={{ width: '20px', flowChildren: 'down', marginTop: '80px' }}>
                                <Label text="VS" style={{ fontSize: '14px', color: '#f80', horizontalAlign: 'center' }} />
                            </Panel>
                            
                            {/* 已装备的同类型 */}
                            {renderItemPanel(equippedSameType, '已装备 ' + (SLOT_NAMES[displayItem.type || ''] || displayItem.type), true)}
                        </Panel>
                    ) : (
                        <Label text="← 悬停或选择物品查看详情" style={{ fontSize: '12px', color: '#555', marginTop: '150px', horizontalAlign: 'center' }} />
                    )}
                    
                    {/* 装备按钮 */}
                    {selItem && ! hoverItem && (
                        <Panel style={{ flowChildren: 'right', marginTop: '20px' }}>
                            <Panel 
                                hittest={true} 
                                onactivate={handleEquip} 
                                style={{ 
                                    width: '100px', 
                                    height: '36px', 
                                    backgroundColor: equipping ? '#333' : '#1a4a1a', 
                                    border: '2px solid #2a8a2a', 
                                    marginRight: '10px' 
                                }}
                            >
                                <Label text={equipping ? '装备中...' : '装备'} style={{ fontSize: '14px', color: equipping ? '#888' : '#0f0', horizontalAlign: 'center', marginTop: '8px' }} />
                            </Panel>
                            <Panel 
                                hittest={true} 
                                onactivate={() => { 
                                    setSelItem(null); 
                                    setSelIndex(-1); 
                                    setCraftSelected(false);
                                    GameEvents.SendCustomGameEventToServer('poe2_cancel_selection' as never, {
                                        PlayerID: Players.GetLocalPlayer()
                                    } as never);
                                }} 
                                style={{ width: '80px', height: '36px', backgroundColor: '#1a1a1a', border: '2px solid #666' }}
                            >
                                <Label text="取消" style={{ fontSize: '14px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                            </Panel>
                        </Panel>
                    )}
                    
                    {/* 打造提示 */}
                    {craftSelected && (
                        <Panel style={{ marginTop: '15px', padding: '10px', backgroundColor: '#1a1a0a', border: '1px solid #ffd700', flowChildren: 'down' }}>
                            <Label text="💡 打造提示" style={{ fontSize: '12px', color: '#ffd700', marginBottom: '5px' }} />
                            <Label text="已选中此装备作为打造目标" style={{ fontSize: '11px', color: '#ccc' }} />
                            <Label text="现在可以在材料背包中使用通货" style={{ fontSize: '11px', color: '#ccc' }} />
                            <Label text="• 混沌石：随机重置1条词缀" style={{ fontSize: '10px', color: '#aa00ff', marginTop: '5px' }} />
                            <Label text="• 崇高石：添加1条新词缀" style={{ fontSize: '10px', color: '#ffd700' }} />
                            <Label text="• 神圣石：重置所有词缀数值" style={{ fontSize: '10px', color: '#00ffff' }} />
                        </Panel>
                    )}
                </Panel>
            </Panel>

            {/* 底部按钮 */}
            <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                    <Label text="关闭(B)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                </Panel>
            </Panel>
        </Panel>
    );
};