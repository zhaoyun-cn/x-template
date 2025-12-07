import { DungeonMapData } from '../types';

/**
 * 简单测试副本 - 只有怪物，没有复杂地形
 */
export const DUNGEON_TEST_SIMPLE: DungeonMapData = {
    mapId: 'test_simple',
    mapName: '测试副本',
    description: '用于测试的简单副本地图，仅包含基础战斗', // 新增
    width: 10,
    height: 10,
    tileSize: 128,
    
    // 暂时不生成地形
    tiles: [],
    
    // 只在入口刷几只怪物
    spawners: [
        {
            id: 'test_spawn_01',
            x: 5,
            y: 5,
            unitType: 'npc_dota_hero_axe',  // 使用斧王（肯定存在）
            count: 3,
            spawnMode: 'instant',
        },
    ],
    
    // 没有触发器
    triggers: [],
    
    // 入口点：副本左侧外面
    entryPoints: [
        { x: -2, y: 5 },
    ],
};