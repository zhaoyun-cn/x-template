import { DungeonMapData, TileData, SpawnerData, TriggerData, DecorationData } from './types';

/**
 * 副本生成器
 * 负责根据配置数据在DOTA2中动态生成副本地图
 */
export class DungeonGenerator {
    private basePosition: Vector;
    private mapData: DungeonMapData;
    private spawnedUnits: CDOTA_BaseNPC[] = [];
    private spawnedProps: any[] = [];
    
    constructor(centerPosition: Vector, mapData: DungeonMapData) {
        this.basePosition = centerPosition;
        this.mapData = mapData;
    }
    
    /**
     * 生成整个副本
     */
    public Generate(): void {
        print(`[DungeonGenerator] 开始生成副本:  ${this.mapData.mapName}`);
        
        // 1.生成地形
        this.GenerateTiles();
        
        // 2.生成装饰物
        if (this.mapData.decorations) {
            this.GenerateDecorations();
        }
        
        // 3.创建刷怪点
        this.GenerateSpawners();
        
        // 4.设置触发器
        this.GenerateTriggers();
        
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
                    // 地板不生成任何东西
                    break;
                case 'wall': 
                    this.CreateWallTile(worldPos);
                    break;
            }
        }
    }
    
    /**
     * 创建墙壁格子 - 使用多个建筑物形成更大的阻挡
     */
    private CreateWallTile(position: Vector): void {
        // 1. 创建视觉效果（石柱）
        const prop = SpawnEntityFromTableSynchronous('prop_dynamic', {
            origin: position,
            model: 'models/props_structures/tower_dragon_blk_dest_lvl3.vmdl',
            modelscale: 0.8,
            DefaultAnim: 'idle',
        }) as any;
        
        if (prop) {
            this.spawnedProps.push(prop);
        }
        
        // 2.创建 9 个建筑物形成 3x3 网格阻挡（覆盖更大范围）
        const blockerPositions = [
            position,  // 中心
            Vector(position.x + 64, position.y, position.z),       // 右
            Vector(position.x - 64, position.y, position.z),       // 左
            Vector(position.x, position.y + 64, position.z),       // 上
            Vector(position.x, position.y - 64, position.z),       // 下
            Vector(position.x + 64, position.y + 64, position.z),  // 右上
            Vector(position.x - 64, position.y + 64, position.z),  // 左上
            Vector(position.x + 64, position.y - 64, position.z),  // 右下
            Vector(position.x - 64, position.y - 64, position.z),  // 左下
        ];
        
        for (const pos of blockerPositions) {
            const blocker = CreateUnitByName(
                'npc_dota_building',
                pos,
                false,
                null,
                null,
                DotaTeam.NEUTRALS
            );
            
            if (blocker) {
                blocker.AddNewModifier(blocker, null, 'modifier_invulnerable', {});
                blocker.SetAbsOrigin(pos);
                this.spawnedUnits.push(blocker);
            }
        }
    }
    
    /**
     * 生成装饰物
     */
    private GenerateDecorations(): void {
        const decorations = this.mapData.decorations;
        print(`[DungeonGenerator] 生成装饰物:  ${decorations.length} 个`);
        
        for (const deco of decorations) {
            const worldPos = this.GridToWorld(deco.x, deco.y);
            
            const prop = SpawnEntityFromTableSynchronous('prop_dynamic', {
                origin: worldPos,
                model: deco.model,
                modelscale: deco.scale || 1.0,
                angles: `0 ${deco.rotation || 0} 0`,
                DefaultAnim: 'idle',
            }) as any;
            
            if (prop) {
                this.spawnedProps.push(prop);
            }
        }
    }
    
    /**
     * 创建刷怪点（不立即刷怪）
     */
    private GenerateSpawners(): void {
        const spawners = this.mapData.spawners;
        print(`[DungeonGenerator] 设置刷怪点: ${spawners.length} 个`);
    }
    
    /**
     * 设置触发器
     */
    private GenerateTriggers(): void {
        const triggers = this.mapData.triggers;
        print(`[DungeonGenerator] 设置触发器: ${triggers.length} 个`);
    }
    
    /**
     * 网格坐标转世界坐标
     */
    public GridToWorld(gridX: number, gridY: number): Vector {
        const tileSize = this.mapData.tileSize;
        const worldX = this.basePosition.x + (gridX - this.mapData.width / 2) * tileSize;
        const worldY = this.basePosition.y + (gridY - this.mapData.height / 2) * tileSize;
        
        return Vector(worldX, worldY, this.basePosition.z);
    }
    
    /**
     * 世界坐标转网格坐标
     */
    public WorldToGrid(worldPos: Vector): { x: number; y: number } {
        const tileSize = this.mapData.tileSize;
        const gridX = Math.round((worldPos.x - this.basePosition.x) / tileSize + this.mapData.width / 2);
        const gridY = Math.round((worldPos.y - this.basePosition.y) / tileSize + this.mapData.height / 2);
        
        return { x: gridX, y: gridY };
    }
    
    /**
     * 🆕 刷怪（支持不同模式）
     */
    public SpawnUnits(position: Vector, spawner: SpawnerData): CDOTA_BaseNPC[] {
        const units:  CDOTA_BaseNPC[] = [];
        
        print(`[DungeonGenerator] ======= 开始刷怪 =======`);
        print(`[DungeonGenerator] 单位类型: ${spawner.unitType}`);
        print(`[DungeonGenerator] 数量: ${spawner.count}`);
        print(`[DungeonGenerator] 位置: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        
        // 🔧 特殊处理：影魔Boss
        if (spawner.unitType === 'npc_dota_hero_shadow_fiend' || 
            spawner.unitType === 'shadow_fiend_boss') {
            print(`[DungeonGenerator] 🎯 检测到影魔Boss，使用特殊生成逻辑`);
            
            const boss = this.SpawnShadowFiendBoss(position);
            if (boss) {
                units.push(boss);
                this.spawnedUnits.push(boss);
                print(`[DungeonGenerator] ✅ 影魔Boss生成成功`);
            } else {
                print(`[DungeonGenerator] ❌ 影魔Boss生成失败`);
            }
            
            print(`[DungeonGenerator] ======= 刷怪完成:  ${units.length}/${spawner.count} =======`);
            return units;
        }
        
        // 原有的刷怪逻辑
        for (let i = 0; i < spawner.count; i++) {
            const offset = RandomVector(100);
            const spawnPos = Vector(
                position.x + offset.x,
                position.y + offset.y,
                position.z
            );
            
            print(`[DungeonGenerator] 尝试生成第 ${i+1}/${spawner.count} 个单位...`);
            
            const unit = CreateUnitByName(
                spawner.unitType,
                spawnPos,
                true,
                null,
                null,
                DotaTeam.NEUTRALS
            );
            
            if (unit) {
                units.push(unit);
                this.spawnedUnits.push(unit);
                print(`[DungeonGenerator] ✅ 成功:  ${unit.GetUnitName()} at (${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)})`);
            } else {
                print(`[DungeonGenerator] ❌ 失败: ${spawner.unitType} - 单位名称可能错误或未预加载`);
            }
        }
        
        print(`[DungeonGenerator] ======= 刷怪完成: ${units.length}/${spawner.count} =======`);
        return units;
    }
    
    /**
     * 🆕 生成影魔Boss（特殊逻辑）
     */
    private SpawnShadowFiendBoss(position: Vector): CDOTA_BaseNPC | null {
        print(`[DungeonGenerator] 开始创建影魔Boss...`);
        
        // 使用英雄单位名称
        const heroName = 'npc_dota_hero_nevermore';
        
        const hero = CreateUnitByName(
            heroName,
            position,
            true,
            null,
            null,
            DotaTeam.NEUTRALS
        ) as CDOTA_BaseNPC_Hero;
        
        if (! hero) {
            print(`[DungeonGenerator] ❌ 创建影魔英雄失败`);
            return null;
        }
        
        print(`[DungeonGenerator] ✅ 影魔单位已创建: ${hero.GetUnitName()}`);
        
        // 设置为中立敌对
        hero.SetTeam(DotaTeam.NEUTRALS);
        hero.SetOwner(null);
        
        // 强化属性
        hero.SetBaseMaxHealth(8000);
        hero.SetMaxHealth(8000);
        hero.SetHealth(8000);
        hero.SetBaseManaRegen(10);
        hero.SetPhysicalArmorBaseValue(20);
        hero.SetBaseDamageMin(200);
        hero.SetBaseDamageMax(250);
        
        // 添加经验和金币奖励
        hero.SetDeathXP(500);
        hero.SetMinimumGoldBounty(200);
        hero.SetMaximumGoldBounty(300);
        
        print(`[DungeonGenerator] ✅ Boss属性已设置`);
        
        // 🔧 重要：延迟初始化Boss系统
Timers.CreateTimer(0.5, () => {
    try {
        print(`[DungeonGenerator] 正在初始化影魔Boss系统...`);
        
        // 动态导入Boss类
        const { ShadowFiendBoss } = require('../dungeon/boss/shadow_fiend_boss');
        
        // 获取第一个有效玩家ID
        let playerId:  PlayerID = 0;
        for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
            if (PlayerResource.IsValidPlayerID(i)) {
                playerId = i as PlayerID;
                break;
            }
        }
        
        // 初始化Boss系统
        const bossInstance = new ShadowFiendBoss(hero, playerId);
        
        // 🔧 将Boss实例保存到hero上，方便后续清理
        (hero as any)._bossInstance = bossInstance;
        
        // 🔧 监听Boss死亡，自动清理
        const deathListener = ListenToGameEvent('entity_killed', (event) => {
            const killedUnit = EntIndexToHScript(event.entindex_killed);
            if (killedUnit === hero) {
                print(`[DungeonGenerator] Boss已死亡，清理Boss系统`);
                if (bossInstance) {
                    bossInstance.Cleanup();
                }
                StopListeningToGameEvent(deathListener);
            }
        }, undefined);
        
        print(`[DungeonGenerator] ✅ 影魔Boss系统已初始化，玩家ID: ${playerId}`);
        
    } catch (error) {
        print(`[DungeonGenerator] ❌ Boss系统初始化失败:  ${error}`);
    }
    
    return undefined;
});

return hero;
    }
    
    /**
     * 获取所有生成的单位
     */
    public GetSpawnedUnits(): CDOTA_BaseNPC[] {
        return [...this.spawnedUnits];
    }
    
    /**
     * 获取地图数据
     */
    public GetMapData(): DungeonMapData {
        return this.mapData;
    }
    
    /**
     * 清理副本
     */
    public Cleanup(): void {
        print(`[DungeonGenerator] 清理副本:  ${this.mapData.mapName}`);
        
        // 清理所有生成的单位
        for (const unit of this.spawnedUnits) {
            if (unit && IsValidEntity(unit) && unit.IsAlive()) {
                unit.ForceKill(false);
                UTIL_Remove(unit);
            }
        }
        this.spawnedUnits = [];
        
        // 清理所有装饰物
        for (const prop of this.spawnedProps) {
            if (prop && IsValidEntity(prop)) {
                UTIL_Remove(prop);
            }
        }
        this.spawnedProps = [];
    }
}