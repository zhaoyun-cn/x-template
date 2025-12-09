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
        print(`[BaseRoomController] 初始化房间:  ${this.config.roomName}`);
        this.state = RoomState.PREPARING;
        this.OnInitialize();
    }
    
    /**
     * 开始房间挑战
     */
    public Start(): void {
        print(`[BaseRoomController] 开始房间:  ${this.config.roomName}`);
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
        if (unit && IsValidEntity(unit) && ! unit.IsNull()) {
            // 🔧 如果单位有Boss实例，先清理
            if ((unit as any)._bossInstance) {
                print(`[BaseRoomController] 清理Boss实例`);
                (unit as any)._bossInstance.Cleanup();
                (unit as any)._bossInstance = null;
            }
            
            unit.ForceKill(false);
            UTIL_Remove(unit);
        }
    }
    this.spawnedUnits = [];
    
    // 调用子类清理逻辑
    this.OnCleanup();
}
    
    /**
     * 获取房间状态
     */
    public GetState(): RoomState {
        return this.state;
    }
    
    /**
     * 获取房间配置
     */
    public GetRoomConfig(): RoomConfig {
        return this.config;
    }
    
    /**
     * 刷新怪物（通过spawner ID）
     */
    protected SpawnMonsters(spawnerId: string): void {
        const spawner = this.config.mapData.spawners.find(s => s.id === spawnerId);
        if (!spawner) {
            print(`[BaseRoomController] 警告：找不到刷怪点 ${spawnerId}`);
            return;
        }
        
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
     * 发送消息给玩家
     */
    protected SendMessageToPlayer(playerId: PlayerID, message: string): void {
        GameRules.SendCustomMessage(message, playerId, 0);
    }
    
    /**
     * 🆕 检查单位是否是本房间生成的怪物
     */
    protected IsOurMonster(unit: CDOTA_BaseNPC): boolean {
        if (!unit || !IsValidEntity(unit)) {
            return false;
        }
        
        const unitIndex = unit.entindex();
        
        for (const spawnedUnit of this.spawnedUnits) {
            if (spawnedUnit && IsValidEntity(spawnedUnit) && 
                spawnedUnit.entindex() === unitIndex) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 单位被击杀事件
     */
    public OnUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        this.HandleUnitKilled(killedUnit, killer);
    }
    
    /**
     * 玩家死亡事件
     */
    public OnPlayerDeath(playerId: PlayerID): void {
        this.HandlePlayerDeath(playerId);
    }
    
    // ===== 抽象方法，由子类实现 =====
    
    protected abstract OnInitialize(): void;
    protected abstract OnStart(): void;
    protected abstract OnUpdate(): void;
    protected abstract OnComplete(): void;
    protected abstract OnFail(): void;
    protected abstract OnCleanup(): void;
    protected abstract GetStartMessage(): string;
    protected abstract HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void;
    protected abstract HandlePlayerDeath(playerId: PlayerID): void;
}