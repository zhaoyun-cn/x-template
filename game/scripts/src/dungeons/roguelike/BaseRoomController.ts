import { RoomConfig, RoomState, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * 房间控制器基类
 * 所有房间类型的基类，定义通用行为
 */
export abstract class BaseRoomController {
    protected config: RoomConfig;
    protected generator: DungeonGenerator;
    protected state: RoomState;
    protected players: PlayerID[];
    protected stats: DungeonStats;
    
    protected spawnedUnits: CDOTA_BaseNPC[] = [];
    protected updateTimer: string | null = null;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        this.config = config;
        this.generator = generator;
        this.state = RoomState.INACTIVE;
        this.players = players;
        this.stats = stats;
    }
    
    /**
     * 初始化房间
     */
    public Initialize(): void {
        print(`[BaseRoomController] 初始化房间: ${this.config.roomName}`);
        this.state = RoomState.PREPARING;
        this.OnInitialize();
    }
    
    /**
     * 开始房间挑战
     */
    public Start(): void {
        print(`[BaseRoomController] 开始房间: ${this.config.roomName}`);
        this.state = RoomState.IN_PROGRESS;
        
        // 通知所有玩家
        for (const playerId of this.players) {
            this.SendMessageToPlayer(playerId, this.GetStartMessage());
        }
        
        this.OnStart();
        this.StartUpdateLoop();
    }
    
    /**
     * 更新循环
     */
    private StartUpdateLoop(): void {
        this.updateTimer = Timers.CreateTimer(0.1, () => {
            if (this.state !== RoomState.IN_PROGRESS) {
                return undefined;
            }
            
            this.OnUpdate();
            return 0.1;
        }) as string;
    }
    
    /**
     * 完成房间
     */
    protected CompleteRoom(): void {
        print(`[BaseRoomController] 房间完成: ${this.config.roomName}`);
        this.state = RoomState.COMPLETED;
        
        // 停止更新循环
        if (this.updateTimer) {
            Timers.RemoveTimer(this.updateTimer);
            this.updateTimer = null;
        }
        
        // 通知所有玩家
        for (const playerId of this.players) {
            this.SendMessageToPlayer(playerId, `<font color="#00FF00">✅ 房间完成！</font>`);
        }
        
        this.OnComplete();
    }
    
    /**
     * 失败房间
     */
    protected FailRoom(reason: string): void {
        print(`[BaseRoomController] 房间失败: ${this.config.roomName} - ${reason}`);
        this.state = RoomState.FAILED;
        
        // 停止更新循环
        if (this.updateTimer) {
            Timers.RemoveTimer(this.updateTimer);
            this.updateTimer = null;
        }
        
        // 通知所有玩家
        for (const playerId of this.players) {
            this.SendMessageToPlayer(playerId, `<font color="#FF0000">❌ 挑战失败：${reason}</font>`);
        }
        
        this.OnFail();
    }
    
    /**
     * 清理房间
     */
    public Cleanup(): void {
        print(`[BaseRoomController] 清理房间: ${this.config.roomName}`);
        
        // 停止更新循环
        if (this.updateTimer) {
            Timers.RemoveTimer(this.updateTimer);
            this.updateTimer = null;
        }
        
        // 清理所有生成的单位
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && !unit.IsNull() && unit.IsAlive()) {
                unit.ForceKill(false);
            }
        }
        this.spawnedUnits = [];
        
        this.OnCleanup();
    }
    
    /**
     * 获取房间状态
     */
    public GetState(): RoomState {
        return this.state;
    }
    
    /**
     * 处理单位死亡
     */
    public OnUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        this.HandleUnitKilled(killedUnit, killer);
    }
    
    /**
     * 处理玩家死亡
     */
    public OnPlayerDeath(playerId: PlayerID): void {
        this.stats.totalDeaths++;
        this.HandlePlayerDeath(playerId);
    }
    
    /**
     * 发送消息给玩家
     */
    protected SendMessageToPlayer(playerId: PlayerID, message: string): void {
        GameRules.SendCustomMessage(message, playerId, 0);
    }
    
    /**
     * 生成怪物
     */
    protected SpawnMonsters(spawnerId: string): void {
        const spawner = this.config.mapData.spawners.find(s => s.id === spawnerId);
        if (!spawner) return;
        
        const worldPos = this.generator.GridToWorld(spawner.x, spawner.y);
        const units = this.generator.SpawnUnits(worldPos, spawner);
        
        this.spawnedUnits.push(...units);
        
        print(`[BaseRoomController] 生成 ${units.length} 个单位`);
    }
    
    /**
     * 获取存活怪物数量
     */
    protected GetAliveMonsterCount(): number {
        let count = 0;
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && !unit.IsNull() && unit.IsAlive()) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * 检查是否有玩家存活
     */
    protected IsAnyPlayerAlive(): boolean {
        for (const playerId of this.players) {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero && hero.IsAlive()) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查击杀的单位是否属于本房间的怪物
     * 使用 entindex 进行比较，更可靠
     */
    protected IsOurMonster(killedUnit: CDOTA_BaseNPC): boolean {
        const killedIndex = killedUnit.entindex();
        
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && unit.entindex() === killedIndex) {
                return true;
            }
        }
        
        return false;
    }
    
    // ========== 抽象方法，子类必须实现 ==========
    
    /**
     * 子类初始化逻辑
     */
    protected abstract OnInitialize(): void;
    
    /**
     * 子类开始逻辑
     */
    protected abstract OnStart(): void;
    
    /**
     * 子类更新逻辑
     */
    protected abstract OnUpdate(): void;
    
    /**
     * 子类完成逻辑
     */
    protected abstract OnComplete(): void;
    
    /**
     * 子类失败逻辑
     */
    protected abstract OnFail(): void;
    
    /**
     * 子类清理逻辑
     */
    protected abstract OnCleanup(): void;
    
    /**
     * 获取开始消息
     */
    protected abstract GetStartMessage(): string;
    
    /**
     * 处理单位击杀
     */
    protected abstract HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void;
    
    /**
     * 处理玩家死亡
     */
    protected abstract HandlePlayerDeath(playerId: PlayerID): void;
}
