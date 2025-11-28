import React, { useState, useEffect, useRef } from 'react';

// 装备属性接口
interface EquipmentStat {
    attribute: string;
    value: number;
}

// 装备物品接口
interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
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
                    items.push(...data.items. map((item: { stats: any; }) => ({
                        ... item,
                        stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {})
                    })));
                } else if (typeof data.items === 'object') {
                    for (const key in data.items) {
                        const item = data.items[key];
                        const statsArray = Array.isArray(item.stats) 
                            ? item.stats 
                            : Object.values(item.stats || {});
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
                        ... item,
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
            $. Msg('[VaultUI] ⚠️ 正在装备中，请稍候.. .');
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
        setHoveredItem(null);
        
        setTimeout(() => {
            setIsEquipping(false);
            $. Msg('[VaultUI] 解除装备锁定');
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

    const handleMouseOver = (index: number, item: ExternalRewardItem) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredItem(index);
        const equipped = findEquippedItemByType(item.type);
        setCompareEquipment(equipped);
    };

    const handleMouseOut = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem(null);
            setCompareEquipment(null);
        }, 300) as any;
    };

    const keepComparePanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    if (!visible) return null;

    const COLUMNS = 8;
    const ROWS = 5;
    const TOTAL_SLOTS = COLUMNS * ROWS;
    const emptySlots = TOTAL_SLOTS - vaultItems.length;

    const getQualityColor = (item: ExternalRewardItem): string => {
        const totalValue = item.stats.reduce((sum, stat) => sum + stat. value, 0);
        
        if (totalValue >= 50) return '#ff8000';
        if (totalValue >= 35) return '#a335ee';
        if (totalValue >= 20) return '#0070dd';
        if (totalValue >= 10) return '#1eff00';
        return '#9d9d9d';
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
                    panel.style.backgroundColor = '#8b0000';
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
                
                return (
                    <Panel 
                        key={`item-${index}`}
                        style={{
                            width: '80px',
                            height: '80px',
                            margin: '2px',
                            backgroundColor: isHovered ? '#1a1a1a' : '#0a0a0a',
                            border: isHovered ?  hoverBorder : normalBorder,
                            backgroundImage: `url("${item.icon}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                        onactivate={() => {
                            Game.EmitSound('ui. button_click');
                            setSelectedItem(index);
                        }}
                        onmouseover={() => {
                            handleMouseOver(index, item);
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

        {/* ⭐ 装备对比 Tooltip - 浮动在仓库右侧上层 */}
        {hoveredItem !== null && hoveredItemData && (
            <Panel 
                style={{
                    width: '400px',
                    maxHeight: '500px',
                    backgroundColor: '#1a1a1aee',
                    border: '4px solid #ffd700',
                    padding: '20px',
                    // ⭐ 绝对定位：浮动在右侧
                    position: 'absolute',
                    x: '750px',  // 仓库宽度 740px + 10px 间距
                    y: '10px',
                    zIndex: 200,
                    flowChildren: 'down',
                    overflow: 'squish scroll',
                }}
                onmouseover={keepComparePanel}
                onmouseout={handleMouseOut}
            >
                <Label 
                    text="📊 装备对比"
                    style={{
                        fontSize: '24px',
                        color: '#ffd700',
                        textAlign: 'center',
                        marginBottom: '15px',
                        fontWeight: 'bold',
                    }}
                />

                {/* 待装备物品 */}
                <Panel style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: `3px solid ${getQualityColor(hoveredItemData)}`,
                    padding: '15px',
                    marginBottom: '15px',
                    flowChildren: 'down',
                }}>
                    <Label 
                        text="【待装备】"
                        style={{ fontSize: '14px', color: '#00ff00', marginBottom: '8px' }}
                    />
                    <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '10px' }}>
                        <Panel style={{
                            width: '60px',
                            height: '60px',
                            backgroundImage: `url("${hoveredItemData.icon}")`,
                            backgroundSize: 'cover',
                            marginRight: '10px',
                        }} />
                        <Panel style={{ flowChildren: 'down', width: '100%' }}>
                            <Label 
                                text={hoveredItemData.name}
                                style={{
                                    fontSize: '18px',
                                    color: getQualityColor(hoveredItemData),
                                    fontWeight: 'bold',
                                    marginBottom: '5px',
                                }}
                            />
                            <Label 
                                text={hoveredItemData.type}
                                style={{ fontSize: '14px', color: '#ffd700', marginBottom: '8px' }}
                            />
                            
                            {hoveredItemData.stats. map((stat, index) => (
                                <Label 
                                    key={index}
                                    text={`+${stat. value} ${stat. attribute}`}
                                    style={{ 
                                        fontSize: '15px', 
                                        color: '#00ff00', 
                                        fontWeight: 'bold',
                                        marginBottom: '3px'
                                    }}
                                />
                            ))}
                        </Panel>
                    </Panel>
                </Panel>

                <Panel style={{
                    width: '100%',
                    height: '2px',
                    backgroundColor: '#555555',
                    marginBottom: '15px',
                }} />

                {compareEquipment ?  (
                    <>
                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: `3px solid ${getQualityColor(compareEquipment)}`,
                            padding: '15px',
                            marginBottom: '15px',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="【当前装备】"
                                style={{ fontSize: '14px', color: '#888888', marginBottom: '8px' }}
                            />
                            <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '10px' }}>
                                <Panel style={{
                                    width: '60px',
                                    height: '60px',
                                    backgroundImage: `url("${compareEquipment.icon}")`,
                                    backgroundSize: 'cover',
                                    marginRight: '10px',
                                }} />
                                <Panel style={{ flowChildren: 'down', width: '100%' }}>
                                    <Label 
                                        text={compareEquipment.name}
                                        style={{
                                            fontSize: '18px',
                                            color: getQualityColor(compareEquipment),
                                            fontWeight: 'bold',
                                            marginBottom: '5px',
                                        }}
                                    />
                                    <Label 
                                        text={compareEquipment.type}
                                        style={{ fontSize: '14px', color: '#ffd700', marginBottom: '8px' }}
                                    />
                                    
                                    {compareEquipment.stats.map((stat, index) => (
                                        <Label 
                                            key={index}
                                            text={`+${stat. value} ${stat. attribute}`}
                                            style={{ 
                                                fontSize: '15px', 
                                                color: '#00ff00', 
                                                fontWeight: 'bold',
                                                marginBottom: '3px'
                                            }}
                                        />
                                    ))}
                                </Panel>
                            </Panel>
                        </Panel>

                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#2a2a2a',
                            padding: '15px',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="📈 属性变化"
                                style={{
                                    fontSize: '18px',
                                    color: '#ffd700',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                }}
                            />
                            
                            {(() => {
                                const allAttributes = new Set<string>();
                                hoveredItemData.stats.forEach(stat => allAttributes.add(stat.attribute));
                                compareEquipment.stats.forEach(stat => allAttributes.add(stat.attribute));
                                
                                const attributeDiffs: Array<{ attr: string, oldVal: number, newVal: number, diff: number }> = [];
                                
                                allAttributes.forEach(attr => {
                                    const oldStat = compareEquipment.stats.find(s => s.attribute === attr);
                                    const newStat = hoveredItemData. stats.find(s => s.attribute === attr);
                                    
                                    const oldVal = oldStat ?  oldStat.value : 0;
                                    const newVal = newStat ? newStat. value : 0;
                                    const diff = newVal - oldVal;
                                    
                                    if (diff !== 0) {
                                        attributeDiffs. push({ attr, oldVal, newVal, diff });
                                    }
                                });
                                
                                return attributeDiffs.map((item, index) => {
                                    const isUpgrade = item.diff > 0;
                                    const diffColor = isUpgrade ? '#00ff00' : '#ff0000';
                                    const diffSymbol = isUpgrade ? '↑' : '↓';
                                    
                                    return (
                                        <Panel key={index} style={{ 
                                            width: '100%', 
                                            marginBottom: '8px',
                                            flowChildren: 'down'
                                        }}>
                                            <Label 
                                                text={`${item.attr}: ${diffSymbol} ${Math.abs(item. diff)}`}
                                                style={{
                                                    fontSize: '17px',
                                                    color: diffColor,
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                            <Label 
                                                text={`${item.oldVal} → ${item.newVal}`}
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#cccccc',
                                                    marginTop: '2px',
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
                        padding: '20px',
                        flowChildren: 'down',
                    }}>
                        <Label 
                            text="✨ 当前未装备同类型装备"
                            style={{
                                fontSize: '16px',
                                color: '#888888',
                                textAlign: 'center',
                            }}
                        />
                        <Label 
                            text="装备后将获得以下属性："
                            style={{
                                fontSize: '14px',
                                color: '#ffd700',
                                textAlign: 'center',
                                marginTop: '10px',
                                marginBottom: '10px',
                            }}
                        />
                        {hoveredItemData. stats.map((stat, index) => (
                            <Label 
                                key={index}
                                text={`+${stat.value} ${stat.attribute}`}
                                style={{
                                    fontSize: '16px',
                                    color: '#00ff00',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    marginBottom: '5px',
                                }}
                            />
                        ))}
                    </Panel>
                )}
            </Panel>
        )}

        {/* ⭐ 装备确认面板 - 浮动在仓库中央上层 */}
        {selectedItem !== null && vaultItems[selectedItem] && (() => {
            const item = vaultItems[selectedItem];
            const qualityColor = getQualityColor(item);
            
            return (
                <Panel style={{
                    width: '500px',
                    backgroundColor: '#1a1a1aee',
                    border: '4px solid #ffd700',
                    padding: '30px',
                    // ⭐ 绝对定位：浮动在中央
                    position: 'absolute',
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                    zIndex: 300,
                    flowChildren: 'down',
                }}>
                    <Label 
                        text="装备这件物品？"
                        style={{
                            fontSize: '32px',
                            color: '#ffd700',
                            textAlign: 'center',
                            marginBottom: '30px',
                            fontWeight: 'bold',
                        }}
                    />
                    
                    <Panel style={{
                        width: '100%',
                        backgroundColor: '#0a0a0a',
                        border: `3px solid ${qualityColor}`,
                        padding: '25px',
                        marginBottom: '35px',
                        flowChildren: 'down',
                    }}>
                        <Panel style={{
                            width: '100%',
                            horizontalAlign: 'center',
                            marginBottom: '20px',
                        }}>
                            <Image 
                                src={item.icon}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                }}
                            />
                        </Panel>
                        
                        <Label 
                            text={item.name}
                            style={{
                                fontSize: '28px',
                                color: qualityColor,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                marginBottom: '12px',
                            }}
                        />
                        
                        <Label 
                            text={item.type}
                            style={{
                                fontSize: '22px',
                                color: '#ffd700',
                                textAlign: 'center',
                                marginBottom: '20px',
                            }}
                        />
                        
                        <Panel style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: '#555555',
                            marginBottom: '20px',
                        }} />
                        
                        {item.stats.map((stat, index) => (
                            <Label 
                                key={index}
                                text={`+${stat. value} ${stat. attribute}`}
                                style={{
                                    fontSize: '24px',
                                    color: '#00ff00',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                }}
                            />
                        ))}
                    </Panel>
                    
                    <Panel style={{
                        width: '100%',
                        flowChildren: 'down',
                    }}>
                        <Button 
                            onactivate={() => onEquipItem(selectedItem)}
                            style={{
                                width: '100%',
                                height: '60px',
                                backgroundColor: isEquipping ? '#888888' : '#4caf50',
                                marginBottom: '15px',
                                opacity: isEquipping ?  '0.5' : '1',
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
                                text={isEquipping ? "⏳ 装备中..." : "✔ 确认装备"}
                                style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} 
                            />
                        </Button>
                        
                        <Button 
                            onactivate={() => setSelectedItem(null)}
                            style={{
                                width: '100%',
                                height: '60px',
                                backgroundColor: '#888888',
                            }}
                            onmouseover={(panel) => {
                                panel.style. backgroundColor = '#aaaaaa';
                            }}
                            onmouseout={(panel) => {
                                panel.style. backgroundColor = '#888888';
                            }}
                        >
                            <Label text="✕ 取消" style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                        </Button>
                    </Panel>
                </Panel>
            );
        })()}
    </Panel>
);  }   