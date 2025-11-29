/**
 * 护石系统 v2
 * - 5槽位（3开放+2锁定）
 * - Roll值系统（整数）
 * - 效果实际应用
 */

export enum RuneQuality {
    COMMON = 1,      // 白色 - Roll 1-20%
    UNCOMMON = 2,    // 绿色 - Roll 15-40%
    RARE = 3,        // 蓝色 - Roll 30-60%
    EPIC = 4,        // 紫色 - Roll 50-80%
    LEGENDARY = 5,   // 橙色 - Roll 70-100%
}

export enum RuneEffectType {
    DAMAGE_PERCENT = 'damage_percent',
    RANGE_PERCENT = 'range_percent',
    COOLDOWN_REDUCTION = 'cooldown_reduction',
    LIFESTEAL = 'lifesteal',
    CRIT_CHANCE = 'crit_chance',
    CRIT_DAMAGE = 'crit_damage',
    RAGE_COST_REDUCTION = 'rage_cost_reduction',
    BURN_DAMAGE = 'burn_damage',
}

// 效果类型中文名
const EFFECT_TYPE_NAMES: Record<string, string> = {
    [RuneEffectType.DAMAGE_PERCENT]: '伤害',
    [RuneEffectType.RANGE_PERCENT]: '范围',
    [RuneEffectType.COOLDOWN_REDUCTION]: '冷却缩减',
    [RuneEffectType.LIFESTEAL]: '生命偷取',
    [RuneEffectType.CRIT_CHANCE]: '暴击率',
    [RuneEffectType.CRIT_DAMAGE]: '暴击伤害',
    [RuneEffectType.RAGE_COST_REDUCTION]: '怒气消耗',
    [RuneEffectType.BURN_DAMAGE]: '燃烧伤害',
};

// 品质对应的Roll值范围（整数）
const QUALITY_ROLL_RANGES: Record<number, { min: number; max: number }> = {
    [RuneQuality.COMMON]: { min: 1, max: 20 },
    [RuneQuality.UNCOMMON]: { min: 15, max: 40 },
    [RuneQuality.RARE]: { min: 30, max: 60 },
    [RuneQuality.EPIC]: { min: 50, max: 80 },
    [RuneQuality. LEGENDARY]: { min: 70, max: 100 },
};

const QUALITY_NAMES: Record<number, string> = {
    [RuneQuality.COMMON]: '普通',
    [RuneQuality. UNCOMMON]: '优秀',
    [RuneQuality.RARE]: '稀有',
    [RuneQuality.EPIC]: '史诗',
    [RuneQuality.LEGENDARY]: '传说',
};

interface RuneTypeDefinition {
    id: string;
    name: string;
    effectType: RuneEffectType;
    icon: string;
    minValue: number;  // 效果最小值（整数）
    maxValue: number;  // 效果最大值（整数）
    applicableSkills: string[];
}

const RUNE_TYPES: RuneTypeDefinition[] = [
    {
        id: 'rune_damage',
        name: '伤害增幅',
        effectType: RuneEffectType.DAMAGE_PERCENT,
        icon: 'item_ultimate_orb',
        minValue: 5,
        maxValue: 30,
        applicableSkills: [],
    },
    {
        id: 'rune_range',
        name: '范围扩展',
        effectType: RuneEffectType.RANGE_PERCENT,
        icon: 'item_aether_lens',
        minValue: 10,
        maxValue: 50,
        applicableSkills: ['warrior_thunder_strike'],
    },
    {
        id: 'rune_cooldown',
        name: '时光碎片',
        effectType: RuneEffectType.COOLDOWN_REDUCTION,
        icon: 'item_octarine_core',
        minValue: 5,
        maxValue: 25,
        applicableSkills: [],
    },
    {
        id: 'rune_lifesteal',
        name: '生命汲取',
        effectType: RuneEffectType.LIFESTEAL,
        icon: 'item_satanic',
        minValue: 3,
        maxValue: 15,
        applicableSkills: [],
    },
    {
        id: 'rune_crit_chance',
        name: '致命本能',
        effectType: RuneEffectType.CRIT_CHANCE,
        icon: 'item_greater_crit',
        minValue: 5,
        maxValue: 20,
        applicableSkills: [],
    },
    {
        id: 'rune_crit_damage',
        name: '毁灭打击',
        effectType: RuneEffectType.CRIT_DAMAGE,
        icon: 'item_bloodthorn',
        minValue: 15,
        maxValue: 50,
        applicableSkills: [],
    },
    {
        id: 'rune_burn',
        name: '烈焰附魔',
        effectType: RuneEffectType.BURN_DAMAGE,
        icon: 'item_radiance',
        minValue: 10,
        maxValue: 40,
        applicableSkills: [],
    },
    {
        id: 'rune_thunder_special',
        name: '雷霆之怒',
        effectType: RuneEffectType.DAMAGE_PERCENT,
        icon: 'item_mjollnir',
        minValue: 20,
        maxValue: 60,
        applicableSkills: ['warrior_thunder_strike'],
    },
    {
        id: 'rune_execute_special',
        name: '死神印记',
        effectType: RuneEffectType.DAMAGE_PERCENT,
        icon: 'item_desolator',
        minValue: 15,
        maxValue: 40,
        applicableSkills: ['warrior_execute'],
    },
];

interface RuneInstance {
    id: string;
    typeId: string;
    quality: RuneQuality;
    rollPercent: number;   // 0-100 整数
    rollValue: number;     // 实际效果值 整数
    equippedTo: string | null;
    slotIndex: number;
}

interface PlayerRuneData {
    inventory: RuneInstance[];
    skillSlotUnlocks: Record<string, boolean[]>;
}

class RuneSystemClass {
    private playerData: Map<PlayerID, PlayerRuneData> = new Map();
    private runeIdCounter: number = 0;
    private initialized: boolean = false;

    public Init(): void {
        if (this.initialized) return;

        print('[RuneSystem] ========================================');
        print('[RuneSystem] 初始化护石系统 v2');
        print('[RuneSystem] ========================================');

        CustomGameEventManager.RegisterListener('rune_equip', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const runeId = data.runeId as string;
            const skillId = data.skillId as string;
            const slotIndex = data. slotIndex as number;
            this.equipRune(playerId, runeId, skillId, slotIndex);
        });

        CustomGameEventManager.RegisterListener('rune_unequip', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const runeId = data.runeId as string;
            this.unequipRune(playerId, runeId);
        });

        CustomGameEventManager. RegisterListener('rune_request_data', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            this.sendDataToClient(playerId);
        });

        this.initialized = true;
        print('[RuneSystem] 初始化完成');
    }

    private generateRuneId(): string {
        this.runeIdCounter++;
        return 'rune_' + this. runeIdCounter + '_' + RandomInt(1000, 9999);
    }

    // ⭐ 计算护石效果值（整数）
    private calculateRuneValue(typeId: string, quality: RuneQuality, rollPercent: number): number {
        const runeType = RUNE_TYPES.find(t => t.id === typeId);
        if (!runeType) return 0;

        // rollPercent 直接作为在 minValue~maxValue 范围内的百分比位置
        const value = runeType.minValue + (runeType.maxValue - runeType.minValue) * (rollPercent / 100);
        return Math.floor(value); // ⭐ 取整
    }

    // 创建随机护石
    public createRandomRune(typeId: string, quality: RuneQuality): RuneInstance {
        const rollPercent = RandomInt(0, 100); // 整数 0-100
        const rollValue = this.calculateRuneValue(typeId, quality, rollPercent);

        return {
            id: this.generateRuneId(),
            typeId: typeId,
            quality: quality,
            rollPercent: rollPercent,
            rollValue: rollValue,
            equippedTo: null,
            slotIndex: -1,
        };
    }

    // 创建保底护石（最低Roll）
    public createGuaranteedRune(typeId: string, quality: RuneQuality): RuneInstance {
        const rollPercent = 0;
        const rollValue = this.calculateRuneValue(typeId, quality, rollPercent);

        return {
            id: this.generateRuneId(),
            typeId: typeId,
            quality: quality,
            rollPercent: rollPercent,
            rollValue: rollValue,
            equippedTo: null,
            slotIndex: -1,
        };
    }

    public initPlayer(playerId: PlayerID): void {
        print('[RuneSystem] ========================================');
        print('[RuneSystem] 初始化玩家: ' + playerId);

        this.playerData.set(playerId, {
            inventory: [],
            skillSlotUnlocks: {},
        });

        // 添加测试护石
        this.addRuneToPlayer(playerId, this.createRandomRune('rune_damage', RuneQuality. UNCOMMON));
        this.addRuneToPlayer(playerId, this.createRandomRune('rune_range', RuneQuality. RARE));
        this.addRuneToPlayer(playerId, this. createRandomRune('rune_cooldown', RuneQuality. COMMON));
        this.addRuneToPlayer(playerId, this. createRandomRune('rune_lifesteal', RuneQuality. EPIC));
        this.addRuneToPlayer(playerId, this. createRandomRune('rune_thunder_special', RuneQuality. RARE));
        this.addRuneToPlayer(playerId, this. createRandomRune('rune_crit_chance', RuneQuality.UNCOMMON));

        print('[RuneSystem] 添加了 6 个测试护石');
        print('[RuneSystem] ========================================');

        this.sendDataToClient(playerId);
    }

    public addRuneToPlayer(playerId: PlayerID, rune: RuneInstance): void {
        const data = this.playerData.get(playerId);
        if (!data) return;

        data.inventory.push(rune);
        const runeType = RUNE_TYPES. find(t => t.id === rune.typeId);
        print('[RuneSystem] 添加护石: ' + (runeType?.name || rune.typeId) + 
              ' [' + QUALITY_NAMES[rune. quality] + '] Roll:' + rune.rollPercent + '% 效果:+' + rune.rollValue + '%');
    }

    private getSkillSlotUnlocks(playerId: PlayerID, skillId: string): boolean[] {
        const data = this.playerData.get(playerId);
        if (!data) return [true, true, true, false, false];

        if (!data.skillSlotUnlocks[skillId]) {
            data.skillSlotUnlocks[skillId] = [true, true, true, false, false];
        }
        return data.skillSlotUnlocks[skillId];
    }

    public unlockSlot(playerId: PlayerID, skillId: string, slotIndex: number): boolean {
        const data = this. playerData.get(playerId);
        if (!data) return false;

        const unlocks = this.getSkillSlotUnlocks(playerId, skillId);
        if (slotIndex < 0 || slotIndex > 4) return false;
        
        unlocks[slotIndex] = true;
        this.sendDataToClient(playerId);
        return true;
    }

    private canEquipToSkill(rune: RuneInstance, skillId: string): boolean {
        const runeType = RUNE_TYPES.find(t => t. id === rune.typeId);
        if (!runeType) return false;

        if (runeType.applicableSkills.length === 0) return true;
        return runeType.applicableSkills.indexOf(skillId) >= 0;
    }

    public equipRune(playerId: PlayerID, runeId: string, skillId: string, slotIndex: number): boolean {
        const data = this. playerData.get(playerId);
        if (!data) return false;

        const rune = data.inventory.find(r => r.id === runeId);
        if (!rune) {
            this.sendError(playerId, '护石不存在');
            return false;
        }

        if (rune.equippedTo) {
            this.sendError(playerId, '请先卸下护石');
            return false;
        }

        if (!this.canEquipToSkill(rune, skillId)) {
            this.sendError(playerId, '此护石不能装备到该技能');
            return false;
        }

        const unlocks = this.getSkillSlotUnlocks(playerId, skillId);
        if (slotIndex < 0 || slotIndex > 4 || ! unlocks[slotIndex]) {
            this.sendError(playerId, '该槽位未解锁');
            return false;
        }

        const existingRune = data.inventory. find(r => r.equippedTo === skillId && r.slotIndex === slotIndex);
        if (existingRune) {
            this. sendError(playerId, '该槽位已有护石');
            return false;
        }

        rune. equippedTo = skillId;
        rune.slotIndex = slotIndex;

        print('[RuneSystem] 装备成功');
        this.sendDataToClient(playerId);
        return true;
    }

    public unequipRune(playerId: PlayerID, runeId: string): boolean {
        const data = this.playerData.get(playerId);
        if (!data) return false;

        const rune = data.inventory.find(r => r.id === runeId);
        if (!rune || ! rune.equippedTo) return false;

        rune. equippedTo = null;
        rune.slotIndex = -1;

        print('[RuneSystem] 卸下成功');
        this.sendDataToClient(playerId);
        return true;
    }

    // 获取技能护石加成
    public getSkillRuneBonus(playerId: PlayerID, skillId: string, effectType: RuneEffectType): number {
        const data = this.playerData.get(playerId);
        if (!data) return 0;

        let totalBonus = 0;
        for (const rune of data.inventory) {
            if (rune.equippedTo !== skillId) continue;

            const runeType = RUNE_TYPES.find(t => t.id === rune. typeId);
            if (!runeType || runeType.effectType !== effectType) continue;

            totalBonus += rune.rollValue;
        }

        return totalBonus;
    }

    public sendDataToClient(playerId: PlayerID): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) return;

        const data = this.playerData.get(playerId);
        if (!data) return;

        print('[RuneSystem] 发送数据, 护石数量: ' + data.inventory.length);

        const runesObj: Record<string, any> = {};
        for (const rune of data.inventory) {
            const runeType = RUNE_TYPES.find(t => t.id === rune.typeId);
            if (!runeType) continue;

            runesObj[rune.id] = {
                id: rune.id,
                typeId: rune.typeId,
                name: runeType.name,
                icon: runeType.icon,
                effectType: runeType.effectType,
                effectTypeName: EFFECT_TYPE_NAMES[runeType. effectType] || '',
                quality: rune.quality,
                qualityName: QUALITY_NAMES[rune.quality],
                rollPercent: rune.rollPercent,
                rollValue: rune.rollValue,
                minValue: runeType.minValue,
                maxValue: runeType.maxValue,
                equippedTo: rune.equippedTo || '',
                slotIndex: rune.slotIndex,
                isUniversal: runeType.applicableSkills.length === 0,
            };
        }

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'rune_data_update' as never,
            {
                runes: runesObj,
            } as never
        );
    }

    private sendError(playerId: PlayerID, message: string): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'rune_error' as never,
            { message: message } as never
        );
    }
}

export const RuneSystem = new RuneSystemClass();

export function InitRuneSystem(): void {
    RuneSystem.Init();
}