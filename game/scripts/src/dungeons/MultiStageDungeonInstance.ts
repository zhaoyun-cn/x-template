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
    
    public portalEntity: CDOTA_BaseNPC | null = null;  // ✅ 改为 public
    private startTime: number = 0;
    
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
        
        // 生成第一阶段
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
        
        // 计算阶段中心位置
        const stageCenter = Vector(
            this.basePosition.x + stage.offsetX,
            this.basePosition.y + stage.offsetY,
            128
        );
        
        // 清理旧的生成器
        if (this.currentGenerator) {
            this.currentGenerator.Cleanup();
        }
        
        // 创建新生成器并生成地图
        this.currentGenerator = new DungeonGenerator(stageCenter, stage.mapData);
        this.currentGenerator.Generate();
        
        // ✅ 刷新立即刷怪点
        this.SpawnImmediateUnits(stage);
        
        // 如果不是最终阶段，生成传送门
        if (! stage.isFinalStage && stage.portalPosition) {
            this.SpawnPortal(stage);
        }
    }
    
    /**
     * 刷新立即刷怪点
     */
    private SpawnImmediateUnits(stage: DungeonStageConfig): void {
        if (!this.currentGenerator) return;
        
        for (const spawner of stage.mapData.spawners) {
            // ✅ 检查 instant 或 immediate
            if (spawner.spawnMode === 'immediate' || spawner.spawnMode === 'instant') {
                const worldPos = this.currentGenerator.GridToWorld(spawner.x, spawner.y);
                const units = this.currentGenerator.SpawnUnits(worldPos, spawner);
                print(`[MultiStageDungeon] 立即刷怪: ${spawner.id}, 生成 ${units.length} 个单位`);
            }
        }
    }
    
    /**
     * 生成阶段传送门
     */
    private SpawnPortal(stage: DungeonStageConfig): void {
        if (!this.currentGenerator || !stage.portalPosition) return;
        
        const portalPos = this.currentGenerator.GridToWorld(
            stage.portalPosition.x,
            stage.portalPosition.y
        );
        
        // ✅ 提高Z轴，确保在地面上
        portalPos.z = 128;
        
        print(`[MultiStageDungeon] 生成传送门在 (${portalPos.x}, ${portalPos.y}, ${portalPos.z})`);
        
        // ✅ 使用更明显的单位
        this.portalEntity = CreateUnitByName(
            'npc_dota_hero_wisp',
            portalPos,
            false,
            null,
            null,
            DotaTeam.NOTEAM
        );
        
        if (this.portalEntity) {
            // ✅ 使用更大更明显的模型
            this.portalEntity.SetModel('models/props_structures/radiant_statue001.vmdl');
            this.portalEntity.SetModelScale(2.5);
            this.portalEntity.AddNewModifier(this.portalEntity, null, 'modifier_invulnerable', {});
            
            // ✅ 添加多个粒子效果
            const particle1 = ParticleManager.CreateParticle(
                'particles/econ/events/ti6/teleport_end_ground_ti6.vpcf',
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.portalEntity
            );
            ParticleManager.SetParticleControl(particle1, 0, portalPos);
            
            const particle2 = ParticleManager.CreateParticle(
                'particles/units/heroes/hero_wisp/wisp_ambient.vpcf',
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.portalEntity
            );
            ParticleManager.SetParticleControl(particle2, 0, portalPos);
            
            // ✅ 添加光柱
            const particle3 = ParticleManager.CreateParticle(
                'particles/items2_fx/teleport_end.vpcf',
                ParticleAttachment.ABSORIGIN,
                this.portalEntity
            );
            ParticleManager.SetParticleControl(particle3, 0, portalPos);
            
            print(`[MultiStageDungeon] ✅ 传送门创建成功，模型: ${this.portalEntity.GetModelName()}`);
            
            // ✅ 显示提示
            this.ShowPortalPrompt();
        } else {
            print(`[MultiStageDungeon] ❌ 传送门创建失败`);
        }
    }
    
    /**
     * 显示传送门提示
     */
    private ShowPortalPrompt(): void {
        Timers.CreateTimer(2, () => {
            if (! this.portalEntity || this.portalEntity.IsNull()) {
                return undefined;
            }
            
            if (this.state !== DungeonInstanceState.RUNNING) {
                return undefined;
            }
            
            const portalPos = this.portalEntity.GetAbsOrigin();
            
            for (const playerId of this.players) {
                const hero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (! hero || !hero.IsAlive()) {
                    continue;
                }
                
                const heroPos = hero.GetAbsOrigin();
                const dx = portalPos.x - heroPos.x;
                const dy = portalPos.y - heroPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // ✅ 显示提示
                if (distance <= 800) {
                    GameRules.SendCustomMessage(
                        '<font color="#00FFFF">输入 -next 进入下一阶段 | 输入 -portal_pos 查看距离</font>',
                        playerId,
                        0
                    );
                }
            }
            
            return 2;
        });
    }
    
    /**
     * 开始传送门读条
     */
    public StartPortalChanneling(playerId: PlayerID): void {
        print(`[MultiStageDungeon] 玩家 ${playerId} 开始读条`);
        
        GameRules.SendCustomMessage(
            '<font color="#00FFFF">传送中...  (2秒)</font>',
            playerId,
            0
        );
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            hero.Stop();
            hero.AddNewModifier(hero, null, 'modifier_stunned', { duration: 2 });
            
            // 播放音效
            hero.EmitSound('Portal.Loop_Appear');
        }
        
        // 2秒后完成传送
        Timers.CreateTimer(2, () => {
            this.OnPortalChannelComplete(playerId);
            return undefined;
        });
    }
    
    /**
     * 读条完成
     */
    private OnPortalChannelComplete(playerId: PlayerID): void {
        const currentStage = this.GetStageConfig(this.currentStageId);
        if (!currentStage) return;
        
        // 标记当前阶段完成
        this.completedStages.add(this.currentStageId);
        
        print(`[MultiStageDungeon] 玩家 ${playerId} 完成阶段: ${currentStage.stageName}`);
        
        // 获取下一阶段
        const nextStageId = this.GetNextStageId(this.currentStageId);
        
        if (nextStageId) {
            this.EnterNextStage(nextStageId);
        } else {
            print(`[MultiStageDungeon] 没有下一阶段`);
        }
    }
    
    /**
     * 进入下一阶段
     */
    private EnterNextStage(stageId: string): void {
        const stage = this.GetStageConfig(stageId);
        if (!stage) return;
        
        print(`[MultiStageDungeon] 进入下一阶段: ${stage.stageName}`);
        
        // 移除旧传送门
        if (this.portalEntity && ! this.portalEntity.IsNull()) {
            UTIL_Remove(this.portalEntity);
            this.portalEntity = null;
        }
        
        // 更新当前阶段
        this.currentStageId = stageId;
        
        // 生成新阶段
        this.GenerateStage(stageId);
        
        // 传送所有玩家到新阶段入口
        this.TeleportPlayersToStage();
        
        // 通知玩家
        for (const playerId of this.players) {
            GameRules.SendCustomMessage(
                `<font color="#00FF00">进入：${stage.stageName}</font>`,
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
        if (!this.currentGenerator) return;
        
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
     * 获取下一阶段ID
     */
    private GetNextStageId(currentId: string): string | null {
        const currentIndex = this.config.stages.findIndex(s => s.stageId === currentId);
        if (currentIndex >= 0 && currentIndex < this.config.stages.length - 1) {
            return this.config.stages[currentIndex + 1].stageId;
        }
        return null;
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
    }
    
    /**
     * 移除玩家
     */
    public RemovePlayer(playerId: PlayerID): void {
        const index = this.players.indexOf(playerId);
        if (index > -1) {
            this.players.splice(index, 1);
        }
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
        
        if (this.portalEntity && !this.portalEntity.IsNull()) {
            UTIL_Remove(this.portalEntity);
        }
        
        this.players = [];
    }
    
    // Getters
    public GetState(): DungeonInstanceState { return this.state; }
    public GetInstanceId(): string { return this.instanceId; }
    public GetPlayers(): PlayerID[] { return this.players; }
}