import 'utils/index';
import { ActivateModules } from './modules';
import Precache from './utils/precache';

// ==================== 技能和 Modifier 导入（必须保留）====================
import './examples/abilities/warrior_sudden_death';
import './examples/modifiers/modifier_rage_attack_listener';
import './examples/modifiers/modifier_rage_ability_checker';
import './examples/abilities/warrior_thunder_strike';
import './examples/modifiers/modifier_axe_giant_strike_debuff';
import './examples/abilities/warrior_deep_wound';
import './examples/abilities/axe_giant_strike';
import './modifiers/modifier_equipment_system';

// ==================== 核心系统导入 ====================
import { GameManager } from './core/game_manager';
import { EventHandlers } from './core/event_handlers';
import { MaterialUseSystem } from './systems/inventory/material_system';
import { TestCommands } from './dev/test_commands';

// ==================== Lua Modifier 初始化 ====================
if (IsServer()) {
    pcall(() => require('init_modifiers'));
}

// ==================== 入口函数 ====================
Object.assign(getfenv(), {
    Activate: () => {
        print("=".repeat(50));
        print("[GameMode] Activating...");
        print("=".repeat(50));
        
        // 激活模块系统
        ActivateModules();
        
        // 初始化所有游戏系统（通过 GameManager）
        GameManager.InitializeSystems();
        
        // 初始化材料使用系统
        MaterialUseSystem.Init();
        print("[GameMode] ✓ 材料使用系统已初始化");
        
        // 注册所有事件处理器
        EventHandlers.RegisterAllEvents();
        
        // 生成副本传送门
        EventHandlers.SpawnDungeonPortal();
        
        // 注册测试命令
        TestCommands.RegisterAllCommands();
        
        print("[GameMode] All modules loaded!");
        print("=".repeat(50));
    },
    Precache: Precache,
});