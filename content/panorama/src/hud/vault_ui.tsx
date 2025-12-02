import React, { useState, useEffect, useRef } from 'react';

// ========== 类型定义 ==========
interface VaultItem {
    id: string;
    name: string;
    type: string;
    icon: string;
    rarity: number;
    stats: Array<{ attribute: string; value: number }>;
    affixDetails?: any;
}

interface EquippedItems {
    weapon?: VaultItem;
    armor?: VaultItem;
    helmet?: VaultItem;
    boots?: VaultItem;
    gloves?: VaultItem;
    belt?: VaultItem;
    necklace?: VaultItem;
    ring?: VaultItem;
}

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
};

// ========== 主组件 ==========
export const VaultUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [equipped, setEquipped] = useState<EquippedItems>({});
    const [selItem, setSelItem] = useState<VaultItem | null>(null);
    const [hoverItem, setHoverItem] = useState<VaultItem | null>(null);
    const [equipping, setEquipping] = useState(false);
    
    const hoverTimeoutRef = useRef<number | null>(null);

    // ========== 数据订阅 ==========
    useEffect(() => {
        if (!visible) return;
        
        GameEvents.SendCustomGameEventToServer('request_vault_data' as never, { PlayerID: Players.GetLocalPlayer() } as never);
        GameEvents.SendCustomGameEventToServer('request_equipment_data' as never, { PlayerID: Players.GetLocalPlayer() } as never);
        
        const h1 = GameEvents.Subscribe('update_vault_ui' as never, (data: any) => {
            const arr: VaultItem[] = [];
            if (data && data.items) {
                const rawArr = Array.isArray(data.items) ? data.items : Object.values(data.items || {});
                for (let i = 0; i < rawArr.length; i++) {
                    const raw = rawArr[i];
                    if (raw && raw.name) {
                        const stats: Array<{ attribute: string; value: number }> = [];
                        if (raw.stats) {
                            const rawStats = Array.isArray(raw.stats) ? raw.stats : Object.values(raw.stats || {});
                            for (const s of rawStats) {
                                if (s && s.attribute) {
                                    stats.push({ attribute: s.attribute + '', value: +s.value || 0 });
                                }
                            }
                        }
                        arr.push({
                            id: 'item_' + i,
                            name: raw.name + '',
                            type: raw.type + '',
                            icon: raw.icon + '',
                            rarity: +raw.rarity || 0,
                            stats: stats,
                            affixDetails: raw.affixDetails,
                        });
                    }
                }
            }
            setItems(arr);
        });
        
        const h2 = GameEvents.Subscribe('update_equipment_ui' as never, (data: any) => {
            if (data && data.equipment) {
                const eq: EquippedItems = {};
                for (const slot in data.equipment) {
                    const raw = data.equipment[slot];
                    if (raw && raw.name) {
                        const stats: Array<{ attribute: string; value: number }> = [];
                        if (raw.stats) {
                            const rawStats = Array.isArray(raw.stats) ? raw.stats : Object.values(raw.stats || {});
                            for (const s of rawStats) {
                                if (s && s.attribute) {
                                    stats.push({ attribute: s.attribute + '', value: +s.value || 0 });
                                }
                            }
                        }
                        (eq as any)[slot] = {
                            id: 'eq_' + slot,
                            name: raw.name + '',
                            type: raw.type + '',
                            icon: raw.icon + '',
                            rarity: +raw.rarity || 0,
                            stats: stats,
                            affixDetails: raw.affixDetails,
                        };
                    }
                }
                setEquipped(eq);
            }
        });
        
        return () => {
            GameEvents.Unsubscribe(h1);
            GameEvents.Unsubscribe(h2);
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [visible]);

    if (!visible) return null;

    // ========== 悬停处理 ==========
    const handleItemMouseOver = (item: VaultItem) => {
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

    // ========== 装备操作 ==========
    const handleEquip = () => {
        if (equipping || !selItem) return;
        setEquipping(true);
        
        const idx = items.findIndex(i => i.id === selItem.id);
        if (idx >= 0) {
            GameEvents.SendCustomGameEventToServer('equip_item_from_vault' as never, {
                PlayerID: Players.GetLocalPlayer(),
                index: idx
            } as never);
        }
        
        Game.EmitSound('ui.crafting_gem_create');
        setSelItem(null);
        setTimeout(() => setEquipping(false), 1500);
    };

    // ========== 获取已装备的同类型物品 ==========
    const getEquippedByType = (type: string): VaultItem | null => {
        for (const slot in equipped) {
            const item = (equipped as any)[slot];
            if (item && item.type === type) {
                return item;
            }
        }
        return null;
    };

    // ========== 渲染物品详情面板 ==========
    const renderItemPanel = (item: VaultItem | null, title: string, isEquipped: boolean) => {
        if (!item) {
            return (
                <Panel style={{ width: '220px', backgroundColor: '#0c0c08', border: '1px solid #333', padding: '10px', flowChildren: 'down' }}>
                    <Label text={title} style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }} />
                    <Label text="无" style={{ fontSize: '11px', color: '#444', horizontalAlign: 'center', marginTop: '30px' }} />
                </Panel>
            );
        }

        const color = QCOLOR[item.rarity] || '#9d9d9d';
        const qualityName = QNAME[item.rarity] || '普通';

        // 处理词缀
        const prefixes: string[] = [];
        const suffixes: string[] = [];
        if (item.affixDetails) {
            for (const k in item.affixDetails) {
                const a = item.affixDetails[k];
                if (a && a.name) {
                    const text = '[T' + (+a.tier || 1) + '] ' + a.name;
                    if (a.position === 'suffix') {
                        suffixes.push(text);
                    } else {
                        prefixes.push(text);
                    }
                }
            }
        }

        return (
            <Panel 
                hittest={true}
                style={{ width: '220px', backgroundColor: '#1a1a1aee', border: '2px solid ' + color, padding: '12px', flowChildren: 'down' }}
                onmouseover={keepHoverPanel}
                onmouseout={handleItemMouseOut}
            >
                <Label text={title} style={{ fontSize: '11px', color: isEquipped ? '#888' : '#ffd700', marginBottom: '8px' }} />
                <Panel style={{ width: '100%', height: '1px', backgroundColor: '#444', marginBottom: '10px' }} />
                
                {/* 名称和图标 */}
                <Panel style={{ flowChildren: 'right', marginBottom: '10px' }}>
                    <Panel style={{ width: '44px', height: '44px', border: '1px solid ' + color, marginRight: '10px', backgroundImage: item.icon ?  'url("' + item.icon + '")' : 'none', backgroundSize: 'cover' }} />
                    <Panel style={{ flowChildren: 'down' }}>
                        <Label text={item.name} style={{ fontSize: '14px', color: color, fontWeight: 'bold' }} />
                        <Label text={qualityName + ' ' + item.type} style={{ fontSize: '10px', color: '#888' }} />
                    </Panel>
                </Panel>
                
                {/* 属性 */}
                {item.stats.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '8px' }}>
                        {item.stats.map((stat, i) => (
                            <Label key={'s' + i} text={'+' + stat.value + ' ' + stat.attribute} style={{ fontSize: '12px', color: '#55ff55' }} />
                        ))}
                    </Panel>
                )}
                
                {/* 词缀 */}
                {prefixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '5px' }}>
                        <Label text={'前缀(' + prefixes.length + ')'} style={{ fontSize: '10px', color: '#9999ff' }} />
                        {prefixes.map((t, i) => <Label key={'p' + i} text={t} style={{ fontSize: '10px', color: '#7777dd', marginLeft: '5px' }} />)}
                    </Panel>
                )}
                {suffixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '5px' }}>
                        <Label text={'后缀(' + suffixes.length + ')'} style={{ fontSize: '10px', color: '#ffdd77' }} />
                        {suffixes.map((t, i) => <Label key={'x' + i} text={t} style={{ fontSize: '10px', color: '#ddaa00', marginLeft: '5px' }} />)}
                    </Panel>
                )}
            </Panel>
        );
    };

    // ========== 当前显示的物品（悬停优先，选中次之）==========
    const displayItem = hoverItem || selItem;
    const equippedSameType = displayItem ? getEquippedByType(displayItem.type) : null;

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '1100px', height: '680px', backgroundColor: '#111', border: '3px solid #8b6914', horizontalAlign: 'center', verticalAlign: 'center', flowChildren: 'down' }}>

                {/* ========== 标题栏 ========== */}
                <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                    <Label text="装备仓库" style={{ fontSize: '18px', color: '#ffd700', marginLeft: '20px', marginTop: '13px' }} />
                    <Label text={'仓库: ' + items.length + '/40'} style={{ fontSize: '12px', color: '#888', marginLeft: '20px', marginTop: '17px' }} />
                    <Panel style={{ width: '750px' }} />
                    <Label text={selItem ? '已选择: ' + selItem.name : '点击选择装备'} style={{ fontSize: '11px', color: selItem ? '#0f0' : '#666', marginTop: '18px' }} />
                </Panel>

                {/* ========== 内容区域 ========== */}
                <Panel style={{ width: '100%', height: '570px', flowChildren: 'right' }}>
                    
                    {/* 左侧：仓库物品列表 */}
                    <Panel style={{ width: '600px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                        <Label text="仓库物品" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '10px' }} />
                        <Panel style={{ width: '100%', height: '520px', flowChildren: 'right-wrap', overflow: 'scroll' }}>
                            {items.map((item) => {
                                const color = QCOLOR[item.rarity] || '#9d9d9d';
                                const isSel = selItem?.id === item.id;
                                return (
                                    <Panel
                                        key={item.id}
                                        hittest={true}
                                        onactivate={() => setSelItem(isSel ? null : item)}
                                        onmouseover={() => handleItemMouseOver(item)}
                                        onmouseout={handleItemMouseOut}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            margin: '4px',
                                            backgroundColor: isSel ? '#2a3a2a' : '#151515',
                                            border: (isSel ?  '3px' : '2px') + ' solid ' + color,
                                            backgroundImage: item.icon ? 'url("' + item.icon + '")' : 'none',
                                            backgroundSize: 'cover',
                                        }}
                                    />
                                );
                            })}
                            {/* 空格子 */}
                            {Array.from({ length: Math.max(0, 40 - items.length) }).map((_, i) => (
                                <Panel key={'e' + i} style={{ width: '64px', height: '64px', margin: '4px', backgroundColor: '#0c0c0c', border: '1px solid #333' }} />
                            ))}
                        </Panel>
                    </Panel>

                    {/* 右侧：对比面板 */}
                    <Panel style={{ width: '490px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                        <Label text="装备对比" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '15px' }} />
                        
                        {displayItem ?  (
                            <Panel style={{ flowChildren: 'right' }}>
                                {/* 悬停/选中的物品 */}
                                {renderItemPanel(displayItem, hoverItem ?  '预览' : '已选择', false)}
                                
                                {/* VS */}
                                <Panel style={{ width: '30px', flowChildren: 'down', marginTop: '80px' }}>
                                    <Label text="VS" style={{ fontSize: '14px', color: '#f80', horizontalAlign: 'center' }} />
                                </Panel>
                                
                                {/* 已装备的同类型 */}
                                {renderItemPanel(equippedSameType, '已装备 ' + (SLOT_NAMES[displayItem.type] || displayItem.type), true)}
                            </Panel>
                        ) : (
                            <Label text="← 悬停或选择物品查看详情" style={{ fontSize: '12px', color: '#555', marginTop: '150px', horizontalAlign: 'center' }} />
                        )}
                        
                        {/* 装备按钮 */}
                        {selItem && ! hoverItem && (
                            <Panel style={{ flowChildren: 'right', marginTop: '20px' }}>
                                <Panel hittest={true} onactivate={handleEquip} style={{ width: '100px', height: '36px', backgroundColor: equipping ? '#333' : '#1a4a1a', border: '2px solid #2a8a2a', marginRight: '15px' }}>
                                    <Label text={equipping ? '装备中...' : '装备'} style={{ fontSize: '14px', color: equipping ? '#888' : '#0f0', horizontalAlign: 'center', marginTop: '8px' }} />
                                </Panel>
                                <Panel hittest={true} onactivate={() => setSelItem(null)} style={{ width: '80px', height: '36px', backgroundColor: '#1a1a1a', border: '2px solid #666' }}>
                                    <Label text="取消" style={{ fontSize: '14px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                                </Panel>
                            </Panel>
                        )}
                    </Panel>
                </Panel>

                {/* ========== 底部按钮 ========== */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                        <Label text="关闭(B)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>

            </Panel>
        </Panel>
    );
};