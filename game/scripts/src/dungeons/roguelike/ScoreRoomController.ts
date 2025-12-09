import { BaseRoomController } from './BaseRoomController';
import { RoomConfig, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * 积分房间控制器
 * 持续刷怪，达到指定分数通关
 */
export class ScoreRoomController extends BaseRoomController {
    private currentScore: number = 0;
    private requiredScore: number = 50;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 10;
    private maxMonsters: number = 15;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        super(config, generator, players, stats);
        
        this.requiredScore = config.requiredScore || 50;
        this.spawnInterval = config.spawnConfig?.spawnInterval || 10;
        this.maxMonsters = config.spawnConfig?.maxMonsters || 15;
    }
    
    protected OnInitialize(): void {
        print(`[ScoreRoom] 初始化积分房间，目标: ${this.requiredScore}分`);
        this.currentScore = 0;
    }
    
    protected OnStart(): void {
        print(`[ScoreRoom] 开始积分挑战`);
        this.lastSpawnTime = GameRules.GetGameTime();
        
        // 初始刷怪
        this.SpawnWave();
    }
    
    protected OnUpdate(): void {
        const currentTime = GameRules.GetGameTime();
        
        // 检查是否需要刷怪
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            const aliveCount = this.GetAliveMonsterCount();
            if (aliveCount < this.maxMonsters) {
                this.SpawnWave();
                this.lastSpawnTime = currentTime;
            }
        }
        
        // 检查是否达到分数
        if (this.currentScore >= this.requiredScore) {
            this.CompleteRoom();
        }
    }
    
    protected OnComplete(): void {
        print(`[ScoreRoom] 积分房间完成，最终得分: ${this.currentScore}`);
    }
    
    protected OnFail(): void {
        print(`[ScoreRoom] 积分房间失败`);
    }
    
    protected OnCleanup(): void {
        print(`[ScoreRoom] 清理积分房间`);
    }
    
    protected GetStartMessage(): string {
        return `<font color="#FFD700">🎯 积分挑战开始！击杀怪物获得积分 (目标: ${this.requiredScore}分)</font>`;
    }
    
    protected HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        // 🔧 修复：检查怪物是否属于本房间（使用 entindex 比较）
        const killedIndex = killedUnit.entindex();
        let isOurMonster = false;
        
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && unit.entindex() === killedIndex) {
                isOurMonster = true;
                break;
            }
        }
        
        if (!isOurMonster) {
            // 不是我们刷的怪物，忽略
            return;
        }
        
        // 计算积分
        let score = 0;
        const unitName = killedUnit.GetUnitName();
        
        // 根据单位类型给予不同积分
        if (unitName.includes('boss') || unitName.includes('hero')) {
            score = this.config.scoreConfig?.bossKill || 50;
        } else if (unitName.includes('elite') || unitName.includes('siege')) {
            score = this.config.scoreConfig?.eliteKill || 15;
        } else {
            score = this.config.scoreConfig?.normalKill || 5;
        }
        
        this.currentScore += score;
        this.stats.totalKills++;
        
        // 通知玩家
        for (const playerId of this.players) {
            this.SendMessageToPlayer(
                playerId,
                `<font color="#FFD700">+${score}分！当前: ${this.currentScore}/${this.requiredScore}</font>`
            );
        }
        
        print(`[ScoreRoom] 击杀 ${unitName}，获得 ${score}分，当前: ${this.currentScore}/${this.requiredScore}`);
    }
    
    protected HandlePlayerDeath(playerId: PlayerID): void {
        this.SendMessageToPlayer(playerId, `<font color="#FF6666">你已阵亡，等待重生...</font>`);
        
        // 如果所有玩家都死了，失败
        Timers.CreateTimer(0.1, () => {
            if (!this.IsAnyPlayerAlive()) {
                this.FailRoom('所有玩家阵亡');
            }
            return undefined;
        });
    }
    
    /**
     * 刷新一波怪物
     */
    private SpawnWave(): void {
        const currentAlive = this.GetAliveMonsterCount();
        const canSpawn = this.maxMonsters - currentAlive;
        
        if (canSpawn <= 0) return;
        
        print(`[ScoreRoom] 刷新一波怪物，当前存活: ${currentAlive}，可刷新: ${canSpawn}`);
        
        // 从所有刷怪点中随机选择
        const spawners = this.config.mapData.spawners;
        if (spawners.length === 0) return;
        
        const randomSpawner = spawners[Math.floor(Math.random() * spawners.length)];
        this.SpawnMonsters(randomSpawner.id);
    }
}
