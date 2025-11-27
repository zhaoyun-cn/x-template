import React, { useState, useEffect } from 'react';

// 装备槽位枚举
enum EquipmentSlot {
    HELMET = 'helmet',
    NECKLACE = 'necklace',
    RING = 'ring',
    TRINKET = 'trinket',
    WEAPON = 'weapon',
    ARMOR = 'armor',
    BELT = 'belt',
    BOOTS = 'boots',
}

// 装备属性接口
interface EquipmentStat {
    attribute: string;
    value: number;
}

// 装备物品接口
interface EquippedItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
}

interface EquipmentUIProps {
    visible: boolean;
    onClose: () => void;
}

export const EquipmentUI: React.FC<EquipmentUIProps> = ({ visible, onClose }) => {
    // 默认槽初始化
    const initialSlots: Record<string, EquippedItem | null> = {
        helmet: null,
        necklace: null,
        ring: null,
        trinket: null,
        weapon: null,
        armor: null,
        belt: null,
        boots: null,
    };

    const [equippedItems, setEquippedItems] = useState<Record<string, EquippedItem | null>>(initialSlots);

    // 加载装备数据
    useEffect(() => {
        if (! visible) return;

        $. Msg('[EquipmentUI] 请求装备数据');
        
        (GameEvents. SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

const listener = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
    $. Msg('[EquipmentUI] 收到装备数据:', data);

    // ⭐ 转换装备数据，确保 stats 是数组
    const processedEquipment: Record<string, EquippedItem | null> = {};
    
    for (const slot in data.equipment) {
        const item = data. equipment[slot];
        
        if (item) {
            // 将 stats 对象转为数组
            const statsArray = Array.isArray(item.stats) 
                ?  item.stats 
                : Object.values(item.stats || {});
            
            processedEquipment[slot] = {
                ...item,
                stats: statsArray  // ✅ 保证 stats 是数组
            };
        } else {
            processedEquipment[slot] = null;
        }
    }
    
    // 合并默认槽位和处理后的装备数据
    const updatedEquipment: Record<string, EquippedItem | null> = {
        ...initialSlots,
        ... processedEquipment,
    };
    
    setEquippedItems(updatedEquipment);
});

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, [visible]);

    // 卸下装备
    const unequipItem = (slot: string) => {
        $. Msg(`[EquipmentUI] 卸下装备槽位: ${slot}`);
        
        (GameEvents.SendCustomGameEventToServer as any)('unequip_item', {
            PlayerID: Players.GetLocalPlayer(),
            slot: slot
        });

        Game.EmitSound('ui. crafting_gem_create');
    };

    if (!visible) return null;

    // 获取品质颜色
    const getQualityColor = (item: EquippedItem): string => {
        // 根据属性总和计算品质
        const totalValue = item.stats.reduce((sum, stat) => sum + stat. value, 0);
        
        if (totalValue >= 50) return '#ff8000';  // 橙色 - 传说
        if (totalValue >= 35) return '#a335ee';  // 紫色 - 史诗
        if (totalValue >= 20) return '#0070dd';  // 蓝色 - 稀有
        if (totalValue >= 10) return '#1eff00';  // 绿色 - 优秀
        return '#9d9d9d';                        // 灰色 - 普通
    };

    // 渲染装备槽位（支持多属性）
    const renderSlot = (slotName: string, slotLabel: string) => {
        const item = equippedItems[slotName];
        const hasItem = item !== null;
        
        return (
            <Panel 
                key={slotName}
                style={{
                    width: '200px',
                    height: '130px',  // 增加高度以容纳多属性
                    margin: '10px',
                    backgroundColor: hasItem ? '#1a1a1a' : '#0a0a0a',
                    border: hasItem ? `3px solid ${getQualityColor(item! )}` : '2px solid #3a3a3a',
                    flowChildren: 'right',
                    padding: '10px',
                }}
                onactivate={() => {
                    if (hasItem) {
                        unequipItem(slotName);
                    }
                }}
                onmouseover={(panel) => {
                    if (hasItem) {
                        panel.style.backgroundColor = '#2a2a2a';
                        Game.EmitSound('ui.button_over');
                    }
                }}
                onmouseout={(panel) => {
                    if (hasItem) {
                        panel.style.backgroundColor = '#1a1a1a';
                    }
                }}
            >
                {/* 槽位图标 */}
                <Panel style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #555555',
                    backgroundImage: hasItem ? `url("${item! .icon}")` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    {! hasItem && (
                        <Label 
                            text={getSlotIcon(slotName)}
                            style={{
                                fontSize: '40px',
                                color: '#555555',
                                textAlign: 'center',
                                horizontalAlign: 'center',
                                verticalAlign: 'center',
                            }}
                        />
                    )}
                </Panel>

                {/* 装备信息 */}
                <Panel style={{
                    width: '100px',
                    height: '110px',
                    marginLeft: '10px',
                    flowChildren: 'down',
                }}>
                    <Label 
                        text={hasItem ? item! .name : slotLabel}
                        style={{
                            fontSize: hasItem ? '16px' : '16px',
                            color: hasItem ? getQualityColor(item!) : '#666666',
                            fontWeight: hasItem ? 'bold' : 'normal',
                            marginBottom: '5px',
                        }}
                    />
                    {hasItem && (
                        <>
                            {/* 显示多个属性 */}
                            {item!.stats.map((stat, index) => (
                                <Label 
                                    key={index}
                                    text={`+${stat.value} ${stat.attribute}`}
                                    style={{
                                        fontSize: '13px',
                                        color: '#00ff00',
                                        marginBottom: '2px',
                                    }}
                                />
                            ))}
                            <Label 
                                text="点击卸下"
                                style={{
                                    fontSize: '11px',
                                    color: '#888888',
                                    fontStyle: 'italic',
                                    marginTop: '5px',
                                }}
                            />
                        </>
                    )}
                </Panel>
            </Panel>
        );
    };

    // 获取槽位图标
    const getSlotIcon = (slot: string): string => {
        const icons: Record<string, string> = {
            helmet: '⛑️',
            necklace: '📿',
            ring: '💍',
            trinket: '✨',
            weapon: '⚔️',
            armor: '🛡️',
            belt: '🎗️',
            boots: '🥾',
        };
        return icons[slot] || '? ';
    };

    // 计算总属性（支持多属性）
    const getTotalStats = () => {
        const stats: Record<string, number> = {};
        Object.values(equippedItems).forEach(item => {
            if (item && item.stats) {
                item.stats.forEach(stat => {
                    stats[stat.attribute] = (stats[stat.attribute] || 0) + stat.value;
                });
            }
        });
        return stats;
    };

    const totalStats = getTotalStats();

    return (
        <Panel 
            style={{
                width: '100%',
                height: '100%',
                horizontalAlign: 'center',
                verticalAlign: 'center',
                zIndex: 100,
                backgroundColor: '#000000cc',
            }}
            onactivate={onClose}
        >
            {/* 主容器 */}
            <Panel 
                style={{
                    width: '900px',
                    height: '750px',  // 增加高度
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                    backgroundColor: '#1c1410',
                    border: '4px solid #8b7355',
                    flowChildren: 'down',
                }}
                onactivate={() => {}}
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
                        text="⚔️ 人物装备" 
                        style={{
                            fontSize: '32px',
                            color: '#ffd700',
                            fontWeight: 'bold',
                        }}
                    />
                    <Panel style={{ width: '100%', height: '1px' }} />
                    <Button 
                        onactivate={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#8b0000',
                            border: '2px solid #ff0000',
                        }}
                    >
                        <Label text="✕" style={{ fontSize: '28px', color: 'white', textAlign: 'center' }} />
                    </Button>
                </Panel>

                {/* 装备区域 */}
                <Panel style={{ width: '100%', height: '690px', padding: '20px', flowChildren: 'right' }}>
                    {/* 左侧槽位 */}
                    <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                        {renderSlot('helmet', '头盔')}
                        {renderSlot('necklace', '项链')}
                        {renderSlot('ring', '戒指')}
                        {renderSlot('trinket', '饰品')}
                    </Panel>

                    {/* 中角色部分 */}
                    <Panel style={{
                        width: '350px',
                        height: '100%',
                        flowChildren: 'down',
                        padding: '20px',
                    }}>
                        <Label text="总属性加成" style={{ fontSize: '22px', marginBottom: '15px', color: '#ffd700', fontWeight: 'bold' }} />
                        
                        {/* 属性列表 */}
                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: '2px solid #555555',
                            padding: '15px',
                            marginBottom: '20px',
                            flowChildren: 'down',
                        }}>
                            {Object.keys(totalStats).length > 0 ? (
                                Object.entries(totalStats).map(([attr, value]) => (
                                    <Label 
                                        key={attr} 
                                        text={`${attr}: +${value}`}
                                        style={{ 
                                            fontSize: '18px', 
                                            color: '#00ff00', 
                                            marginBottom: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                ))
                            ) : (
                                <Label 
                                    text="未装备任何装备"
                                    style={{ 
                                        fontSize: '16px', 
                                        color: '#888888',
                                        textAlign: 'center'
                                    }}
                                />
                            )}
                        </Panel>

                        {/* 角色模型区域 */}
                        <Panel style={{
                            width: '100%',
                            height: '300px',
                            backgroundColor: '#0a0a0a',
                            border: '2px solid #555555',
                        }}>
                            <Label text="🦸" style={{ fontSize: '120px', textAlign: 'center', horizontalAlign: 'center', verticalAlign: 'center' }} />
                        </Panel>
                    </Panel>

                    {/* 右侧槽位 */}
                    <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                        {renderSlot('weapon', '武器')}
                        {renderSlot('armor', '护甲')}
                        {renderSlot('belt', '腰带')}
                        {renderSlot('boots', '鞋子')}
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};