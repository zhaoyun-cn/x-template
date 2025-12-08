import { MultiStageDungeonConfig } from '../types_multistage';

/**
 * 冰霜神殿 - 多阶段版本（积分制）
 */
export const DUNGEON_FROST_TEMPLE_MULTI: MultiStageDungeonConfig & { mapName: string } = {
    dungeonId: 'frost_temple_multi',
    dungeonName: '冰霜神殿（多阶段）',
    mapName: '冰霜神殿（多阶段）',
    description: '击杀怪物获得积分，选择下一关卡',
    startStageId: 'stage1',
    stages: [
        {
            stageId: 'stage1',
            stageName: '冰封前厅',
            description: '清理小怪（需要10分）',
            offsetX: 0,
            offsetY: 0,
            isFinalStage: false,
            mapData: {
                // ✅ 不使用 ...DUNGEON_FROST_TEMPLE，完全自定义
                mapId: 'frost_temple_stage1',
                mapName: '冰封前厅',
                description: '清理小怪',
                width: 20,
                height: 20,
                tileSize: 128,
                
                // 简化的地形 - 只保留基本墙壁
                tiles: [
                    // 上墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0, type: 'wall' as const })),
                    // 下墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 19, type: 'wall' as const })),
                    // 左墙（留出入口 5-15）
                    ...Array.from({ length: 5 }, (_, i) => ({ x: 0, y: i, type: 'wall' as const })),
                    ...Array.from({ length: 5 }, (_, i) => ({ x: 0, y: 15 + i, type: 'wall' as const })),
                    // 右墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: 19, y: i, type: 'wall' as const })),
                ],
                
                // ✅ 只有这两个刷怪点
                spawners: [
                    {
                        id: 'spawn_entrance_01',
                        x: 2,
                        y: 10,
                        unitType: 'npc_dota_neutral_kobold',
                        count: 5,
                        spawnMode: 'instant',
                    },
                    {
                        id: 'spawn_room1',
                        x: 8,
                        y: 10,
                        unitType: 'npc_dota_neutral_ice_shaman',
                        count: 5,
                        spawnMode: 'instant',
                    },
                ],
                
                triggers: [],
                decorations: [],
                entryPoints: [{ x: -2, y: 10 }],
            }
        },
        {
            stageId: 'stage2',
            stageName: 'BOSS房间',
            description: '击败黑龙BOSS',
            offsetX: 3000,
            offsetY: 0,
            isFinalStage: true,
            mapData: {
                // ✅ 不使用 ...DUNGEON_FROST_TEMPLE，完全自定义
                mapId: 'frost_temple_stage2',
                mapName: 'BOSS房间',
                description: '击败黑龙BOSS',
                width: 20,
                height: 20,
                tileSize: 128,
                
                // 简化的地形
                tiles: [
                    // 上墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0, type: 'wall' as const })),
                    // 下墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 19, type: 'wall' as const })),
                    // 左墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: 0, y: i, type: 'wall' as const })),
                    // 右墙
                    ...Array.from({ length: 20 }, (_, i) => ({ x: 19, y: i, type: 'wall' as const })),
                ],
                
                // ✅ 只有BOSS
                spawners: [
                    {
                        id: 'spawn_boss',
                        x: 10,
                        y: 10,
                        unitType: 'npc_dota_neutral_black_dragon',
                        count: 1,
                        spawnMode: 'instant',
                    }
                ],
                
                triggers: [],
                decorations: [],
                entryPoints: [{ x: 2, y: 10 }],
            }
        }
    ]
};