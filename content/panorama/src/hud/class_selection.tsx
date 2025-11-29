import React, { useState } from 'react';

interface ClassSelectionProps {
    visible: boolean;
    onSelect: (classId: string) => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ visible, onSelect }) => {
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [hoveredClass, setHoveredClass] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    if (!visible) {
        return null;
    }

    const handleSelectWarrior = () => {
        if (isConfirming) return;
        setSelectedClass('warrior');
    };

    const handleSelectLocked = () => {};

    const handleConfirm = () => {
        if (! selectedClass || isConfirming) return;
        setIsConfirming(true);
        
        const playerId = Players.GetLocalPlayer();
        GameEvents.SendCustomGameEventToServer('select_class' as never, {
            PlayerID: playerId,
            classId: selectedClass,
        } as never);
    };

    const isWarriorSelected = selectedClass === 'warrior';
    const isWarriorHovered = hoveredClass === 'warrior';

    return (
        <Panel style={{ width: '100%', height: '100%' }}>
            
            {/* ========== 视频背景层 ========== */}
            <Movie
                src="file://{resources}/videos/class_selection_bg.webm"
                repeat={true}
                autoplay="onload"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
            
            {/* 暗色遮罩 - 让背景不那么亮，突出前景 */}
            <Panel
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000000bb',
                }}
            />
            
            {/* 顶部暗角 */}
            <Panel
                style={{
                    width: '100%',
                    height: '250px',
                    backgroundColor: 'gradient(linear, 0% 0%, 0% 100%, from(#000000ee), to(#00000000))',
                }}
            />
            
            {/* 底部暗角 */}
            <Panel
                style={{
                    width: '100%',
                    height: '250px',
                    backgroundColor: 'gradient(linear, 0% 100%, 0% 0%, from(#000000ee), to(#00000000))',
                    verticalAlign: 'bottom',
                }}
            />

            {/* ========== 装饰边框 ========== */}
            <Panel style={{ width: '100%', height: '6px', backgroundColor: '#0a0a0a' }} />
            <Panel style={{ width: '100%', height: '2px', backgroundColor: '#8b6914', marginTop: '-4px' }} />
            <Panel style={{ width: '50%', height: '1px', backgroundColor: '#ffd700', marginTop: '-1px', horizontalAlign: 'center' }} />
            
            <Panel style={{ width: '100%', height: '6px', backgroundColor: '#0a0a0a', verticalAlign: 'bottom' }} />
            <Panel style={{ width: '100%', height: '2px', backgroundColor: '#8b6914', verticalAlign: 'bottom', marginBottom: '2px' }} />

            {/* ========== 主内容 ========== */}
            <Panel
                style={{
                    width: '100%',
                    height: '100%',
                    flowChildren: 'down',
                    horizontalAlign: 'center',
                    paddingTop: '35px',
                }}
            >
                {/* ===== 标题区域 ===== */}
                <Panel
                    style={{
                        flowChildren: 'down',
                        horizontalAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginBottom: '8px' }}>
                        <Panel style={{ width: '100px', height: '1px', backgroundColor: '#8b6914', marginTop: '6px' }} />
                        <Label text="  ◆  " style={{ fontSize: '12px', color: '#ffd700' }} />
                        <Panel style={{ width: '100px', height: '1px', backgroundColor: '#8b6914', marginTop: '6px' }} />
                    </Panel>
                    
                    <Label
                        text="选择你的职业"
                        style={{
                            fontSize: '50px',
                            color: '#ffd700',
                            fontWeight: 'bold',
                            letterSpacing: '8px',
                        }}
                    />
                    
                    <Label
                        text="CHOOSE YOUR CLASS"
                        style={{
                            fontSize: '12px',
                            color: '#8b6914',
                            letterSpacing: '6px',
                            marginTop: '5px',
                            marginBottom: '8px',
                        }}
                    />
                    
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center' }}>
                        <Panel style={{ width: '50px', height: '1px', backgroundColor: '#5a4510' }} />
                        <Panel style={{ width: '180px', height: '2px', backgroundColor: '#8b6914', marginLeft: '5px', marginRight: '5px' }} />
                        <Panel style={{ width: '50px', height: '1px', backgroundColor: '#5a4510' }} />
                    </Panel>
                </Panel>

                {/* ===== 职业卡片区域 ===== */}
                <Panel
                    style={{
                        flowChildren: 'right',
                        horizontalAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    {/* ========== 战士卡片 ========== */}
                    <Panel
                        hittest={true}
                        style={{
                            width: '400px',
                            height: '460px',
                            marginRight: '40px',
                            flowChildren: 'down',
                            backgroundColor: isWarriorSelected ?  '#0f1a0fdd' : (isWarriorHovered ?  '#15151088' : '#0c0c0ccc'),
                            border: isWarriorSelected 
                                ? '2px solid #00cc00' 
                                : (isWarriorHovered ? '2px solid #8b6914' : '2px solid #3a302088'),
                        }}
                        onactivate={handleSelectWarrior}
                        onmouseover={() => setHoveredClass('warrior')}
                        onmouseout={() => setHoveredClass(null)}
                    >
                        <Panel style={{ width: '100%', height: '3px', backgroundColor: isWarriorSelected ?  '#00cc00' : '#8b6914' }} />
                        
                        <Panel style={{ width: '100%', height: '180px', backgroundColor: '#0a0a08' }}>
                            <Image
                                src="file://{images}/heroes/npc_dota_hero_axe.png"
                                style={{ width: '100%', height: '180px' }}
                            />
                            <Panel
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    backgroundColor: 'gradient(linear, 0% 0%, 0% 100%, from(#00000000), to(#0c0c0c))',
                                    verticalAlign: 'bottom',
                                }}
                            />
                        </Panel>

                        <Panel
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#0a0a08ee',
                                borderBottom: '1px solid #3a3020',
                                flowChildren: 'down',
                                horizontalAlign: 'center',
                            }}
                        >
                            <Label text="战  士" style={{ fontSize: '30px', color: '#ffd700', fontWeight: 'bold', letterSpacing: '8px' }} />
                            <Label text="WARRIOR" style={{ fontSize: '10px', color: '#8b6914', letterSpacing: '4px', marginTop: '2px' }} />
                            <Label text="近战物理输出" style={{ fontSize: '13px', color: '#ff6600', marginTop: '6px' }} />
                        </Panel>

                        <Panel
                            style={{
                                width: '100%',
                                padding: '10px 15px',
                                flowChildren: 'down',
                                backgroundColor: '#080808ee',
                            }}
                        >
                            <Label text="以怒气为力量源泉的近战勇士" style={{ fontSize: '12px', color: '#777777', marginBottom: '8px', horizontalAlign: 'center' }} />
                            
                            <Panel style={{ flowChildren: 'right', marginBottom: '4px' }}>
                                <Label text="资源：" style={{ fontSize: '12px', color: '#555555', width: '45px' }} />
                                <Label text="怒气" style={{ fontSize: '12px', color: '#ff4444', fontWeight: 'bold' }} />
                            </Panel>
                            <Panel style={{ flowChildren: 'right', marginBottom: '8px' }}>
                                <Label text="被动：" style={{ fontSize: '12px', color: '#555555', width: '45px' }} />
                                <Label text="重伤" style={{ fontSize: '12px', color: '#00ff00', fontWeight: 'bold' }} />
                                <Label text=" - 暴击触发流血" style={{ fontSize: '11px', color: '#444444' }} />
                            </Panel>
                            
                            <Panel style={{ width: '85%', height: '1px', backgroundColor: '#3a3020', marginBottom: '8px', horizontalAlign: 'center' }} />
                            
                            <Panel style={{ flowChildren: 'right', marginBottom: '3px' }}>
                                <Label text="►" style={{ fontSize: '10px', color: '#8b6914', marginRight: '6px' }} />
                                <Label text="高爆发伤害" style={{ fontSize: '11px', color: '#999999' }} />
                            </Panel>
                            <Panel style={{ flowChildren: 'right', marginBottom: '3px' }}>
                                <Label text="►" style={{ fontSize: '10px', color: '#8b6914', marginRight: '6px' }} />
                                <Label text="强力AOE技能" style={{ fontSize: '11px', color: '#999999' }} />
                            </Panel>
                            <Panel style={{ flowChildren: 'right' }}>
                                <Label text="►" style={{ fontSize: '10px', color: '#8b6914', marginRight: '6px' }} />
                                <Label text="坚韧生存能力" style={{ fontSize: '11px', color: '#999999' }} />
                            </Panel>
                        </Panel>

                        {isWarriorSelected && (
                            <Panel style={{ width: '100%', height: '38px', backgroundColor: '#0a4a0aee', borderTop: '2px solid #00cc00' }}>
                                <Label text="◆ 已选择 ◆" style={{ fontSize: '15px', color: '#00ff00', fontWeight: 'bold', horizontalAlign: 'center', marginTop: '9px' }} />
                            </Panel>
                        )}
                    </Panel>

                    {/* ========== 锁定职业卡片 ========== */}
                    <Panel
                        hittest={true}
                        style={{
                            width: '400px',
                            height: '460px',
                            flowChildren: 'down',
                            backgroundColor: '#080808aa',
                            border: '2px solid #22222288',
                            opacity: '0.5',
                        }}
                        onactivate={handleSelectLocked}
                    >
                        <Panel style={{ width: '100%', height: '3px', backgroundColor: '#333333' }} />
                        
                        <Panel style={{ width: '100%', height: '180px', backgroundColor: '#0a0a0a', horizontalAlign: 'center' }}>
                            <Label text="?" style={{ fontSize: '100px', color: '#222222', marginTop: '30px', horizontalAlign: 'center' }} />
                        </Panel>

                        <Panel style={{ width: '100%', padding: '12px', backgroundColor: '#060606', flowChildren: 'down', horizontalAlign: 'center' }}>
                            <Label text="?? ?" style={{ fontSize: '30px', color: '#333333', fontWeight: 'bold' }} />
                            <Label text="LOCKED" style={{ fontSize: '10px', color: '#222222', letterSpacing: '4px', marginTop: '3px' }} />
                            <Label text="(尚未开发)" style={{ fontSize: '13px', color: '#552222', marginTop: '8px' }} />
                        </Panel>

                        <Panel style={{ width: '100%', padding: '15px', flowChildren: 'down', horizontalAlign: 'center' }}>
                            <Label text="神秘职业" style={{ fontSize: '15px', color: '#333333', marginTop: '15px' }} />
                            <Panel style={{ width: '120px', height: '1px', backgroundColor: '#222222', marginTop: '12px', marginBottom: '12px' }} />
                            <Label text="敬请期待" style={{ fontSize: '13px', color: '#222222' }} />
                        </Panel>
                    </Panel>
                </Panel>

                {/* ===== 底部选择信息 ===== */}
                <Panel
                    style={{
                        width: '840px',
                        height: '60px',
                        backgroundColor: '#0a0a0acc',
                        border: '2px solid #3a302088',
                        marginBottom: '15px',
                        horizontalAlign: 'center',
                    }}
                >
                    <Panel style={{ width: '3px', height: '100%', backgroundColor: '#8b6914' }} />
                    
                    {isWarriorSelected ?  (
                        <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginTop: '17px', marginLeft: '15px' }}>
                            <Label text="◆" style={{ fontSize: '12px', color: '#00ff00', marginRight: '8px' }} />
                            <Label text="已选择" style={{ fontSize: '14px', color: '#00ff00', marginRight: '12px' }} />
                            <Label text="战士" style={{ fontSize: '22px', color: '#ffd700', fontWeight: 'bold', marginRight: '15px' }} />
                            <Label text="近战物理输出 | 怒气系统 | 高爆发AOE" style={{ fontSize: '12px', color: '#777777', marginTop: '5px' }} />
                        </Panel>
                    ) : (
                        <Label text="— 请选择一个职业开始你的冒险 —" style={{ fontSize: '16px', color: '#555555', horizontalAlign: 'center', marginTop: '18px', marginLeft: '15px' }} />
                    )}
                    
                    <Panel style={{ width: '3px', height: '100%', backgroundColor: '#8b6914', horizontalAlign: 'right' }} />
                </Panel>

                {/* ===== 确认按钮 ===== */}
                <Panel
                    hittest={true}
                    style={{
                        width: '260px',
                        height: '50px',
                        backgroundColor: selectedClass ?  (isConfirming ? '#333333cc' : '#1a5a1acc') : '#151515cc',
                        border: selectedClass ?  '2px solid #00aa00' : '2px solid #33333388',
                        horizontalAlign: 'center',
                    }}
                    onactivate={handleConfirm}
                    onmouseover={(panel) => {
                        if (selectedClass && ! isConfirming) {
                            panel.style.backgroundColor = '#226622cc';
                        }
                    }}
                    onmouseout={(panel) => {
                        if (selectedClass && ! isConfirming) {
                            panel.style.backgroundColor = '#1a5a1acc';
                        }
                    }}
                >
                    <Panel style={{ width: '100%', height: '2px', backgroundColor: selectedClass ? '#00cc00' : '#333333' }} />
                    <Label
                        text={isConfirming ? '正在进入.. .' : (selectedClass ? '◆ 确认选择 ◆' : '请先选择职业')}
                        style={{ fontSize: '18px', color: selectedClass ? '#ffffff' : '#444444', fontWeight: 'bold', horizontalAlign: 'center', marginTop: '12px' }}
                    />
                </Panel>

                <Label text="职业选择后无法更改，请谨慎选择" style={{ fontSize: '10px', color: '#444444', marginTop: '8px' }} />
            </Panel>
        </Panel>
    );
};