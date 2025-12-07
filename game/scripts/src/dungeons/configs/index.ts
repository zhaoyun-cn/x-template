import { DungeonMapData } from '../types';
import { DUNGEON_FROST_TEMPLE } from './dungeon_frost_temple';
import { DUNGEON_TEST_SIMPLE } from './dungeon_test_simple';
import { DUNGEON_MY_DUNGEON } from './dungeon_my_dungeon';
/**
 * 所有副本配置的索引
 */
export const DUNGEON_CONFIGS: Record<string, DungeonMapData> = {
    'frost_temple_01': DUNGEON_FROST_TEMPLE,
    'test_simple': DUNGEON_TEST_SIMPLE,  // 添加测试副本
    'dungeon_my_dungeon': DUNGEON_MY_DUNGEON,
    // 未来可以添加更多副本：
    // 'shadow_maze_01': DUNGEON_SHADOW_MAZE,
    // 'fire_cavern_01': DUNGEON_FIRE_CAVERN,
};

/**
 * 根据ID获取副本配置
 */
export function GetDungeonConfig(dungeonId: string): DungeonMapData | undefined {
    return DUNGEON_CONFIGS[dungeonId];
}

/**
 * 获取所有副本ID列表
 */
export function GetAllDungeonIds(): string[] {
    return Object.keys(DUNGEON_CONFIGS);
}