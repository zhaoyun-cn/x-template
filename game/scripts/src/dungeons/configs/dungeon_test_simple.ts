import { DungeonMapData } from '../types';

/**
 * 简单测试副本 - 只有怪物，没有复杂地形
 */
export const DUNGEON_TEST_SIMPLE: DungeonMapData = {
    mapId: 'test_simple',
    mapName: '测试副本',
    description: '用于测试的简单副本地图，仅包含基础战斗',
    width: 20,
    height: 20,
    tileSize: 128,
    
    // 地块（全部为地板）
    tiles: [],
    
    // 刷怪点
    spawners: [
        {
            id: 'spawn_test_1',
            x: 10,
            y: 5,
            unitType: 'npc_dota_neutral_kobold',
            count: 3,
            spawnMode: 'instant',
        },
        {
            id: 'spawn_test_2',
            x: 10,
            y: 15,
            unitType: 'npc_dota_neutral_kobold',
            count: 3,
            spawnMode: 'instant',
        },
    ],
    
    // 触发器
    triggers: [],
    
    // ✅ 添加这一行
    decorations: [],
    
    // 入口点
    entryPoints: [
        { x: 10, y: 2 },
    ],
};