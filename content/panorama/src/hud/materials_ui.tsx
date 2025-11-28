import React, { useState, useEffect } from 'react';

// 材料物品接口
interface MaterialItem {
    type: string;
    name: string;
    icon: string;
    color: string;
    count: number;
}

interface MaterialsUIProps {
    visible: boolean;
    onClose: () => void;
}

export const MaterialsUI: React.FC<MaterialsUIProps> = ({ visible, onClose }) => {
    const [materials, setMaterials] = useState<MaterialItem[]>([]);

// ==================== 从网表获取数据 ====================
useEffect(() => {
    if (!visible) return;

    $. Msg('[MaterialsUI] 界面打开，从网表获取材料数据');

    const playerId = Players.GetLocalPlayer();
    
    // ⭐ 将网表对象转换为数组
    const convertToArray = (data: any): MaterialItem[] => {
        if (!data || ! data.items) return [];
        
        const items = data.items;
        
        // 如果已经是数组，直接返回
        if (Array.isArray(items)) {
            return items;
        }
        
        // 如果是对象，转换为数组
        const result: MaterialItem[] = [];
        for (const key in items) {
            if (items[key]) {
                result.push(items[key]);
            }
        }
        return result;
    };
    
    // 从网表读取初始数据
    const loadMaterials = () => {
        const data = CustomNetTables.GetTableValue('player_materials', playerId.toString());
        const items = convertToArray(data);
        setMaterials(items);
        $. Msg(`[MaterialsUI] 从网表加载 ${items.length} 种材料`);
    };
    
    // 初始加载
    loadMaterials();
    
    // 监听网表变化
    const listener = CustomNetTables. SubscribeNetTableListener('player_materials', (_, key, value) => {
        if (key === playerId.toString() && value) {
            $.Msg('[MaterialsUI] 网表数据更新');
            const items = convertToArray(value);
            setMaterials(items);
        }
    });

    return () => {
        CustomNetTables.UnsubscribeNetTableListener(listener);
    };
}, [visible]);

    if (!visible) return null;

    // 获取材料稀有度颜色
    const getMaterialColor = (item: MaterialItem): string => {
        return item.color || '#ffffff';
    };

    return (
        <Panel
            style={{
                width: '280px',
                height: '520px',
                backgroundColor: '#1c1410',
                border: '4px solid #8b7355',
                flowChildren: 'down',
                horizontalAlign: 'right',
                verticalAlign: 'center',
                marginRight: '20px',
            }}
        >
            {/* 标题栏 */}
            <Panel
                style={{
                    width: '100%',
                    height: '60px',
                    backgroundColor: '#2a1f1a',
                    borderBottom: '3px solid #8b7355',
                    flowChildren: 'right',
                    padding: '10px 15px',
                }}
            >
                <Label
                    text="📦 材料背包"
                    style={{
                        fontSize: '24px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                    }}
                />
                {/* 弹性空间 */}
                <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                {/* 关闭按钮 */}
                <Button
                    onactivate={onClose}
                    style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#8b0000',
                        border: '2px solid #ff0000',
                    }}
                    onmouseover={(panel) => {
                        panel. style.backgroundColor = '#b22222';
                    }}
                    onmouseout={(panel) => {
                        panel.style.backgroundColor = '#8b0000';
                    }}
                >
                    <Label text="✕" style={{ fontSize: '24px', color: 'white', textAlign: 'center' }} />
                </Button>
            </Panel>

            {/* 材料列表 */}
            <Panel
                style={{
                    width: '100%',
                    height: '460px',
                    padding: '10px',
                    flowChildren: 'down',
                    overflow: 'squish scroll',
                }}
            >
                {materials.length === 0 ?  (
                    <Label
                        text="暂无材料"
                        style={{
                            fontSize: '18px',
                            color: '#888888',
                            textAlign: 'center',
                            marginTop: '20px',
                        }}
                    />
                ) : (
                    materials.map((item, index) => (
                        <Panel
                            key={`material-${index}`}
                            style={{
                                width: '100%',
                                height: '50px',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${getMaterialColor(item)}`,
                                marginBottom: '5px',
                                flowChildren: 'right',
                                padding: '5px',
                            }}
                            onmouseover={(panel) => {
                                panel.style.backgroundColor = '#1a1a1a';
                            }}
                            onmouseout={(panel) => {
                                panel.style.backgroundColor = '#0a0a0a';
                            }}
                        >
                            {/* 材料图标 */}
                            <Image
                                src={item.icon}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    marginRight: '10px',
                                }}
                            />
                            {/* 材料名称 */}
                            <Label
                                text={item.name}
                                style={{
                                    fontSize: '16px',
                                    color: getMaterialColor(item),
                                    fontWeight: 'bold',
                                    marginTop: '10px',
                                }}
                            />
                            {/* 弹性空间 */}
                            <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                            {/* 材料数量 */}
                            <Label
                                text={`x${item.count}`}
                                style={{
                                    fontSize: '18px',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    marginTop: '10px',
                                    marginRight: '5px',
                                }}
                            />
                        </Panel>
                    ))
                )}
            </Panel>
        </Panel>
    );
};