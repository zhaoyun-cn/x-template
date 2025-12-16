import React, { useState, useEffect } from 'react';

interface MFData {
    total:  number;
    breakdown: Array<{
        source: string;
        value: number;
        type: string;
        description: string;
    }>;
}

/**
 * MF显示HUD组件
 */
export const MFDisplay: React.FC = () => {
    const [mfData, setMfData] = useState<MFData>({ total: 0, breakdown: [] });
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const listener = GameEvents.Subscribe('update_magic_find', (data: any) => {
            $. Msg(`[MFDisplay] 更新 MF: ${data.total}%`);
            
            let breakdownArray = [];
            if (Array.isArray(data.breakdown)) {
                breakdownArray = data.breakdown;
            } else if (data.breakdown) {
                breakdownArray = Object.values(data.breakdown);
            }
            
            setMfData({
                total: data.total || 0,
                breakdown: breakdownArray
            });
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, []);

    const getMFColor = (value: number): string => {
        if (value > 50) return '#44ff44';
        if (value > 0) return '#88ff88';
        if (value < -50) return '#ff4444';
        if (value < 0) return '#ff8888';
        return '#888888';
    };

    return (
        <Panel style={{
            width: '220px',
            height: '60px',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            marginTop: '100px',
            marginRight: '20px',
        }}>
            <Panel 
                onmouseover={() => setShowTooltip(true)}
                onmouseout={() => setShowTooltip(false)}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor:  'gradient(linear, 0% 0%, 100% 0%, from(#00000000), to(#000000cc))',
                    border: '2px solid #ffd700',
                    padding: '10px 15px',
                    flowChildren: 'right',
                }}
            >
                <Label text="✨ MF:" style={{
                    fontSize: '22px',
                    color: '#ffd700',
                    marginRight: '10px',
                    verticalAlign: 'center',
                    fontWeight: 'bold',
                }} />
                
                <Label text={`${mfData.total}%`} style={{
                    fontSize: '28px',
                    fontWeight:  'bold',
                    color: getMFColor(mfData.total),
                    verticalAlign: 'center',
                }} />
            </Panel>
            
            {/* 悬停提示 */}
            {showTooltip && mfData.breakdown.length > 0 && (
                <Panel style={{
                    width: '350px',
                    backgroundColor: '#000000ee',
                    border: '2px solid #ffd700',
                    padding: '15px',
                    marginTop: '65px',
                    flowChildren: 'down',
                }}>
                    <Label text="✨ Magic Find 详情" style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffd700',
                        marginBottom: '10px',
                    }} />
                    
                    {mfData.breakdown.map((item, idx) => (
                        <Panel key={idx} style={{
                            flowChildren: 'right',
                            marginBottom: '8px',
                        }}>
                            <Label text={`${item.source}:`} style={{
                                fontSize: '16px',
                                color: '#cccccc',
                                width: '150px',
                            }} />
                            <Label 
                                text={`${item.value > 0 ? '+' : ''}${item.value}%`} 
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: item.value > 0 ? '#44ff44' : (item.value < 0 ? '#ff4444' :  '#888888'),
                                    width: '80px',
                                    textAlign: 'right',
                                }} 
                            />
                            <Label text={`(${item.type})`} style={{
                                fontSize: '14px',
                                color: '#888888',
                                marginLeft: '10px',
                            }} />
                        </Panel>
                    ))}
                    
                    <Panel style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: '#ffd700',
                        marginTop: '5px',
                        marginBottom: '5px',
                    }} />
                    
                    <Panel style={{
                        flowChildren: 'right',
                    }}>
                        <Label text="总计:" style={{
                            fontSize: '18px',
                            fontWeight:  'bold',
                            color: '#ffffff',
                            width: '150px',
                        }} />
                        <Label 
                            text={`${mfData.total}%`} 
                            style={{
                                fontSize: '20px',
                                fontWeight:  'bold',
                                color: getMFColor(mfData.total),
                                width: '80px',
                                textAlign: 'right',
                            }} 
                        />
                    </Panel>
                </Panel>
            )}
        </Panel>
    );
};