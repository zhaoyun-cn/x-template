import { RoomChoice } from './MagicFindSystem';

/**
 * 房间选择配置
 * 玩家进入房间前的 Buff/Debuff 选择
 */

// 增益选择（降低 MF）
export const BUFF_CHOICES: RoomChoice[] = [
    {
        id: 'buff_damage',
        name: '力量祝福',
        description: '攻击力 +30%',
        type: 'buff',
        mfModifier: -15,  // 降低 15% MF
        effects: {
            playerDamage: 30
        }
    },
    {
        id: 'buff_health',
        name: '生命祝福',
        description: '最大生命 +40%',
        type: 'buff',
        mfModifier: -10,
        effects: {
            playerHealth: 40
        }
    },
    {
        id:  'buff_speed',
        name: '迅捷祝福',
        description: '移动速度 +25%',
        type: 'buff',
        mfModifier: -8,
        effects: {
            playerSpeed: 25
        }
    },
    {
        id: 'buff_monster_weak',
        name: '削弱诅咒',
        description:  '怪物伤害 -20%',
        type:  'buff',
        mfModifier: -12,
        effects: {
            monsterDamage: -20
        }
    }
];

// 负面选择（提升 MF）
export const DEBUFF_CHOICES: RoomChoice[] = [
    {
        id: 'debuff_glass_cannon',
        name: '玻璃大炮',
        description: '攻击力 +50%，生命 -30%',
        type: 'debuff',
        mfModifier: 25,  // 提升 25% MF
        effects: {
            playerDamage: 50,
            playerHealth: -30
        }
    },
    {
        id: 'debuff_monster_strong',
        name: '强敌挑战',
        description: '怪物伤害 +40%，生命 +50%',
        type: 'debuff',
        mfModifier: 35,
        effects: {
            monsterDamage: 40,
            monsterHealth: 50
        }
    },
    {
        id: 'debuff_horde',
        name: '兽群来袭',
        description: '怪物数量 +50%',
        type: 'debuff',
        mfModifier:  30,
        effects: {
            monsterCount: 50
        }
    },
    {
        id: 'debuff_slow',
        name: '缓慢诅咒',
        description:  '移动速度 -30%',
        type: 'debuff',
        mfModifier: 20,
        effects: {
            playerSpeed: -30
        }
    },
    {
        id: 'debuff_frail',
        name: '脆弱诅咒',
        description: '受到伤害 +50%',
        type: 'debuff',
        mfModifier: 40,
        effects: {
            playerDamage: -50  // 实际是增加受到的伤害
        }
    }
];

// 中性选择（不影响 MF）
export const NEUTRAL_CHOICES: RoomChoice[] = [
    {
        id: 'neutral_balanced',
        name: '平衡之道',
        description: '攻击力 +15%，移动速度 +15%',
        type: 'neutral',
        mfModifier: 0,
        effects: {
            playerDamage: 15,
            playerSpeed: 15
        }
    }
];

// 精英房间特殊选择
export const ELITE_CHOICES: RoomChoice[] = [
    {
        id: 'elite_greed',
        name: '贪婪契约',
        description: '怪物全属性 +100%，MF +80%',
        type: 'debuff',
        mfModifier: 80,
        effects:  {
            monsterDamage: 100,
            monsterHealth: 100,
            monsterSpeed: 50
        }
    },
    {
        id: 'elite_safe',
        name: '安全模式',
        description: '怪物全属性 -50%，MF -30%',
        type: 'buff',
        mfModifier:  -30,
        effects: {
            monsterDamage: -50,
            monsterHealth: -50
        }
    }
];

/**
 * 根据房间类型获取可用选择
 */
export function GetChoicesForRoom(roomType: 'normal' | 'elite' | 'boss', currentMF: number): RoomChoice[] {
    let choices: RoomChoice[] = [];
    
    if (roomType === 'elite') {
        // 精英房：特殊选择 + 部分常规选择
        choices = [
            ...ELITE_CHOICES,
            BUFF_CHOICES[0],
            DEBUFF_CHOICES[1]
        ];
    } else if (roomType === 'boss') {
        // Boss房：只有高风险高回报选择
        choices = [
            DEBUFF_CHOICES[1],
            DEBUFF_CHOICES[4],
            NEUTRAL_CHOICES[0]
        ];
    } else {
        // 普通房间：随机3个选择（1 buff, 1 debuff, 1 neutral）
        choices = [
            BUFF_CHOICES[Math.floor(Math.random() * BUFF_CHOICES.length)],
            DEBUFF_CHOICES[Math.floor(Math. random() * DEBUFF_CHOICES.length)],
            NEUTRAL_CHOICES[0]
        ];
    }
    
    return choices;
}