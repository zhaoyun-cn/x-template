import { DungeonMapData } from '../types';
import { DUNGEON_FROST_TEMPLE } from './dungeon_frost_temple';
import { DUNGEON_TEST_SIMPLE } from './dungeon_test_simple';
import { DUNGEON_MY_DUNGEON } from './dungeon_my_dungeon';

/**
 * 所有副本配置的索引
 */
export const DUNGEON_CONFIGS: Record<string, DungeonMapData> = {
    'frost_temple': DUNGEON_FROST_TEMPLE,
    'test_simple': DUNGEON_TEST_SIMPLE,
    'my_dungeon': DUNGEON_MY_DUNGEON,
    // 未来可以添加更多副本：
    // 'shadow_maze': DUNGEON_SHADOW_MAZE,
    // 'fire_cavern': DUNGEON_FIRE_CAVERN,
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

/**
 * 获取所有副本配置列表（用于UI显示）
 */
export function GetAllDungeonConfigs(): Array<{ id: string; config: DungeonMapData }> {
    return Object.entries(DUNGEON_CONFIGS).map(([id, config]) => ({
        id,
        config
    }));
}