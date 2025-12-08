import { DungeonInstanceState } from './DungeonInstance';
import { MultiStageDungeonConfig, DungeonStageConfig } from './types_multistage';
import { DungeonGenerator } from './DungeonGenerator';

/**
 * 多阶段副本实例
 */
export class MultiStageDungeonInstance {
    private instanceId: string;
    private config: MultiStageDungeonConfig;
    private basePosition: Vector;
    private state: DungeonInstanceState;
    private players: PlayerID[] = [];
    
    private currentStageId: string;
    private currentGenerator: DungeonGenerator | null = null;
    private completedStages: Set<string> = new Set();
    
    private startTime: number = 0;
    
    // 积分系统
    public currentScore: number = 0;  // ✅ 改为 public
    public requiredScore: number = 10;
    public spawnedUnits: CDOTA_BaseNPC[] = [];  // ✅ 改为 public
    private isWaitingForNextStage: boolean = false;
    
    constructor(instanceId: string, basePosition: Vector, config: MultiStageDungeonConfig) {
        this.instanceId = instanceId;
        this.config = config;
        this.basePosition = basePosition;
        this.state = DungeonInstanceState.WAITING;
        this.currentStageId = config.startStageId;
    }
    
    /**
     * 初始化副本
     */
    public Initialize(): void {
        print(`[MultiStageDungeon] 初始化多阶段副本: ${this.instanceId}`);
        this.GenerateStage(this.currentStageId);
    }
    
    /**
     * 生成指定阶段
     */
    private GenerateStage(stageId: string): void {
        const stage = this.GetStageConfig(stageId);
        if (!stage) {
            print(`[MultiStageDungeon] 错误：找不到阶段 ${stageId}`);
            return;
        }
        
        print(`[MultiStageDungeon] 生成阶段: ${stage.stageName}`);
        
        // 重置积分
        this.currentScore = 0;
        this.spawnedUnits = [];
        this.isWaitingForNextStage = false;
        
        const stageCenter = Vector(
            this.basePosition.x + stage.offsetX,
            this.basePosition.y + stage.offsetY,
            128
        );
        
        if (this.currentGenerator) {
            this.currentGenerator.Cleanup();
        }
        
        this.currentGenerator = new DungeonGenerator(stageCenter, stage.mapData);
        this.currentGenerator.Generate();
        
        // 刷新所有怪物（包括触发式的）
        this.SpawnAllUnits(stage);
        
        // 通知玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#FFD700">【${stage.stageName}】击杀怪物获得积分 (需要${this.requiredScore}分)</font>`,
                playerId,
                0
            );
        }
    }
    
    /**
     * 刷新所有怪物
     */
    private SpawnAllUnits(stage: DungeonStageConfig): void {
        if (!this.currentGenerator) return;
        
        print(`[MultiStageDungeon] 刷新所有怪物，共 ${stage.mapData.spawners.length} 个刷怪点`);
        
        for (const spawner of stage.mapData.spawners) {
            const worldPos = this.currentGenerator.GridToWorld(spawner.x, spawner.y);
            print(`[MultiStageDungeon] 刷怪: ${spawner.id} at (${worldPos.x}, ${worldPos.y})`);
            
            const units = this.currentGenerator.SpawnUnits(worldPos, spawner);
            print(`[MultiStageDungeon] ✅ 生成 ${units.length} 个单位`);
            
            // 保存所有单位并监听击杀
            for (const unit of units) {
                this.spawnedUnits.push(unit);
                this.ListenToUnitKilled(unit, spawner.id);
            }
        }
        
        print(`[MultiStageDungeon] 总共刷新了 ${this.spawnedUnits.length} 个单位`);
    }
    
    /**
     * 监听单位被击杀
     */
    private ListenToUnitKilled(unit: CDOTA_BaseNPC, spawnerId: string): void {
        ListenToGameEvent('entity_killed', (event) => {
            const killedUnit = EntIndexToHScript(event.entindex_killed);
            if (killedUnit !== unit) return;
            
            // 判断是否BOSS
            const isBoss = spawnerId === 'spawn_boss';
            const score = isBoss ? 10 : 1;
            
            this.OnUnitKilled(unit, score, isBoss);
        }, undefined);
    }
    
    /**
     * 单位被击杀
     */
    private OnUnitKilled(unit: CDOTA_BaseNPC, score: number, isBoss: boolean): void {
        if (this.isWaitingForNextStage) return;
        
        this.currentScore += score;
        
        print(`[MultiStageDungeon] 击杀单位，获得 ${score} 分，当前: ${this.currentScore}/${this.requiredScore}`);
        
        // 通知所有玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#00FF00">+${score}分！当前: ${this.currentScore}/${this.requiredScore}</font>`,
                playerId,
                0
            );
        }
        
        // 检查是否达到要求
        if (this.currentScore >= this.requiredScore) {
            this.OnStageComplete();
        }
    }
    
    /**
     * 阶段完成
     */
    public OnStageComplete(): void {  // ✅ 改为 public
        if (this.isWaitingForNextStage) return;
        this.isWaitingForNextStage = true;
        
        print(`[MultiStageDungeon] 🎉 阶段完成！积分达标`);
        
        // 通知玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                '<font color="#FFD700">🎉 阶段完成！清理怪物中...</font>',
                playerId,
                0
            );
        }
        
        // 清空所有怪物
        this.ClearAllUnits();
        
        // 检查是否最终阶段
        const currentStage = this.GetStageConfig(this.currentStageId);
        if (currentStage?.isFinalStage) {
            // 最终阶段完成，结束副本
            Timers.CreateTimer(2, () => {
                this.CompleteDungeon();
                return undefined;
            });
        } else {
            // 5秒后弹出选择界面
            this.StartCountdownToStageSelection();
        }
    }
    
    /**
     * 清空所有怪物
     */
    private ClearAllUnits(): void {
        print(`[MultiStageDungeon] 开始清理 ${this.spawnedUnits.length} 个单位`);
        
        let clearedCount = 0;
        
        for (let i = 0; i < this.spawnedUnits.length; i++) {
            const unit = this.spawnedUnits[i];
            if (unit && IsValidEntity(unit) && !unit.IsNull()) {
                if (unit.IsAlive()) {
                    print(`[MultiStageDungeon] 清理单位: ${unit.GetUnitName()}`);
                    unit.ForceKill(false);
                    clearedCount++;
                } else {
                    print(`[MultiStageDungeon] 单位已死亡: ${unit.GetUnitName()}`);
                }
            } else {
                print(`[MultiStageDungeon] 单位无效或为空 (索引 ${i})`);
            }
        }
        
        print(`[MultiStageDungeon] ✅ 清理完成，共清理 ${clearedCount} 个存活单位`);
        this.spawnedUnits = [];
    }
    
    /**
     * 开始倒计时到关卡选择
     */
    private StartCountdownToStageSelection(): void {
        let countdown = 5;
        
        const countdownTimer = () => {
            if (countdown <= 0) {
                // 弹出UI
                this.ShowStageSelectionUI();
                return;
            }
            
            for (const playerId of this.players) {
                GameRules.SendCustomMessage(
                    `<font color="#FFFF00">${countdown}秒后选择下一关卡...</font>`,
                    playerId,
                    0
                );
            }
            
            countdown--;
            
            Timers.CreateTimer(1, () => {
                countdownTimer();
                return undefined;
            });
        };
        
        countdownTimer();
    }
    
    /**
     * 显示关卡选择UI
     */
    private ShowStageSelectionUI(): void {
        print(`[MultiStageDungeon] 显示关卡选择UI`);
        
        // 获取所有可用的下一阶段
        const availableStages = this.GetAvailableNextStages();
        
        if (availableStages.length === 0) {
            // 没有下一阶段，完成副本
            this.CompleteDungeon();
            return;
        }
        
        // 发送UI事件给客户端
        for (const playerId of this.players) {
            const player = PlayerResource.GetPlayer(playerId);
            if (player) {
                // 发送自定义事件到UI
                CustomGameEventManager.Send_ServerToPlayer(
                    player,
                    'dungeon_stage_selection' as never,
                    {
                        instanceId: this.instanceId,
                        stages: availableStages.map(stage => ({
                            stageId: stage.stageId,
                            stageName: stage.stageName,
                            description: stage.description,
                        }))
                    } as never
                );
            }
            
            // 同时在聊天显示（备用）
            GameRules.SendCustomMessage(
                '<font color="#00FFFF">【选择下一关卡】</font>',
                playerId,
                0
            );
            
            for (let i = 0; i < availableStages.length; i++) {
                const stage = availableStages[i];
                GameRules.SendCustomMessage(
                    `<font color="#FFFF00">${i + 1}.${stage.stageName} - ${stage.description}</font>`,
                    playerId,
                    0
                );
            }
            
            GameRules.SendCustomMessage(
                '<font color="#00FF00">输入 -stage 1 / -stage 2 选择关卡</font>',
                playerId,
                0
            );
        }
    }
    
    /**
     * 获取可用的下一阶段
     */
    public GetAvailableNextStages(): DungeonStageConfig[] {  // ✅ 改为 public
        const currentIndex = this.config.stages.findIndex(s => s.stageId === this.currentStageId);
        if (currentIndex < 0) return [];
        
        // 返回当前阶段之后的所有阶段
        const result: DungeonStageConfig[] = [];
        for (let i = currentIndex + 1; i < this.config.stages.length; i++) {
            result.push(this.config.stages[i]);
        }
        return result;
    }
    
    /**
     * 选择下一阶段（由命令调用）
     */
    public SelectNextStage(stageIndex: number): boolean {
        const availableStages = this.GetAvailableNextStages();
        
        print(`[MultiStageDungeon] SelectNextStage: 索引=${stageIndex}, 可用=${availableStages.length}`);
        
        if (stageIndex < 0 || stageIndex >= availableStages.length) {
            print(`[MultiStageDungeon] 无效的阶段索引: ${stageIndex}`);
            return false;
        }
        
        const selectedStage = availableStages[stageIndex];
        print(`[MultiStageDungeon] 选择阶段: ${selectedStage.stageName}`);
        
        this.EnterNextStage(selectedStage.stageId);
        
        return true;
    }
    
    /**
     * 进入下一阶段
     */
    private EnterNextStage(stageId: string): void {
        const stage = this.GetStageConfig(stageId);
        if (! stage) return;
        
        print(`[MultiStageDungeon] 进入下一阶段: ${stage.stageName}`);
        
        // 标记完成当前阶段
        this.completedStages.add(this.currentStageId);
        
        // 更新当前阶段
        this.currentStageId = stageId;
        
        // 生成新阶段
        this.GenerateStage(stageId);
        
        // 传送所有玩家到新阶段入口
        this.TeleportPlayersToStage();
        
        // 通知玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#00FF00">✅ 进入：${stage.stageName}</font>`,
                playerId,
                0
            );
            
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero) {
                hero.EmitSound('Portal.Hero_Appear');
            }
        }
    }
    
    /**
     * 传送玩家到当前阶段入口
     */
    private TeleportPlayersToStage(): void {
        if (! this.currentGenerator) return;
        
        const stage = this.GetStageConfig(this.currentStageId);
        if (!stage) return;
        
        const entryPoint = stage.mapData.entryPoints?.[0] || { x: -2, y: 10 };
        const worldPos = this.currentGenerator.GridToWorld(entryPoint.x, entryPoint.y);
        
        for (const playerId of this.players) {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero) {
                FindClearSpaceForUnit(hero, worldPos, true);
                hero.Stop();
            }
        }
    }
    
    /**
     * 获取阶段配置
     */
    private GetStageConfig(stageId: string): DungeonStageConfig | null {
        return this.config.stages.find(s => s.stageId === stageId) || null;
    }
    
    /**
     * 开始副本
     */
    public Start(): void {
        this.state = DungeonInstanceState.RUNNING;
        this.startTime = GameRules.GetGameTime();
        print(`[MultiStageDungeon] 副本开始`);
    }
    
    /**
     * 添加玩家
     */
    public AddPlayer(playerId: PlayerID): void {
        if (! this.players.includes(playerId)) {
            this.players.push(playerId);
        }
        print(`[MultiStageDungeon] 添加玩家 ${playerId}，当前玩家数: ${this.players.length}`);
    }
    
    /**
     * 移除玩家
     */
    public RemovePlayer(playerId: PlayerID): void {
        const index = this.players.indexOf(playerId);
        if (index > -1) {
            this.players.splice(index, 1);
        }
        print(`[MultiStageDungeon] 移除玩家 ${playerId}，当前玩家数: ${this.players.length}`);
    }
    
    /**
     * 完成副本
     */
    public CompleteDungeon(): void {
        this.state = DungeonInstanceState.COMPLETED;
        const duration = GameRules.GetGameTime() - this.startTime;
        
        print(`[MultiStageDungeon] 副本完成！用时: ${duration.toFixed(2)}秒`);
        
        // 给奖励
        for (const playerId of this.players) {
            this.GiveReward(playerId, duration);
        }
        
        // 3秒后传送回主城
        Timers.CreateTimer(3, () => {
            const { GetDungeonManager } = require('./DungeonManager');
            const manager = GetDungeonManager();
            
            const playersCopy = [...this.players];
            for (const playerId of playersCopy) {
                manager.LeaveDungeon(playerId, 'complete');
            }
            return undefined;
        });
    }
    
    /**
     * 给奖励
     */
    private GiveReward(playerId: PlayerID, duration: number): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        const goldReward = 1000;
        const expReward = 2000;
        
        hero.AddExperience(expReward, ModifyXpReason.UNSPECIFIED, false, true);
        PlayerResource.ModifyGold(playerId, goldReward, true, ModifyGoldReason.UNSPECIFIED);
        
        GameRules.SendCustomMessage(
            `<font color="#FFD700">获得奖励：${goldReward}金币, ${expReward}经验</font>`,
            playerId,
            0
        );
    }
    
    /**
     * 玩家死亡
     */
    public OnPlayerDeath(playerId: PlayerID): void {
        if (! this.players.includes(playerId)) return;
        
        print(`[MultiStageDungeon] 玩家 ${playerId} 死亡，返回城镇`);
        
        GameRules.SendCustomMessage(
            `<font color='#FF0000'>你已死亡，2秒后返回城镇</font>`,
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
    
    /**
     * 清理
     */
    public Cleanup(): void {
        print(`[MultiStageDungeon] 清理副本: ${this.instanceId}`);
        
        if (this.currentGenerator) {
            this.currentGenerator.Cleanup();
        }
        
        this.ClearAllUnits();
        this.players = [];
    }
    
    // Getters
    public GetState(): DungeonInstanceState { return this.state; }
    public GetInstanceId(): string { return this.instanceId; }
    public GetPlayers(): PlayerID[] { 
        print(`[MultiStageDungeon] GetPlayers 被调用，返回 ${this.players.length} 个玩家`);
        return this.players; 
    }
}