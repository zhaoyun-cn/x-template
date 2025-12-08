/**
 * 地块类型
 */
export type TileType = 'floor' | 'wall' | 'entrance' | 'exit' | 'special';

/**
 * 地块数据
 */
export interface TileData {
    x: number;
    y: number;
    type: TileType;
}

/**
 * 刷怪点数据
 */
export interface SpawnerData {
    id: string;
    x: number;
    y: number;
    unitType: string;
    count: number;
    spawnMode: 'instant' | 'delayed' | 'trigger' | 'wave' | 'immediate';  // ✅ 添加 'immediate'
    spawnDelay?: number;
    triggerCondition?: string;
}

/**
 * 触发器数据
 */
export interface TriggerData {
    id: string;
    x: number;
    y: number;
    radius: number;
    event: 'enter' | 'kill' | 'interact';
    action: string;
    oneTime: boolean;
}

/**
 * 装饰物数据
 */
export interface DecorationData {
    x: number;
    y: number;
    model: string;
    scale?: number;
    rotation?: number;
}

/**
 * 入口点数据
 */
export interface EntryPointData {
    x: number;
    y: number;
}

/**
 * 副本地图数据
 */
export interface DungeonMapData {
    mapId: string;
    mapName: string;
    description?: string;
    width: number;
    height: number;
    tileSize: number;
    tiles: TileData[];
    spawners: SpawnerData[];
    triggers: TriggerData[];
    decorations: DecorationData[];
    entryPoints?: EntryPointData[];
}

/**
 * 副本实例数据
 */
export interface DungeonInstanceData {
    instanceId: string;
    dungeonId: string;
    createdTime: number;
    playerIds: PlayerID[];
}