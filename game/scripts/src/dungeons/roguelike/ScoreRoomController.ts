import { BaseRoomController } from './BaseRoomController';
import { RoomConfig, DungeonStats, RoomState } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * 积分房间控制器
 * 持续刷怪，击杀获得积分，达到目标分数通关
 */
export class ScoreRoomController extends BaseRoomController {
    private currentScore:  number = 0;
    private requiredScore: number = 0;
    private monsters: CDOTA_BaseNPC[] = [];
    private killListener: EventListenerID | null = null;
    private spawnTimer: string | null = null;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        super(config, generator, players, stats);
        this.requiredScore = config.requiredScore || 100;
    }
    
    protected OnInitialize(): void {
        print(`[ScoreRoom] 初始化积分房间`);
    }
    
    protected OnStart(): void {
        print(`[ScoreRoom] 开始积分挑战`);
        
        // 初始刷怪
        for (const spawner of this.config.mapData.spawners) {
            this.SpawnMonsters(spawner.id);
        }
        
        // 开始持续刷怪
        this.StartSpawning();
    }
    
    protected OnUpdate(): void {
        // 检查是否达到目标分数
        if (this.currentScore >= this.requiredScore) {
            this.CompleteRoom();
        }
    }
    
    protected OnComplete(): void {
        print(`[ScoreRoom] 积分房间完成`);
        
        // 停止刷怪
        if (this.spawnTimer) {
            Timers.RemoveTimer(this.spawnTimer);
            this.spawnTimer = null;
        }
    }
    
    protected OnFail(): void {
        print(`[ScoreRoom] 积分房间失败`);
    }
    
    protected OnCleanup(): void {
    print(`[ScoreRoom] 清理积分房间`);
    
    // 🔧 停止刷怪计时器
    if (this.spawnTimer) {
        Timers.RemoveTimer(this. spawnTimer);
        this.spawnTimer = null;
    }
    
    // 🔧 移除事件监听
    if (this.killListener) {
        StopListeningToGameEvent(this.killListener);
        this.killListener = null;
    }
}
    
    protected GetStartMessage(): string {
        return `<font color="#FFA500">⚔️ 积分挑战开始！目标：${this.requiredScore}分</font>`;
    }
    
    protected HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer:  CDOTA_BaseNPC | undefined): void {
        // 🔧 使用 IsOurMonster 检查
        if (!this.IsOurMonster(killedUnit)) {
            return;
        }
        
        const scoreConfig = this.config.scoreConfig;
        if (!scoreConfig) {
            print(`[ScoreRoom] 警告：没有配置 scoreConfig`);
            return;
        }
        
        // 从怪物列表中移除
        const unitIndex = killedUnit.entindex();
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            if (monster && IsValidEntity(monster) && 
                monster.entindex() === unitIndex) {
                this.monsters.splice(i, 1);
                break;
            }
        }
        
        this.stats.totalKills++;
        
        // 根据怪物类型给分
        let score = scoreConfig.normalKill;
        
        const unitName = killedUnit.GetUnitName();
        if (unitName.includes('ranged') || unitName.includes('elite')) {
            score = scoreConfig.eliteKill;
        } else if (unitName.includes('boss') || unitName.includes('roshan')) {
            score = scoreConfig.bossKill;
        }
        
        this.currentScore += score;
        
        print(`[ScoreRoom] 击杀怪物:  ${unitName}, +${score}分, 当前:  ${this.currentScore}/${this.requiredScore}`);
        
        // 通知所有玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#FFFF00">+${score}分 (${this.currentScore}/${this.requiredScore})</font>`,
                playerId,
                0
            );
        }
        
        // 检查完成条件
        this.CheckCompletion();
    }
    
    protected HandlePlayerDeath(playerId: PlayerID): void {
        this.SendMessageToPlayer(playerId, `<font color="#FF6666">你已阵亡，等待重生...</font>`);
        
        // 如果所有玩家都死了，失败
        Timers.CreateTimer(0.1, () => {
            if (! this.IsAnyPlayerAlive()) {
                this.FailRoom('所有玩家阵亡');
            }
            return undefined;
        });
    }
    
    /**
     * 持续刷怪
     */
    private StartSpawning(): void {
        print(`[ScoreRoom] 开始持续刷怪`);
        
        const spawnConfig = this.config.spawnConfig;
        if (!spawnConfig) return;
        
        // 🔧 保存计时器ID
        this.spawnTimer = Timers.CreateTimer(spawnConfig.spawnInterval, () => {
            if (this.state !== RoomState.IN_PROGRESS) {
                return undefined;
            }
            
            this.SpawnWave();
            return spawnConfig.spawnInterval;
        }) as string;
    }
    
    /**
     * 刷新一波怪物
     */
    private SpawnWave(): void {
        const spawnConfig = this.config.spawnConfig;
        if (!spawnConfig) return;
        
        const aliveCount = this.GetAliveMonsterCount();
        
        // 如果当前怪物数量已达上限，不刷新
        if (aliveCount >= spawnConfig.maxMonsters) {
            print(`[ScoreRoom] 当前怪物数量已达上限:  ${aliveCount}/${spawnConfig.maxMonsters}`);
            return;
        }
        
        const canSpawn = spawnConfig.maxMonsters - aliveCount;
        
        print(`[ScoreRoom] 刷新一波怪物，当前存活:  ${aliveCount}，可刷新: ${canSpawn}`);
        
        // 随机选择一个刷怪点
        const spawners = this.config.mapData.spawners;
        if (spawners.length === 0) return;
        
        const spawner = spawners[Math.floor(Math.random() * spawners.length)];
        const worldPos = this.generator.GridToWorld(spawner.x, spawner.y);
        
        // 刷新怪物（数量限制为 canSpawn）
        const spawnCount = Math.min(spawner.count, canSpawn);
        const units = this.generator.SpawnUnits(worldPos, {
            ...spawner,
            count: spawnCount
        });
        
        this.spawnedUnits.push(...units);
        this.monsters.push(...units);
        
        print(`[BaseRoomController] 生成 ${units.length} 个单位`);
    }
    
    /**
     * 检查是否达到目标分数
     */
    private CheckCompletion(): void {
        if (this.currentScore >= this.requiredScore) {
            print(`[ScoreRoom] 达到目标分数！`);
            
            // 延迟1秒后完成，让玩家看到提示
            Timers.CreateTimer(1, () => {
                if (this.state === RoomState.IN_PROGRESS) {
                    this.CompleteRoom();
                }
                return undefined;
            });
        }
    }
}