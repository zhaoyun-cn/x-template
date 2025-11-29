import React, { useState, useEffect } from 'react';

// ========== 数据 ==========
const SKILLS = [
    { id: 'warrior_deep_wound', name: '重伤', icon: 'bloodseeker_rupture', type: 'passive', maxLv: 1, reqLv: 1, done: true },
    { id: 'warrior_thunder_strike', name: '雷霆一击', icon: 'sven_storm_bolt', type: 'active', maxLv: 5, reqLv: 1, done: true },
    { id: 'warrior_sudden_death', name: '猝死', icon: 'skeleton_king_reincarnation', type: 'passive', maxLv: 5, reqLv: 5, done: true },
    { id: 'warrior_execute', name: '斩杀', icon: 'axe_culling_blade', type: 'ultimate', maxLv: 1, reqLv: 10, done: true },
    { id: 'warrior_strike', name: '猛击', icon: 'sven_great_cleave', type: 'active', maxLv: 5, reqLv: 1, done: false },
    { id: 'warrior_whirlwind', name: '旋风斩', icon: 'juggernaut_blade_fury', type: 'active', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_warcry', name: '战吼', icon: 'sven_warcry', type: 'active', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_berserker', name: '狂战士', icon: 'huskar_berserkers_blood', type: 'passive', maxLv: 5, reqLv: 8, done: false },
    { id: 'warrior_bloodthirst', name: '嗜血', icon: 'bloodseeker_thirst', type: 'passive', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_armor_break', name: '破甲', icon: 'slardar_amplify_damage', type: 'active', maxLv: 5, reqLv: 6, done: false },
    { id: 'warrior_charge', name: '冲锋', icon: 'spirit_breaker_charge_of_darkness', type: 'active', maxLv: 5, reqLv: 4, done: false },
    { id: 'warrior_block', name: '格挡', icon: 'tidehunter_kraken_shell', type: 'passive', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_tenacity', name: '坚韧', icon: 'huskar_inner_fire', type: 'passive', maxLv: 5, reqLv: 2, done: false },
    { id: 'warrior_critical', name: '致命打击', icon: 'phantom_assassin_coup_de_grace', type: 'passive', maxLv: 5, reqLv: 7, done: false },
    { id: 'warrior_avatar', name: '战神降临', icon: 'sven_gods_strength', type: 'ultimate', maxLv: 3, reqLv: 15, done: false },
];

interface Rune { id: string; name: string; icon: string; effectTypeName: string; quality: number; qualityName: string; rollValue: number; equippedTo: string; slotIndex: number; }

export const SkillTreeUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [tab, setTab] = useState(0);
    const [points, setPoints] = useState(0);
    const [levels, setLevels] = useState<Record<string, number>>({});
    const [heroLv, setHeroLv] = useState(1);
    const [selSkill, setSelSkill] = useState('');
    const [slots, setSlots] = useState({ q: '', w: '', e: '', r: '' });
    const [equipMode, setEquipMode] = useState(false);
    const [runes, setRunes] = useState<Rune[]>([]);
    const [runeSkill, setRuneSkill] = useState('');
    const [selRune, setSelRune] = useState('');

    useEffect(() => {
        if (!  visible) return;
        GameEvents.SendCustomGameEventToServer('skill_point_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('skill_equip_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('rune_request_data' as never, {} as never);

        const h1 = GameEvents.Subscribe('skill_point_data_update' as never, (d: any) => {
            if (d) { setPoints(d.availablePoints || 0); setLevels(d.skillLevels || {}); setHeroLv(d.playerLevel || 1); }
        });
        const h2 = GameEvents.Subscribe('skill_equip_data_update' as never, (d: any) => {
            if (d && d.slots) { setSlots({ q: d.slots.q || '', w: d.slots.w || '', e: d.slots.  e || '', r: d.slots.r || '' }); }
        });
        const h3 = GameEvents.Subscribe('rune_data_update' as never, (d: any) => {
            const arr: Rune[] = [];
            if (d && d.runes) {
                for (const k in d.runes) {
                    const r = d.runes[k];
                    if (r && r.id) {
                        arr.push({ id: r.id + '', name: r.name + '', icon: r.icon + '', effectTypeName: r.effectTypeName + '', quality: +r.quality || 1, qualityName: r.qualityName + '', rollValue: +r.rollValue || 0, equippedTo: r.equippedTo + '', slotIndex: +r. slotIndex >= 0 ? +r.slotIndex : -1 });
                    }
                }
            }
            setRunes(arr);
        });
        return () => { GameEvents.Unsubscribe(h1); GameEvents.Unsubscribe(h2); GameEvents.Unsubscribe(h3); };
    }, [visible]);

    if (!visible) return null;

    const getLv = (id: string): number => levels[id] || 0;
    const isLearned = (id: string): boolean => getLv(id) > 0;
    const findSkill = (id: string) => SKILLS.find(s => s.id === id);
    const canUp = (id: string): boolean => { const s = findSkill(id); return ! !(s && s.done && points > 0 && getLv(id) < s.maxLv && heroLv >= s.reqLv); };

    const upgrade = () => { if (selSkill && canUp(selSkill)) GameEvents.SendCustomGameEventToServer('skill_point_upgrade_skill' as never, { skillId: selSkill } as never); };
    const resetSkills = () => GameEvents.SendCustomGameEventToServer('skill_point_reset' as never, {} as never);
    const equipTo = (k: string) => { const s = findSkill(selSkill); if (s && isLearned(selSkill) && s.type !== 'passive') { GameEvents.SendCustomGameEventToServer('skill_equip_to_slot' as never, { skillId: selSkill, slot: k === 'q' ? 0 : k === 'w' ? 1 : k === 'e' ? 2 : 3 } as never); setEquipMode(false); } };
    const unequip = (k: string) => GameEvents.SendCustomGameEventToServer('skill_unequip_slot' as never, { slot: k === 'q' ?   0 : k === 'w' ? 1 : k === 'e' ? 2 : 3 } as never);
    const equipRune = (rid: string, sid: string, slot: number) => { if (rid && sid) { GameEvents.SendCustomGameEventToServer('rune_equip' as never, { runeId: rid, skillId: sid, slotIndex: slot } as never); setSelRune(''); } };
    const unequipRune = (rid: string) => { if (rid) GameEvents.SendCustomGameEventToServer('rune_unequip' as never, { runeId: rid } as never); };

    const sk = selSkill ?  findSkill(selSkill) : null;
    const QCOLOR: Record<number, string> = { 1: '#fff', 2: '#0f0', 3: '#08f', 4: '#a0f', 5: '#f80' };

    // 技能槽状态文字
    const slotStatus = 'Q:' + (slots.q ?  '有' : '-') + ' W:' + (slots.w ? '有' : '-') + ' E:' + (slots. e ? '有' : '-') + ' R:' + (slots.r ? '有' : '-');

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '1000px', height: '680px', backgroundColor: '#111', border: '3px solid #8b6914', horizontalAlign: 'center', verticalAlign: 'center', flowChildren: 'down' }}>
                
                {/* 标题栏 */}
                <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                    <Panel hittest={true} onactivate={() => setTab(0)} style={{ width: '100px', height: '50px', backgroundColor: tab === 0 ? '#1a3a1a' : '#1a1a15' }}>
                        <Label text="技能" style={{ fontSize: '16px', color: tab === 0 ? '#0f0' : '#888', horizontalAlign: 'center', marginTop: '14px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={() => setTab(1)} style={{ width: '100px', height: '50px', backgroundColor: tab === 1 ? '#1a1a3a' : '#1a1a15' }}>
                        <Label text="护石" style={{ fontSize: '16px', color: tab === 1 ? '#a0f' : '#888', horizontalAlign: 'center', marginTop: '14px' }} />
                    </Panel>
                    <Panel style={{ width: '250px' }} />
                    <Label text={slotStatus} style={{ fontSize: '12px', color: '#aaa', marginTop: '18px', marginRight: '20px' }} />
                    <Label text={'点数:' + points + '  Lv' + heroLv + '  护石:' + runes.length} style={{ fontSize: '14px', color: '#888', marginTop: '16px' }} />
                </Panel>

                {/* 内容 */}
                <Panel style={{ width: '100%', height: '570px' }}>
                    {tab === 0 ?  (
                        // ===== 技能页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                            {/* 技能网格 */}
                            <Panel style={{ width: '600px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                                {[0, 1, 2].  map(row => (
                                    <Panel key={'r' + row} style={{ flowChildren: 'right' }}>
                                        {SKILLS.slice(row * 5, row * 5 + 5).  map(s => {
                                            const lv = getLv(s.id);
                                            const isSel = selSkill === s.  id;
                                            return (
                                                <Panel key={s.id} hittest={true} onactivate={() => setSelSkill(s.  id)} style={{ width: '110px', height: '120px', margin: '3px', backgroundColor: isSel ?  '#1a1500' : '#0c0c0c', border: '2px solid ' + (isSel ? '#fa0' : lv > 0 ? '#080' : '#333'), flowChildren: 'down' }}>
                                                    <Panel style={{ width: '60px', height: '60px', marginTop: '8px', marginLeft: '22px', border: '1px solid #333' }}>
                                                        <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%', opacity: s.done ? '1' : '0.3' }} />
                                                    </Panel>
                                                    <Label text={s.name} style={{ fontSize: '11px', color: s.done ? '#ccc' : '#555', horizontalAlign: 'center', marginTop: '5px' }} />
                                                    <Label text={lv + '/' + s.maxLv} style={{ fontSize: '10px', color: lv > 0 ? '#0f0' : '#666', horizontalAlign: 'center' }} />
                                                </Panel>
                                            );
                                        })}
                                    </Panel>
                                ))}
                            </Panel>
                            {/* 详情 */}
                            <Panel style={{ width: '400px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                                {sk ?  (
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                            <Panel style={{ width: '60px', height: '60px', border: '2px solid #ffd700', marginRight: '15px' }}>
                                                <DOTAAbilityImage abilityname={sk.icon} style={{ width: '100%', height: '100%' }} />
                                            </Panel>
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label text={sk.name} style={{ fontSize: '18px', color: '#ffd700' }} />
                                                <Label text={sk.type === 'active' ? '主动' : sk.type === 'passive' ? '被动' : '终极'} style={{ fontSize: '12px', color: '#888', marginTop: '5px' }} />
                                            </Panel>
                                        </Panel>
                                        <Label text={'等级: ' + getLv(selSkill) + '/' + sk.maxLv + '  需求Lv' + sk.reqLv} style={{ fontSize: '13px', color: '#0f0', marginBottom: '15px' }} />
                                        <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                            <Panel hittest={true} onactivate={upgrade} style={{ width: '80px', height: '32px', backgroundColor: canUp(selSkill) ? '#1a4a1a' : '#1a1a1a', border: '2px solid #333', marginRight: '10px' }}>
                                                <Label text="升级" style={{ fontSize: '13px', color: canUp(selSkill) ? '#0f0' : '#666', horizontalAlign: 'center', marginTop: '6px' }} />
                                            </Panel>
                                            {sk.type !== 'passive' && isLearned(selSkill) && (
                                                <Panel hittest={true} onactivate={() => setEquipMode(! equipMode)} style={{ width: '80px', height: '32px', backgroundColor: equipMode ? '#2a3a4a' : '#1a2a3a', border: '2px solid #048' }}>
                                                    <Label text={equipMode ? '取消' : '装备'} style={{ fontSize: '13px', color: '#0af', horizontalAlign: 'center', marginTop: '6px' }} />
                                                </Panel>
                                            )}
                                        </Panel>
                                        {equipMode && (
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label text="选择技能槽:" style={{ fontSize: '12px', color: '#0af', marginBottom: '10px' }} />
                                                <Panel style={{ flowChildren: 'right' }}>
                                                    {['q', 'w', 'e', 'r'].map(k => {
                                                        const canEquip = (k === 'r' && sk.type === 'ultimate') || (k !== 'r' && sk.type === 'active');
                                                        return (
                                                            <Panel key={k} hittest={canEquip} onactivate={() => canEquip && equipTo(k)} style={{ width: '60px', height: '60px', margin: '5px', backgroundColor: canEquip ?  '#1a3a1a' : '#1a1a1a', border: canEquip ? '2px solid #0f0' : '2px solid #333' }}>
                                                                <Label text={k. toUpperCase()} style={{ fontSize: '20px', color: canEquip ?  '#0f0' : '#444', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                            </Panel>
                                                        );
                                                    })}
                                                </Panel>
                                            </Panel>
                                        )}
                                    </Panel>
                                ) : (
                                    <Label text="选择技能" style={{ fontSize: '14px', color: '#555', horizontalAlign: 'center', marginTop: '200px' }} />
                                )}
                            </Panel>
                        </Panel>
                    ) : (
                        // ===== 护石页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                            <Panel style={{ width: '200px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                                <Label text="已学技能" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '10px' }} />
                                <Panel style={{ flowChildren: 'down', height: '520px', overflow: 'scroll' }}>
                                    {SKILLS.filter(s => s.done && isLearned(s.id)). map(s => {
                                        const cnt = runes.filter(r => r. equippedTo === s.id).length;
                                        return (
                                            <Panel key={s.id} hittest={true} onactivate={() => { setRuneSkill(s.id); setSelRune(''); }} style={{ flowChildren: 'right', height: '50px', marginBottom: '5px', backgroundColor: runeSkill === s.id ?  '#1a2a1a' : '#0c0c0c', border: runeSkill === s.id ?  '2px solid #0f0' : '1px solid #333', padding: '3px' }}>
                                                <Panel style={{ width: '44px', height: '44px' }}>
                                                    <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%' }} />
                                                </Panel>
                                                <Panel style={{ flowChildren: 'down', marginLeft: '8px' }}>
                                                    <Label text={s.name} style={{ fontSize: '12px', color: runeSkill === s.id ?  '#0f0' : '#ccc' }} />
                                                    <Label text={'护石:' + cnt + '/5'} style={{ fontSize: '10px', color: '#888' }} />
                                                </Panel>
                                            </Panel>
                                        );
                                    })}
                                </Panel>
                            </Panel>
                            <Panel style={{ width: '400px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                                {runeSkill ? (
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label text={(findSkill(runeSkill)?.name || '') + ' 护石'} style={{ fontSize: '16px', color: '#ffd700', marginBottom: '15px' }} />
                                        <Label text="槽位(3开+2锁)" style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }} />
                                        <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                            {[0, 1, 2, 3, 4]. map(i => {
                                                const locked = i >= 3;
                                                const inSlot = runes.find(r => r.equippedTo === runeSkill && r.slotIndex === i);
                                                const canDrop = ! locked && ! inSlot && selRune;
                                                return (
                                                    <Panel key={i} hittest={! locked && !inSlot} onactivate={() => { if (canDrop) equipRune(selRune, runeSkill, i); }} style={{ width: '55px', height: '55px', margin: '4px', backgroundColor: locked ? '#111' : canDrop ? '#1a3a1a' : '#0c0c0c', border: locked ? '2px solid #222' : canDrop ? '2px solid #0f0' : '2px solid #444' }}>
                                                        {locked ?  (
                                                            <Label text="🔒" style={{ fontSize: '16px', color: '#333', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                        ) : inSlot ? (
                                                            <DOTAItemImage itemname={inSlot.icon} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <Label text="+" style={{ fontSize: '18px', color: canDrop ? '#0f0' : '#333', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                        )}
                                                    </Panel>
                                                );
                                            })}
                                        </Panel>
                                        <Label text="已装备:" style={{ fontSize: '12px', color: '#a0f', marginBottom: '8px' }} />
                                        <Panel style={{ flowChildren: 'down', height: '280px', overflow: 'scroll' }}>
                                            {runes.filter(r => r. equippedTo === runeSkill).map(r => (
                                                <Panel key={r.id} style={{ flowChildren: 'right', height: '40px', marginBottom: '4px', backgroundColor: '#1a1a1a', border: '1px solid ' + (QCOLOR[r.quality] || '#333'), padding: '3px' }}>
                                                    <DOTAItemImage itemname={r.icon} style={{ width: '34px', height: '34px' }} />
                                                    <Panel style={{ flowChildren: 'down', marginLeft: '8px', width: '180px' }}>
                                                        <Label text={r.name} style={{ fontSize: '11px', color: QCOLOR[r.quality] || '#fff' }} />
                                                        <Label text={r.effectTypeName + ' +' + r.rollValue + '%'} style={{ fontSize: '9px', color: '#0f0' }} />
                                                    </Panel>
                                                    <Panel hittest={true} onactivate={() => unequipRune(r.id)} style={{ width: '36px', height: '22px', backgroundColor: '#400', marginTop: '6px' }}>
                                                        <Label text="卸" style={{ fontSize: '10px', color: '#f66', horizontalAlign: 'center', marginTop: '3px' }} />
                                                    </Panel>
                                                </Panel>
                                            ))}
                                        </Panel>
                                    </Panel>
                                ) : (
                                    <Label text="← 选择技能" style={{ fontSize: '14px', color: '#555', horizontalAlign: 'center', marginTop: '200px' }} />
                                )}
                            </Panel>
                            <Panel style={{ width: '350px', height: '100%', backgroundColor: '#080808', padding: '15px', flowChildren: 'down' }}>
                                <Label text="护石背包" style={{ fontSize: '14px', color: '#a0f', marginBottom: '10px' }} />
                                <Label text={selRune ? '已选择' : '点击选择'} style={{ fontSize: '10px', color: selRune ? '#0f0' : '#888', marginBottom: '10px' }} />
                                <Panel style={{ flowChildren: 'down', height: '490px', overflow: 'scroll' }}>
                                    {runes.filter(r => ! r.equippedTo).map(r => (
                                        <Panel key={r.id} hittest={true} onactivate={() => setSelRune(selRune === r.id ? '' : r. id)} style={{ flowChildren: 'right', height: '50px', marginBottom: '4px', backgroundColor: selRune === r.id ? '#1a3a1a' : '#1a1a1a', border: selRune === r.id ?  '2px solid #0f0' : '1px solid ' + (QCOLOR[r. quality] || '#333'), padding: '3px' }}>
                                            <DOTAItemImage itemname={r.icon} style={{ width: '44px', height: '44px' }} />
                                            <Panel style={{ flowChildren: 'down', marginLeft: '8px' }}>
                                                <Label text={r.name} style={{ fontSize: '11px', color: QCOLOR[r.quality] || '#fff' }} />
                                                <Label text={r.qualityName} style={{ fontSize: '9px', color: '#888' }} />
                                                <Label text={r.effectTypeName + ' +' + r. rollValue + '%'} style={{ fontSize: '9px', color: '#0f0' }} />
                                            </Panel>
                                        </Panel>
                                    ))}
                                </Panel>
                            </Panel>
                        </Panel>
                    )}
                </Panel>

                {/* 底部 */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={resetSkills} style={{ width: '100px', height: '34px', backgroundColor: '#2a1515', border: '2px solid #a33', marginTop: '13px', marginRight: '15px' }}>
                        <Label text="重置技能" style={{ fontSize: '12px', color: '#f66', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                        <Label text="关闭(K)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};