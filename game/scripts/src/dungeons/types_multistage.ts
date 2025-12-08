import { DungeonMapData } from './types';

/**
 * 副本阶段配置
 */
export interface DungeonStageConfig {
    stageId: string;                    // 阶段ID
    stageName: string;                   // 阶段名称
    description: string;                 // 描述
    mapData: DungeonMapData;            // 地图数据
    offsetX: number;                     // X轴偏移（相对副本中心）
    offsetY: number;                     // Y轴偏移
    isFinalStage: boolean;              // 是否最终阶段
    portalPosition?: { x: number, y: number };  // 传送门位置（格子坐标）
}

/**
 * 多阶段副本配置
 */
export interface MultiStageDungeonConfig {
    dungeonId: string;
    dungeonName: string;
    description: string;
    startStageId: string;               // 起始阶段
    stages: DungeonStageConfig[];       // 所有阶段
    mapName?: string;                    // 兼容旧系统
}