import { DungeonMapData, TileData, SpawnerData, TriggerData, DecorationData } from './types';

/**
 * 副本生成器
 * 负责根据配置数据在DOTA2中动态生成副本地图
 */
export class DungeonGenerator {
    private basePosition: Vector;
    private mapData: DungeonMapData;
    private spawnedUnits: CDOTA_BaseNPC[] = [];
    private spawnedDummies: CDOTA_BaseNPC[] = [];
    private spawnedParticles: ParticleID[] = [];
    
    constructor(centerPosition: Vector, mapData: DungeonMapData) {
        this.basePosition = centerPosition;
        this.mapData = mapData;
    }
    
    /**
     * 生成整个副本
     */
    public Generate(): void {
        print(`[DungeonGenerator] 开始生成副本: ${this.mapData.mapName}`);
        
        // 1. 生成地形
        this.GenerateTiles();
        
        // 2. 生成装饰物
        if (this.mapData.decorations) {
            this.GenerateDecorations();
        }
        
        // 3. 创建刷怪点
        this.GenerateSpawners();
        
        // 4. 设置触发器
        this. GenerateTriggers();
        
        print(`[DungeonGenerator] 副本生成完成! `);
    }
    
    /**
     * 生成地形
     */
    private GenerateTiles(): void {
        const tiles = this.mapData.tiles;
        print(`[DungeonGenerator] 生成地块数量: ${tiles.length}`);
        
        for (const tile of tiles) {
            const worldPos = this.GridToWorld(tile.x, tile.y);
            
            switch (tile.type) {
                case 'floor':
                    this.CreateFloorTile(worldPos);
                    break;
                case 'wall':
                    this.CreateWallTile(worldPos);
                    break;
                case 'water':
                    this.CreateWaterTile(worldPos);
                    break;
                case 'lava':
                    this.CreateLavaTile(worldPos);
                    break;
                case 'ice':
                    this.CreateIceTile(worldPos);
                    break;
            }
        }
    }
    
    /**
     * 创建地板格子（添加视觉效果）
     */
    private CreateFloorTile(position: Vector): void {
        // 创建地板特效（可选）
        const particle = ParticleManager.CreateParticle(
            'particles/world_environmental_fx/dungeon_floor.vpcf',
            ParticleAttachment. WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, position);
        this.spawnedParticles. push(particle);
    }
    
    /**
     * 创建墙壁格子（使用隐形单位阻挡）
     */
    private CreateWallTile(position: Vector): void {
        // 创建阻挡单位
        const dummy = CreateUnitByName(
            'npc_dota_creature_dummy_target',  // 使用训练假人作为阻挡
            position,
            false,
            null,
            null,
            DotaTeam.NEUTRALS
        );
        
        if (dummy) {
            // 设置为不可见、不可选择
            dummy.AddNoDraw();
            dummy.SetAbsOrigin(position);
            
            // 添加碰撞
            // dummy.SetHullRadius(64);  // 半个格子的大小
            
            this.spawnedDummies.push(dummy);
            
            // 添加墙壁视觉效果
            const particle = ParticleManager.CreateParticle(
                'particles/world_environmental_fx/dungeon_wall.vpcf',
                ParticleAttachment. WORLDORIGIN,
                undefined
            );
            ParticleManager. SetParticleControl(particle, 0, position);
            this.spawnedParticles. push(particle);
        }
    }
    
    /**
     * 创建水面格子
     */
    private CreateWaterTile(position: Vector): void {
        const particle = ParticleManager.CreateParticle(
            'particles/econ/items/earthshaker/earthshaker_gravelmaw/earthshaker_gravelmaw_fissure_groundwater.vpcf',
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, position);
        this.spawnedParticles.push(particle);
    }
    
    /**
     * 创建岩浆格子
     */
    private CreateLavaTile(position: Vector): void {
        const particle = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_phoenix/phoenix_fire_spirit_ground.vpcf',
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, position);
        this.spawnedParticles.push(particle);
    }
    
    /**
     * 创建冰面格子
     */
    private CreateIceTile(position: Vector): void {
        const particle = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_ancient_apparition/ancient_ice_vortex. vpcf',
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, position);
        this.spawnedParticles.push(particle);
    }
    
    /**
     * 生成装饰物
     */
    private GenerateDecorations(): void {
        if (! this.mapData.decorations) return;
        
        for (const deco of this.mapData.decorations) {
            const worldPos = this.GridToWorld(deco.x, deco.y);
            this.CreateDecoration(worldPos, deco);
        }
    }
    
    /**
     * 创建装饰物
     */
    private CreateDecoration(position: Vector, deco: DecorationData): void {
        const dummy = CreateUnitByName(
            'npc_dota_creature_dummy_target',
            position,
            false,
            null,
            null,
            DotaTeam.NEUTRALS
        );
        
        if (dummy) {
            // 设置模型
            dummy.SetModel(deco.model);
            dummy.SetOriginalModel(deco.model);
            
            // 设置缩放
            if (deco.scale) {
                dummy.SetModelScale(deco.scale);
            }
            
            // 设置旋转
            if (deco.rotation !== undefined) {
                const angles = QAngle(0, deco.rotation, 0);
                dummy.SetAngles(angles. x, angles.y, angles. z);
            }
            
            // 设置为不可攻击、不可移动
            dummy.SetUnitCanRespawn(false);
            
            this.spawnedDummies.push(dummy);
        }
    }
    
    /**
     * 生成刷怪点
     */
    private GenerateSpawners(): void {
        for (const spawner of this.mapData.spawners) {
            const worldPos = this.GridToWorld(spawner.x, spawner.y);
            
            // 根据刷怪模式决定是否立即生成
            if (spawner.spawnMode === 'instant' || ! spawner.spawnMode) {
                this.SpawnUnits(worldPos, spawner);
            }
            // 其他模式（trigger, delayed, wave）由触发器或管理器处理
        }
    }
    
    /**
     * 在指定位置刷怪
     */
    public SpawnUnits(position: Vector, spawner: SpawnerData): CDOTA_BaseNPC[] {
        const units: CDOTA_BaseNPC[] = [];
        
        for (let i = 0; i < spawner.count; i++) {
            // 在刷怪点周围随机偏移一点位置
            const offset = RandomVector(100);
            const spawnPos = Vector(
                position.x + offset. x,
                position.y + offset.y,
                position. z
            );
            
            const unit = CreateUnitByName(
                spawner.unitType,
                spawnPos,
                true,
                null,
                null,
                DotaTeam.NEUTRALS
            );
            
            if (unit) {
                units. push(unit);
                this.spawnedUnits.push(unit);
                
                print(`[DungeonGenerator] 生成单位: ${spawner.unitType} at (${spawner.x}, ${spawner. y})`);
            }
        }
        
        return units;
    }
    
    /**
     * 生成触发器
     */
    private GenerateTriggers(): void {
        for (const trigger of this.mapData.triggers) {
            const worldPos = this.GridToWorld(trigger.x, trigger.y);
            this.CreateTrigger(worldPos, trigger);
        }
    }
    
    /**
     * 创建触发器
     */
    private CreateTrigger(position: Vector, trigger: TriggerData): void {
        // 创建触发器标记（隐形单位）
        const triggerDummy = CreateUnitByName(
            'npc_dota_creature_dummy_target',
            position,
            false,
            null,
            null,
            DotaTeam. NEUTRALS
        );
        
        if (triggerDummy) {
            triggerDummy.AddNoDraw();
            
            // 在开发模式下显示触发器范围
            if (IsInToolsMode()) {
                const particle = ParticleManager.CreateParticle(
                    'particles/ui_mouseactions/range_display. vpcf',
                    ParticleAttachment.WORLDORIGIN,
                    undefined
                );
                ParticleManager.SetParticleControl(particle, 0, position);
                ParticleManager.SetParticleControl(particle, 1, Vector(trigger.radius, 0, 0));
                this.spawnedParticles.push(particle);
            }
            
            this.spawnedDummies.push(triggerDummy);
        }
        
        // 触发器逻辑将由 DungeonInstance 类处理
    }
    
    /**
     * 网格坐标转世界坐标
     */
    public GridToWorld(gridX: number, gridY: number): Vector {
        return Vector(
            this.basePosition. x + (gridX - this.mapData.width / 2) * this.mapData.tileSize,
            this.basePosition.y + (gridY - this.mapData. height / 2) * this. mapData.tileSize,
            this.basePosition.z
        );
    }
    
    /**
     * 世界坐标转网格坐标
     */
    public WorldToGrid(worldPos: Vector): { x: number; y: number } {
        return {
            x: Math.floor((worldPos.x - this.basePosition.x) / this.mapData.tileSize + this.mapData.width / 2),
            y: Math. floor((worldPos.y - this.basePosition.y) / this.mapData.tileSize + this.mapData.height / 2),
        };
    }
    
    /**
     * 清理副本（移除所有生成的实体）
     */
    public Cleanup(): void {
        print(`[DungeonGenerator] 清理副本: ${this.mapData.mapName}`);
        
        // 清理单位
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && unit.IsAlive()) {
                unit.ForceKill(false);
            }
        }
        
        // 清理假人
        for (const dummy of this.spawnedDummies) {
            if (dummy && IsValidEntity(dummy)) {
                UTIL_Remove(dummy);
            }
        }
        
        // 清理粒子效果
        for (const particle of this.spawnedParticles) {
            ParticleManager.DestroyParticle(particle, false);
            ParticleManager.ReleaseParticleIndex(particle);
        }
        
        this.spawnedUnits = [];
        this.spawnedDummies = [];
        this.spawnedParticles = [];
    }
    
    /**
     * 获取已生成的单位列表
     */
    public GetSpawnedUnits(): CDOTA_BaseNPC[] {
        return this.spawnedUnits;
    }
    
    /**
     * 获取地图数据
     */
    public GetMapData(): DungeonMapData {
        return this. mapData;
    }
}