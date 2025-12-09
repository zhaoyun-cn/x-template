import { RoguelikeDungeonConfig, RoomConfig, RoomState, RoomType, DungeonStats } from '../types_roguelike';
import { DungeonGenerator } from '../DungeonGenerator';
import { BaseRoomController } from './BaseRoomController';
import { ScoreRoomController } from './ScoreRoomController';
import { ClearRoomController } from './ClearRoomController';
import { SurvivalRoomController } from './SurvivalRoomController';
import { BossRoomController } from './BossRoomController';
import { RoguelikeRewardSystem } from './RoguelikeRewardSystem';
import { CameraSystem, CameraZone } from '../../systems/camera'; // 🔧 修改路径（两个 .. ）
/**
 * Roguelike副本实例
 * 主控制器，管理房间流程和分支选择
 */
export class RoguelikeDungeonInstance {
    private instanceId: string;
    private basePosition: Vector;
    private config: RoguelikeDungeonConfig;
    private players: PlayerID[] = [];
    
    private currentRoomId: string;
    private currentRoomController: BaseRoomController | null = null;
    private currentGenerator: DungeonGenerator | null = null;
    
    private stats: DungeonStats;
    private completedRooms: Set<string> = new Set();
    
    private isWaitingForBranchSelection: boolean = false;
    private branchSelections: Map<PlayerID, string> = new Map();
    
    constructor(instanceId: string, basePosition: Vector, config: RoguelikeDungeonConfig) {
        this.instanceId = instanceId;
        this.basePosition = basePosition;
        this.config = config;
        this.currentRoomId = config.startRoomId;
        
        this.stats = {
            totalKills: 0,
            totalDeaths: 0,
            roomsCompleted: 0,
            totalScore: 0,
            startTime: GameRules.GetGameTime()
        };
    }
    
    /**
     * 初始化副本
     */
    public Initialize(): void {
        print(`[RoguelikeDungeon] 初始化Roguelike副本: ${this.instanceId}`);
        this.StartRoom(this.currentRoomId);
    }
    
    /**
 * 开始副本
 */
public Start(): void {
    print(`[RoguelikeDungeon] 开始副本:  ${this.instanceId}`);
    // 副本在 Initialize 时已经启动了第一个房间
    // 这个方法主要是为了兼容 DungeonManager 的调用
}

    /**
     * 添加玩家
     */
    public AddPlayer(playerId: PlayerID): void {
        if (!this.players.includes(playerId)) {
            this.players.push(playerId);
            print(`[RoguelikeDungeon] 添加玩家 ${playerId} 到副本`);
        }
    }
    
    /**
     * 移除玩家
     */
    public RemovePlayer(playerId: PlayerID): void {
        const index = this.players.indexOf(playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            print(`[RoguelikeDungeon] 移除玩家 ${playerId} 从副本`);
        }
    }
    
    /**
     * 获取玩家列表
     */
    public GetPlayers(): PlayerID[] {
        return [...this.players];
    }
    
    
    
    /**
     * 开始房间
     */
    private StartRoom(roomId: string): void {
        print(`[RoguelikeDungeon] 开始房间: ${roomId}`);
        
        const roomConfig = this.config.rooms.get(roomId);
        if (!roomConfig) {
            print(`[RoguelikeDungeon] 错误：找不到房间配置 ${roomId}`);
            return;
        }
        
        // 清理上一个房间
        if (this.currentRoomController) {
            this.currentRoomController.Cleanup();
        }
        if (this.currentGenerator) {
            this.currentGenerator.Cleanup();
        }
        
        // 创建新房间
        this.currentRoomId = roomId;
        this.currentGenerator = new DungeonGenerator(this.basePosition, roomConfig.mapData);
        this.currentGenerator.Generate();
        
        // 创建房间控制器
        this.currentRoomController = this.CreateRoomController(roomConfig);
        this.currentRoomController.Initialize();
        
        // 传送玩家到房间入口
        this.TeleportPlayersToRoom(roomConfig);
        
        // 延迟1秒后开始房间
        Timers.CreateTimer(1, () => {
            if (this.currentRoomController) {
                this.currentRoomController.Start();
            }
            return undefined;
        });
        
        // 开始监测房间状态
        this.StartRoomMonitoring();
    }
    
    /**
     * 创建房间控制器
     */
    private CreateRoomController(config: RoomConfig): BaseRoomController {
        switch (config.roomType) {
            case RoomType.SCORE:
                return new ScoreRoomController(config, this.currentGenerator!, this.players, this.stats);
            case RoomType.CLEAR:
                return new ClearRoomController(config, this.currentGenerator!, this.players, this.stats);
            case RoomType.SURVIVAL:
                return new SurvivalRoomController(config, this.currentGenerator!, this.players, this.stats);
            case RoomType.BOSS:
                return new BossRoomController(config, this.currentGenerator!, this.players, this.stats);
            default:
                print(`[RoguelikeDungeon] 警告：未知房间类型 ${config.roomType}，使用清怪模式`);
                return new ClearRoomController(config, this.currentGenerator!, this.players, this.stats);
        }
    }
    
    /**
     * 传送玩家到房间入口
     */
    private TeleportPlayersToRoom(config: RoomConfig): void {
        const entryPoint = config.mapData.entryPoints?.[0];
        if (!entryPoint || !this.currentGenerator) return;
        
        const worldPos = this.currentGenerator.GridToWorld(entryPoint.x, entryPoint.y);
        
        for (const playerId of this.players) {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero) {
                FindClearSpaceForUnit(hero, worldPos, true);
                print(`[RoguelikeDungeon] 传送玩家 ${playerId} 到 (${worldPos.x}, ${worldPos.y})`);
            }
        }
    }
    
    /**
     * 监测房间状态
     */
    private StartRoomMonitoring(): void {
        Timers.CreateTimer(0.5, () => {
            if (!this.currentRoomController) {
                return undefined;
            }
            
            const state = this.currentRoomController.GetState();
            
            if (state === RoomState.COMPLETED) {
                this.OnRoomCompleted();
                return undefined;
            } else if (state === RoomState.FAILED) {
                this.OnRoomFailed();
                return undefined;
            }
            
            return 0.5;
        });
    }
    
    /**
     * 房间完成
     */
    private OnRoomCompleted(): void {
        print(`[RoguelikeDungeon] 房间完成: ${this.currentRoomId}`);
        
        this.completedRooms.add(this.currentRoomId);
        this.stats.roomsCompleted++;
        
        const roomConfig = this.config.rooms.get(this.currentRoomId)!;
        
        // 检查是否是最终房间
        if (roomConfig.isFinalRoom) {
            this.OnDungeonCompleted();
            return;
        }
        
        // 显示分支选择
        const nextRooms = roomConfig.nextRooms || [];
        if (nextRooms.length > 0) {
            this.ShowBranchSelection(nextRooms);
        } else {
            print(`[RoguelikeDungeon] 警告：房间没有后续分支`);
            this.OnDungeonCompleted();
        }
    }
    
    /**
     * 房间失败
     */
    private OnRoomFailed(): void {
        print(`[RoguelikeDungeon] 房间失败: ${this.currentRoomId}`);
        
        // 3秒后返回城镇
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                '<font color="#FF0000">挑战失败！3秒后返回城镇</font>',
                playerId,
                0
            );
        }
        
        Timers.CreateTimer(3, () => {
            this.Cleanup();
            return undefined;
        });
    }
    
    /**
     * 显示分支选择UI
     */
    private ShowBranchSelection(nextRoomIds: string[]): void {
        print(`[RoguelikeDungeon] 显示分支选择，共 ${nextRoomIds.length} 个选项`);
        
        this.isWaitingForBranchSelection = true;
        this.branchSelections.clear();
        
        // 构建选项数据
        const options = nextRoomIds.map(roomId => {
            const room = this.config.rooms.get(roomId)!;
            return {
                roomId: roomId,
                roomName: room.roomName,
                description: this.GetRoomDescription(room)
            };
        });
        
       // 发送到所有玩家
for (const playerId of this.players) {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
        // 🔧 修复：将数组转为对象，并确保索引从0开始
        const optionsObj:  Record<number, any> = {};
        options.forEach((opt, index) => {
            optionsObj[index] = opt;
        });
        
        CustomGameEventManager.Send_ServerToPlayer(
            player, 
            'roguelike_show_branch_selection' as any, 
            {
                instanceId: this.instanceId,
                options: optionsObj,
                optionCount: options.length  // 🆕 添加数量字段
            } as any
        );
        
        print(`[RoguelikeDungeon] 发送分支选择给玩家 ${playerId}，选项数:  ${options.length}`);
    }
}
    }
    
    /**
     * 获取房间描述
     */
    private GetRoomDescription(config: RoomConfig): string {
        switch (config.roomType) {
            case RoomType.SCORE:
                return `需要${config.requiredScore}分`;
            case RoomType.CLEAR:
                return '清除所有怪物';
            case RoomType.SURVIVAL:
                return `存活${config.survivalConfig?.duration || 30}秒`;
            case RoomType.BOSS:
                return '击败Boss';
            default:
                return '未知挑战';
        }
    }
    
    /**
     * 玩家选择分支
     */
    public OnBranchSelected(playerId: PlayerID, roomId: string): void {
        print(`[RoguelikeDungeon] 玩家 ${playerId} 选择分支: ${roomId}`);
        
        if (!this.isWaitingForBranchSelection) {
            print(`[RoguelikeDungeon] 警告：当前不在等待分支选择状态`);
            return;
        }
        
        // 记录玩家的选择
        this.branchSelections.set(playerId, roomId);
        
        // 通知玩家选择成功
        GameRules.SendCustomMessage(
            `<font color="#00FF00">✅ 已选择: ${this.config.rooms.get(roomId)!.roomName}</font>`,
            playerId,
            0
        );
        
        // 检查是否所有玩家都选择了
        if (this.branchSelections.size === this.players.length) {
            this.ProcessBranchSelection();
        }
    }
    
    /**
     * 处理分支选择
     */
    private ProcessBranchSelection(): void {
        print(`[RoguelikeDungeon] 处理分支选择`);
        
        // 统计选择
        const votes = new Map<string, number>();
        for (const [playerId, roomId] of this.branchSelections) {
            votes.set(roomId, (votes.get(roomId) || 0) + 1);
        }
        
        // 找出得票最多的房间
        let selectedRoom = '';
        let maxVotes = 0;
        for (const [roomId, count] of votes) {
            if (count > maxVotes) {
                maxVotes = count;
                selectedRoom = roomId;
            }
        }
        
        print(`[RoguelikeDungeon] 选择房间: ${selectedRoom} (${maxVotes}票)`);
        
        this.isWaitingForBranchSelection = false;
        this.branchSelections.clear();
        
        // 3秒后开始新房间
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#FFD700">3秒后进入: ${this.config.rooms.get(selectedRoom)!.roomName}</font>`,
                playerId,
                0
            );
        }
        
        Timers.CreateTimer(3, () => {
            this.StartRoom(selectedRoom);
            return undefined;
        });
    }
    
 /**
 * 副本完成
 */
private OnDungeonCompleted(): void {
    print(`[RoguelikeDungeon] 🎉 副本完成！`);
    
    this.stats.endTime = GameRules.GetGameTime();
    
    // 立即停止房间更新
    if (this.currentRoomController) {
        this.currentRoomController. Cleanup();
        this.currentRoomController = null;
    }
    
    // 计算奖励
    const breakdown = RoguelikeRewardSystem. CalculateReward(this.config.rewardConfig, this.stats);
    
    // 显示奖励
    for (const playerId of this.players) {
        RoguelikeRewardSystem. ShowRewardSummary(playerId, breakdown);
        RoguelikeRewardSystem.ShowRewardUI(playerId, breakdown, this.stats);
        
        GameRules.SendCustomMessage(
            '<font color="#FFD700">🎉 副本完成！恭喜通关！</font>',
            playerId,
            0
        );
    }
    
    // 5秒后传送回城
    print(`[RoguelikeDungeon] 5秒后传送玩家回城`);
    
    Timers.CreateTimer(5, () => {
        // 🔧 使用 DungeonManager 的 LeaveDungeon 方法
        const { GetDungeonManager } = require('../DungeonManager');
        const manager = GetDungeonManager();
        
        // 复制玩家列表，因为 LeaveDungeon 会修改原列表
        const playersCopy = [...this.players];
        
        for (const playerId of playersCopy) {
            print(`[RoguelikeDungeon] 让玩家 ${playerId} 离开副本`);
            // 🔧 调用 DungeonManager. LeaveDungeon() 来清除 playerDungeonMap
            manager.LeaveDungeon(playerId, 'complete');
        }
        
        return undefined;
    });
}
    
    /**
     * 清理副本
     */
    public Cleanup(): void {
        print(`[RoguelikeDungeon] 清理副本: ${this.instanceId}`);
        
        if (this.currentRoomController) {
            this.currentRoomController.Cleanup();
            this.currentRoomController = null;
        }
        
        if (this.currentGenerator) {
            this.currentGenerator.Cleanup();
            this.currentGenerator = null;
        }
        
        // 这里应该调用DungeonManager的清理方法
        // 但为了避免循环依赖，由DungeonManager负责调用
    }
    
    /**
     * 处理单位死亡
     */
    public OnUnitKilled(killedUnit: CDOTA_BaseNPC, killer: CDOTA_BaseNPC | undefined): void {
        if (this.currentRoomController) {
            this.currentRoomController.OnUnitKilled(killedUnit, killer);
        }
    }
    
    /**
     * 处理玩家死亡
     */
    public OnPlayerDeath(playerId: PlayerID): void {
        if (this.currentRoomController) {
            this.currentRoomController.OnPlayerDeath(playerId);
        }
    }
    
    /**
     * 获取副本ID
     */
    public GetInstanceId(): string {
        return this.instanceId;
    }




/**
 * 获取副本状态
 */
public GetState(): number {
    // Roguelike 副本始终运行中，直到完成或失败
    return 1; // RUNNING
}

/**
 * 获取当前生成器
 */
public GetCurrentGenerator(): DungeonGenerator | null {
    return this.currentGenerator;
}

/**
 * 获取当前房间控制器
 */
public GetCurrentRoom(): BaseRoomController | null {
    return this.currentRoomController;
}

}
