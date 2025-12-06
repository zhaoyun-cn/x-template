import { DungeonMapData } from '../types';

/**
 * 冰霜神殿 - 初级副本
 * 
 * 设计思路：
 * - 这是一个10x10的小型副本
 * - 玩家从左下角进入
 * - 路上有3波小怪
 * - 中央房间有BOSS
 * - 击败BOSS后触发宝箱
 */
export const DUNGEON_FROST_TEMPLE: DungeonMapData = {
    mapId: 'frost_temple_01',
    mapName: '冰霜神殿',
    width: 20,
    height: 20,
    tileSize: 128,  // DOTA2中每格128单位
    
    // 地形数据
    tiles: [
        // 入口走廊（0-5行）
        ...generateFloorTiles(0, 0, 5, 20),
        
        // 第一个房间（6-10行）
        ...generateRoomTiles(6, 5, 10, 15),
        
        // 走廊
        ...generateFloorTiles(11, 9, 14, 11),
        
        // BOSS房间（15-20行）
        ...generateRoomTiles(15, 3, 20, 17),
        
        // 墙壁（边界）
        ...generateWallBorder(0, 0, 20, 20),
    ],
    
    // 刷怪点
    spawners: [
        // 第一波：入口的狗头人
        {
            id: 'spawn_entrance_01',
            x: 2,
            y: 10,
            unitType: 'npc_dota_creature_kobold',
            count: 3,
            spawnDelay: 2,
            spawnMode: 'instant',
        },
        
        // 第二波：第一个房间的冰霜萨满
        {
            id: 'spawn_room1_01',
            x: 8,
            y: 8,
            unitType: 'npc_dota_neutral_ice_shaman',
            count: 2,
            spawnMode: 'trigger',
            triggerCondition: 'trigger_room1_enter',
        },
        {
            id: 'spawn_room1_02',
            x: 8,
            y: 12,
            unitType: 'npc_dota_neutral_ice_shaman',
            count: 2,
            spawnMode: 'trigger',
            triggerCondition: 'trigger_room1_enter',
        },
        
        // 第三波：走廊的精英怪
        {
            id: 'spawn_corridor_elite',
            x: 12,
            y: 10,
            unitType: 'npc_dota_creature_ice_troll',
            count: 1,
            spawnMode: 'trigger',
            triggerCondition: 'trigger_corridor_enter',
        },
        
        // BOSS：中央房间
        {
            id: 'spawn_boss',
            x: 17,
            y: 10,
            unitType: 'npc_dota_neutral_black_dragon',
            count: 1,
            spawnMode: 'trigger',
            triggerCondition: 'trigger_boss_room_enter',
        },
    ],
    
    // 触发器
    triggers: [
        // 进入第一个房间
        {
            id: 'trigger_room1_enter',
            x: 7,
            y: 10,
            radius: 200,
            event: 'enter',
            action: 'spawn_room1',
            oneTime: true,
        },
        
        // 进入走廊
        {
            id: 'trigger_corridor_enter',
            x: 11,
            y: 10,
            radius: 150,
            event: 'enter',
            action: 'spawn_corridor',
            oneTime: true,
        },
        
        // 进入BOSS房间
        {
            id: 'trigger_boss_room_enter',
            x: 15,
            y: 10,
            radius: 200,
            event: 'enter',
            action: 'spawn_boss',
            oneTime: true,
        },
        
        // 击败BOSS
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
    
    // 装饰物
    decorations: [
        // 入口的冰柱
        { x: 1, y: 5, model: 'models/props_gameplay/ice_column.vmdl', scale: 1.5 },
        { x: 1, y: 15, model: 'models/props_gameplay/ice_column.vmdl', scale: 1.5 },
        
        // BOSS房间的雕像
        { x: 15, y: 5, model: 'models/props_structures/dire_statue001.vmdl', scale: 1.0 },
        { x: 15, y: 15, model: 'models/props_structures/dire_statue001.vmdl', scale: 1.0 },
    ],
};

// ===== 辅助函数：快速生成地块 =====

/**
 * 生成地板区域
 */
function generateFloorTiles(startX: number, startY: number, endX: number, endY: number) {
    const tiles = [];
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            tiles.push({ x, y, type: 'floor' as const });
        }
    }
    return tiles;
}

/**
 * 生成房间（包含墙壁）
 */
function generateRoomTiles(startX: number, startY: number, endX: number, endY: number) {
    const tiles = [];
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            // 边界是墙壁
            if (x === startX || x === endX - 1 || y === startY || y === endY - 1) {
                tiles.push({ x, y, type: 'wall' as const });
            } else {
                tiles.push({ x, y, type: 'floor' as const });
            }
        }
    }
    return tiles;
}

/**
 * 生成边界墙壁
 */
function generateWallBorder(startX: number, startY: number, endX: number, endY: number) {
    const tiles = [];
    for (let x = startX; x < endX; x++) {
        tiles.push({ x, y: startY, type: 'wall' as const });
        tiles.push({ x, y: endY - 1, type: 'wall' as const });
    }
    for (let y = startY; y < endY; y++) {
        tiles.push({ x: startX, y, type: 'wall' as const });
        tiles.push({ x: endX - 1, y, type: 'wall' as const });
    }
    return tiles;
}