import { DungeonMapData, TriggerData } from './types';
import { DungeonGenerator } from './DungeonGenerator';

/**
 * 副本实例状态
 */
export enum DungeonInstanceState {
    WAITING = 0,      // 等待玩家
    RUNNING = 1,      // 进行中
    COMPLETED = 2,    // 已完成
    FAILED = 3,       // 失败
}

/**
 * 副本实例
 * 代表一个正在运行的副本
 */
export class DungeonInstance {
    private instanceId: string;
    private generator: DungeonGenerator;
    private state: DungeonInstanceState;
    private players: PlayerID[] = [];
    private triggeredEvents: Set<string> = new Set();
    private startTime: number = 0;
    
    constructor(instanceId: string, centerPosition: Vector, mapData: DungeonMapData) {
        this.instanceId = instanceId;
        this.generator = new DungeonGenerator(centerPosition, mapData);
        this.state = DungeonInstanceState.WAITING;
    }
    
    /**
     * 初始化副本
     */
    public Initialize(): void {
        print(`[DungeonInstance] 初始化副本实例: ${this.instanceId}`);
        this.generator.Generate();
        this.SetupTriggerListeners();
    }
    
    /**
     * 开始副本
     */
    public Start(): void {
        this.state = DungeonInstanceState.RUNNING;
        this.startTime = GameRules.GetGameTime();
        print(`[DungeonInstance] 副本开始: ${this.instanceId}`);
    }
    
    /**
     * 添加玩家到副本
     */
    public AddPlayer(playerId: PlayerID): void {
        if (! this.players.includes(playerId)) {
            this.players.push(playerId);
            print(`[DungeonInstance] 玩家 ${playerId} 加入副本`);
        }
    }
    
    /**
     * 移除玩家
     */
    public RemovePlayer(playerId: PlayerID): void {
        const index = this.players.indexOf(playerId);
        if (index > -1) {
            this.players.splice(index, 1);
            print(`[DungeonInstance] 玩家 ${playerId} 离开副本`);
        }
        
        // 如果没有玩家了，可以考虑清理副本
        if (this.players.length === 0) {
            this.OnAllPlayersLeft();
        }
    }
    
    /**
     * 设置触发器监听
     */
    private SetupTriggerListeners(): void {
        const mapData = this.generator.GetMapData();
        
        // 每0.5秒检查一次触发器
        Timers.CreateTimer(0.5, () => {
            if (this.state === DungeonInstanceState.RUNNING) {
                this.CheckTriggers();
                return 0.5;  // 继续循环
            }
            return undefined;  // 停止计时器
        });
    }
    
    /**
     * 检查所有触发器
     */
    private CheckTriggers(): void {
        const mapData = this.generator.GetMapData();
        
        for (const trigger of mapData.triggers) {
            // 如果是一次性触发器且已触发，跳过
            if (trigger.oneTime && this.triggeredEvents.has(trigger.id)) {
                continue;
            }
            
            const worldPos = this.generator.GridToWorld(trigger.x, trigger.y);
            
            switch (trigger.event) {
                case 'enter':
                    this.CheckEnterTrigger(worldPos, trigger);
                    break;
                case 'kill':
                    this.CheckKillTrigger(worldPos, trigger);
                    break;
                // 其他触发器类型...
            }
        }
    }
    
    /**
     * 检查进入触发器
     */
    private CheckEnterTrigger(position: Vector, trigger: TriggerData): void {
        // 检查是否有玩家英雄在范围内
        for (const playerId of this.players) {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero && hero.IsAlive()) {
                const distance = (hero.GetAbsOrigin() - position as Vector).Length2D();
                if (distance <= trigger.radius) {
                    this.ExecuteTrigger(trigger);
                    return;
                }
            }
        }
    }
    
    /**
     * 检查击杀触发器
     */
    private CheckKillTrigger(position: Vector, trigger: TriggerData): void {
        // 检查范围内是否还有敌对单位
        const units = FindUnitsInRadius(
            DotaTeam.NEUTRALS,
            position,
            undefined,
            trigger.radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.BASIC + UnitTargetType.HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        
        // 如果范围内没有单位了，触发
        if (units.length === 0) {
            this.ExecuteTrigger(trigger);
        }
    }
    
    /**
     * 执行触发器动作
     */
    private ExecuteTrigger(trigger: TriggerData): void {
        print(`[DungeonInstance] 触发器激活: ${trigger.id} - ${trigger.action}`);
        
        // 标记为已触发
        this.triggeredEvents.add(trigger.id);
        
        const mapData = this.generator.GetMapData();
        
        // 根据动作类型执行
        switch (trigger.action) {
            case 'spawn_room1':
                this.SpawnByTrigger('trigger_room1_enter');
                break;
            case 'spawn_corridor':
                this.SpawnByTrigger('trigger_corridor_enter');
                break;
            case 'spawn_boss':
                this.SpawnByTrigger('trigger_boss_room_enter');
                break;
            case 'dungeon_complete':
                this.CompleteDungeon();
                break;
        }
    }
    
    /**
     * 根据触发器ID生成怪物
     */
    private SpawnByTrigger(triggerConditionId: string): void {
        const mapData = this.generator.GetMapData();
        
        for (const spawner of mapData.spawners) {
            if (spawner.triggerCondition === triggerConditionId) {
                const worldPos = this.generator.GridToWorld(spawner.x, spawner.y);
                this.generator.SpawnUnits(worldPos, spawner);
            }
        }
    }
    
    /**
     * 完成副本
     */
    private CompleteDungeon(): void {
        this.state = DungeonInstanceState.COMPLETED;
        const duration = GameRules.GetGameTime() - this.startTime;
        
        print(`[DungeonInstance] 副本完成!  用时: ${duration}秒`);
        
        // 给所有玩家奖励
        for (const playerId of this.players) {
            this.GiveReward(playerId);
        }
    }
    
    /**
     * 给玩家奖励
     */
    private GiveReward(playerId: PlayerID): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            // 示例：给经验和金币
            hero.AddExperience(1000, ModifyXpReason.UNSPECIFIED, false, true);
            PlayerResource.ModifyGold(playerId, 500, true, ModifyGoldReason.UNSPECIFIED);
            
            // 显示消息
            CustomGameEventManager.Send_ServerToPlayer(PlayerResource.GetPlayer(playerId)!, 'dungeon_completed', {
                dungeon_name: this.generator.GetMapData().mapName,
            }as never);
        }
    }
    
    /**
     * 所有玩家离开时
     */
    private OnAllPlayersLeft(): void {
        print(`[DungeonInstance] 所有玩家已离开，准备清理副本`);
        // 可以延迟一段时间再清理
        Timers.CreateTimer(30, () => {
            this.Cleanup();
            return undefined;
        });
    }
    
    /**
     * 清理副本
     */
    public Cleanup(): void {
        print(`[DungeonInstance] 清理副本实例: ${this.instanceId}`);
        this.generator.Cleanup();
    }
    
    /**
     * 获取副本状态
     */
    public GetState(): DungeonInstanceState {
        return this.state;
    }
    
    /**
     * 获取实例ID
     */
    public GetInstanceId(): string {
        return this.instanceId;
    }
}