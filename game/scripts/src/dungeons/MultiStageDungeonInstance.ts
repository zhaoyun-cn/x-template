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
    
    public portalEntity: CDOTA_BaseNPC | null = null;
    private portalParticles: ParticleID[] = [];  // ✅ ParticleID 类型
    private startTime: number = 0;
    
    // 记录正在读条的玩家
    private channelingPlayers: Set<PlayerID> = new Set();
    
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
        
        this.SpawnImmediateUnits(stage);
        
        if (! stage.isFinalStage && stage.portalPosition) {
            this.SpawnPortal(stage);
        }
    }
    
    /**
     * 刷新立即刷怪点
     */
    private SpawnImmediateUnits(stage: DungeonStageConfig): void {
        if (!this.currentGenerator) return;
        
        print(`[MultiStageDungeon] 检查立即刷怪点，共 ${stage.mapData.spawners.length} 个刷怪点`);
        
        for (const spawner of stage.mapData.spawners) {
            print(`[MultiStageDungeon] 刷怪点 ${spawner.id}: 模式=${spawner.spawnMode}, 单位=${spawner.unitType}, 数量=${spawner.count}`);
            
            if (spawner.spawnMode === 'immediate' || spawner.spawnMode === 'instant') {
                const worldPos = this.currentGenerator.GridToWorld(spawner.x, spawner.y);
                print(`[MultiStageDungeon] 正在刷怪: ${spawner.id} at (${worldPos.x}, ${worldPos.y})`);
                
                const units = this.currentGenerator.SpawnUnits(worldPos, spawner);
                print(`[MultiStageDungeon] ✅ 立即刷怪: ${spawner.id}, 生成 ${units.length} 个单位`);
                
                // 为BOSS添加击杀监听
                if (spawner.id === 'spawn_boss' && units.length > 0) {
                    print(`[MultiStageDungeon] 为BOSS添加击杀监听`);
                    for (const unit of units) {
                        ListenToGameEvent('entity_killed', (event) => {
                            const killedUnit = EntIndexToHScript(event.entindex_killed);
                            if (killedUnit === unit) {
                                print(`[MultiStageDungeon] 🎉 BOSS被击杀！`);
                                this.CompleteDungeon();
                            }
                        }, undefined);
                    }
                }
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
        
        portalPos.z = 192;
        
        print(`[MultiStageDungeon] 生成传送门在 (${portalPos.x}, ${portalPos.y}, ${portalPos.z})`);
        
        // 使用影魔作为传送门
        this.portalEntity = CreateUnitByName(
            'npc_dota_hero_nevermore',
            portalPos,
            false,
            null,
            null,
            DotaTeam.NOTEAM
        );
        
        if (this.portalEntity) {
            // 设置为无敌、定身、不可攻击
            this.portalEntity.AddNewModifier(this.portalEntity, null, 'modifier_invulnerable', {});
            this.portalEntity.AddNewModifier(this.portalEntity, null, 'modifier_rooted', {});
            this.portalEntity.SetModelScale(2.5);
            this.portalEntity.StartGesture(GameActivity.DOTA_SPAWN);
            this.portalEntity.SetAttackCapability(UnitAttackCapability.NO_ATTACK);
            
            // 移除经验和金钱
            if (this.portalEntity.IsCreature && this.portalEntity.IsCreature()) {
                (this.portalEntity as CDOTA_BaseNPC_Creature).SetDeathXP(0);
                (this.portalEntity as CDOTA_BaseNPC_Creature).SetMinimumGoldBounty(0);
                (this.portalEntity as CDOTA_BaseNPC_Creature).SetMaximumGoldBounty(0);
            }
            
            // ✅ 添加粒子效果 - 在地面
            const groundPos = Vector(portalPos.x, portalPos.y, GetGroundHeight(portalPos, this.portalEntity));
            
            // 底部光圈
            const p1 = ParticleManager.CreateParticle(
                'particles/econ/events/ti6/teleport_end_ground_ti6.vpcf',
                ParticleAttachment.WORLDORIGIN,
                null
            ) as ParticleID;
            ParticleManager.SetParticleControl(p1, 0, groundPos);
            this.portalParticles.push(p1);
            
            // 蓝色旋转效果
            const p2 = ParticleManager.CreateParticle(
                'particles/econ/events/ti6/teleport_start_ti6.vpcf',
                ParticleAttachment.WORLDORIGIN,
                null
            ) as ParticleID;
            ParticleManager.SetParticleControl(p2, 0, groundPos);
            this.portalParticles.push(p2);
            
            // 黑色阴影效果
            const p3 = ParticleManager.CreateParticle(
                'particles/units/heroes/hero_nevermore/nevermore_shadowraze.vpcf',
                ParticleAttachment.WORLDORIGIN,
                null
            ) as ParticleID;
            ParticleManager.SetParticleControl(p3, 0, groundPos);
            this.portalParticles.push(p3);
            
            // 光柱
            const topPos = Vector(portalPos.x, portalPos.y, portalPos.z + 800);
            const p4 = ParticleManager.CreateParticle(
                'particles/items2_fx/teleport_end.vpcf',
                ParticleAttachment.WORLDORIGIN,
                null
            ) as ParticleID;
            ParticleManager.SetParticleControl(p4, 0, groundPos);
            ParticleManager.SetParticleControl(p4, 1, topPos);
            this.portalParticles.push(p4);
            
            print(`[MultiStageDungeon] ✅ 传送门创建成功 (影魔) at (${portalPos.x}, ${portalPos.y}, ${portalPos.z})`);
            print(`[MultiStageDungeon] ✅ 开始监听玩家靠近`);
            
            // 监听靠近
            this.MonitorPortalInteraction();
        } else {
            print(`[MultiStageDungeon] ❌ 传送门创建失败`);
        }
    }
    
    /**
     * 监听传送门交互（靠近自动触发）
     */
    private MonitorPortalInteraction(): void {
        if (!this.portalEntity) {
            print(`[MultiStageDungeon] ❌ 监听失败：传送门不存在`);
            return;
        }
        
        print(`[MultiStageDungeon] ✅ 监听循环已启动`);
        
        Timers.CreateTimer(0.5, () => {
            // 检查传送门是否存在
            if (! this.portalEntity || this.portalEntity.IsNull()) {
                print(`[MultiStageDungeon] 传送门已销毁，停止监听`);
                return undefined;
            }
            
            // 检查副本状态
            if (this.state !== DungeonInstanceState.RUNNING) {
                print(`[MultiStageDungeon] 副本未运行，停止监听`);
                return undefined;
            }
            
            const portalPos = this.portalEntity.GetAbsOrigin();
            
            // 遍历所有玩家
            for (const playerId of this.players) {
                const hero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (! hero || ! hero.IsAlive()) {
                    continue;
                }
                
                // 跳过已经在读条的玩家
                if (this.channelingPlayers.has(playerId)) {
                    continue;
                }
                
                const heroPos = hero.GetAbsOrigin();
                const dx = portalPos.x - heroPos.x;
                const dy = portalPos.y - heroPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // ✅ 每次都打印日志
                print(`[MultiStageDungeon] 监听中 - 玩家 ${playerId} 距离: ${distance.toFixed(2)}`);
                
                // 显示提示
                if (distance <= 600 && distance > 350) {
                    GameRules.SendCustomMessage(
                        '<font color="#00FFFF">【走近传送门】进入下一阶段</font>',
                        playerId,
                        0
                    );
                }
                
                // ✅ 靠近传送门时自动触发（350距离内）
                if (distance <= 350) {
                    print(`[MultiStageDungeon] 🚪 玩家 ${playerId} 接近传送门，触发传送！`);
                    this.StartPortalChanneling(playerId);
                }
            }
            
            return 0.5;  // 每0.5秒检测一次
        });
    }
    
    /**
     * 开始传送门读条 - 5秒
     */
    public StartPortalChanneling(playerId: PlayerID): void {
        // 防止重复触发
        if (this.channelingPlayers.has(playerId)) {
            print(`[MultiStageDungeon] 玩家 ${playerId} 已在读条中`);
            return;
        }
        
        this.channelingPlayers.add(playerId);
        
        print(`[MultiStageDungeon] 🔔 玩家 ${playerId} 开始读条`);
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            this.channelingPlayers.delete(playerId);
            return;
        }
        
        // 记录起始位置
        const startPos = hero.GetAbsOrigin();
        
        // 显示读条提示
        GameRules.SendCustomMessage(
            '<font color="#00FFFF">传送中...  请勿移动 (5秒)</font>',
            playerId,
            0
        );
        
        // 定身5秒
        hero.Stop();
        hero.AddNewModifier(hero, null, 'modifier_stunned', { duration: 5 });
        
        // ✅ 添加读条粒子效果 - 在英雄脚下
        const heroGroundPos = Vector(startPos.x, startPos.y, GetGroundHeight(startPos, hero));
        const particle = ParticleManager.CreateParticle(
            'particles/items2_fx/teleport_start.vpcf',
            ParticleAttachment.WORLDORIGIN,
            null
        ) as ParticleID;
        ParticleManager.SetParticleControl(particle, 0, heroGroundPos);
        
        // 每秒倒计时提示
        let countdown = 5;
        let cancelled = false;
        
        const countdownTimer = () => {
            if (cancelled || countdown <= 0) return;
            
            // 检查玩家是否移动
            const currentPos = hero.GetAbsOrigin();
            const moved = Math.abs(currentPos.x - startPos.x) > 100 || Math.abs(currentPos.y - startPos.y) > 100;
            
            if (moved) {
                print(`[MultiStageDungeon] 玩家 ${playerId} 移动了，取消传送`);
                GameRules.SendCustomMessage(
                    '<font color="#FF0000">传送已取消（你移动了）</font>',
                    playerId,
                    0
                );
                cancelled = true;
                this.channelingPlayers.delete(playerId);
                hero.RemoveModifierByName('modifier_stunned');
                ParticleManager.DestroyParticle(particle, false);
                ParticleManager.ReleaseParticleIndex(particle);
                return;
            }
            
            // 显示倒计时
            if (countdown > 0) {
                GameRules.SendCustomMessage(
                    `<font color="#FFD700">${countdown}...</font>`,
                    playerId,
                    0
                );
            }
            
            countdown--;
            
            if (countdown > 0) {
                Timers.CreateTimer(1, () => {
                    countdownTimer();
                    return undefined;
                });
            }
        };
        
        countdownTimer();
        
        // 5秒后完成传送
        Timers.CreateTimer(5, () => {
            if (cancelled) return undefined;
            
            // 再次检查是否移动
            const currentPos = hero.GetAbsOrigin();
            const moved = Math.abs(currentPos.x - startPos.x) > 100 || Math.abs(currentPos.y - startPos.y) > 100;
            
            if (moved) {
                print(`[MultiStageDungeon] 玩家 ${playerId} 传送前移动了，取消`);
                this.channelingPlayers.delete(playerId);
                ParticleManager.DestroyParticle(particle, false);
                ParticleManager.ReleaseParticleIndex(particle);
                return undefined;
            }
            
            // 播放音效
            hero.EmitSound('Portal.Loop_Disappear');
            
            // 销毁粒子
            ParticleManager.DestroyParticle(particle, false);
            ParticleManager.ReleaseParticleIndex(particle);
            
            // 完成传送
            this.OnPortalChannelComplete(playerId);
            this.channelingPlayers.delete(playerId);
            
            return undefined;
        });
    }
    
    /**
     * 读条完成
     */
    private OnPortalChannelComplete(playerId: PlayerID): void {
        const currentStage = this.GetStageConfig(this.currentStageId);
        if (! currentStage) return;
        
        this.completedStages.add(this.currentStageId);
        
        print(`[MultiStageDungeon] 玩家 ${playerId} 完成阶段: ${currentStage.stageName}`);
        
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
        if (! stage) return;
        
        print(`[MultiStageDungeon] 进入下一阶段: ${stage.stageName}`);
        
        // 销毁粒子
        for (const particleId of this.portalParticles) {
            ParticleManager.DestroyParticle(particleId, false);
            ParticleManager.ReleaseParticleIndex(particleId);
        }
        this.portalParticles = [];
        
        // 移除旧传送门
        if (this.portalEntity && ! this.portalEntity.IsNull()) {
            UTIL_Remove(this.portalEntity);
            this.portalEntity = null;
        }
        
        // 清空读条玩家列表
        this.channelingPlayers.clear();
        
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
        this.channelingPlayers.delete(playerId);
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
        
        // 取消读条
        this.channelingPlayers.delete(playerId);
        
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
        
        // 清理粒子
        for (const particleId of this.portalParticles) {
            ParticleManager.DestroyParticle(particleId, false);
            ParticleManager.ReleaseParticleIndex(particleId);
        }
        this.portalParticles = [];
        
        if (this.portalEntity && !this.portalEntity.IsNull()) {
            UTIL_Remove(this.portalEntity);
        }
        
        this.players = [];
        this.channelingPlayers.clear();
    }
    
    // Getters
    public GetState(): DungeonInstanceState { return this.state; }
    public GetInstanceId(): string { return this.instanceId; }
    public GetPlayers(): PlayerID[] { return this.players; }
}