import { MultiStageDungeonConfig } from '../types_multistage';
import { DUNGEON_FROST_TEMPLE } from './dungeon_frost_temple';

/**
 * 冰霜神殿 - 多阶段版本
 */
export const DUNGEON_FROST_TEMPLE_MULTI: MultiStageDungeonConfig & { mapName: string } = {
    dungeonId: 'frost_temple_multi',
    dungeonName: '冰霜神殿（多阶段）',
    mapName: '冰霜神殿（多阶段）',  // ✅ 添加
    description: '包含前厅和BOSS房间的两阶段副本',
    startStageId: 'stage1',
    stages: [
        {
            stageId: 'stage1',
            stageName: '冰封前厅',
            description: '副本第一阶段',
            offsetX: 0,
            offsetY: 0,
            isFinalStage: false,
            portalPosition: { x: 10, y: 10 },
            mapData: {
                ...DUNGEON_FROST_TEMPLE,
                mapName: '冰封前厅',
                spawners: DUNGEON_FROST_TEMPLE.spawners.filter(s => 
                    s.id !== 'spawn_boss'
                ),
                triggers: DUNGEON_FROST_TEMPLE.triggers.filter(t => 
                    t.id !== 'trigger_boss_room_enter' && 
                    t.id !== 'trigger_boss_killed'
                ),
            }
        },
        {
            stageId: 'stage2',
            stageName: 'BOSS房间',
            description: '最终阶段',
            offsetX: 3000,
            offsetY: 0,
            isFinalStage: true,
            mapData: {
                ...DUNGEON_FROST_TEMPLE,
                mapName: 'BOSS房间',
                spawners: DUNGEON_FROST_TEMPLE.spawners.filter(s => 
                    s.id === 'spawn_boss'
                ),
                triggers: [
                    {
                        id: 'trigger_boss_room_enter',
                        x: 15,
                        y: 10,
                        radius: 200,
                        event: 'enter',
                        action: 'spawn_boss',
                        oneTime: true,
                    },
                    {
                        id: 'trigger_boss_killed',
                        x: 17,
                        y: 10,
                        radius: 500,
                        event: 'kill',
                        action: 'dungeon_complete',
                        oneTime: true,
                    },
                ],
            }
        }
    ]
};