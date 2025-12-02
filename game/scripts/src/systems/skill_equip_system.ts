/**
 * 技能装备系统
 * 管理玩家技能槽位的装备和卸下
 */

// 槽位定义
export enum SkillSlot {
    Q = 0,
    W = 1,
    E = 2,
    R = 3,
}

// 技能类型
export type SkillType = 'active' | 'passive' | 'ultimate';

// 玩家装备数据
interface PlayerEquipData {
    slots: (string | null)[];  // [Q, W, E, R] 槽位装备的技能ID
}

class SkillEquipSystemClass {
    private playerData: Map<PlayerID, PlayerEquipData> = new Map();
    private initialized: boolean = false;

    // 技能类型映射
    private skillTypes: Record<string, SkillType> = {
        'warrior_deep_wound': 'passive',
        'warrior_thunder_strike': 'active',
        'warrior_sudden_death': 'passive',
        'warrior_execute': 'ultimate',
        'warrior_strike': 'active',
        'warrior_whirlwind': 'active',
        'warrior_warcry': 'active',
        'warrior_berserker': 'passive',
        'warrior_bloodthirst': 'passive',
        'warrior_armor_break': 'active',
        'warrior_charge': 'active',
        'warrior_block': 'passive',
        'warrior_tenacity': 'passive',
        'warrior_critical': 'passive',
        'warrior_avatar': 'ultimate',
    };

    public Init(): void {
        if (this. initialized) return;

        print('[SkillEquipSystem] ========================================');
        print('[SkillEquipSystem] 初始化技能装备系统');
        print('[SkillEquipSystem] ========================================');

        // 监听装备技能请求
        CustomGameEventManager.RegisterListener('skill_equip_to_slot', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const skillId = data.skillId as string;
            const slot = data.slot as number;
            print('[SkillEquipSystem] 装备请求: 玩家=' + playerId + ', 技能=' + skillId + ', 槽位=' + slot);
            this.equipSkill(playerId, skillId, slot);
        });

        // 监听卸下技能请求
        CustomGameEventManager.RegisterListener('skill_unequip_slot', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const slot = data.slot as number;
            print('[SkillEquipSystem] 卸下请求: 玩家=' + playerId + ', 槽位=' + slot);
            this.unequipSlot(playerId, slot);
        });

        // 监听请求装备数据
        CustomGameEventManager. RegisterListener('skill_equip_request_data', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            print('[SkillEquipSystem] 数据请求: 玩家=' + playerId);
            this.sendDataToClient(playerId);
        });

        this.initialized = true;
        print('[SkillEquipSystem] 初始化完成');
    }

    // 初始化玩家数据
    public initPlayer(playerId: PlayerID): void {
        this.playerData.set(playerId, {
            slots: [null, null, null, null],
        });
        print('[SkillEquipSystem] 初始化玩家 ' + playerId + ' 装备数据');
    }

    // 获取技能类型
    private getSkillType(skillId: string): SkillType | null {
        return this.skillTypes[skillId] || null;
    }

    // 检查技能是否可以装备到指定槽位
    private canEquipToSlot(skillId: string, slot: number): { can: boolean; reason?: string } {
        const skillType = this.getSkillType(skillId);
        
        if (skillType == null) {
            return { can: false, reason: '未知技能' };
        }

        if (skillType === 'passive') {
            return { can: false, reason: '被动技能无需装备' };
        }

        if (slot === SkillSlot.R) {
            if (skillType !== 'ultimate') {
                return { can: false, reason: 'R槽只能装备终极技能' };
            }
        } else {
            if (skillType === 'ultimate') {
                return { can: false, reason: '终极技能只能装备到R槽' };
            }
        }

        return { can: true };
    }

    // 装备技能到槽位
    public equipSkill(playerId: PlayerID, skillId: string, slot: number): boolean {
        let data = this.playerData.get(playerId);
        if (!data) {
            this.initPlayer(playerId);
            data = this.playerData. get(playerId)!;
        }

        // 检查是否可以装备
        const check = this.canEquipToSlot(skillId, slot);
        if (!check.can) {
            print('[SkillEquipSystem] 装备失败: ' + check.reason);
            this.sendError(playerId, check.reason || '无法装备');
            return false;
        }

        // 检查技能是否已经装备在其他槽位，如果是则先移除
        for (let i = 0; i < 4; i++) {
            if (data.slots[i] === skillId) {
                data. slots[i] = null;
                print('[SkillEquipSystem] 从槽位 ' + i + ' 移除技能 ' + skillId);
            }
        }

        // 装备到新槽位
        data.slots[slot] = skillId;
        print('[SkillEquipSystem] 技能 ' + skillId + ' 装备到槽位 ' + slot);

        // 更新英雄技能
        this.updateHeroAbilities(playerId);

        // 发送更新
        this.sendDataToClient(playerId);
        return true;
    }

    // 卸下槽位技能
    public unequipSlot(playerId: PlayerID, slot: number): boolean {
        const data = this.playerData.get(playerId);
        if (!  data) return false;

        if (data.slots[slot] == null) {
            return false;
        }

        const skillId = data.slots[slot];
        data.slots[slot] = null;
        print('[SkillEquipSystem] 从槽位 ' + slot + ' 卸下技能 ' + skillId);

        // 更新英雄技能
        this.updateHeroAbilities(playerId);

        // 发送更新
        this.sendDataToClient(playerId);
        return true;
    }

    // 更新英雄的实际技能
    private updateHeroAbilities(playerId: PlayerID): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;

        const data = this.playerData.get(playerId);
        if (!data) return;

        const abilitySlots = [0, 1, 2, 5];

        for (let i = 0; i < 4; i++) {
            const skillId = data.slots[i];
            const abilityIndex = abilitySlots[i];

            if (skillId) {
                const ability = hero.FindAbilityByName(skillId);
                if (ability) {
                    const currentAbility = hero.GetAbilityByIndex(abilityIndex);
                    const currentName = currentAbility ?  currentAbility.GetAbilityName() : '';
                    if (currentName && currentName !== skillId) {
                        hero.SwapAbilities(skillId, currentName, true, true);
                    }
                    print('[SkillEquipSystem] 设置槽位 ' + i + ' 技能: ' + skillId);
                }
            }
        }
    }

    // 获取玩家装备数据
    public getPlayerSlots(playerId: PlayerID): (string | null)[] {
        const data = this.playerData. get(playerId);
        return data ?   data.slots : [null, null, null, null];
    }

    // 发送数据到客户端
    public sendDataToClient(playerId: PlayerID): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!  player) return;

        const data = this.playerData.get(playerId);
        const slots = data ? data.slots : [null, null, null, null];

        // ⭐ 修复：不使用 join，改用简单字符串拼接
        const slotStr = (slots[0] || '_') + ',' + (slots[1] || '_') + ',' + (slots[2] || '_') + ',' + (slots[3] || '_');
        print('[SkillEquipSystem] 发送装备数据: ' + slotStr);

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'skill_equip_data_update' as never,
            {
                slots: {
                    q: slots[0] || '',
                    w: slots[1] || '',
                    e: slots[2] || '',
                    r: slots[3] || '',
                },
            } as never
        );
    }

    // 发送错误
    private sendError(playerId: PlayerID, message: string): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (! player) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'skill_equip_error' as never,
            { message: message } as never
        );
    }
}

// 导出单例
export const SkillEquipSystem = new SkillEquipSystemClass();

// 初始化函数
export function InitSkillEquipSystem(): void {
    SkillEquipSystem.Init();
}