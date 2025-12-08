import React, { useState, useEffect } from 'react';
import { render } from 'react-panorama-x';

interface BranchOption {
    roomId: string;
    roomName: string;
    description: string;
}

interface BranchSelectionData {
    instanceId: string;
    options: BranchOption[];
}

interface RoguelikeBranchSelectionProps {
    visible: boolean;
    onClose: () => void;
}

/**
 * Roguelike分支选择UI组件
 */
export const RoguelikeBranchSelection: React.FC<RoguelikeBranchSelectionProps> = ({ visible, onClose }) => {
    const [data, setData] = useState<BranchSelectionData | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        $.Msg('[RoguelikeBranchSelection] 组件挂载，注册事件监听');

        const listener = GameEvents.Subscribe('roguelike_show_branch_selection', (eventData: any) => {
            $.Msg('[RoguelikeBranchSelection] 收到分支选择事件');
            $.Msg(`[RoguelikeBranchSelection] instanceId: ${eventData.instanceId}`);
            $.Msg(`[RoguelikeBranchSelection] options: ${JSON.stringify(eventData.options)}`);
            
            setData({
                instanceId: eventData.instanceId,
                options: eventData.options || []
            });
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, []);

    const selectBranch = (roomId: string) => {
        if (!data) return;

        $.Msg(`[RoguelikeBranchSelection] 选择分支: ${roomId}`);
        
        setSelectedOption(roomId);

        // 发送选择事件到服务器
        // @ts-ignore
        GameEvents.SendCustomGameEventToServer('roguelike_select_branch', {
            PlayerID: Players.GetLocalPlayer(),
            instanceId: data.instanceId,
            roomId: roomId
        });

        // 1秒后关闭UI
        $.Schedule(1.0, () => {
            setData(null);
            setSelectedOption(null);
            onClose();
        });
    };

    if (!visible || !data || data.options.length === 0) return null;

    $.Msg(`[RoguelikeBranchSelection] 渲染，选项数量: ${data.options.length}`);

    return (
        <Panel style={{
            width: '100%',
            height: '100%',
            align: 'center center',
            zIndex: 15000,
            backgroundColor: '#000000dd',
        }}>
            <Panel style={{
                width: '800px',
                maxHeight: '600px',
                backgroundColor: '#1a1a2edd',
                border: '3px solid #ffd700',
                padding: '30px',
                flowChildren: 'down',
            }}>
                <Label text="🎮 选择你的下一个挑战" style={{ 
                    fontSize: '42px', 
                    color: '#ffd700', 
                    textAlign: 'center', 
                    marginBottom: '30px',
                    textShadow: '2px 2px 4px #000000'
                }} />
                
                {/* 选项列表 */}
                <Panel style={{
                    flowChildren: 'down',
                    width: '100%',
                }}>
                    {data.options.map((option, index) => {
                        const isSelected = selectedOption === option.roomId;
                        
                        return (
                            <Panel
                                key={option.roomId}
                                onactivate={() => !isSelected && selectBranch(option.roomId)}
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    backgroundColor: isSelected ? '#3a5a3a' : '#2a2a3a',
                                    border: isSelected ? '3px solid #00ff00' : '2px solid #4a4a6a',
                                    marginBottom: '20px',
                                    padding: '20px',
                                    flowChildren: 'down',
                                }}
                                onmouseover={(panel) => {
                                    if (!isSelected) {
                                        panel.style.backgroundColor = '#3a3a4a';
                                        panel.style.border = '2px solid #ffd700';
                                    }
                                }}
                                onmouseout={(panel) => {
                                    if (!isSelected) {
                                        panel.style.backgroundColor = '#2a2a3a';
                                        panel.style.border = '2px solid #4a4a6a';
                                    }
                                }}
                            >
                                <Label text={`${getIcon(option.roomName)} ${option.roomName}`} style={{
                                    fontSize: '32px',
                                    color: isSelected ? '#00ff00' : '#ffd700',
                                    marginBottom: '10px',
                                    textShadow: '1px 1px 2px #000000'
                                }} />
                                
                                <Label text={option.description} style={{
                                    fontSize: '22px',
                                    color: isSelected ? '#ccffcc' : '#cccccc'
                                }} />
                                
                                {isSelected && (
                                    <Label text="✓ 已选择" style={{
                                        fontSize: '20px',
                                        color: '#00ff00',
                                        marginTop: '5px'
                                    }} />
                                )}
                            </Panel>
                        );
                    })}
                </Panel>
                
                {/* 提示文本 */}
                <Label text={selectedOption ? '等待传送...' : '点击选择房间'} style={{
                    fontSize: '20px',
                    color: selectedOption ? '#00ff00' : '#999999',
                    textAlign: 'center',
                    marginTop: '20px'
                }} />
            </Panel>
        </Panel>
    );
};

/**
 * 根据房间名称获取图标
 */
function getIcon(roomName: string): string {
    if (roomName.includes('积分') || roomName.includes('挑战')) {
        return '🎯';
    } else if (roomName.includes('剿灭') || roomName.includes('清怪')) {
        return '⚔️';
    } else if (roomName.includes('生存')) {
        return '⏱️';
    } else if (roomName.includes('Boss') || roomName.includes('BOSS')) {
        return '👹';
    }
    return '🔹';
}
