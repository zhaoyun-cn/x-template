import { MultiStageDungeonConfig } from '../types_multistage';
import { DUNGEON_FROST_TEMPLE } from './dungeon_frost_temple';

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
                ...DUNGEON_FROST_TEMPLE,
                mapName: '冰封前厅',
                spawners: [
                    // 5个狗头人在入口
                    {
                        id: 'spawn_entrance_01',
                        x: 2,
                        y: 10,
                        unitType: 'npc_dota_neutral_kobold',
                        count: 5,
                        spawnMode: 'instant',
                    },
                    // 5个冰霜萨满在第一房间
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
                ...DUNGEON_FROST_TEMPLE,
                mapName: 'BOSS房间',
                spawners: [
                    {
                        id: 'spawn_boss',
                        x: 17,
                        y: 10,
                        unitType: 'npc_dota_neutral_black_dragon',
                        count: 1,
                        spawnMode: 'instant',
                    }
                ],
                triggers: [],
                entryPoints: [{ x: 15, y: 10 }],
            }
        }
    ]
};