import { RoguelikeDungeonConfig, RoomType, RoomGoalType } from '../types_roguelike';

/**
 * Roguelike测试副本配置
 */
export const ROGUELIKE_TEST_CONFIG: RoguelikeDungeonConfig = {
    dungeonId: 'roguelike_test',
    dungeonName: 'Roguelike测试副本',
    description: '包含积分、清怪、生存和Boss房间的完整Roguelike体验',
    mapName: 'Roguelike测试副本', // 兼容旧的副本列表UI，使用mapName字段显示名称
    
    startRoomId: 'room_1_score',
    
    rooms: new Map([
        ['room_1_score', {
            roomId: 'room_1_score',
            roomName: '初始挑战',
            roomType: RoomType.SCORE,
            goalType: RoomGoalType.REACH_SCORE,
            requiredScore: 50,
            
            mapData: {
                mapId: 'room_1',
                mapName: '初始房间',
                width: 20,
                height: 20,
                tileSize: 128,
                tiles: [
                    // 简单的方形房间
                    { x: 5, y: 5, type: 'floor' },
                    { x: 6, y: 5, type: 'floor' },
                    { x: 7, y: 5, type: 'floor' },
                    { x: 8, y: 5, type: 'floor' },
                    { x: 9, y: 5, type: 'floor' },
                    { x: 5, y: 6, type: 'floor' },
                    { x: 6, y: 6, type: 'floor' },
                    { x: 7, y: 6, type: 'floor' },
                    { x: 8, y: 6, type: 'floor' },
                    { x: 9, y: 6, type: 'floor' },
                    { x: 5, y: 7, type: 'floor' },
                    { x: 6, y: 7, type: 'floor' },
                    { x: 7, y: 7, type: 'floor' },
                    { x: 8, y: 7, type: 'floor' },
                    { x: 9, y: 7, type: 'floor' },
                    { x: 5, y: 8, type: 'floor' },
                    { x: 6, y: 8, type: 'floor' },
                    { x: 7, y: 8, type: 'floor' },
                    { x: 8, y: 8, type: 'floor' },
                    { x: 9, y: 8, type: 'floor' },
                    { x: 5, y: 9, type: 'floor' },
                    { x: 6, y: 9, type: 'floor' },
                    { x: 7, y: 9, type: 'floor' },
                    { x: 8, y: 9, type: 'floor' },
                    { x: 9, y: 9, type: 'floor' },
                ],
                spawners: [
                    {
                        id: 'spawner_1',
                        x: 6,
                        y: 6,
                        unitType: 'npc_dota_creep_badguys_melee',
                        count: 3,
                        spawnMode: 'trigger'
                    },
                    {
                        id: 'spawner_2',
                        x: 8,
                        y: 8,
                        unitType: 'npc_dota_creep_badguys_ranged',
                        count: 2,
                        spawnMode: 'trigger'
                    }
                ],
                triggers: [],
                decorations: [],
                entryPoints: [{ x: 7, y: 5 }]
            },
            
            spawnConfig: {
                spawnInterval: 10,
                maxMonsters: 15
            },
            
            scoreConfig: {
                normalKill: 5,
                eliteKill: 15,
                bossKill: 50
            },
            
            nextRooms: ['room_2a_clear', 'room_2b_survival']
        }],
        ['room_2a_clear', {
            roomId: 'room_2a_clear',
            roomName: '剿灭战',
            roomType: RoomType.CLEAR,
            goalType: RoomGoalType.KILL_ALL,
            
            mapData: {
                mapId: 'room_2a',
                mapName: '清怪房间',
                width: 20,
                height: 20,
                tileSize: 128,
                tiles: [
                    { x: 4, y: 4, type: 'floor' },
                    { x: 5, y: 4, type: 'floor' },
                    { x: 6, y: 4, type: 'floor' },
                    { x: 7, y: 4, type: 'floor' },
                    { x: 8, y: 4, type: 'floor' },
                    { x: 9, y: 4, type: 'floor' },
                    { x: 10, y: 4, type: 'floor' },
                    { x: 4, y: 5, type: 'floor' },
                    { x: 5, y: 5, type: 'floor' },
                    { x: 6, y: 5, type: 'floor' },
                    { x: 7, y: 5, type: 'floor' },
                    { x: 8, y: 5, type: 'floor' },
                    { x: 9, y: 5, type: 'floor' },
                    { x: 10, y: 5, type: 'floor' },
                    { x: 4, y: 6, type: 'floor' },
                    { x: 5, y: 6, type: 'floor' },
                    { x: 6, y: 6, type: 'floor' },
                    { x: 7, y: 6, type: 'floor' },
                    { x: 8, y: 6, type: 'floor' },
                    { x: 9, y: 6, type: 'floor' },
                    { x: 10, y: 6, type: 'floor' },
                    { x: 4, y: 7, type: 'floor' },
                    { x: 5, y: 7, type: 'floor' },
                    { x: 6, y: 7, type: 'floor' },
                    { x: 7, y: 7, type: 'floor' },
                    { x: 8, y: 7, type: 'floor' },
                    { x: 9, y: 7, type: 'floor' },
                    { x: 10, y: 7, type: 'floor' },
                    { x: 4, y: 8, type: 'floor' },
                    { x: 5, y: 8, type: 'floor' },
                    { x: 6, y: 8, type: 'floor' },
                    { x: 7, y: 8, type: 'floor' },
                    { x: 8, y: 8, type: 'floor' },
                    { x: 9, y: 8, type: 'floor' },
                    { x: 10, y: 8, type: 'floor' },
                    { x: 4, y: 9, type: 'floor' },
                    { x: 5, y: 9, type: 'floor' },
                    { x: 6, y: 9, type: 'floor' },
                    { x: 7, y: 9, type: 'floor' },
                    { x: 8, y: 9, type: 'floor' },
                    { x: 9, y: 9, type: 'floor' },
                    { x: 10, y: 9, type: 'floor' },
                    { x: 4, y: 10, type: 'floor' },
                    { x: 5, y: 10, type: 'floor' },
                    { x: 6, y: 10, type: 'floor' },
                    { x: 7, y: 10, type: 'floor' },
                    { x: 8, y: 10, type: 'floor' },
                    { x: 9, y: 10, type: 'floor' },
                    { x: 10, y: 10, type: 'floor' },
                ],
                spawners: [
                    {
                        id: 'spawner_1',
                        x: 5,
                        y: 5,
                        unitType: 'npc_dota_creep_badguys_melee',
                        count: 5,
                        spawnMode: 'trigger'
                    },
                    {
                        id: 'spawner_2',
                        x: 9,
                        y: 9,
                        unitType: 'npc_dota_creep_badguys_ranged',
                        count: 3,
                        spawnMode: 'trigger'
                    }
                ],
                triggers: [],
                decorations: [],
                entryPoints: [{ x: 7, y: 4 }]
            },
            
            nextRooms: ['room_3_boss']
        }],
        ['room_2b_survival', {
            roomId: 'room_2b_survival',
            roomName: '生存挑战',
            roomType: RoomType.SURVIVAL,
            goalType: RoomGoalType.SURVIVE_TIME,
            
            mapData: {
                mapId: 'room_2b',
                mapName: '生存房间',
                width: 20,
                height: 20,
                tileSize: 128,
                tiles: [
                    { x: 6, y: 6, type: 'floor' },
                    { x: 7, y: 6, type: 'floor' },
                    { x: 8, y: 6, type: 'floor' },
                    { x: 6, y: 7, type: 'floor' },
                    { x: 7, y: 7, type: 'floor' },
                    { x: 8, y: 7, type: 'floor' },
                    { x: 6, y: 8, type: 'floor' },
                    { x: 7, y: 8, type: 'floor' },
                    { x: 8, y: 8, type: 'floor' },
                ],
                spawners: [
                    {
                        id: 'spawner_1',
                        x: 6,
                        y: 6,
                        unitType: 'npc_dota_creep_badguys_melee',
                        count: 2,
                        spawnMode: 'trigger'
                    }
                ],
                triggers: [],
                decorations: [],
                entryPoints: [{ x: 7, y: 7 }]
            },
            
            survivalConfig: {
                duration: 30
            },
            
            spawnConfig: {
                spawnInterval: 5,
                maxMonsters: 10
            },
            
            nextRooms: ['room_3_boss']
        }],
        [// Boss房间
'room_3_boss', {
    roomId: 'room_3_boss',
    roomName: 'Boss战',
    roomType: RoomType.BOSS,
    goalType: RoomGoalType.DEFEAT_BOSS,
    
    mapData: {
        mapId: 'room_3',
        mapName: 'Boss房间',
        width: 20,
        height: 20,
        tileSize: 128,
        tiles: [
            { x: 3, y: 3, type:  'floor' },
            { x: 4, y: 3, type:  'floor' },
            { x: 5, y: 3, type: 'floor' },
            { x: 6, y: 3, type:  'floor' },
            { x: 7, y: 3, type: 'floor' },
            { x: 8, y: 3, type:  'floor' },
            { x: 9, y: 3, type: 'floor' },
            { x: 10, y: 3, type:  'floor' },
            { x: 11, y: 3, type: 'floor' },
            { x: 3, y: 4, type:  'floor' },
            { x: 4, y: 4, type: 'floor' },
            { x: 5, y:  4, type: 'floor' },
            { x: 6, y: 4, type: 'floor' },
            { x: 7, y:  4, type: 'floor' },
            { x: 8, y: 4, type: 'floor' },
            { x: 9, y:  4, type: 'floor' },
            { x: 10, y: 4, type: 'floor' },
            { x: 11, y:  4, type: 'floor' },
            { x: 3, y: 5, type: 'floor' },
            { x: 4, y:  5, type: 'floor' },
            { x: 5, y: 5, type: 'floor' },
            { x: 6, y:  5, type: 'floor' },
            { x: 7, y: 5, type: 'floor' },
            { x: 8, y:  5, type: 'floor' },
            { x: 9, y: 5, type: 'floor' },
            { x: 10, y:  5, type: 'floor' },
            { x: 11, y: 5, type: 'floor' },
            { x: 3, y:  6, type: 'floor' },
            { x: 4, y: 6, type: 'floor' },
            { x: 5, y:  6, type: 'floor' },
            { x: 6, y: 6, type: 'floor' },
            { x: 7, y:  6, type: 'floor' },
            { x: 8, y: 6, type: 'floor' },
            { x: 9, y:  6, type: 'floor' },
            { x: 10, y: 6, type: 'floor' },
            { x: 11, y:  6, type: 'floor' },
            { x: 3, y: 7, type: 'floor' },
            { x: 4, y:  7, type: 'floor' },
            { x: 5, y: 7, type: 'floor' },
            { x: 6, y:  7, type: 'floor' },
            { x: 7, y: 7, type: 'floor' },
            { x: 8, y:  7, type: 'floor' },
            { x: 9, y: 7, type: 'floor' },
            { x: 10, y:  7, type: 'floor' },
            { x: 11, y: 7, type: 'floor' },
            { x: 3, y:  8, type: 'floor' },
            { x: 4, y: 8, type: 'floor' },
            { x: 5, y:  8, type: 'floor' },
            { x: 6, y: 8, type: 'floor' },
            { x: 7, y:  8, type: 'floor' },
            { x: 8, y: 8, type: 'floor' },
            { x: 9, y:  8, type: 'floor' },
            { x: 10, y: 8, type: 'floor' },
            { x: 11, y:  8, type: 'floor' },
            { x: 3, y: 9, type: 'floor' },
            { x: 4, y:  9, type: 'floor' },
            { x: 5, y: 9, type: 'floor' },
            { x: 6, y:  9, type: 'floor' },
            { x: 7, y: 9, type: 'floor' },
            { x: 8, y:  9, type: 'floor' },
            { x: 9, y: 9, type: 'floor' },
            { x: 10, y:  9, type: 'floor' },
            { x: 11, y: 9, type: 'floor' },
            { x: 3, y:  10, type: 'floor' },
            { x: 4, y: 10, type: 'floor' },
            { x: 5, y:  10, type: 'floor' },
            { x: 6, y: 10, type: 'floor' },
            { x: 7, y:  10, type: 'floor' },
            { x: 8, y: 10, type: 'floor' },
            { x: 9, y:  10, type: 'floor' },
            { x: 10, y: 10, type: 'floor' },
            { x: 11, y:  10, type: 'floor' },
            { x: 3, y: 11, type: 'floor' },
            { x: 4, y:  11, type: 'floor' },
            { x: 5, y: 11, type: 'floor' },
            { x: 6, y:  11, type: 'floor' },
            { x: 7, y: 11, type: 'floor' },
            { x: 8, y:  11, type: 'floor' },
            { x: 9, y: 11, type: 'floor' },
            { x: 10, y:  11, type: 'floor' },
            { x: 11, y: 11, type: 'floor' },
        ],
        spawners: [
            {
                id: 'boss_spawner',
                x: 7,
                y: 7,
                unitType: 'shadow_fiend_boss',  // 🔧 使用特殊标识符
                count: 1,
                spawnMode: 'trigger'
            }
        ],
        triggers: [],
        decorations: [],
        entryPoints: [{ x: 7, y: 3 }]
    },
    
    nextRooms: [],
    isFinalRoom: true
}]
    ]),
    
    rewardConfig: {
        baseReward: 100,
        perRoomBonus: 50,
        bossReward: 200,
        perfectClearBonus: 100,
        perKillBonus: 5
    }
};
