/**
 * 护石系统
 */

export enum RuneQuality {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
}

export enum RuneEffectType {
    DAMAGE_BONUS = 'damage_bonus',
    COOLDOWN_REDUCTION = 'cooldown_reduction',
    RANGE_BONUS = 'range_bonus',
    LIFESTEAL = 'lifesteal',
    CRIT_CHANCE = 'crit_chance',
}

interface RuneDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    effectType: RuneEffectType;
    baseValue: number;
    applicableSkills: string[];
}

interface RuneInstance {
    id: string;
    definitionId: string;
    quality: RuneQuality;
    equippedTo: string | null;
}

const RUNE_DEFINITIONS: RuneDefinition[] = [
    {
        id: 'rune_thunder_damage',
        name: '雷霆增幅',
        description: '雷霆一击伤害提高',
        icon: 'item_ultimate_orb',
        effectType: RuneEffectType.DAMAGE_BONUS,
        baseValue: 30,
        applicableSkills: ['warrior_thunder_strike'],
    },
    {
        id: 'rune_thunder_range',
        name: '雷霆扩散',
        description: '雷霆一击范围扩大',
        icon: 'item_aether_lens',
        effectType: RuneEffectType.RANGE_BONUS,
        baseValue: 20,
        applicableSkills: ['warrior_thunder_strike'],
    },
    {
        id: 'rune_cooldown',
        name: '时光碎片',
        description: '技能冷却缩减',
        icon: 'item_octarine_core',
        effectType: RuneEffectType.COOLDOWN_REDUCTION,
        baseValue: 10,
        applicableSkills: [],
    },
    {
        id: 'rune_lifesteal',
        name: '生命汲取',
        description: '技能伤害转化生命',
        icon: 'item_satanic',
        effectType: RuneEffectType.LIFESTEAL,
        baseValue: 5,
        applicableSkills: [],
    },
];

const QUALITY_MULTIPLIERS: Record<RuneQuality, number> = {
    [RuneQuality.COMMON]: 1.0,
    [RuneQuality.UNCOMMON]: 1.25,
    [RuneQuality.RARE]: 1.5,
    [RuneQuality.EPIC]: 1.75,
    [RuneQuality.LEGENDARY]: 2.0,
};

interface PlayerRuneData {
    inventory: RuneInstance[];
    equipped: Record<string, string[]>;
    maxSlotsPerSkill: number;
}

class RuneSystemClass {
    private playerData: Map<PlayerID, PlayerRuneData> = new Map();
    private runeIdCounter: number = 0;
    private initialized: boolean = false;

    public Init(): void {
        if (this.initialized) return;

        print('[RuneSystem] ========================================');
        print('[RuneSystem] 初始化护石系统');
        print('[RuneSystem] ========================================');

        CustomGameEventManager.RegisterListener('rune_equip', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const runeId = data.runeId as string;
            const skillId = data.skillId as string;
            print('[RuneSystem] 装备护石: 玩家=' + playerId + ', 护石=' + runeId + ', 技能=' + skillId);
            this.equipRune(playerId, runeId, skillId);
        });

        CustomGameEventManager.RegisterListener('rune_unequip', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const runeId = data.runeId as string;
            print('[RuneSystem] 卸下护石: 玩家=' + playerId + ', 护石=' + runeId);
            this.unequipRune(playerId, runeId);
        });

        CustomGameEventManager.RegisterListener('rune_request_data', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            print('[RuneSystem] 数据请求: 玩家=' + playerId);
            this.sendDataToClient(playerId);
        });

        this.initialized = true;
        print('[RuneSystem] 初始化完成');
    }

    private generateRuneId(): string {
        this.runeIdCounter++;
        return 'rune_inst_' + this.runeIdCounter + '_' + RandomInt(1000, 9999);
    }

    public initPlayer(playerId: PlayerID): void {
        print('[RuneSystem] ========================================');
        print('[RuneSystem] 初始化玩家: ' + playerId);
        
        this.playerData.set(playerId, {
            inventory: [],
            equipped: {},
            maxSlotsPerSkill: 3,
        });

        // 添加测试护石
        print('[RuneSystem] 添加测试护石...');
        this.addRuneToPlayer(playerId, 'rune_thunder_damage', RuneQuality.UNCOMMON);
        this.addRuneToPlayer(playerId, 'rune_thunder_range', RuneQuality.COMMON);
        this.addRuneToPlayer(playerId, 'rune_cooldown', RuneQuality.RARE);
        this.addRuneToPlayer(playerId, 'rune_lifesteal', RuneQuality.COMMON);

        const data = this.playerData.get(playerId);
        print('[RuneSystem] 玩家护石数量: ' + (data ? data.inventory.length : 0));
        print('[RuneSystem] ========================================');
        
        // 立即发送数据
        this.sendDataToClient(playerId);
    }

    public addRuneToPlayer(playerId: PlayerID, definitionId: string, quality: RuneQuality): RuneInstance | null {
        const data = this.playerData.get(playerId);
        if (!data) {
            print('[RuneSystem] 错误: 玩家数据不存在 ' + playerId);
            return null;
        }

        const definition = RUNE_DEFINITIONS.find(d => d.id === definitionId);
        if (! definition) {
            print('[RuneSystem] 错误: 护石定义不存在 ' + definitionId);
            return null;
        }

        const rune: RuneInstance = {
            id: this.generateRuneId(),
            definitionId: definitionId,
            quality: quality,
            equippedTo: null,
        };

        data.inventory.push(rune);
        print('[RuneSystem] 添加护石成功: ' + definition.name + ' (' + quality + '), ID=' + rune.id);

        return rune;
    }

    private canEquipRuneToSkill(rune: RuneInstance, skillId: string): boolean {
        const definition = RUNE_DEFINITIONS.find(d => d.id === rune.definitionId);
        if (!definition) return false;
        if (definition.applicableSkills.length === 0) return true;
        return definition.applicableSkills.indexOf(skillId) >= 0;
    }

    public equipRune(playerId: PlayerID, runeId: string, skillId: string): boolean {
        const data = this.playerData.get(playerId);
        if (!data) return false;

        const rune = data.inventory.find(r => r.id === runeId);
        if (!rune) {
            print('[RuneSystem] 护石不存在: ' + runeId);
            this.sendError(playerId, '护石不存在');
            return false;
        }

        if (rune.equippedTo) {
            print('[RuneSystem] 护石已装备');
            this.sendError(playerId, '请先卸下护石');
            return false;
        }

        if (!this.canEquipRuneToSkill(rune, skillId)) {
            print('[RuneSystem] 护石不能装备到此技能');
            this.sendError(playerId, '此护石不能装备到该技能');
            return false;
        }

        if (! data.equipped[skillId]) {
            data.equipped[skillId] = [];
        }
        if (data.equipped[skillId].length >= data.maxSlotsPerSkill) {
            print('[RuneSystem] 护石槽已满');
            this.sendError(playerId, '护石槽已满');
            return false;
        }

        rune.equippedTo = skillId;
        data.equipped[skillId].push(runeId);

        print('[RuneSystem] 护石装备成功');
        this.sendDataToClient(playerId);
        return true;
    }

    public unequipRune(playerId: PlayerID, runeId: string): boolean {
        const data = this.playerData.get(playerId);
        if (!data) return false;

        const rune = data.inventory.find(r => r.id === runeId);
        if (!rune || ! rune.equippedTo) {
            return false;
        }

        const skillId = rune.equippedTo;
        rune.equippedTo = null;

        if (data.equipped[skillId]) {
            const idx = data.equipped[skillId].indexOf(runeId);
            if (idx >= 0) {
                data.equipped[skillId].splice(idx, 1);
            }
        }

        print('[RuneSystem] 护石卸下成功');
        this.sendDataToClient(playerId);
        return true;
    }

    public sendDataToClient(playerId: PlayerID): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) {
            print('[RuneSystem] 错误: 找不到玩家 ' + playerId);
            return;
        }

        const data = this.playerData.get(playerId);
        if (!data) {
            print('[RuneSystem] 错误: 玩家数据不存在 ' + playerId);
            return;
        }

        print('[RuneSystem] 发送护石数据, 数量: ' + data.inventory.length);

        // 构建护石数据 - 使用对象而非数组
        const runesObj: Record<string, any> = {};
        for (let i = 0; i < data.inventory.length; i++) {
            const rune = data.inventory[i];
            const def = RUNE_DEFINITIONS.find(d => d.id === rune.definitionId);
            if (! def) continue;

            // 构建 applicableSkills 对象
            const applicableObj: Record<string, boolean> = {};
            for (const skillId of def.applicableSkills) {
                applicableObj[skillId] = true;
            }

            runesObj[rune.id] = {
                id: rune.id,
                definitionId: rune.definitionId,
                name: def.name,
                description: def.description,
                icon: def.icon,
                effectType: def.effectType,
                baseValue: def.baseValue,
                quality: rune.quality,
                equippedTo: rune.equippedTo || '',
                applicableSkills: applicableObj,
                isUniversal: def.applicableSkills.length === 0,
            };
            
            print('[RuneSystem] - 护石: ' + def.name + ' (' + rune.quality + ')');
        }

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'rune_data_update' as never,
            {
                runes: runesObj,
                maxSlots: data.maxSlotsPerSkill,
            } as never
        );
        
        print('[RuneSystem] 数据发送完成');
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