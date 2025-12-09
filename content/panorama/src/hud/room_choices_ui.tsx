import React, { useState, useEffect } from 'react';

interface RoomChoice {
    id: string;
    name: string;
    description: string;
    type: 'buff' | 'debuff' | 'neutral';
    mfModifier: number;
    effects: {
        playerDamage?:  number;
        playerHealth?: number;
        playerSpeed?: number;
        monsterDamage?: number;
        monsterHealth?: number;
        monsterSpeed?: number;
        monsterCount?: number;
    };
}

interface RoomChoicesData {
    instanceId: string;
    roomName: string;
    roomDescription: string;
    currentMF: number;
    choices: RoomChoice[];
}

interface RoomChoicesUIProps {
    visible: boolean;
    onClose:  () => void;
}

/**
 * MF房间选择UI组件
 */
export const RoomChoicesUI: React.FC<RoomChoicesUIProps> = ({ visible, onClose }) => {
    const [data, setData] = useState<RoomChoicesData | null>(null);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);

    useEffect(() => {
        $.Msg('[RoomChoicesUI] 组件挂载，注册事件监听');

        const listener = GameEvents.Subscribe('show_room_choices', (eventData: any) => {
            $.Msg('[RoomChoicesUI] 收到房间选择事件');
            $.Msg(`[RoomChoicesUI] roomName: ${eventData.roomName}`);
            $.Msg(`[RoomChoicesUI] currentMF: ${eventData.currentMF}`);
            $.Msg(`[RoomChoicesUI] choices:   ${JSON.stringify(eventData.choices)}`);
            
            // 处理choices数组
            let choicesArray: RoomChoice[] = [];
            if (Array.isArray(eventData.choices)) {
                choicesArray = eventData.choices;
            } else if (eventData.choices) {
                choicesArray = Object.values(eventData.choices);
            }
            
            setData({
                instanceId: eventData.instanceId,
                roomName:  eventData.roomName || '未知房间',
                roomDescription: eventData.roomDescription || '',
                currentMF: eventData.currentMF || 0,
                choices: choicesArray
            });
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, []);

    const selectChoice = (choiceId: string) => {
        if (! data || selectedChoice) return;

        $.Msg(`[RoomChoicesUI] 选择:  ${choiceId}`);
        
        setSelectedChoice(choiceId);
        Game.EmitSound('ui.button_click');

        // 发送选择事件到服务器
        (GameEvents.SendCustomGameEventToServer as any)('roguelike_room_choice', {
            PlayerID: Players.GetLocalPlayer(),
            instanceId: data.instanceId,
            choiceId: choiceId
        });

        // 1秒后关闭UI
        $.Schedule(1.0, () => {
            setData(null);
            setSelectedChoice(null);
            onClose();
        });
    };

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'buff':  return '#00ff00';
            case 'debuff': return '#ff6600';
            case 'neutral': return '#888888';
            default: return '#ffffff';
        }
    };

    const getTypeBorderColor = (type: string): string => {
        switch (type) {
            case 'buff':  return '#00aa00';
            case 'debuff': return '#ff4400';
            case 'neutral': return '#666666';
            default: return '#444444';
        }
    };

    const getTypeIcon = (type: string): string => {
        switch (type) {
            case 'buff':  return '✅';
            case 'debuff': return '⚠️';
            case 'neutral': return '⚖️';
            default: return '❓';
        }
    };

    const formatEffects = (choice: RoomChoice): string[] => {
        const effects: string[] = [];
        const e = choice.effects;
        
        if (e.playerDamage) effects.push(`攻击力 ${e.playerDamage > 0 ? '+' : ''}${e.playerDamage}%`);
        if (e.playerHealth) effects.push(`生命值 ${e.playerHealth > 0 ? '+' : ''}${e.playerHealth}%`);
        if (e.playerSpeed) effects.push(`移动速度 ${e.playerSpeed > 0 ? '+' : ''}${e.playerSpeed}%`);
        if (e.monsterDamage) effects.push(`怪物伤害 ${e.monsterDamage > 0 ? '+' : ''}${e.monsterDamage}%`);
        if (e.monsterHealth) effects.push(`怪物生命 ${e.monsterHealth > 0 ? '+' : ''}${e.monsterHealth}%`);
        if (e.monsterSpeed) effects.push(`怪物速度 ${e.monsterSpeed > 0 ? '+' :  ''}${e.monsterSpeed}%`);
        if (e.monsterCount) effects.push(`怪物数量 ${e.monsterCount > 0 ? '+' : ''}${e.monsterCount}%`);
        
        return effects;
    };

    if (!visible || !data || data.choices.length === 0) return null;

    $.Msg(`[RoomChoicesUI] 渲染，选项数量: ${data.choices.length}`);

    return (
        <Panel style={{
            width: '100%',
            height: '100%',
            align: 'center center',
            zIndex: 15000,
            backgroundColor: '#000000dd',
        }}>
            <Panel style={{
                width: '900px',
                maxHeight: '800px',
                backgroundColor: '#1a1a2edd',
                border: '3px solid #ffd700',
                padding: '30px',
                flowChildren: 'down',
            }}>
                {/* 标题区域 */}
                <Panel style={{
                    width: '100%',
                    flowChildren: 'down',
                    marginBottom: '20px',
                }}>
                    <Label text={`⚔️ ${data.roomName}`} style={{ 
                        fontSize: '42px', 
                        color:  '#ffd700', 
                        textAlign: 'center', 
                        marginBottom: '10px',
                        textShadow: '2px 2px 4px #000000'
                    }} />
                    
                    {data.roomDescription && (
                        <Label text={data.roomDescription} style={{ 
                            fontSize: '22px', 
                            color:  '#cccccc', 
                            textAlign: 'center', 
                            marginBottom: '10px'
                        }} />
                    )}
                    
                    {/* 当前MF显示 */}
                    <Panel style={{
                        width: '100%',
                        height: '50px',
                        backgroundColor: '#0f3460',
                        border: '2px solid #16213e',
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                        marginTop: '10px',
                    }}>
                        <Label text="当前 Magic Find:" style={{
                            fontSize: '24px',
                            color: '#ffffff',
                            marginRight: '15px',
                        }} />
                        <Label text={`${data.currentMF}%`} style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: data.currentMF >= 0 ? '#44ff44' : '#ff4444',
                        }} />
                    </Panel>
                </Panel>
                
                {/* 选项列表 */}
                <Panel style={{
                    flowChildren: 'down',
                    width: '100%',
                   overflow: 'squish scroll' ,
                    maxHeight: '500px',
                }}>
                    {data.choices.map((choice) => {
                        const isSelected = selectedChoice === choice.id;
                        const isHovered = hoveredChoice === choice.id;
                        const typeColor = getTypeColor(choice.type);
                        const borderColor = getTypeBorderColor(choice.type);
                        const effects = formatEffects(choice);
                        
                        return (
                            <Panel
                                key={choice.id}
                                onactivate={() => !isSelected && selectChoice(choice.id)}
                                onmouseover={() => {
                                    if (! isSelected) {
                                        setHoveredChoice(choice.id);
                                        Game.EmitSound('ui.button_over');
                                    }
                                }}
                                onmouseout={() => setHoveredChoice(null)}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    backgroundColor:  isSelected ? '#2a4a2a' : (isHovered ? '#2a2a4a' : '#1a1a2a'),
                                    border: isSelected ? '4px solid #00ff00' : (isHovered ?  `3px solid ${typeColor}` : `2px solid ${borderColor}`),
                                    borderLeft: `8px solid ${typeColor}`,
                                    marginBottom: '12px',
                                    padding: '20px',
                                    flowChildren: 'right',
                                    opacity: isSelected ? '0.7' : '1.0',
                                }}
                            >
                                {/* 图标区域 */}
                                <Panel style={{
                                    width: '80px',
                                    height:  '80px',
                                    backgroundColor: '#333333',
                                    border:  `2px solid ${typeColor}`,
                                    verticalAlign: 'center',
                                    horizontalAlign: 'center',
                                    marginRight: '20px',
                                }}>
                                    <Label text={getTypeIcon(choice.type)} style={{
                                        fontSize: '48px',
                                        textAlign: 'center',
                                    }} />
                                </Panel>
                                
                                {/* 信息区域 */}
                                <Panel style={{
                                    width: 'fill-parent-flow(1.0)',
                                    flowChildren: 'down',
                                    verticalAlign: 'center',
                                }}>
                                    {/* 名称 */}
                                    <Label text={choice.name} style={{
                                        fontSize: '28px',
                                        fontWeight: 'bold',
                                        color: typeColor,
                                        marginBottom: '8px',
                                    }} />
                                    
                                    {/* 描述 */}
                                    <Label text={choice.description} style={{
                                        fontSize: '20px',
                                        color:  '#cccccc',
                                        marginBottom: '10px',
                                    }} />
                                    
                                    {/* 效果列表 */}
                                    {effects.length > 0 && (
                                        <Panel style={{
                                            flowChildren: 'right',
                                            marginBottom:  '5px',
                                        }}>
                                            {effects.map((effect, idx) => (
                                                <Label 
                                                    key={idx}
                                                    text={effect} 
                                                    style={{
                                                        fontSize: '16px',
                                                        color: '#aaaaaa',
                                                        marginRight: '15px',
                                                        backgroundColor: '#222222',
                                                        padding: '4px 8px',
                                                    }} 
                                                />
                                            ))}
                                        </Panel>
                                    )}
                                </Panel>
                                
                                {/* MF修正值 */}
                                <Panel style={{
                                    width:  '120px',
                                    verticalAlign: 'center',
                                    horizontalAlign: 'right',
                                }}>
                                    <Panel style={{
                                        flowChildren: 'down',
                                        horizontalAlign: 'center',
                                    }}>
                                        <Label text="MF" style={{
                                            fontSize:  '18px',
                                            color: '#888888',
                                            textAlign: 'center',
                                            marginBottom: '5px',
                                        }} />
                                        <Label 
                                            text={`${choice.mfModifier > 0 ? '+' : ''}${choice.mfModifier}%`} 
                                            style={{
                                                fontSize: '36px',
                                                fontWeight: 'bold',
                                                color: choice.mfModifier > 0 ? '#44ff44' : (choice.mfModifier < 0 ? '#ff4444' : '#888888'),
                                                textAlign: 'center',
                                            }} 
                                        />
                                    </Panel>
                                </Panel>
                            </Panel>
                        );
                    })}
                </Panel>
                
                {/* 提示文字 */}
                <Label text="💡 选择后无法更改，请谨慎选择！" style={{
                    fontSize:  '20px',
                    color: '#ff6666',
                    textAlign: 'center',
                    marginTop: '20px',
                    fontStyle: 'italic',
                }} />
                
                {selectedChoice && (
                    <Label text="✅ 选择已确认，正在进入房间..." style={{
                        fontSize: '24px',
                        color: '#00ff00',
                        textAlign: 'center',
                        marginTop: '10px',
                        fontWeight: 'bold',
                    }} />
                )}
            </Panel>
        </Panel>
    );
};