/**
 * 地块类型
 */
export type TileType = 'floor' | 'wall' | 'water' | 'cliff' | 'lava' | 'ice';

/**
 * 地块数据
 */
export interface TileData {
    x: number;              // 网格X坐标
    y: number;              // 网格Y坐标
    type: TileType;         // 地块类型
    height?: number;        // 高度（可选）
}

/**
 * 刷怪点数据
 */
export interface SpawnerData {
    id: string;             // 唯一标识
    x: number;              // 网格X坐标
    y: number;              // 网格Y坐标
    unitType: string;       // 单位类型（DOTA2单位名）
    count: number;          // 刷怪数量
    spawnDelay?: number;    // 刷怪延迟（秒）
    spawnMode?: 'instant' | 'delayed' | 'trigger' | 'wave';  // 刷怪模式
    triggerCondition?: string;  // 触发条件ID
}

/**
 * 触发器事件类型
 */
export type TriggerEvent = 'enter' | 'kill' | 'interact' | 'timer';

/**
 * 触发器数据
 */
export interface TriggerData {
    id: string;             // 唯一标识
    x: number;              // 网格X坐标
    y: number;              // 网格Y坐标
    radius: number;         // 触发半径
    event: TriggerEvent;    // 触发事件
    action: string;         // 触发动作
    oneTime?: boolean;      // 是否只触发一次
}

/**
 * 装饰物数据
 */
export interface DecorationData {
    x: number;              // 网格X坐标
    y: number;              // 网格Y坐标
    model: string;          // 模型路径
    scale?: number;         // 缩放
    rotation?: number;      // 旋转角度
}

/**
 * 副本地图数据
 */
export interface DungeonMapData {
    mapId: string;          // 地图ID
    mapName: string;        // 地图名称
    width: number;          // 地图宽度（格子数）
    height: number;         // 地图高度（格子数）
    tileSize: number;       // 单个格子大小（DOTA2单位）
    tiles: TileData[];      // 地块数据
    spawners: SpawnerData[];    // 刷怪点数据
    triggers: TriggerData[];    // 触发器数据
    decorations?: DecorationData[];  // 装饰物数据（可选）
}