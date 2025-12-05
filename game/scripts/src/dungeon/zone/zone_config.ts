/**
 * 刷怪区域配置
 */

// ==================== 基础设定 ====================
export const ZONE_CONFIG = {
    // 时间设定
    DURATION: 600,              // 持续时间：10分钟 = 600秒
    SPAWN_INTERVAL: 30,         // 刷怪间隔：30秒
    
    // 怪物数量
    MAX_MONSTERS: 50,           // 场上怪物上限
    
    // 难度递进时间点（秒）
    DIFFICULTY_TIME_1: 180,     // 3分钟
    DIFFICULTY_TIME_2: 360,     // 6分钟
    
    // 难度递进倍率
    DIFFICULTY_MULT_1: 1.2,     // 3-6分钟：1.2x
    DIFFICULTY_MULT_2: 1.5,     // 6-10分钟：1.5x
    
    // 积分触发（测试值）
    ELITE_TRIGGER_SCORE: 10,    // 10分触发精英
    BOSS_TRIGGER_SCORE: 50,     // 50分触发Boss
    
    // 疲劳消耗
    FATIGUE_COST: 8,            // 每次进入消耗8点疲劳
};

// ==================== 怪物积分 ====================
export const MONSTER_SCORE = {
    normal: 1,
    elite: 10,
    boss: 50,
};

// ==================== 多人属性缩放 ====================
export const PARTY_SCALING: Record<number, { health: number; damage: number }> = {
    1: { health: 1.0, damage: 1.0 },
    2: { health: 1.6, damage: 1.2 },
    3: { health: 2.2, damage: 1.4 },
    4: { health: 2.8, damage: 1.6 },
};

// ==================== 群落配置 ====================
export const CLUSTER_CONFIG = {
    small: { min: 3, max: 5 },      // 小群
    medium: { min: 8, max: 12 },    // 中群
    large: { min: 15, max: 20 },    // 大群
};

// ==================== 区域坐标 ====================
export const ZONE_AREA = {
    center: Vector(0, 4000, 128),   // 战斗区域中心点
    halfSize: 2000,                  // 半边长
    z: 128,
};

// 计算区域边界
export const ZONE_BOUNDS = {
    minX: ZONE_AREA.center.x - ZONE_AREA.halfSize,  // -2000
    maxX: ZONE_AREA.center.x + ZONE_AREA.halfSize,  // 2000
    minY: ZONE_AREA. center.y - ZONE_AREA. halfSize,  // 2000
    maxY: ZONE_AREA.center.y + ZONE_AREA.halfSize,  // 6000
};

// 刷怪点（9个点均匀分布在区域内）
export const SPAWN_POINTS: Vector[] = [
    // 第一排
    Vector(ZONE_BOUNDS. minX + 500, ZONE_BOUNDS.minY + 500, ZONE_AREA.z),
    Vector(ZONE_AREA.center.x, ZONE_BOUNDS.minY + 500, ZONE_AREA.z),
    Vector(ZONE_BOUNDS. maxX - 500, ZONE_BOUNDS.minY + 500, ZONE_AREA.z),
    // 第二排
    Vector(ZONE_BOUNDS.minX + 500, ZONE_AREA.center.y, ZONE_AREA.z),
    Vector(ZONE_AREA.center. x, ZONE_AREA.center. y, ZONE_AREA.z),
    Vector(ZONE_BOUNDS. maxX - 500, ZONE_AREA.center.y, ZONE_AREA.z),
    // 第三排
    Vector(ZONE_BOUNDS.minX + 500, ZONE_BOUNDS.maxY - 500, ZONE_AREA. z),
    Vector(ZONE_AREA.center.x, ZONE_BOUNDS.maxY - 500, ZONE_AREA.z),
    Vector(ZONE_BOUNDS.maxX - 500, ZONE_BOUNDS.maxY - 500, ZONE_AREA. z),
];

// 玩家入口点（区域中心）
export const ZONE_ENTRANCE = Vector(ZONE_AREA.center.x, ZONE_AREA.center.y, ZONE_AREA.z);

// 主城传送点
export const TOWN_SPAWN = Vector(0, 0, 128);