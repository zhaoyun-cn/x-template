/**
 * 副本系统自定义事件定义
 */

// 副本完成事件
export interface DungeonCompletedEvent {
    dungeon_name: string;
    duration: number;
    rewards: {
        gold: number;
        experience: number;
    };
}

// 副本进入事件
export interface DungeonEnteredEvent {
    dungeon_id: string;
    dungeon_name: string;
}

// 副本失败事件
export interface DungeonFailedEvent {
    dungeon_name: string;
    reason: string;
}

// 触发器激活事件
export interface TriggerActivatedEvent {
    trigger_id: string;
    trigger_action: string;
}

/**
 * 所有副本事件类型
 */
export interface DungeonGameEvents {
    dungeon_completed: DungeonCompletedEvent;
    dungeon_entered: DungeonEnteredEvent;
    dungeon_failed: DungeonFailedEvent;
    trigger_activated: TriggerActivatedEvent;
}

/**
 * 发送副本事件到客户端（类型安全的包装函数）
 */
export function SendDungeonEvent<T extends keyof DungeonGameEvents>(
    player: CDOTAPlayer,
    eventName: T,
    data: DungeonGameEvents[T]
): void {
    CustomGameEventManager.Send_ServerToPlayer(player, eventName, data as any);
}

/**
 * 发送副本事件到所有玩家
 */
export function SendDungeonEventToAllPlayers<T extends keyof DungeonGameEvents>(
    eventName: T,
    data: DungeonGameEvents[T]
): void {
    CustomGameEventManager.Send_ServerToAllClients(eventName, data as any);
}