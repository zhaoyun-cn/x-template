import React, { useState, useEffect } from 'react';

interface SkillDef {
    id: string;
    name: string;
    desc: string;
    icon: string;
    type: string;
    maxLv: number;
    reqLv: number;
    done: boolean;
}

const SKILLS: SkillDef[] = [
    { id: 'warrior_deep_wound', name: '重伤', desc: '暴击时施加流血', icon: 'bloodseeker_rupture', type: 'passive', maxLv: 1, reqLv: 1, done: true },
    { id: 'warrior_thunder_strike', name: '雷霆一击', desc: '对周围造成AOE伤害', icon: 'sven_storm_bolt', type: 'active', maxLv: 5, reqLv: 1, done: true },
    { id: 'warrior_sudden_death', name: '猝死', desc: '攻击有几率触发猝死', icon: 'skeleton_king_reincarnation', type: 'passive', maxLv: 5, reqLv: 5, done: true },
    { id: 'warrior_execute', name: '斩杀', desc: '对低血量目标致命伤害', icon: 'axe_culling_blade', type: 'ultimate', maxLv: 1, reqLv: 10, done: true },
    { id: 'warrior_strike', name: '猛击', desc: '造成150%武器伤害', icon: 'sven_great_cleave', type: 'active', maxLv: 5, reqLv: 1, done: false },
    { id: 'warrior_whirlwind', name: '旋风斩', desc: '对周围敌人AOE伤害', icon: 'juggernaut_blade_fury', type: 'active', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_warcry', name: '战吼', desc: '提升攻击力', icon: 'sven_warcry', type: 'active', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_berserker', name: '狂战士', desc: '血量越低攻击越高', icon: 'huskar_berserkers_blood', type: 'passive', maxLv: 5, reqLv: 8, done: false },
    { id: 'warrior_bloodthirst', name: '嗜血', desc: '击杀回复生命', icon: 'bloodseeker_thirst', type: 'passive', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_armor_break', name: '破甲', desc: '降低目标护甲', icon: 'slardar_amplify_damage', type: 'active', maxLv: 5, reqLv: 6, done: false },
    { id: 'warrior_charge', name: '冲锋', desc: '冲向目标并眩晕', icon: 'spirit_breaker_charge_of_darkness', type: 'active', maxLv: 5, reqLv: 4, done: false },
    { id: 'warrior_block', name: '格挡', desc: '格挡物理伤害', icon: 'tidehunter_kraken_shell', type: 'passive', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_tenacity', name: '坚韧', desc: '增加生命值', icon: 'huskar_inner_fire', type: 'passive', maxLv: 5, reqLv: 2, done: false },
    { id: 'warrior_critical', name: '致命打击', desc: '增加暴击', icon: 'phantom_assassin_coup_de_grace', type: 'passive', maxLv: 5, reqLv: 7, done: false },
    { id: 'warrior_avatar', name: '战神降临', desc: '大幅提升属性', icon: 'sven_gods_strength', type: 'ultimate', maxLv: 3, reqLv: 15, done: false },
];

interface Props {
    visible: boolean;
    onClose: () => void;
}

interface EquipSlots {
    q: string | null;
    w: string | null;
    e: string | null;
    r: string | null;
}

interface RuneData {
    id: string;
    definitionId: string;
    name: string;
    description: string;
    icon: string;
    effectType: string;
    baseValue: number;
    quality: string;
    equippedTo: string;
    applicableSkills: string[];
    isUniversal: boolean;  // ⭐ 新增
}

// 品质颜色
const QUALITY_COLORS: Record<string, string> = {
    common: '#ffffff',
    uncommon: '#00ff00',
    rare: '#0088ff',
    epic: '#aa00ff',
    legendary: '#ff8800',
};

const QUALITY_NAMES: Record<string, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
};

export const SkillTreeUI: React. FC<Props> = ({ visible, onClose }) => {
    const [points, setPoints] = useState(0);
    const [levels, setLevels] = useState<Record<string, number>>({});
    const [heroLv, setHeroLv] = useState(1);
    const [selIdx, setSelIdx] = useState(-1);
    const [equipSlots, setEquipSlots] = useState<EquipSlots>({ q: null, w: null, e: null, r: null });
    const [equipMode, setEquipMode] = useState(false);
    
    // 护石相关状态
    const [runes, setRunes] = useState<RuneData[]>([]);
    const [maxRuneSlots, setMaxRuneSlots] = useState(3);
    const [showRunePanel, setShowRunePanel] = useState(false);
    const [selectedRuneId, setSelectedRuneId] = useState<string | null>(null);

    useEffect(() => {
        if (! visible) return;

        GameEvents.SendCustomGameEventToServer('skill_point_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('skill_equip_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('rune_request_data' as never, {} as never);

        const pointListener = GameEvents.Subscribe('skill_point_data_update' as never, (d: any) => {
            setPoints(d.availablePoints || 0);
            setLevels(d.skillLevels || {});
            setHeroLv(d. playerLevel || 1);
        });

        const equipListener = GameEvents.Subscribe('skill_equip_data_update' as never, (d: any) => {
            if (d.slots) {
                setEquipSlots({
                    q: d.slots.q || null,
                    w: d.slots.w || null,
                    e: d.slots.e || null,
                    r: d.slots. r || null,
                });
            }
        });

const runeListener = GameEvents.Subscribe('rune_data_update' as never, (d: any) => {
    $. Msg('[SkillTreeUI] 收到护石数据');
    
    if (d.runes) {
        const runeList: RuneData[] = [];
        
        // 遍历对象
        for (const key in d.runes) {
            const r = d.runes[key];
            $. Msg('[SkillTreeUI] 护石: ' + r.name + ' (' + r.quality + ')');
            
            // 解析 applicableSkills
            const applicable: string[] = [];
            if (r.applicableSkills) {
                for (const skillId in r.applicableSkills) {
                    applicable.push(skillId);
                }
            }
            
            runeList.push({
                id: r.id,
                definitionId: r.definitionId,
                name: r.name,
                description: r.description,
                icon: r.icon,
                effectType: r. effectType,
                baseValue: r.baseValue,
                quality: r.quality,
                equippedTo: r.equippedTo || '',
                applicableSkills: applicable,
                isUniversal: r.isUniversal || false,
            });
        }
        
        $. Msg('[SkillTreeUI] 护石总数: ' + runeList. length);
        setRunes(runeList);
    }
    
    if (d.maxSlots) {
        setMaxRuneSlots(d.maxSlots);
    }
});

        const runeErrorListener = GameEvents.Subscribe('rune_error' as never, (d: any) => {
            $.Msg('[SkillTreeUI] 护石错误: ' + d.message);
        });

        return () => {
            GameEvents.Unsubscribe(pointListener);
            GameEvents. Unsubscribe(equipListener);
            GameEvents.Unsubscribe(runeListener);
            GameEvents.Unsubscribe(runeErrorListener);
        };
    }, [visible]);

    if (!visible) return null;

    const getLv = (id: string) => levels[id] || 0;
    const isLearned = (id: string) => getLv(id) > 0;

    const canUp = (s: SkillDef) => {
        if (! s.done || points <= 0) return false;
        if (getLv(s.id) >= s.maxLv) return false;
        if (heroLv < s.reqLv) return false;
        return true;
    };

    const doUpgrade = () => {
        if (selIdx < 0) return;
        const s = SKILLS[selIdx];
        if (!canUp(s)) return;
        GameEvents.SendCustomGameEventToServer('skill_point_upgrade_skill' as never, { skillId: s.id } as never);
    };

    const doReset = () => {
        GameEvents.SendCustomGameEventToServer('skill_point_reset' as never, {} as never);
    };

    const doEquipToSlot = (slot: string) => {
        if (selIdx < 0) return;
        const s = SKILLS[selIdx];
        if (!isLearned(s.id)) return;
        if (s.type === 'passive') return;
        const slotNum = slot === 'q' ? 0 : slot === 'w' ? 1 : slot === 'e' ? 2 : 3;
        GameEvents.SendCustomGameEventToServer('skill_equip_to_slot' as never, { skillId: s.id, slot: slotNum } as never);
        setEquipMode(false);
    };

    const doUnequipSlot = (slot: string) => {
        const slotNum = slot === 'q' ? 0 : slot === 'w' ? 1 : slot === 'e' ?  2 : 3;
        GameEvents.SendCustomGameEventToServer('skill_unequip_slot' as never, { slot: slotNum } as never);
    };

    // 护石操作
    const doEquipRune = (runeId: string, skillId: string) => {
        GameEvents.SendCustomGameEventToServer('rune_equip' as never, { runeId: runeId, skillId: skillId } as never);
        setSelectedRuneId(null);
    };

    const doUnequipRune = (runeId: string) => {
        GameEvents.SendCustomGameEventToServer('rune_unequip' as never, { runeId: runeId } as never);
    };

    // 获取技能已装备的护石
    const getSkillRunes = (skillId: string) => {
        return runes.filter(r => r.equippedTo === skillId);
    };

    // 获取可装备到技能的护石
 const getAvailableRunesForSkill = (skillId: string) => {
    return runes.filter(r => {
        if (r.equippedTo) return false; // 已装备
        if (r.isUniversal) return true; // 通用护石
        return r.applicableSkills.indexOf(skillId) >= 0;
    });
};

    const getSkillById = (id: string | null) => id ? SKILLS.find(s => s.id === id) : null;
    const sel = selIdx >= 0 ? SKILLS[selIdx] : null;

    const row1 = SKILLS.slice(0, 5);
    const row2 = SKILLS.slice(5, 10);
    const row3 = SKILLS.slice(10, 15);

    const renderSkill = (s: SkillDef, idx: number) => {
        const lv = getLv(s.id);
        const isSel = selIdx === idx;
        const learned = lv > 0;
        const equipped = s.id === equipSlots.q || s.id === equipSlots.w || s.id === equipSlots.e || s.id === equipSlots.r;
        const hasRunes = getSkillRunes(s.id).length > 0;

        let border = ! s.done ? '#222' : isSel ? '#ffaa00' : equipped ? '#00aaff' : lv >= s.maxLv ? '#00cc00' : lv > 0 ? '#008800' : canUp(s) ? '#886600' : '#333';
        let bg = !s.done ? '#080808' : isSel ? '#1a1500' : equipped ? '#0a1520' : lv >= s.maxLv ? '#0a200a' : lv > 0 ? '#0a150a' : '#0c0c0c';

        return (
            <Panel
                key={s.id}
                hittest={true}
                style={{ width: '110px', height: '125px', margin: '3px', backgroundColor: bg, border: '2px solid ' + border, flowChildren: 'down' }}
                onactivate={() => { setSelIdx(idx); setShowRunePanel(false); setSelectedRuneId(null); }}
            >
                <Panel style={{ width: '100%', height: '3px', backgroundColor: s.done ? (s.type === 'active' ? '#4488ff' : s.type === 'passive' ? '#44cc44' : '#ff8800') : '#333' }} />
                <Panel style={{ width: '60px', height: '60px', marginTop: '6px', marginLeft: '22px', border: '1px solid #333' }}>
                    <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%', opacity: s.done ? '1' : '0.3' }} />
                    {equipped && (
                        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#0088ff44' }}>
                            <Label text="已装备" style={{ fontSize: '9px', color: '#0af', horizontalAlign: 'center', verticalAlign: 'center' }} />
                        </Panel>
                    )}
                    {/* 护石指示器 */}
                    {hasRunes && (
                        <Panel style={{ width: '16px', height: '16px', backgroundColor: '#aa00ff', border: '1px solid #ff00ff', horizontalAlign: 'right', verticalAlign: 'top' }}>
                            <Label text={String(getSkillRunes(s.id).length)} style={{ fontSize: '10px', color: '#fff', horizontalAlign: 'center', verticalAlign: 'center' }} />
                        </Panel>
                    )}
                </Panel>
                <Label text={s.name} style={{ fontSize: '11px', color: s.done ? '#ccc' : '#555', horizontalAlign: 'center', marginTop: '4px' }} />
                <Label text={lv + '/' + s.maxLv} style={{ fontSize: '10px', color: lv >= s.maxLv ?  '#0f0' : lv > 0 ? '#8f8' : '#666', horizontalAlign: 'center' }} />
            </Panel>
        );
    };

    const renderSlot = (slotKey: string, label: string) => {
        const slotValue = (equipSlots as any)[slotKey] as string | null;
        const skill = getSkillById(slotValue);
        const isSelTarget = equipMode && sel && sel.type !== 'passive' && (
            (slotKey === 'r' && sel.type === 'ultimate') ||
            (slotKey !== 'r' && sel.type === 'active')
        );

        return (
            <Panel
                hittest={true}
                style={{ width: '70px', height: '90px', margin: '3px', backgroundColor: isSelTarget ? '#1a2a1a' : '#0c0c0c', border: isSelTarget ? '2px solid #0f0' : '2px solid #444', flowChildren: 'down' }}
                onactivate={() => { if (isSelTarget) doEquipToSlot(slotKey); }}
            >
                <Label text={label} style={{ fontSize: '14px', color: '#ffd700', horizontalAlign: 'center', marginTop: '2px' }} />
                <Panel style={{ width: '50px', height: '50px', marginTop: '2px', marginLeft: '8px', border: '1px solid #333', backgroundColor: '#000' }}>
                    {skill ?  (
                        <DOTAAbilityImage abilityname={skill.icon} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Label text="空" style={{ fontSize: '12px', color: '#444', horizontalAlign: 'center', verticalAlign: 'center' }} />
                    )}
                </Panel>
                {skill && (
                    <Panel hittest={true} style={{ width: '50px', height: '14px', backgroundColor: '#400', marginLeft: '8px', marginTop: '2px' }} onactivate={() => { doUnequipSlot(slotKey); }}>
                        <Label text="卸下" style={{ fontSize: '9px', color: '#f66', horizontalAlign: 'center' }} />
                    </Panel>
                )}
            </Panel>
        );
    };

    // 渲染护石
    const renderRune = (rune: RuneData, canEquip: boolean) => {
        const color = QUALITY_COLORS[rune.quality] || '#fff';
        const isSelected = selectedRuneId === rune.id;

        return (
            <Panel
                key={rune.id}
                hittest={true}
                style={{
                    width: '100%',
                    height: '50px',
                    margin: '2px 0',
                    backgroundColor: isSelected ? '#1a1a3a' : '#0c0c0c',
                    border: isSelected ? '1px solid #00aaff' : '1px solid #333',
                    flowChildren: 'right',
                }}
                onactivate={() => {
                    if (canEquip && sel) {
                        doEquipRune(rune.id, sel.id);
                    } else if (rune.equippedTo) {
                        setSelectedRuneId(rune. id);
                    }
                }}
            >
                <Panel style={{ width: '40px', height: '40px', margin: '4px', border: '1px solid ' + color }}>
                    <DOTAItemImage itemname={rune.icon} style={{ width: '100%', height: '100%' }} />
                </Panel>
                <Panel style={{ flowChildren: 'down', marginTop: '5px', width: '180px' }}>
                    <Label text={rune.name} style={{ fontSize: '12px', color: color, fontWeight: 'bold' }} />
                    <Label text={QUALITY_NAMES[rune. quality] + ' +' + rune.baseValue + '%'} style={{ fontSize: '10px', color: '#888' }} />
                </Panel>
                {rune.equippedTo && (
                    <Panel
                        hittest={true}
                        style={{ width: '40px', height: '20px', backgroundColor: '#400', marginTop: '14px', marginLeft: '5px' }}
                        onactivate={() => doUnequipRune(rune.id)}
                    >
                        <Label text="卸下" style={{ fontSize: '9px', color: '#f66', horizontalAlign: 'center', marginTop: '3px' }} />
                    </Panel>
                )}
            </Panel>
        );
    };

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '1150px', height: '750px', backgroundColor: '#111', border: '3px solid #8b6914', flowChildren: 'down', horizontalAlign: 'center', verticalAlign: 'center' }}>

                {/* 标题 */}
                <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                    <Label text="◆ 技能与护石 ◆" style={{ fontSize: '22px', color: '#ffd700', marginLeft: '20px', marginTop: '10px' }} />
                    <Panel style={{ width: '500px' }} />
                    <Label text={'技能点: ' + points} style={{ fontSize: '18px', color: points > 0 ? '#0f0' : '#888', marginTop: '12px' }} />
                    <Label text={'  等级: ' + heroLv} style={{ fontSize: '16px', color: '#88f', marginTop: '13px', marginLeft: '15px' }} />
                    <Label text={'  护石: ' + runes.length} style={{ fontSize: '14px', color: '#a0f', marginTop: '14px', marginLeft: '15px' }} />
                </Panel>

                {/* 装备槽区域 */}
                <Panel style={{ width: '100%', height: '100px', backgroundColor: '#0a0a0a', borderBottom: '1px solid #3a3020', flowChildren: 'right', padding: '5px' }}>
                    <Label text="技能槽:" style={{ fontSize: '14px', color: '#888', marginLeft: '10px', marginTop: '35px', marginRight: '10px' }} />
                    {renderSlot('q', 'Q')}
                    {renderSlot('w', 'W')}
                    {renderSlot('e', 'E')}
                    {renderSlot('r', 'R')}
                    <Panel style={{ width: '30px' }} />
                    <Panel style={{ flowChildren: 'down', marginTop: '15px' }}>
                        <Label text="提示:" style={{ fontSize: '11px', color: '#888' }} />
                        <Label text="• 选中技能后点击槽位装备" style={{ fontSize: '10px', color: '#666', marginTop: '2px' }} />
                        <Label text="• 护石可增强技能效果" style={{ fontSize: '10px', color: '#a0f', marginTop: '2px' }} />
                    </Panel>
                </Panel>

                {/* 主内容 */}
                <Panel style={{ width: '100%', height: '535px', flowChildren: 'right' }}>

                    {/* 技能区 */}
                    <Panel style={{ width: '600px', height: '100%', backgroundColor: '#0a0a0a', padding: '8px', flowChildren: 'down' }}>
                        <Panel style={{ flowChildren: 'right' }}>{row1. map((s, i) => renderSkill(s, i))}</Panel>
                        <Panel style={{ flowChildren: 'right' }}>{row2. map((s, i) => renderSkill(s, i + 5))}</Panel>
                        <Panel style={{ flowChildren: 'right' }}>{row3.map((s, i) => renderSkill(s, i + 10))}</Panel>
                    </Panel>

                    {/* 详情区 + 护石区 */}
                    <Panel style={{ width: '550px', height: '100%', backgroundColor: '#0c0c08', borderLeft: '2px solid #3a3020', flowChildren: 'right' }}>
                        
                        {/* 技能详情 */}
                        <Panel style={{ width: '280px', height: '100%', padding: '12px', flowChildren: 'down', borderRight: '1px solid #2a2520' }}>
                            {sel ?  (
                                <>
                                    <Panel style={{ flowChildren: 'right', marginBottom: '10px' }}>
                                        <Panel style={{ width: '56px', height: '56px', border: '2px solid ' + (sel.type === 'active' ? '#48f' : sel.type === 'passive' ? '#4c4' : '#f80'), marginRight: '10px' }}>
                                            <DOTAAbilityImage abilityname={sel.icon} style={{ width: '100%', height: '100%' }} />
                                        </Panel>
                                        <Panel style={{ flowChildren: 'down' }}>
                                            <Label text={sel.name} style={{ fontSize: '18px', color: '#ffd700', fontWeight: 'bold' }} />
                                            <Label text={sel.type === 'active' ? '主动' : sel.type === 'passive' ? '被动' : '终极'} style={{ fontSize: '11px', color: sel.type === 'active' ?  '#48f' : sel.type === 'passive' ? '#4c4' : '#f80', marginTop: '3px' }} />
                                        </Panel>
                                    </Panel>

                                    <Panel style={{ width: '100%', height: '1px', backgroundColor: '#8b6914', marginBottom: '8px' }} />

                                    <Panel style={{ padding: '6px', backgroundColor: '#0a0a05', border: '1px solid #3a3020', marginBottom: '8px', flowChildren: 'down' }}>
                                        <Label text={'等级: ' + getLv(sel.id) + '/' + sel.maxLv} style={{ fontSize: '13px', color: '#0f0' }} />
                                        <Label text={'需求: Lv' + sel.reqLv} style={{ fontSize: '11px', color: heroLv >= sel.reqLv ? '#0f0' : '#f44', marginTop: '3px' }} />
                                    </Panel>

                                    <Panel style={{ padding: '6px', backgroundColor: '#080805', border: '1px solid #2a2520', marginBottom: '10px' }}>
                                        <Label text={sel.desc} style={{ fontSize: '11px', color: '#bbb' }} />
                                    </Panel>

                                    {/* 按钮 */}
                                    <Panel style={{ flowChildren: 'right', marginBottom: '8px' }}>
                                        {sel.done && (
                                            <Panel hittest={true} onactivate={doUpgrade} style={{ width: '80px', height: '30px', backgroundColor: canUp(sel) ? '#1a4a1a' : '#1a1a1a', border: canUp(sel) ? '2px solid #0a0' : '2px solid #333', marginRight: '8px' }}>
                                                <Label text={getLv(sel.id) >= sel.maxLv ? '满级' : '升级'} style={{ fontSize: '12px', color: canUp(sel) ? '#fff' : '#666', horizontalAlign: 'center', marginTop: '6px' }} />
                                            </Panel>
                                        )}
                                        {sel.done && isLearned(sel. id) && sel.type !== 'passive' && (
                                            <Panel hittest={true} onactivate={() => setEquipMode(! equipMode)} style={{ width: '80px', height: '30px', backgroundColor: equipMode ? '#1a3a4a' : '#1a2a3a', border: equipMode ? '2px solid #0af' : '2px solid #048' }}>
                                                <Label text={equipMode ? '取消' : '装备'} style={{ fontSize: '12px', color: '#0af', horizontalAlign: 'center', marginTop: '6px' }} />
                                            </Panel>
                                        )}
                                    </Panel>

                                    {/* 护石槽 */}
                                    {sel.done && isLearned(sel.id) && (
                                        <>
                                            <Panel style={{ width: '100%', height: '1px', backgroundColor: '#3a3020', marginTop: '5px', marginBottom: '8px' }} />
                                            <Label text="已装备护石:" style={{ fontSize: '11px', color: '#a0f', marginBottom: '5px' }} />
                                            <Panel style={{ flowChildren: 'down', height: '120px', overflow: 'scroll' }}>
                                                {getSkillRunes(sel.id).length > 0 ? (
                                                    getSkillRunes(sel.id).map(r => renderRune(r, false))
                                                ) : (
                                                    <Label text="(无护石)" style={{ fontSize: '10px', color: '#555' }} />
                                                )}
                                            </Panel>
                                        </>
                                    )}

                                    {! sel.done && (
                                        <Label text="[ 开发中 ]" style={{ fontSize: '12px', color: '#f60', horizontalAlign: 'center', marginTop: '10px' }} />
                                    )}
                                </>
                            ) : (
                                <Label text="选择技能" style={{ fontSize: '13px', color: '#555', horizontalAlign: 'center', marginTop: '150px' }} />
                            )}
                        </Panel>

                        {/* 护石背包 */}
                        <Panel style={{ width: '270px', height: '100%', padding: '10px', flowChildren: 'down', backgroundColor: '#080808' }}>
                            <Label text="◆ 护石背包 ◆" style={{ fontSize: '14px', color: '#a0f', marginBottom: '8px' }} />
                            <Panel style={{ width: '100%', height: '1px', backgroundColor: '#3a3020', marginBottom: '8px' }} />
                            
                            {sel && isLearned(sel.id) ?  (
                                <>
                                    <Label text={'可装备到 [' + sel.name + '] 的护石:'} style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }} />
                                    <Panel style={{ flowChildren: 'down', height: '420px', overflow: 'scroll' }}>
                                        {getAvailableRunesForSkill(sel.id).length > 0 ? (
                                            getAvailableRunesForSkill(sel.id). map(r => renderRune(r, true))
                                        ) : (
                                            <Label text="(无可用护石)" style={{ fontSize: '10px', color: '#555', marginTop: '20px' }} />
                                        )}
                                    </Panel>
                                </>
                            ) : (
                                <Label text="选择已学习的技能\n查看可用护石" style={{ fontSize: '11px', color: '#555', marginTop: '150px', horizontalAlign: 'center' }} />
                            )}
                        </Panel>
                    </Panel>
                </Panel>

                {/* 底部 */}
                <Panel style={{ width: '100%', height: '65px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={doReset} style={{ width: '130px', height: '36px', backgroundColor: '#2a1515', border: '2px solid #a33', marginTop: '14px', marginRight: '15px' }}>
                        <Label text="重置技能" style={{ fontSize: '14px', color: '#f66', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '130px', height: '36px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '14px' }}>
                        <Label text="关闭(K)" style={{ fontSize: '14px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};