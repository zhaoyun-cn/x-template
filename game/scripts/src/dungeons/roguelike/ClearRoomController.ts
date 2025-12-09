import { BaseRoomController } from './BaseRoomController';
import { RoomConfig, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * 清怪房间控制器
 * 一次性刷出所有怪物，击杀所有怪物通关
 */
export class ClearRoomController extends BaseRoomController {
    private totalMonsters: number = 0;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        super(config, generator, players, stats);
    }
    
    protected OnInitialize(): void {
        print(`[ClearRoom] 初始化清怪房间`);
    }
    
    protected OnStart(): void {
        print(`[ClearRoom] 开始清怪挑战`);
        
        // 一次性刷出所有怪物
        for (const spawner of this.config.mapData.spawners) {
            this.SpawnMonsters(spawner.id);
        }
        
        this.totalMonsters = this.spawnedUnits.length;
        print(`[ClearRoom] 总共刷新 ${this.totalMonsters} 个怪物`);
    }
    
    protected OnUpdate(): void {
        // 检查是否所有怪物都被击杀
        const aliveCount = this.GetAliveMonsterCount();
        
        if (aliveCount === 0 && this.totalMonsters > 0) {
            this.CompleteRoom();
        }
    }
    
    protected OnComplete(): void {
        print(`[ClearRoom] 清怪房间完成`);
    }
    
    protected OnFail(): void {
        print(`[ClearRoom] 清怪房间失败`);
    }
    
    protected OnCleanup(): void {
        print(`[ClearRoom] 清理清怪房间`);
    }
    
    protected GetStartMessage(): string {
        return `<font color="#FF6347">⚔️ 剿灭战开始！消灭所有怪物</font>`;
    }
    
    protected HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        this.stats.totalKills++;
        
        const aliveCount = this.GetAliveMonsterCount();
        const killedCount = this.totalMonsters - aliveCount;
        
        // 通知玩家进度
        for (const playerId of this.players) {
            this.SendMessageToPlayer(
                playerId,
                `<font color="#FFA500">击杀进度: ${killedCount}/${this.totalMonsters}</font>`
            );
        }
        
        print(`[ClearRoom] 击杀进度: ${killedCount}/${this.totalMonsters}`);
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
}
