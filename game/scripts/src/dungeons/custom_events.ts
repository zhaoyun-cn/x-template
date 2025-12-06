/**
 * 扩展 CustomGameEventDeclarations 接口
 * 这样 TypeScript 就知道我们的自定义事件了
 */

declare interface CustomGameEventDeclarations {
    // 副本完成事件
    dungeon_completed: {
        dungeon_name: string;
        duration: number;
        rewards: {
            gold: number;
            experience: number;
        };
    };
    
    // 副本进入事件
    dungeon_entered: {
        dungeon_id: string;
        dungeon_name: string;
    };
    
    // 副本失败事件
    dungeon_failed: {
        dungeon_name: string;
        reason: string;
    };
    
    // 触发器激活事件
    trigger_activated: {
        trigger_id: string;
        trigger_action: string;
    };
}