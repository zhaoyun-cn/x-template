import { BaseRoomController } from './BaseRoomController';
import { RoomConfig, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';

/**
 * Boss房间控制器
 * 击败Boss通关
 */
export class BossRoomController extends BaseRoomController {
    private bossUnit: CDOTA_BaseNPC | null = null;
    
    constructor(config: RoomConfig, generator: DungeonGenerator, players: PlayerID[], stats: DungeonStats) {
        super(config, generator, players, stats);
    }
    
    protected OnInitialize(): void {
        print(`[BossRoom] 初始化Boss房间`);
    }
    
    protected OnStart(): void {
        print(`[BossRoom] 开始Boss战`);
        
        // 刷新Boss
        for (const spawner of this.config.mapData.spawners) {
            this.SpawnMonsters(spawner.id);
        }
        
        // 找到Boss单位
        for (const unit of this.spawnedUnits) {
            const unitName = unit.GetUnitName();
            if (unitName.includes('boss') || unitName.includes('hero')) {
                this.bossUnit = unit;
                print(`[BossRoom] 找到Boss: ${unitName}`);
                break;
            }
        }
        
        // 如果没有找到Boss，使用第一个单位
        if (!this.bossUnit && this.spawnedUnits.length > 0) {
            this.bossUnit = this.spawnedUnits[0];
        }
    }
    
    protected OnUpdate(): void {
        // 检查Boss是否被击败
        if (this.bossUnit && (!IsValidEntity(this.bossUnit) || this.bossUnit.IsNull() || !this.bossUnit.IsAlive())) {
            this.CompleteRoom();
        }
        
        // 检查是否所有玩家都死了
        if (!this.IsAnyPlayerAlive()) {
            this.FailRoom('所有玩家阵亡');
        }
    }
    
    protected OnComplete(): void {
        print(`[BossRoom] Boss房间完成`);
    }
    
    protected OnFail(): void {
        print(`[BossRoom] Boss房间失败`);
    }
    
    protected OnCleanup(): void {
        print(`[BossRoom] 清理Boss房间`);
        this.bossUnit = null;
    }
    
    protected GetStartMessage(): string {
        return `<font color="#FF0000">👹 Boss战开始！击败强大的敌人</font>`;
    }
    
    protected HandleUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        this.stats.totalKills++;
        
        // 如果击杀的是Boss
        if (killedUnit === this.bossUnit) {
            for (const playerId of this.players) {
                this.SendMessageToPlayer(
                    playerId,
                    `<font color="#FFD700">🎉 Boss已击败！</font>`
                );
            }
            print(`[BossRoom] Boss已击败`);
        }
    }
    
    protected HandlePlayerDeath(playerId: PlayerID): void {
        this.SendMessageToPlayer(playerId, `<font color="#FF6666">你已阵亡，等待重生...</font>`);
        
        // 延迟检查，防止在同一帧内检查
        Timers.CreateTimer(0.1, () => {
            if (!this.IsAnyPlayerAlive()) {
                this.FailRoom('所有玩家阵亡');
            }
            return undefined;
        });
    }
}
