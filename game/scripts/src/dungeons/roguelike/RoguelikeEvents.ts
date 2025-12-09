import { RoguelikeDungeonInstance } from './RoguelikeDungeonInstance';

/**
 * Roguelike事件系统
 * 处理玩家的分支选择等事件
 */
export class RoguelikeEvents {
    private static instances: Map<string, RoguelikeDungeonInstance> = new Map();
    private static initialized: boolean = false;
    
    /**
     * 注册副本实例
     */
    public static RegisterInstance(instanceId: string, instance: RoguelikeDungeonInstance): void {
        this.instances.set(instanceId, instance);
        print(`[RoguelikeEvents] 注册副本实例: ${instanceId}`);
        
        if (!this.initialized) {
            this.Initialize();
        }
    }
    
    /**
     * 取消注册副本实例
     */
    public static UnregisterInstance(instanceId: string): void {
        this.instances.delete(instanceId);
        print(`[RoguelikeEvents] 取消注册副本实例: ${instanceId}`);
    }
    
    /**
     * 初始化事件监听
     */
    private static Initialize(): void {
        if (this.initialized) return;
        
        print('[RoguelikeEvents] 初始化事件系统');
        
        // 监听分支选择事件
        CustomGameEventManager.RegisterListener('roguelike_select_branch', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const instanceId = event.instanceId as string;
            const roomId = event.roomId as string;
            
            print(`[RoguelikeEvents] 玩家 ${playerId} 选择分支: ${roomId} in ${instanceId}`);
            
            const instance = this.instances.get(instanceId);
            if (instance) {
                instance.OnBranchSelected(playerId, roomId);
            } else {
                print(`[RoguelikeEvents] 错误：找不到副本实例 ${instanceId}`);
            }
        });
        
        this.initialized = true;
    }
}
