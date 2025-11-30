import React, { useState, useEffect, useRef } from 'react';

// 装备属性接口
interface EquipmentStat {
    attribute: string;
    value: number;
}

// ⭐ 新增：词缀详情接口
interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
    color?: string;
}

// 装备物品接口
interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
    rarity?: number;
    affixDetails?: AffixDetail[];  // ⭐ 新增
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ExternalRewardItem | null>>({});
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [compareEquipment, setCompareEquipment] = useState<ExternalRewardItem | null>(null);
    const [isEquipping, setIsEquipping] = useState(false);
    
    // ⭐ 记录点击位置（格子的行和列）
    const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
    // ⭐ 记录悬停位置
    const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);

    const hoverTimeoutRef = useRef<number | null>(null);
    
    // ==================== 数据加载逻辑 ====================
    useEffect(() => {
        if (! visible) return;

        $. Msg('[VaultUI] 界面打开，请求仓库数据');
        
        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

        const vaultListener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            $. Msg('[VaultUI] 收到仓库数据:', data);
            
            const items: ExternalRewardItem[] = [];
            if (data.items) {
                if (Array.isArray(data.items)) {
                    items.push(...data.items. map((item: any) => {
                        // ⭐ 调试：检查 affixDetails
                        if (item.affixDetails) {
                            $. Msg(`[VaultUI] 装备 ${item.name} 有 affixDetails:`, item.affixDetails);
                        } else {
                            $.Msg(`[VaultUI] 装备 ${item.name} 没有 affixDetails`);
                        }
                        
                        return {
                            ... item,
                            stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {})
                        };
                    }));
                } else if (typeof data.items === 'object') {
                    for (const key in data.items) {
                        const item = data.items[key];
                        const statsArray = Array.isArray(item. stats) 
                            ? item.stats 
                            : Object.values(item.stats || {});
                        
                        // ⭐ 调试：检查 affixDetails
                        if (item.affixDetails) {
                            $. Msg(`[VaultUI] 装备 ${item.name} 有 affixDetails:`, item.affixDetails);
                        } else {
                            $. Msg(`[VaultUI] 装备 ${item.name} 没有 affixDetails`);
                        }
                        
                        items.push({
                            ...item,
                            stats: statsArray
                        });
                    }
                }
            }
            
            setVaultItems(items);
            $. Msg(`[VaultUI] 显示 ${items.length} 件装备`);
        });

        const equipmentListener = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            $. Msg('[VaultUI] 收到装备数据:', data);
            
            const processedEquipment: Record<string, ExternalRewardItem | null> = {};
            
            for (const slot in data.equipment) {
                const item = data.equipment[slot];
                
                if (item) {
                    const statsArray = Array.isArray(item.stats) 
                        ?  item.stats 
                        : Object.values(item.stats || {});
                    
                    processedEquipment[slot] = {
                        ...item,
                        stats: statsArray
                    };
                } else {
                    processedEquipment[slot] = null;
                }
            }
            
            setEquippedItems(processedEquipment);
        });

        return () => {
            GameEvents.Unsubscribe(vaultListener);
            GameEvents.Unsubscribe(equipmentListener);
        };
    }, [visible]);

    // ==================== 装备物品逻辑 ====================
    const onEquipItem = (index: number) => {
        if (isEquipping) {
            $. Msg('[VaultUI] ⚠️ 正在装备中，请稍候...');
            return;
        }
        
        $. Msg(`[VaultUI] 装备索引 ${index} 的装备`);
        
        setIsEquipping(true);
        
        (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players.GetLocalPlayer(),
            index: index
        });

        Game.EmitSound('ui. crafting_gem_create');
        
        setSelectedItem(null);
        setSelectedPosition(null);
        setHoveredItem(null);
        setHoveredPosition(null);
        
        setTimeout(() => {
            setIsEquipping(false);
            $.Msg('[VaultUI] 解除装备锁定');
        }, 1500);
    };

    const findEquippedItemByType = (itemType: string): ExternalRewardItem | null => {
        for (const slot in equippedItems) {
            const equipped = equippedItems[slot];
            if (equipped && equipped. type === itemType) {
                return equipped;
            }
        }
        return null;
    };

    const handleMouseOver = (index: number, item: ExternalRewardItem, row: number, col: number) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredItem(index);
        setHoveredPosition({ row, col });
        const equipped = findEquippedItemByType(item.type);
        setCompareEquipment(equipped);
        
        // ⭐ 调试：悬停时打印装备信息
        $. Msg('[VaultUI] 悬停装备:', item);
        $. Msg('[VaultUI] affixDetails:', item.affixDetails);
    };

    const handleMouseOut = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem(null);
            setHoveredPosition(null);
            setCompareEquipment(null);
        }, 300) as any;
    };

    const keepHoverPanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    // ==================== 获取物品品质颜色 ====================
    const getQualityColor = (item: ExternalRewardItem): string => {
        // ⭐ 优先使用稀有度颜色
        if (item. rarity !== undefined) {
            const rarityColors: Record<number, string> = {
                0: '#c8c8c8',  // 普通 - 灰白色
                1: '#8888ff',  // 魔法 - 蓝色
                2: '#ffff77',  // 稀有 - 黄色
                3: '#ff8800',  // 传说 - 橙色
            };
            return rarityColors[item.rarity] || '#9d9d9d';
        }
        
        // 原有逻辑（向下兼容）
        const totalValue = item.stats.reduce((sum, stat) => sum + stat.value, 0);
        
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
    const emptySlots = TOTAL_SLOTS - vaultItems.length;
    
    // ⭐ 格子尺寸
    const SLOT_SIZE = 80;
    const SLOT_MARGIN = 2;
    const GRID_PADDING = 15;

    // ⭐ 计算弹窗位置
    const getPopupPosition = (position: { row: number; col: number } | null, popupWidth: number) => {
        if (!position) return { marginLeft: '0px', marginTop: '0px' };
        
        const { row, col } = position;
        
        // 计算格子的位置
        const slotX = GRID_PADDING + col * (SLOT_SIZE + SLOT_MARGIN * 2);
        const slotY = 60 + GRID_PADDING + row * (SLOT_SIZE + SLOT_MARGIN * 2);
        
        // 面板显示在格子右上方
        let popupX = slotX + SLOT_SIZE + 10;
        let popupY = slotY - 30;
        
        // 确保不超出仓库右边界
        if (popupX + popupWidth > 740) {
            popupX = slotX - popupWidth - 10;
        }
        
        // 确保不超出上边界
        if (popupY < 10) {
            popupY = 10;
        }
        
        return {
            marginLeft: `${popupX}px`,
            marginTop: `${popupY}px`,
        };
    };

    const hoveredItemData = hoveredItem !== null ? vaultItems[hoveredItem] : null;

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
                    style={{
                        fontSize: '32px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                    }}
                />
                <Label 
                    text={`${vaultItems.length} / ${TOTAL_SLOTS}`}
                    style={{
                        fontSize: '24px',
                        color: '#cccccc',
                        marginLeft: '20px',
                        marginTop: '4px',
                    }}
                />
                <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                <Button 
                    onactivate={onClose}
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#8b0000',
                        border: '2px solid #ff0000',
                    }}
                    onmouseover={(panel) => {
                        panel.style.backgroundColor = '#b22222';
                    }}
                    onmouseout={(panel) => {
                        panel. style.backgroundColor = '#8b0000';
                    }}
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
                    const qualityColor = getQualityColor(item);
                    const normalBorder = `3px solid ${qualityColor}`;
                    const hoverBorder = `4px solid ${qualityColor}`;
                    const isHovered = hoveredItem === index;
                    
                    // ⭐ 计算当前格子的行和列
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
                                border: isHovered ? hoverBorder : normalBorder,
                                backgroundImage: `url("${item.icon}")`,
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
                            onmouseout={() => {
                                handleMouseOut();
                            }}
                        >
                            {selectedItem === index && (
                                <Panel style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#ffffff40',
                                }} />
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

            {/* ⭐ 装备悬停对比面板 */}
            {hoveredItem !== null && hoveredItemData && hoveredPosition && ! selectedItem && (() => {
                const hoverPos = getPopupPosition(hoveredPosition, 350);
                
                return (
                    <Panel hittest={false}
                        style={{
                            width: '740px',
                            height: '520px',
                            marginTop: '-520px',
                        }}
                    >
                        <Panel hittest={false}
                            style={{
                                width: '350px',
                                maxHeight: '480px',
                                backgroundColor: '#1a1a1aee',
                                border: '3px solid #ffd700',
                                padding: '15px',
                                marginLeft: hoverPos.marginLeft,
                                marginTop: hoverPos. marginTop,
                                flowChildren: 'down',
                                overflow: 'squish scroll',
                            }}
                            onmouseover={keepHoverPanel}
                            onmouseout={handleMouseOut}
                        >
                            <Label 
                                text="📊 装备对比"
                                style={{
                                    fontSize: '20px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                }}
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
                                <Label 
                                    text="【待装备】"
                                    style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}
                                />
                                <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                    <Panel style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundImage: `url("${hoveredItemData.icon}")`,
                                        backgroundSize: 'cover',
                                        marginRight: '10px',
                                    }} />
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label 
                                            text={hoveredItemData.name}
                                            style={{
                                                fontSize: '16px',
                                                color: getQualityColor(hoveredItemData),
                                                fontWeight: 'bold',
                                                marginBottom: '3px',
                                            }}
                                        />
                                        <Label 
                                            text={hoveredItemData.type}
                                            style={{ fontSize: '12px', color: '#ffd700', marginBottom: '5px' }}
                                        />
                                        
                                        {/* ⭐ 词缀详情显示 */}
                                        {hoveredItemData.affixDetails && hoveredItemData.affixDetails. length > 0 ?  (
                                            <>
                                                <Label 
                                                    text="━━━ 词缀 ━━━"
                                                    style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                                />
                                                {hoveredItemData.affixDetails.map((affix, idx) => (
                                                    <Label 
                                                        key={`affix-${idx}`}
                                                        text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                        style={{ 
                                                            fontSize: '11px', 
                                                            color: affix.color || '#ffffff',
                                                            marginBottom: '2px',
                                                        }}
                                                    />
                                                ))}
                                                <Label 
                                                    text="━━━ 属性 ━━━"
                                                    style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                                />
                                            </>
                                        ) : (
                                            <Label 
                                                text="[调试] 无词缀数据"
                                                style={{ fontSize: '10px', color: '#ff0000', marginBottom: '3px' }}
                                            />
                                        )}
                                        
                                        {hoveredItemData.stats.map((stat, idx) => (
                                            <Label 
                                                key={idx}
                                                text={`+${stat. value} ${stat.attribute}`}
                                                style={{ 
                                                    fontSize: '14px', 
                                                    color: '#00ff00', 
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        ))}
                                    </Panel>
                                </Panel>
                            </Panel>

                            {/* 分隔线 */}
                            <Panel style={{
                                width: '100%',
                                height: '2px',
                                backgroundColor: '#555555',
                                marginBottom: '10px',
                            }} />

                            {/* 当前已装备 */}
                            {compareEquipment ?  (
                                <>
                                    <Panel style={{
                                        width: '100%',
                                        backgroundColor: '#0a0a0a',
                                        border: `2px solid ${getQualityColor(compareEquipment)}`,
                                        padding: '10px',
                                        marginBottom: '10px',
                                        flowChildren: 'down',
                                    }}>
                                        <Label 
                                            text="【当前装备】"
                                            style={{ fontSize: '12px', color: '#888888', marginBottom: '5px' }}
                                        />
                                        <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                            <Panel style={{
                                                width: '50px',
                                                height: '50px',
                                                backgroundImage: `url("${compareEquipment.icon}")`,
                                                backgroundSize: 'cover',
                                                marginRight: '10px',
                                            }} />
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label 
                                                    text={compareEquipment.name}
                                                    style={{
                                                        fontSize: '16px',
                                                        color: getQualityColor(compareEquipment),
                                                        fontWeight: 'bold',
                                                        marginBottom: '3px',
                                                    }}
                                                />
                                                <Label 
                                                    text={compareEquipment. type}
                                                    style={{ fontSize: '12px', color: '#ffd700', marginBottom: '5px' }}
                                                />
                                                
                                                {/* ⭐ 当前装备词缀显示 */}
                                                {compareEquipment.affixDetails && compareEquipment.affixDetails.length > 0 ? (
                                                    <>
                                                        <Label 
                                                            text="━━━ 词缀 ━━━"
                                                            style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                                        />
                                                        {compareEquipment. affixDetails.map((affix, idx) => (
                                                            <Label 
                                                                key={`curr-affix-${idx}`}
                                                                text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                                style={{ 
                                                                    fontSize: '11px', 
                                                                    color: affix.color || '#ffffff',
                                                                    marginBottom: '2px',
                                                                }}
                                                            />
                                                        ))}
                                                        <Label 
                                                            text="━━━ 属性 ━━━"
                                                            style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                                        />
                                                    </>
                                                ) : null}
                                                
                                                {compareEquipment.stats.map((stat, idx) => (
                                                    <Label 
                                                        key={idx}
                                                        text={`+${stat.value} ${stat.attribute}`}
                                                        style={{ 
                                                            fontSize: '14px', 
                                                            color: '#00ff00', 
                                                            fontWeight: 'bold',
                                                        }}
                                                    />
                                                ))}
                                            </Panel>
                                        </Panel>
                                    </Panel>

                                    {/* 属性变化 */}
                                    <Panel style={{
                                        width: '100%',
                                        backgroundColor: '#2a2a2a',
                                        padding: '10px',
                                        flowChildren: 'down',
                                    }}>
                                        <Label 
                                            text="📈 属性变化"
                                            style={{
                                                fontSize: '14px',
                                                color: '#ffd700',
                                                marginBottom: '8px',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                        
                                        {(() => {
                                            const allAttributes = new Set<string>();
                                            hoveredItemData.stats.forEach(stat => allAttributes.add(stat.attribute));
                                            compareEquipment.stats.forEach(stat => allAttributes.add(stat.attribute));
                                            
                                            const attributeDiffs: Array<{ attr: string; oldVal: number; newVal: number; diff: number }> = [];
                                            
                                            allAttributes.forEach(attr => {
                                                const oldStat = compareEquipment.stats.find(s => s.attribute === attr);
                                                const newStat = hoveredItemData.stats. find(s => s.attribute === attr);
                                                
                                                const oldVal = oldStat ? oldStat.value : 0;
                                                const newVal = newStat ? newStat.value : 0;
                                                const diff = newVal - oldVal;
                                                
                                                if (diff !== 0) {
                                                    attributeDiffs.push({ attr, oldVal, newVal, diff });
                                                }
                                            });
                                            
                                            return attributeDiffs.map((item, idx) => {
                                                const isUpgrade = item.diff > 0;
                                                const diffColor = isUpgrade ? '#00ff00' : '#ff0000';
                                                const diffSymbol = isUpgrade ? '↑' : '↓';
                                                
                                                return (
                                                    <Panel key={idx} style={{ 
                                                        width: '100%', 
                                                        marginBottom: '5px',
                                                        flowChildren: 'right'
                                                    }}>
                                                        <Label 
                                                            text={`${item.attr}: `}
                                                            style={{
                                                                fontSize: '14px',
                                                                color: '#cccccc',
                                                            }}
                                                        />
                                                        <Label 
                                                            text={`${diffSymbol} ${Math.abs(item.diff)}`}
                                                            style={{
                                                                fontSize: '14px',
                                                                color: diffColor,
                                                                fontWeight: 'bold',
                                                            }}
                                                        />
                                                        <Label 
                                                            text={` (${item.oldVal} → ${item.newVal})`}
                                                            style={{
                                                                fontSize: '12px',
                                                                color: '#888888',
                                                            }}
                                                        />
                                                    </Panel>
                                                );
                                            });
                                        })()}
                                    </Panel>
                                </>
                            ) : (
                                <Panel style={{
                                    width: '100%',
                                    backgroundColor: '#2a2a2a',
                                    padding: '15px',
                                    flowChildren: 'down',
                                }}>
                                    <Label 
                                        text="✨ 当前未装备同类型装备"
                                        style={{
                                            fontSize: '14px',
                                            color: '#888888',
                                            textAlign: 'center',
                                        }}
                                    />
                                    <Label 
                                        text="装备后将获得："
                                        style={{
                                            fontSize: '12px',
                                            color: '#ffd700',
                                            textAlign: 'center',
                                            marginTop: '8px',
                                            marginBottom: '5px',
                                        }}
                                    />
                                    {hoveredItemData.stats.map((stat, idx) => (
                                        <Label 
                                            key={idx}
                                            text={`+${stat.value} ${stat. attribute}`}
                                            style={{
                                                fontSize: '14px',
                                                color: '#00ff00',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    ))}
                                </Panel>
                            )}
                        </Panel>
                    </Panel>
                );
            })()}

            {/* ⭐ 装备确认面板 */}
            {selectedItem !== null && vaultItems[selectedItem] && selectedPosition && (() => {
                const item = vaultItems[selectedItem];
                const qualityColor = getQualityColor(item);
                const popupPos = getPopupPosition(selectedPosition, 320);
                
                return (
                    <Panel 
                        style={{
                            width: '740px',
                            height: '520px',
                            backgroundColor: '#00000055',
                            marginTop: '-520px',
                        }}
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
                                style={{
                                    fontSize: '20px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                }}
                            />
                            
                            {/* 装备信息 */}
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${qualityColor}`,
                                padding: '10px',
                                marginBottom: '10px',
                                flowChildren: 'right',
                            }}>
                                <Image 
                                    src={item.icon}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        marginRight: '10px',
                                    }}
                                />
                                <Panel style={{ flowChildren: 'down' }}>
                                    <Label 
                                        text={item.name}
                                        style={{
                                            fontSize: '16px',
                                            color: qualityColor,
                                            fontWeight: 'bold',
                                            marginBottom: '3px',
                                        }}
                                    />
                                    <Label 
                                        text={item.type}
                                        style={{
                                            fontSize: '12px',
                                            color: '#ffd700',
                                            marginBottom: '5px',
                                        }}
                                    />
                                    
                                    {/* ⭐ 确认面板词缀显示 */}
                                    {item.affixDetails && item.affixDetails.length > 0 ? (
                                        <>
                                            <Label 
                                                text="━━━ 词缀 ━━━"
                                                style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                            />
                                            {item.affixDetails.map((affix, idx) => (
                                                <Label 
                                                    key={`confirm-affix-${idx}`}
                                                    text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        color: affix.color || '#ffffff',
                                                        marginBottom: '2px',
                                                    }}
                                                />
                                            ))}
                                            <Label 
                                                text="━━━ 属性 ━━━"
                                                style={{ fontSize: '11px', color: '#888888', marginTop: '3px', marginBottom: '3px' }}
                                            />
                                        </>
                                    ) : null}
                                    
                                    {item.stats.map((stat, idx) => (
                                        <Label 
                                            key={idx}
                                            text={`+${stat. value} ${stat.attribute}`}
                                            style={{
                                                fontSize: '14px',
                                                color: '#00ff00',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    ))}
                                </Panel>
                            </Panel>
                            
                            {/* 按钮区域 */}
                            <Panel style={{
                                width: '100%',
                                flowChildren: 'right',
                            }}>
                                <Button 
                                    onactivate={() => onEquipItem(selectedItem)}
                                    style={{
                                        width: '140px',
                                        height: '40px',
                                        backgroundColor: isEquipping ? '#888888' : '#4caf50',
                                        marginRight: '10px',
                                    }}
                                    onmouseover={(panel) => {
                                        if (! isEquipping) {
                                            panel.style.backgroundColor = '#66bb6a';
                                        }
                                    }}
                                    onmouseout={(panel) => {
                                        if (!isEquipping) {
                                            panel.style.backgroundColor = '#4caf50';
                                        }
                                    }}
                                >
                                    <Label 
                                        text={isEquipping ? "装备中..." : "✔ 确认"}
                                        style={{ fontSize: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} 
                                    />
                                </Button>
                                
                                <Button 
                                    onactivate={() => setSelectedItem(null)}
                                    style={{
                                        width: '140px',
                                        height: '40px',
                                        backgroundColor: '#888888',
                                    }}
                                    onmouseover={(panel) => {
                                        panel.style.backgroundColor = '#aaaaaa';
                                    }}
                                    onmouseout={(panel) => {
                                        panel.style.backgroundColor = '#888888';
                                    }}
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