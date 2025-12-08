import { BaseRoomController } from './BaseRoomController';
import { RoomConfig, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * 生存房间控制器
 * 倒计时30秒，存活即通关，持续刷怪
 */
export class SurvivalRoomController extends BaseRoomController {
    private duration: number = 30;
    private startTime: number = 0;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 5;
    private maxMonsters: number = 10;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        super(config, generator, players, stats);
        
        this.duration = config.survivalConfig?.duration || 30;
        this.spawnInterval = config.spawnConfig?.spawnInterval || 5;
        this.maxMonsters = config.spawnConfig?.maxMonsters || 10;
    }
    
    protected OnInitialize(): void {
        print(`[SurvivalRoom] 初始化生存房间，存活时间: ${this.duration}秒`);
    }
    
    protected OnStart(): void {
        print(`[SurvivalRoom] 开始生存挑战`);
        this.startTime = GameRules.GetGameTime();
        this.lastSpawnTime = this.startTime;
        
        // 初始刷怪
        this.SpawnWave();
    }
    
    protected OnUpdate(): void {
        const currentTime = GameRules.GetGameTime();
        const elapsed = currentTime - this.startTime;
        const remaining = Math.max(0, this.duration - elapsed);
        
        // 持续刷怪
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            const aliveCount = this.GetAliveMonsterCount();
            if (aliveCount < this.maxMonsters) {
                this.SpawnWave();
                this.lastSpawnTime = currentTime;
            }
        }
        
        // 每5秒更新一次倒计时
        if (Math.floor(elapsed) % 5 === 0 && Math.floor(elapsed * 10) % 10 === 0) {
            for (const playerId of this.players) {
                this.SendMessageToPlayer(
                    playerId,
                    `<font color="#00FFFF">⏱️ 剩余时间: ${remaining.toFixed(0)}秒</font>`
                );
            }
        }
        
        // 检查是否到达时间
        if (elapsed >= this.duration) {
            // 检查是否有玩家存活
            if (this.IsAnyPlayerAlive()) {
                this.CompleteRoom();
            } else {
                this.FailRoom('所有玩家阵亡');
            }
        }
        
        // 检查是否所有玩家都死了
        if (!this.IsAnyPlayerAlive()) {
            this.FailRoom('所有玩家阵亡');
        }
    }
    
    protected OnComplete(): void {
        print(`[SurvivalRoom] 生存房间完成`);
    }
    
    protected OnFail(): void {
        print(`[SurvivalRoom] 生存房间失败`);
    }
    
    protected OnCleanup(): void {
        print(`[SurvivalRoom] 清理生存房间`);
    }
    
    protected GetStartMessage(): string {
        return `<font color="#00FFFF">⏱️ 生存挑战开始！存活 ${this.duration} 秒</font>`;
    }
    
    protected HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        this.stats.totalKills++;
        // 生存模式不需要特别的击杀反馈
    }
    
    protected HandlePlayerDeath(playerId: PlayerID): void {
        this.SendMessageToPlayer(playerId, `<font color="#FF6666">你已阵亡！</font>`);
        
        // 延迟检查，防止在同一帧内检查
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
        
        print(`[SurvivalRoom] 刷新一波怪物，当前存活: ${currentAlive}，可刷新: ${canSpawn}`);
        
        // 从所有刷怪点中随机选择
        const spawners = this.config.mapData.spawners;
        if (spawners.length === 0) return;
        
        const randomSpawner = spawners[Math.floor(Math.random() * spawners.length)];
        this.SpawnMonsters(randomSpawner.id);
    }
}
