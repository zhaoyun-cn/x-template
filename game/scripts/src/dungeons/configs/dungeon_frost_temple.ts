import { DungeonMapData } from '../types';

/**
 * 冰霜神殿 - 初级副本
 */
export const DUNGEON_FROST_TEMPLE: DungeonMapData = {
    mapId: 'frost_temple_01',
    mapName: '冰霜神殿',
    width: 20,
    height: 20,
    tileSize: 128,
    
    // 地形数据 - 优化后的墙壁布局
    tiles: [
        // 边界墙壁（左侧留出入口）
        ...generateTopWall(0, 20),           // 上墙
        ...generateBottomWall(0, 20),        // 下墙
        ...generateLeftWall(0, 5, 20),       // 左墙上半部分
        ...generateLeftWall(15, 20, 20),     // 左墙下半部分（中间 5-15 是入口）
        ...generateRightWall(0, 20),         // 右墙
        
        // 房间分隔墙
        ...generateWallLine(6, 0, 6, 5),     // 第一个房间左侧
        ...generateWallLine(6, 15, 6, 20),   // 第一个房间右侧
        ...generateWallLine(15, 0, 15, 5),   // BOSS房间左侧
        ...generateWallLine(15, 15, 15, 20), // BOSS房间右侧
    ],
    
    // 刷怪点
    spawners: [
        // 入口小怪（在入口走廊里）
        {
            id: 'spawn_entrance_01',
            x: 2,
            y: 10,
            unitType: 'npc_dota_neutral_kobold',
            count: 3,
            spawnMode: 'instant',
        },
        
        // 第一个房间
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
        
        // 走廊精英
        {
            id: 'spawn_corridor_elite',
            x: 12,
            y: 10,
            unitType: 'npc_dota_creature_ice_troll',
            count: 1,
            spawnMode: 'trigger',
            triggerCondition: 'trigger_corridor_enter',
        },
        
        // BOSS
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
        {
            id: 'trigger_room1_enter',
            x: 7,
            y: 10,
            radius: 200,
            event: 'enter',
            action: 'spawn_room1',
            oneTime: true,
        },
        {
            id: 'trigger_corridor_enter',
            x: 11,
            y: 10,
            radius: 150,
            event: 'enter',
            action: 'spawn_corridor',
            oneTime: true,
        },
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
    
    // 装饰物
    decorations: [
        // 入口标记（两侧）
        { x: -1, y: 5, model: 'models/props_structures/tower_dragon_blk_dest_lvl3.vmdl', scale: 0.6 },
        { x: -1, y: 15, model: 'models/props_structures/tower_dragon_blk_dest_lvl3.vmdl', scale: 0.6 },
        
        // BOSS房间雕像
        { x: 15, y: 5, model: 'models/props_structures/dire_statue001.vmdl', scale: 0.8 },
        { x: 15, y: 15, model: 'models/props_structures/dire_statue001.vmdl', scale: 0.8 },
        
        // 宝箱
        { x: 17, y: 10, model: 'models/props_gameplay/treasure_chest001.vmdl', scale: 1.2 },
    ],
    
    // 入口点：副本左侧外面（5-15是入口通道）
    entryPoints: [
        { x: -2, y: 10 },
    ],
};

// ===== 辅助函数 =====

/**
 * 生成上墙
 */
function generateTopWall(startX: number, endX: number) {
    const tiles = [];
    for (let x = startX; x < endX; x++) {
        tiles.push({ x, y: 0, type: 'wall' as const });
    }
    return tiles;
}

/**
 * 生成下墙
 */
function generateBottomWall(startX: number, endX: number) {
    const tiles = [];
    for (let x = startX; x < endX; x++) {
        tiles.push({ x, y: 19, type: 'wall' as const });
    }
    return tiles;
}

/**
 * 生成左墙（部分）
 */
function generateLeftWall(startY: number, endY: number, height: number) {
    const tiles = [];
    for (let y = startY; y < endY; y++) {
        tiles.push({ x: 0, y, type: 'wall' as const });
    }
    return tiles;
}

/**
 * 生成右墙
 */
function generateRightWall(startY: number, endY: number) {
    const tiles = [];
    for (let y = startY; y < endY; y++) {
        tiles.push({ x: 19, y, type: 'wall' as const });
    }
    return tiles;
}

/**
 * 生成墙壁线
 */
function generateWallLine(x: number, startY: number, endX: number, endY: number) {
    const tiles = [];
    if (x === endX) {
        // 垂直线
        for (let y = startY; y <= endY; y++) {
            tiles.push({ x, y, type: 'wall' as const });
        }
    } else {
        // 水平线
        for (let nx = x; nx <= endX; nx++) {
            tiles.push({ x: nx, y: startY, type: 'wall' as const });
        }
    }
    return tiles;
}