import { ExternalRewardItem } from "../game/scripts/src/dungeon/external_reward_pool";

declare interface CustomGameEventDeclarations {
    /**
     * 在前后端之间（UI的ts代码和游戏逻辑的ts代码之间）传递的事件，需要在此处声明事件的参数类型
     * Events and their parameters between UI TypeScript code (Panorama) and game mode TypeScript code.
     */

     /*示例测试事件
    c2s_test_event: { key: string };
    c2s_test_event_with_params: {
        foo: number;
        bar: string;
    };*/
    

    // 客户端显示奖励选择事件
    
      player_select_reward: {
        PlayerID: PlayerID;
        
        rewardIndex: number;
    };
        reward_selected: {
        PlayerID: PlayerID;
        reward:any /*{
            name: string;
            type: string;
            icon: string;
            attribute: string;
            value: number;
        }*/;
        rewardIndex: number;
    };
    // 显示奖励选择界面事件
    show_reward_selection: {
        rewards: Array<{
            name: string;
            type: string;
            icon: string;
            attribute: string;
            value: number;
        }>;
    };
     request_character_stats: {
        PlayerID: PlayerID;
    };
      update_character_stats: {
          update_character_stats: {
        // ⭐ 基础属性
        strength: number;
        agility: number;
        intelligence: number;
        
        // ⭐ 攻击属性
        attackDamage: number;
        attackSpeed: number;
        critChance: number;
        critMultiplier: number;
        
        // ⭐ 防御属性
        armor: number;
        health: number;
        mana: number;
        evasion: number;
        
        // ⭐ 抗性
        fireResistance: number;
        coldResistance: number;
        lightningResistance: number;
        magicResistance: number;
        
        // ⭐ 移动
        moveSpeed: number;
        
        // 兼容旧字段
        increasedDamage: number;
        increasedPhysicalDamage: number;
        increasedElementalDamage: number;
        increasedFireDamage: number;
        increasedColdDamage: number;
        increasedLightningDamage: number;
        moreDamageValues: number[];
        projectileDamage: number;
        areaDamage: number;
        meleeDamage: number;
        spellDamage: number;
        dotDamage: number;
        cooldownReduction: number;
        areaOfEffect: number;
        castSpeed: number;
        lifesteal: number;
    };
    dungeon_completed: {
        dungeon_name: string;
        duration: number;
        rewards: {
            gold: number;
            experience: number;
        };
    };
    
    dungeon_entered: {
        dungeon_id: string;
        dungeon_name: string;
    };
    
    dungeon_failed: {
        dungeon_name: string;
        reason: string;
    };
    
    trigger_activated: {
        trigger_id: string;
        trigger_action: string;
    };
    };

// 材料使用事件
use_material: {
    PlayerID: PlayerID;
    materialType: string;
};

material_used: {
    success: boolean;
    materialType: string;
    message: string;
};


    // 示例：玩家选择副本的事件
    select_dungeon: {
        PlayerID: PlayerID;
        dungeon_type: string; // 副本类型 ("A", "B", "C")
        difficulty: string;   // 难度 ("easy", "normal", "hard")
    };
 // ⭐ 新增：职业选择事件
    select_class: {
        PlayerID: PlayerID;
        classId: string;
    };
    
    class_selection_confirmed: {
        classId: string;
        className?: string;
        success?: boolean;
    };
    
    class_selection_failed: {
        reason: string;
        success: boolean;
    };
}

    // 其他事件可以继续按照关键-参数模式进行声明...

declare global {
    interface CustomGameEventDeclarations {
        reward_selected: {
            PlayerID: PlayerID;         // 玩家 ID
            reward: ExternalRewardItem; // 玩家选定的奖励
        };
        show_reward_selection: {
            rewards: ExternalRewardItem[]; // 服务端发送奖励列表
        };
    }
}