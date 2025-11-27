import React, { useState, useEffect } from 'react';
// ⭐ 添加这一行
declare const Timers: {
    CreateTimer(delay: number, callback: () => number | undefined): void;
};
interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    attribute: string;
    value: number;
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

    // ==================== 数据加载逻辑 ====================
    useEffect(() => {
        if (!   visible) return;

        $.   Msg('[VaultUI] 界面打开，请求仓库数据');
        
        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        const listener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            $.  Msg('[VaultUI] 收到仓库数据:', data);
            
            const items: ExternalRewardItem[] = [];
            if (data.items) {
                if (Array.isArray(data.items)) {
                    items.push(...data.items);
                } else if (typeof data.items === 'object') {
                    for (const key in data.items) {
                        items.push(data.items[key]);
                    }
                }
            }
            
            setVaultItems(items);
            $. Msg(`[VaultUI] 显示 ${items.length} 件装备`);
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, [visible]);

    // ==================== 装备物品逻辑 ====================
    const onEquipItem = (index: number) => {
        $. Msg(`[VaultUI] 装备索引 ${index} 的装备`);
        
        (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players.GetLocalPlayer(),
            index: index
        });

        Game.EmitSound('ui.  crafting_gem_create');
        
        // ⭐ 装备后关闭确认框并刷新数据
        setSelectedItem(null);
        
        // ⭐ 延迟请求更新数据（等服务器处理完）
        Timers.CreateTimer(0.1, () => {
            (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
                PlayerID: Players.GetLocalPlayer()
            });
            return undefined;
        });
    };

    if (!visible) return null;

    // 网格配置：8列 x 5行 = 40个格子
    const COLUMNS = 8;
    const ROWS = 5;
    const TOTAL_SLOTS = COLUMNS * ROWS;
    const emptySlots = TOTAL_SLOTS - vaultItems.length;

    // ==================== 获取物品品质颜色 ====================
    const getQualityColor = (item: ExternalRewardItem): string => {
        if (item.value >= 15) return '#ff8000'; // 橙色 - 传说
        if (item.value >= 12) return '#a335ee'; // 紫色 - 史诗
        if (item.   value >= 8) return '#0070dd';  // 蓝色 - 稀有
        if (item.   value >= 5) return '#1eff00';  // 绿色 - 优秀
        return '#9d9d9d';                        // 灰色 - 普通
    };

    return (
        /* 全屏背景遮罩 */
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
                    width: '740px',
                    height: '520px',
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
                    {/* 弹性空间 */}
                    <Panel style={{ width: '100%', height: '1px' }} />
                    {/* 关闭按钮 */}
                    <Button 
                        onactivate={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#8b0000',
                            border: '2px solid #ff0000',
                        }}
                        onmouseover={(panel) => {
                            panel.   style.backgroundColor = '#b22222';
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
                    {/* 已有物品 */}
                    {vaultItems.map((item, index) => {
                        const qualityColor = getQualityColor(item);
                        const normalBorder = `3px solid ${qualityColor}`;
                        const hoverBorder = `4px solid ${qualityColor}`;
                        
                        return (
                            <Panel 
                                key={`item-${index}`}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '2px',
                                    backgroundColor: '#0a0a0a',
                                    border: normalBorder,
                                    backgroundImage: `url("${item.icon}")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                onactivate={() => {
                                    Game.EmitSound('ui. button_click');
                                    setSelectedItem(index);
                                }}
                                onmouseover={(panel) => {
                                    panel.style.border = hoverBorder;
                                    panel.style. backgroundColor = '#1a1a1a';
                                }}
                                onmouseout={(panel) => {
                                    panel. style.border = normalBorder;
                                    panel.style. backgroundColor = '#0a0a0a';
                                }}
                            >
                                {/* 选中高亮 */}
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

                    {/* 空格子 */}
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
            </Panel>

            {/* 装备确认面板 */}
            {selectedItem !== null && vaultItems[selectedItem] && (() => {
                const item = vaultItems[selectedItem];
                const qualityColor = getQualityColor(item);
                
                return (
                    <Panel style={{
                        width: '500px',
                        backgroundColor: '#1a1a1aee',
                        border: '4px solid #ffd700',
                        padding: '30px',
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                        zIndex: 300,
                        flowChildren: 'down',
                    }}>
                        {/* 标题 */}
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
                        
                        {/* 装备信息卡片 */}
                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: `3px solid ${qualityColor}`,
                            padding: '25px',
                            marginBottom: '35px',
                            flowChildren: 'down',
                        }}>
                            {/* 装备图标 */}
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
                            
                            {/* 装备名称 */}
                            <Label 
                                text={item. name}
                                style={{
                                    fontSize: '28px',
                                    color: qualityColor,
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    marginBottom: '12px',
                                }}
                            />
                            
                            {/* 装备类型 */}
                            <Label 
                                text={item.type}
                                style={{
                                    fontSize: '22px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '20px',
                                }}
                            />
                            
                            {/* 分隔线 */}
                            <Panel style={{
                                width: '100%',
                                height: '2px',
                                backgroundColor: '#555555',
                                marginBottom: '20px',
                            }} />
                            
                            {/* 装备属性 */}
                            <Label 
                                text={`+${item.value} ${item.attribute}`}
                                style={{
                                    fontSize: '26px',
                                    color: '#00ff00',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                }}
                            />
                        </Panel>
                        
                        {/* 按钮区域 */}
                        <Panel style={{
                            width: '100%',
                            flowChildren: 'down',
                        }}>
                            {/* 确认按钮 */}
                            <Button 
                                onactivate={() => onEquipItem(selectedItem)}
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    backgroundColor: '#4caf50',
                                    marginBottom: '15px',
                                }}
                                onmouseover={(panel) => {
                                    panel.style.backgroundColor = '#66bb6a';
                                }}
                                onmouseout={(panel) => {
                                    panel.style.backgroundColor = '#4caf50';
                                }}
                            >
                                <Label text="✔ 确认装备" style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                            </Button>
                            
                            {/* 取消按钮 */}
                            <Button 
                                onactivate={() => setSelectedItem(null)}
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    backgroundColor: '#888888',
                                }}
                                onmouseover={(panel) => {
                                    panel.style.backgroundColor = '#aaaaaa';
                                }}
                                onmouseout={(panel) => {
                                    panel.style.backgroundColor = '#888888';
                                }}
                            >
                                <Label text="✕ 取消" style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                            </Button>
                        </Panel>
                    </Panel>
                );
            })()}
        </Panel>
    );
};