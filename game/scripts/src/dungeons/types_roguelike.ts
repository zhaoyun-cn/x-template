import { DungeonMapData } from './types';

/**
 * 房间类型
 */
export enum RoomType {
    SCORE = 'score',           // 积分模式
    CLEAR = 'clear',           // 清怪模式
    SURVIVAL = 'survival',     // 生存模式
    BOSS = 'boss'              // Boss模式
}

/**
 * 房间目标类型
 */
export enum RoomGoalType {
    REACH_SCORE = 'reach_score',       // 达到指定分数
    KILL_ALL = 'kill_all',             // 击杀所有怪物
    SURVIVE_TIME = 'survive_time',     // 存活指定时间
    DEFEAT_BOSS = 'defeat_boss'        // 击败Boss
}

/**
 * 刷怪配置
 */
export interface SpawnConfig {
    spawnInterval: number;      // 刷怪间隔（秒）
    maxMonsters: number;        // 最大怪物数量
}

/**
 * 积分配置
 */
export interface ScoreConfig {
    normalKill: number;         // 普通怪击杀积分
    eliteKill: number;          // 精英怪击杀积分
    bossKill: number;           // Boss击杀积分
}

/**
 * 生存配置
 */
export interface SurvivalConfig {
    duration: number;           // 存活时间（秒）
}

/**
 * 房间配置
 */
export interface RoomConfig {
    roomId: string;
    roomName: string;
    roomType: RoomType;
    goalType: RoomGoalType;
    
    // 地图数据
    mapData: DungeonMapData;
    
    // 积分模式配置
    requiredScore?: number;
    spawnConfig?: SpawnConfig;
    scoreConfig?: ScoreConfig;
    
    // 生存模式配置
    survivalConfig?: SurvivalConfig;
    
    // 下一个房间ID列表（分支选择）
    nextRooms?: string[];
    
    // 是否是最终房间
    isFinalRoom?: boolean;
}

/**
 * 奖励配置
 */
export interface RewardConfig {
    baseReward: number;         // 基础奖励
    perRoomBonus: number;       // 每房间奖励
    bossReward: number;         // Boss奖励
    perfectClearBonus: number;  // 完美通关奖励（0死亡）
    perKillBonus?: number;      // 每击杀奖励
}

/**
 * Roguelike副本配置
 */
export interface RoguelikeDungeonConfig {
    dungeonId: string;
    dungeonName: string;
    description: string;
    
    // 房间配置
    rooms: Map<string, RoomConfig>;
    startRoomId: string;
    
    // 奖励配置
    rewardConfig: RewardConfig;
    
    // 兼容性字段
    mapName?: string;
}

/**
 * 房间状态
 */
export enum RoomState {
    INACTIVE = 'inactive',
    PREPARING = 'preparing',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

/**
 * 副本统计
 */
export interface DungeonStats {
    totalKills: number;         // 总击杀数
    totalDeaths: number;        // 总死亡数
    roomsCompleted: number;     // 完成房间数
    totalScore: number;         // 总积分
    startTime: number;          // 开始时间
    endTime?: number;           // 结束时间
}
