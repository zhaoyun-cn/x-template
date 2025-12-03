/**
 * 游戏管理器 - 统一初始化所有系统
 */

import { ClassSystem } from '../systems/class_system';
import { InitSkillEquipSystem } from '../systems/skill_equip_system';
import { InitSkillPointSystem } from '../systems/skill_point_system';
import { InitRuneSystem } from '../systems/rune_system';
import { InitDamageTest } from '../systems/damage_test';
import { InitCharacterStatsHandler } from '../systems/character_stats_handler';
import { InitPOE2System } from '../systems/equipment/poe2_init';
import { InitEquipmentTestCommands } from '../systems/equipment_test_commands';
import { RageSystem } from '../modules/rage_system';
import { SimpleDungeon } from '../dungeon/simple_dungeon';
import { ZoneDungeon } from '../zone/zone_dungeon';

declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
        ZoneDungeon?: ZoneDungeon;
    }
}

export class GameManager {
    /**
     * 初始化所有游戏系统
     */
    public static InitializeSystems(): void {
        print("=".repeat(50));
        print("[GameManager] 开始初始化所有系统...");
        print("=".repeat(50));

        // 职业系统
        ClassSystem.Init();
        print("[GameManager] ✓ 职业系统已初始化");

        // 技能点系统
        InitSkillPointSystem();
        print("[GameManager] ✓ 技能点系统已初始化");

        // 技能装备系统
        InitSkillEquipSystem();
        print("[GameManager] ✓ 技能装备系统已初始化");

        // 角色属性系统
        InitCharacterStatsHandler();
        print("[GameManager] ✓ 角色属性系统已初始化");

        // 伤害测试系统
        InitDamageTest();
        print("[GameManager] ✓ 伤害测试系统已初始化");

        // 护石系统
        InitRuneSystem();
        print("[GameManager] ✓ 护石系统已初始化");

        // POE2 装备系统
        InitPOE2System();
        print("[GameManager] ✓ POE2 装备系统已初始化");

        // 装备测试命令
        InitEquipmentTestCommands();
        print("[GameManager] ✓ 装备测试命令已初始化");

        // 狂暴系统
        RageSystem.Init();
        print("[GameManager] ✓ 狂暴系统已初始化");

        // 副本系统
        GameRules.SimpleDungeon = new SimpleDungeon();
        print("[GameManager] ✓ 简单副本系统已初始化");

        GameRules.ZoneDungeon = new ZoneDungeon();
        print("[GameManager] ✓ 刷怪区域系统已初始化");

        print("=".repeat(50));
        print("[GameManager] 所有系统初始化完成！");
        print("=".repeat(50));
    }
}
