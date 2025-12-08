import { DungeonMapData, TriggerData } from './types';
import { DungeonGenerator } from './DungeonGenerator';

/**
 * 副本实例状态
 */
export enum DungeonInstanceState {
    WAITING = 0,
    RUNNING = 1,
    COMPLETED = 2,
    FAILED = 3,
}

/**
 * 副本实例
 */
export class DungeonInstance {
    private instanceId: string;
    private generator: DungeonGenerator;
    private state: DungeonInstanceState;
    private players: PlayerID[] = [];
    private triggeredEvents: Set<string> = new Set();
    private startTime: number = 0;
    private spawnedUnitsByTrigger: Map<string, CDOTA_BaseNPC[]> = new Map();
    
    constructor(instanceId: string, centerPosition: Vector, mapData: DungeonMapData) {
        this.instanceId = instanceId;
        this.generator = new DungeonGenerator(centerPosition, mapData);
        this.state = DungeonInstanceState.WAITING;
    }
    
    public Initialize(): void {
        print(`[DungeonInstance] 初始化副本实例: ${this.instanceId}`);
        this.generator.Generate();
        this.SetupTriggerListeners();
    }
    
    public Start(): void {
        this.state = DungeonInstanceState.RUNNING;
        this.startTime = GameRules.GetGameTime();
        print(`[DungeonInstance] 副本开始: ${this.instanceId}`);
    }
    
    public AddPlayer(playerId: PlayerID): void {
        if (! this.players.includes(playerId)) {
            this.players.push(playerId);
            print(`[DungeonInstance] 玩家 ${playerId} 加入副本`);
        }
    }
    
    public RemovePlayer(playerId: PlayerID): void {
        const index = this.players.indexOf(playerId);
        if (index > -1) {
            this.players.splice(index, 1);
            print(`[DungeonInstance] 玩家 ${playerId} 离开副本`);
        }
        
        if (this.players.length === 0) {
            this.OnAllPlayersLeft();
        }
    }
    
    private SetupTriggerListeners(): void {
        Timers.CreateTimer(0.5, () => {
            if (this.state === DungeonInstanceState.RUNNING) {
                this.CheckTriggers();
                return 0.5;
            }
            return undefined;
        });
    }
    
    private CheckTriggers(): void {
        const mapData = this.generator.GetMapData();
        
        for (const trigger of mapData.triggers) {
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
            }
        }
    }
    
    private CheckEnterTrigger(position: Vector, trigger: TriggerData): void {
        for (const playerId of this.players) {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero && hero.IsAlive()) {
                const heroPos = hero.GetAbsOrigin();
                const dx = heroPos.x - position.x;
                const dy = heroPos.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= trigger.radius) {
                    this.ExecuteTrigger(trigger);
                    return;
                }
            }
        }
    }
    
    private CheckKillTrigger(position: Vector, trigger: TriggerData): void {
        // kill 触发器需要检查对应的 spawn 触发器生成的单位
        // 例如：trigger_boss_killed 应该检查 trigger_boss_room_enter 生成的单位
        
        // 根据命名规则推导对应的 spawn 触发器
        let spawnTriggerId = trigger.id.replace('_killed', '_room_enter');
        
        // 特殊情况处理：如果是副本完成触发器，尝试多个可能的ID
        if (trigger.action === 'dungeon_complete') {
            const possibleIds = [
                'trigger_boss_room_enter',
                'trigger_boss_enter',
                'spawn_boss',
            ];
            
            for (const id of possibleIds) {
                if (this.spawnedUnitsByTrigger.has(id)) {
                    spawnTriggerId = id;
                    print(`[DungeonInstance] 找到关联的刷怪触发器: ${id}`);
                    break;
                }
            }
        }
        
        const spawnedUnits = this.spawnedUnitsByTrigger.get(spawnTriggerId);
        
        print(`[DungeonInstance] 检查击杀触发器: ${trigger.id} -> 关联刷怪触发器: ${spawnTriggerId}`);
        
        if (!spawnedUnits || spawnedUnits.length === 0) {
            // print(`[DungeonInstance] 触发器 ${spawnTriggerId} 还没有生成单位，跳过检查`);
            return;
        }
        
        // 检查生成的单位是否都已经死亡
        let allDead = true;
        let aliveCount = 0;
        
        for (const unit of spawnedUnits) {
            if (unit && IsValidEntity(unit) && unit.IsAlive()) {
                allDead = false;
                aliveCount++;
            }
        }
        
        if (aliveCount > 0 || ! allDead) {
            // print(`[DungeonInstance] 触发器 ${trigger.id} - 存活单位: ${aliveCount}/${spawnedUnits.length}`);
        }
        
        if (allDead) {
            print(`[DungeonInstance] ✅✅✅ 所有单位已死亡！触发器: ${trigger.id}, 动作: ${trigger.action}`);
            this.ExecuteTrigger(trigger);
        }
    }
    
    private ExecuteTrigger(trigger: TriggerData): void {
        print(`[DungeonInstance] 触发器激活: ${trigger.id} - ${trigger.action}`);
        
        // 标记为已触发
        this.triggeredEvents.add(trigger.id);
        
        // 根据动作类型执行
        switch (trigger.action) {
            case 'spawn_room1':
                this.SpawnByTrigger('trigger_room1_enter', trigger.id);
                break;
            case 'spawn_corridor':
                this.SpawnByTrigger('trigger_corridor_enter', trigger.id);
                break;
            case 'spawn_boss':
                this.SpawnByTrigger('trigger_boss_room_enter', trigger.id);
                break;
            case 'dungeon_complete':
                print(`[DungeonInstance] ✅✅✅ 副本完成动作触发！`);
                this.CompleteDungeon();
                break;
            default:
                print(`[DungeonInstance] ⚠️ 未知动作: ${trigger.action}`);
                break;
        }
    }
    
    private SpawnByTrigger(triggerConditionId: string, parentTriggerId: string): void {
        const mapData = this.generator.GetMapData();
        const allSpawnedUnits: CDOTA_BaseNPC[] = [];
        
        print(`[DungeonInstance] 刷怪触发: ${triggerConditionId} (父触发器: ${parentTriggerId})`);
        
        for (const spawner of mapData.spawners) {
            if (spawner.triggerCondition === triggerConditionId) {
                const worldPos = this.generator.GridToWorld(spawner.x, spawner.y);
                const units = this.generator.SpawnUnits(worldPos, spawner);
                allSpawnedUnits.push(...units);
                print(`[DungeonInstance] 刷怪点 ${spawner.id} 生成了 ${units.length} 个单位`);
            }
        }
        
        // 记录生成的单位，用于 kill 触发器检查
        if (allSpawnedUnits.length > 0) {
            this.spawnedUnitsByTrigger.set(parentTriggerId, allSpawnedUnits);
            print(`[DungeonInstance] 触发器 ${parentTriggerId} 总共生成了 ${allSpawnedUnits.length} 个单位`);
        }
    }
    
    private CompleteDungeon(): void {
        this.state = DungeonInstanceState.COMPLETED;
        const duration = GameRules.GetGameTime() - this.startTime;
        
        print(`[DungeonInstance] 副本完成！用时: ${duration.toFixed(2)}秒`);
        
        for (const playerId of this.players) {
            this.GiveReward(playerId, duration);
        }
        
        Timers.CreateTimer(3, () => {
            const { GetDungeonManager } = require('./DungeonManager');
            const manager = GetDungeonManager();
            
            const playersCopy = [...this.players];
            for (const playerId of playersCopy) {
                print(`[DungeonInstance] 传送玩家 ${playerId} 回主城`);
                manager.LeaveDungeon(playerId, 'complete');
            }
            return undefined;
        });
    }
    
    private FailDungeon(): void {
        this.state = DungeonInstanceState.FAILED;
        print(`[DungeonInstance] 副本失败: ${this.instanceId}`);
        
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color='#FF0000'>副本失败！</font>`,
                playerId,
                0
            );
        }
    }
    
    private GiveReward(playerId: PlayerID, duration: number): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        const goldReward = 500;
        const expReward = 1000;
        
        hero.AddExperience(expReward, ModifyXpReason.UNSPECIFIED, false, true);
        PlayerResource.ModifyGold(playerId, goldReward, true, ModifyGoldReason.UNSPECIFIED);
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(
                player,
                'dungeon_completed',
                {
                    dungeon_name: this.generator.GetMapData().mapName,
                    duration: duration,
                    rewards: {
                        gold: goldReward,
                        experience: expReward,
                    },
                }
            );
        }
        
        print(`[DungeonInstance] 玩家 ${playerId} 获得奖励: ${goldReward}金币, ${expReward}经验`);
    }
    
    public OnPlayerDeath(playerId: PlayerID): void {
        if (! this.players.includes(playerId)) {
            return;
        }
        
        print(`[DungeonInstance] 玩家 ${playerId} 在副本中死亡`);
        
        GameRules.SendCustomMessage(
            `<font color='#FF0000'>你已死亡，2秒后离开副本</font>`,
            playerId,
            0
        );
        
        Timers.CreateTimer(2, () => {
            const { GetDungeonManager } = require('./DungeonManager');
            const manager = GetDungeonManager();
            
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero && ! hero.IsAlive()) {
                hero.RespawnHero(false, false);
            }
            
            manager.LeaveDungeon(playerId, 'death');
            
            return undefined;
        });
    }
    
    private OnAllPlayersLeft(): void {
        print(`[DungeonInstance] 所有玩家已离开副本 ${this.instanceId}`);
    }
    
    public Cleanup(): void {
        print(`[DungeonInstance] 清理副本实例: ${this.instanceId}`);
        this.generator.Cleanup();
        this.triggeredEvents.clear();
        this.spawnedUnitsByTrigger.clear();
        this.players = [];
    }
    
    public GetState(): DungeonInstanceState {
        return this.state;
    }
    
    public GetInstanceId(): string {
        return this.instanceId;
    }
    
    public GetPlayers(): PlayerID[] {
        return this.players;
    }
    
    public GetMapData(): DungeonMapData {
        return this.generator.GetMapData();
    }
    
    public GetGenerator(): DungeonGenerator {
        return this.generator;
    }
    
    public GetTriggeredEvents(): Set<string> {
        return this.triggeredEvents;
    }
    
    public GetSpawnedUnits(): Map<string, CDOTA_BaseNPC[]> {
        return this.spawnedUnitsByTrigger;
    }
}