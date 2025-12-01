import React, { useState, useEffect, useRef } from 'react';

interface EquipmentStat {
    attribute: string;
    value: number;
}

interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
    color?: string;
}

interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
    rarity?: number;
    affixDetails?: AffixDetail[];
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

// 安全字符串函数
const safeText = (value: any, defaultValue: string = ''): string => {
    if (value === undefined || value === null) return defaultValue;
    return String(value);
};

// 安全数字函数
const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === undefined || value === null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
};

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ExternalRewardItem | null>>({});
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [compareEquipment, setCompareEquipment] = useState<ExternalRewardItem | null>(null);
    const [isEquipping, setIsEquipping] = useState(false);
    
    const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);

    const hoverScheduleHandle = useRef<ScheduleID | null>(null);
    const equipScheduleHandle = useRef<ScheduleID | null>(null);
    const mouseOverScheduleHandle = useRef<ScheduleID | null>(null);
    
    useEffect(() => {
        return () => {
            if (hoverScheduleHandle.current !== null) {
                $.CancelScheduled(hoverScheduleHandle.current);
            }
            if (equipScheduleHandle.current !== null) {
                $.CancelScheduled(equipScheduleHandle.current);
            }
            if (mouseOverScheduleHandle.current !== null) {
                $.CancelScheduled(mouseOverScheduleHandle.current);
            }
        };
    }, []);
    
    const extractAffixes = (affixDetails: any) => {
        const prefixes: any[] = [];
        const suffixes: any[] = [];
        
        if (! affixDetails) return { prefixes, suffixes };
        
        try {
            for (const key in affixDetails) {
                const affix = affixDetails[key];
                if (affix && typeof affix === 'object' && affix.name) {
                    const safeAffix = {
                        position: affix.position || 'prefix',
                        tier: safeNumber(affix.tier, 1),
                        name: safeText(affix.name, '未知'),
                        description: safeText(affix.description, ''),
                        color: affix.color || '#ffffff',
                    };
                    
                    if (safeAffix.position === 'prefix') {
                        prefixes.push(safeAffix);
                    } else {
                        suffixes.push(safeAffix);
                    }
                }
            }
        } catch (e) {
            $.Msg('[VaultUI] extractAffixes error');
        }
        
        return { prefixes, suffixes };
    };
    
    useEffect(() => {
        if (!visible) return;

        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

        const vaultListener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            try {
                const items: ExternalRewardItem[] = [];
                if (data.items) {
                    const itemsData = Array.isArray(data.items) ? data.items : Object.values(data.items);
                    for (let i = 0; i < itemsData.length; i++) {
                        const item = itemsData[i];
                        if (item) {
                            items.push({
                                name: safeText(item.name, '未知物品'),
                                type: safeText(item.type, '未知类型'),
                                icon: safeText(item.icon, ''),
                                stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {}),
                                rarity: item.rarity,
                                affixDetails: item.affixDetails,
                            });
                        }
                    }
                }
                setVaultItems(items);
            } catch (e) {
                $.Msg('[VaultUI] update_vault_ui error');
            }
        });

        const equipmentListener = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            try {
                const processedEquipment: Record<string, ExternalRewardItem | null> = {};
                
                if (data.equipment) {
                    for (const slot in data.equipment) {
                        const item = data.equipment[slot];
                        if (item) {
                            processedEquipment[slot] = {
                                name: safeText(item.name, '未知装备'),
                                type: safeText(item.type, '未知类型'),
                                icon: safeText(item.icon, ''),
                                stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {}),
                                rarity: item.rarity,
                                affixDetails: item.affixDetails,
                            };
                        } else {
                            processedEquipment[slot] = null;
                        }
                    }
                }
                
                setEquippedItems(processedEquipment);
            } catch (e) {
                $.Msg('[VaultUI] update_equipment_ui error');
            }
        });

        return () => {
            GameEvents.Unsubscribe(vaultListener);
            GameEvents.Unsubscribe(equipmentListener);
        };
    }, [visible]);

    const onEquipItem = (index: number) => {
        if (isEquipping) return;
        
        setIsEquipping(true);
        
        (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players.GetLocalPlayer(),
            index: index
        });

        Game.EmitSound('ui.crafting_gem_create');
        
        setSelectedItem(null);
        setSelectedPosition(null);
        setHoveredItem(null);
        setHoveredPosition(null);
        setCompareEquipment(null);
        
        if (equipScheduleHandle.current !== null) {
            $.CancelScheduled(equipScheduleHandle.current);
        }
        
        equipScheduleHandle.current = $.Schedule(1.5, () => {
            setIsEquipping(false);
            equipScheduleHandle.current = null;
        });
    };

    const findEquippedItemByType = (itemType: string): ExternalRewardItem | null => {
        if (!itemType) return null;
        for (const slot in equippedItems) {
            const equipped = equippedItems[slot];
            if (equipped && equipped.type === itemType) {
                return equipped;
            }
        }
        return null;
    };

    // ⭐⭐⭐ 核心修复：使用 Schedule 延迟状态更新
    const handleMouseOver = (index: number, item: ExternalRewardItem, row: number, col: number) => {
        // 取消之前的隐藏计划
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
            hoverScheduleHandle.current = null;
        }
        
        // 取消之前的 mouseover schedule
        if (mouseOverScheduleHandle.current !== null) {
            $.CancelScheduled(mouseOverScheduleHandle.current);
            mouseOverScheduleHandle.current = null;
        }
        
        // 防止重复触发
        if (hoveredItem === index) return;
        
        // 安全检查
        if (!item) return;
        
        // ⭐ 延迟执行状态更新，避免在事件回调中直接触发可能导致崩溃的渲染
        mouseOverScheduleHandle.current = $.Schedule(0.01, () => {
            mouseOverScheduleHandle.current = null;
            
            setHoveredItem(index);
            setHoveredPosition({ row: safeNumber(row, 0), col: safeNumber(col, 0) });
            
            const itemType = safeText(item.type, '');
            if (itemType) {
                const equipped = findEquippedItemByType(itemType);
                setCompareEquipment(equipped);
            } else {
                setCompareEquipment(null);
            }
        });
    };

    const handleMouseOut = () => {
        // 取消 mouseover schedule
        if (mouseOverScheduleHandle.current !== null) {
            $.CancelScheduled(mouseOverScheduleHandle.current);
            mouseOverScheduleHandle.current = null;
        }
        
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
        }
        
        hoverScheduleHandle.current = $.Schedule(0.3, () => {
            setHoveredItem(null);
            setHoveredPosition(null);
            setCompareEquipment(null);
            hoverScheduleHandle.current = null;
        });
    };

    const keepHoverPanel = () => {
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
            hoverScheduleHandle.current = null;
        }
    };

    const getQualityColor = (item: ExternalRewardItem | null): string => {
        if (!item) return '#9d9d9d';
        
        if (item.rarity !== undefined && item.rarity !== null) {
            const rarityColors: Record<number, string> = {
                0: '#c8c8c8',
                1: '#8888ff',
                2: '#ffff77',
                3: '#ff8800',
            };
            return rarityColors[item.rarity] || '#9d9d9d';
        }
        
        let totalValue = 0;
        try {
            const statsData = item.stats;
            if (statsData && Array.isArray(statsData)) {
                for (let i = 0; i < statsData.length; i++) {
                    const stat = statsData[i];
                    if (stat && typeof stat.value === 'number') {
                        totalValue += stat.value;
                    }
                }
            }
        } catch (e) {}
        
        if (totalValue >= 50) return '#ff8000';
        if (totalValue >= 35) return '#a335ee';
        if (totalValue >= 20) return '#0070dd';
        if (totalValue >= 10) return '#1eff00';
        return '#9d9d9d';
    };

    if (!visible) return null;

    const COLUMNS = 8;
    const ROWS = 5;
    const TOTAL_SLOTS = COLUMNS * ROWS;
    const emptySlots = Math.max(0, TOTAL_SLOTS - vaultItems.length);
    
    const SLOT_SIZE = 80;
    const SLOT_MARGIN = 2;
    const GRID_PADDING = 15;

    // ⭐⭐⭐ 安全的位置计算，确保永远返回有效值
    const getPopupPosition = (position: { row: number; col: number } | null, popupWidth: number) => {
        const defaultPos = { marginLeft: '0px', marginTop: '0px' };
        
        if (! position) return defaultPos;
        
        const row = safeNumber(position.row, 0);
        const col = safeNumber(position.col, 0);
        
        const slotX = GRID_PADDING + col * (SLOT_SIZE + SLOT_MARGIN * 2);
        const slotY = 60 + GRID_PADDING + row * (SLOT_SIZE + SLOT_MARGIN * 2);
        
        let popupX = slotX + SLOT_SIZE + 10;
        let popupY = slotY - 30;
        
        if (popupX + popupWidth > 740) {
            popupX = slotX - popupWidth - 10;
        }
        
        if (popupY < 10) {
            popupY = 10;
        }
        
        return {
            marginLeft: safeNumber(popupX, 0) + 'px',
            marginTop: safeNumber(popupY, 0) + 'px',
        };
    };

    const hoveredItemData = (hoveredItem !== null && hoveredItem >= 0 && hoveredItem < vaultItems.length)
        ? vaultItems[hoveredItem] 
        : null;

    // ⭐ 渲染词缀的辅助函数
    const renderAffixes = (prefixes: any[], suffixes: any[], keyPrefix: string) => {
        return (
            <>
                {prefixes.length > 0 && (
                    <>
                        <Label 
                            text={`━━ 前缀 (${prefixes.length}) ━━`}
                            style={{ fontSize: '11px', color: '#8888ff', marginBottom: '3px', fontWeight: 'bold' }}
                        />
                        {prefixes.map((affix: any, idx: number) => (
                            <Label 
                                key={`${keyPrefix}-prefix-${idx}`}
                                text={`[T${safeNumber(affix.tier, 1)}] ${safeText(affix.name, '')} ${safeText(affix.description, '')}`}
                                style={{ fontSize: '11px', color: '#8888ff', marginBottom: '2px' }}
                            />
                        ))}
                    </>
                )}
                {suffixes.length > 0 && (
                    <>
                        <Label 
                            text={`━━ 后缀 (${suffixes.length}) ━━`}
                            style={{ fontSize: '11px', color: '#ffff77', marginTop: '5px', marginBottom: '3px', fontWeight: 'bold' }}
                        />
                        {suffixes.map((affix: any, idx: number) => (
                            <Label 
                                key={`${keyPrefix}-suffix-${idx}`}
                                text={`[T${safeNumber(affix.tier, 1)}] ${safeText(affix.name, '')} ${safeText(affix.description, '')}`}
                                style={{ fontSize: '11px', color: '#ffff77', marginBottom: '2px' }}
                            />
                        ))}
                    </>
                )}
            </>
        );
    };

    return (
        <Panel
            style={{
                width: '740px',
                height: '520px',
                horizontalAlign: 'center',
                verticalAlign: 'center',
                backgroundColor: '#1c1410',
                border: '4px solid #8b7355',
                flowChildren: 'down',
            }}
        >
            {/* 标题栏 */}
            <Panel style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#2a1f1a',
                borderBottom: '3px solid #8b7355',
                flowChildren: 'right',
                padding: '10px 20px',
            }}>
                <Label 
                    text="⚔️ 装备仓库" 
                    style={{ fontSize: '32px', color: '#ffd700', fontWeight: 'bold' }}
                />
                <Label 
                    text={`${vaultItems.length} / ${TOTAL_SLOTS}`}
                    style={{ fontSize: '24px', color: '#cccccc', marginLeft: '20px', marginTop: '4px' }}
                />
                <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                <Button 
                    onactivate={onClose}
                    style={{ width: '40px', height: '40px', backgroundColor: '#8b0000', border: '2px solid #ff0000' }}
                    onmouseover={(panel) => { panel.style.backgroundColor = '#b22222'; }}
                    onmouseout={(panel) => { panel.style.backgroundColor = '#8b0000'; }}
                >
                    <Label text="✕" style={{ fontSize: '28px', color: 'white', textAlign: 'center' }} />
                </Button>
            </Panel>

            {/* 网格容器 */}
            <Panel style={{
                width: '100%',
                height: '460px',
                padding: '15px',
                flowChildren: 'right-wrap',
            }}>
                {vaultItems.map((item, index) => {
                    if (!item) return null;
                    
                    const qualityColor = getQualityColor(item);
                    const isHovered = hoveredItem === index;
                    
                    const row = Math.floor(index / COLUMNS);
                    const col = index % COLUMNS;
                    
                    return (
                        <Panel 
                            key={`item-${index}`}
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '2px',
                                backgroundColor: isHovered ? '#1a1a1a' : '#0a0a0a',
                                border: isHovered ? `4px solid ${qualityColor}` : `3px solid ${qualityColor}`,
                                backgroundImage: `url("${safeText(item.icon, '')}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                            onactivate={() => {
                                Game.EmitSound('ui.button_click');
                                setSelectedItem(index);
                                setSelectedPosition({ row, col });
                            }}
                            onmouseover={() => {
                                handleMouseOver(index, item, row, col);
                                Game.EmitSound('ui.button_over');
                            }}
                            onmouseout={handleMouseOut}
                        >
                            {selectedItem === index && (
                                <Panel style={{ width: '100%', height: '100%', backgroundColor: '#ffffff40' }} />
                            )}
                        </Panel>
                    );
                })}

                {Array.from({ length: emptySlots }, (_, index) => (
                    <Panel 
                        key={`empty-${index}`}
                        style={{
                            width: '80px',
                            height: '80px',
                            margin: '2px',
                            backgroundColor: '#0a0a0a',
                            border: '2px solid #3a3a3a',
                        }}
                    />
                ))}
            </Panel>

            {/* 悬停对比面板 */}
            {hoveredItem !== null && hoveredItemData && hoveredPosition && selectedItem === null && (() => {
                const hoverPos = getPopupPosition(hoveredPosition, 350);
                const { prefixes, suffixes } = extractAffixes(hoveredItemData.affixDetails);
                
                return (
                    <Panel 
                        hittest={false}
                        style={{ width: '740px', height: '520px', marginTop: '-520px' }}
                    >
                        <Panel 
                            hittest={false}
                            style={{
                                width: '350px',
                                maxHeight: '480px',
                                backgroundColor: '#1a1a1aee',
                                border: '3px solid #ffd700',
                                padding: '15px',
                                marginLeft: hoverPos.marginLeft,
                                marginTop: hoverPos.marginTop,
                                flowChildren: 'down',
                                overflow: 'squish scroll',
                            }}
                            onmouseover={keepHoverPanel}
                            onmouseout={handleMouseOut}
                        >
                            <Label 
                                text="📊 装备对比"
                                style={{ fontSize: '20px', color: '#ffd700', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}
                            />

                            {/* 待装备物品 */}
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${getQualityColor(hoveredItemData)}`,
                                padding: '10px',
                                marginBottom: '10px',
                                flowChildren: 'down',
                            }}>
                                <Label text="【待装备】" style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }} />
                                <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                    <Panel style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundImage: `url("${safeText(hoveredItemData.icon, '')}")`,
                                        backgroundSize: 'cover',
                                        marginRight: '10px',
                                    }} />
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label 
                                            text={safeText(hoveredItemData.name, '未知物品')}
                                            style={{ fontSize: '16px', color: getQualityColor(hoveredItemData), fontWeight: 'bold', marginBottom: '3px' }}
                                        />
                                        <Label 
                                            text={safeText(hoveredItemData.type, '未知类型')}
                                            style={{ fontSize: '12px', color: '#ffd700', marginBottom: '8px' }}
                                        />
                                        {renderAffixes(prefixes, suffixes, 'hover')}
                                    </Panel>
                                </Panel>
                            </Panel>

                            <Panel style={{ width: '100%', height: '2px', backgroundColor: '#555555', marginBottom: '10px' }} />

                            {/* 当前已装备 */}
                            {compareEquipment ?  (() => {
                                const { prefixes: currPrefixes, suffixes: currSuffixes } = extractAffixes(compareEquipment.affixDetails);
                                
                                return (
                                    <Panel style={{
                                        width: '100%',
                                        backgroundColor: '#0a0a0a',
                                        border: `2px solid ${getQualityColor(compareEquipment)}`,
                                        padding: '10px',
                                        flowChildren: 'down',
                                    }}>
                                        <Label text="【当前装备】" style={{ fontSize: '12px', color: '#888888', marginBottom: '5px' }} />
                                        <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                            <Panel style={{
                                                width: '50px',
                                                height: '50px',
                                                backgroundImage: `url("${safeText(compareEquipment.icon, '')}")`,
                                                backgroundSize: 'cover',
                                                marginRight: '10px',
                                            }} />
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label 
                                                    text={safeText(compareEquipment.name, '未知装备')}
                                                    style={{ fontSize: '16px', color: getQualityColor(compareEquipment), fontWeight: 'bold', marginBottom: '3px' }}
                                                />
                                                <Label 
                                                    text={safeText(compareEquipment.type, '')}
                                                    style={{ fontSize: '12px', color: '#ffd700', marginBottom: '8px' }}
                                                />
                                                {renderAffixes(currPrefixes, currSuffixes, 'curr')}
                                            </Panel>
                                        </Panel>
                                    </Panel>
                                );
                            })() : (
                                <Panel style={{ width: '100%', backgroundColor: '#2a2a2a', padding: '15px', flowChildren: 'down' }}>
                                    <Label 
                                        text="✨ 当前未装备同类型装备"
                                        style={{ fontSize: '14px', color: '#888888', textAlign: 'center' }}
                                    />
                                </Panel>
                            )}
                        </Panel>
                    </Panel>
                );
            })()}

            {/* 装备确认面板 */}
            {selectedItem !== null && selectedItem >= 0 && selectedItem < vaultItems.length && vaultItems[selectedItem] && selectedPosition && (() => {
                const item = vaultItems[selectedItem];
                if (! item) return null;
                
                const qualityColor = getQualityColor(item);
                const popupPos = getPopupPosition(selectedPosition, 320);
                const { prefixes, suffixes } = extractAffixes(item.affixDetails);
                
                return (
                    <Panel 
                        style={{ width: '740px', height: '520px', backgroundColor: '#00000055', marginTop: '-520px' }}
                        onactivate={() => setSelectedItem(null)}
                    >
                        <Panel 
                            style={{
                                width: '320px',
                                backgroundColor: '#1a1a1acc',
                                border: '3px solid #ffd700',
                                padding: '15px',
                                marginLeft: popupPos.marginLeft,
                                marginTop: popupPos.marginTop,
                                flowChildren: 'down',
                            }}
                            onactivate={() => {}}
                        >
                            <Label 
                                text="装备这件物品？"
                                style={{ fontSize: '20px', color: '#ffd700', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}
                            />
                            
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${qualityColor}`,
                                padding: '10px',
                                marginBottom: '10px',
                                flowChildren: 'right',
                            }}>
                                <Image 
                                    src={safeText(item.icon, '')}
                                    style={{ width: '50px', height: '50px', marginRight: '10px' }}
                                />
                                <Panel style={{ flowChildren: 'down' }}>
                                    <Label 
                                        text={safeText(item.name, '未知物品')}
                                        style={{ fontSize: '16px', color: qualityColor, fontWeight: 'bold', marginBottom: '3px' }}
                                    />
                                    <Label 
                                        text={safeText(item.type, '未知类型')}
                                        style={{ fontSize: '12px', color: '#ffd700', marginBottom: '8px' }}
                                    />
                                    {renderAffixes(prefixes, suffixes, 'confirm')}
                                </Panel>
                            </Panel>
                            
                            <Panel style={{ width: '100%', flowChildren: 'right' }}>
                                <Button 
                                    onactivate={() => onEquipItem(selectedItem)}
                                    style={{
                                        width: '140px',
                                        height: '40px',
                                        backgroundColor: isEquipping ? '#888888' : '#4caf50',
                                        marginRight: '10px',
                                    }}
                                    onmouseover={(panel) => { if (! isEquipping) panel.style.backgroundColor = '#66bb6a'; }}
                                    onmouseout={(panel) => { if (! isEquipping) panel.style.backgroundColor = '#4caf50'; }}
                                >
                                    <Label 
                                        text={isEquipping ? "装备中..." : "✔ 确认"}
                                        style={{ fontSize: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} 
                                    />
                                </Button>
                                
                                <Button 
                                    onactivate={() => setSelectedItem(null)}
                                    style={{ width: '140px', height: '40px', backgroundColor: '#888888' }}
                                    onmouseover={(panel) => { panel.style.backgroundColor = '#aaaaaa'; }}
                                    onmouseout={(panel) => { panel.style.backgroundColor = '#888888'; }}
                                >
                                    <Label text="✕ 取消" style={{ fontSize: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                                </Button>
                            </Panel>
                        </Panel>
                    </Panel>
                );
            })()}
        </Panel>
    );
};