/**
 * 副本地图配置 - 区域分离设计
 */

// ==================== 主城区 ====================
export const SPAWN_POINT = Vector(0, 0, 128);

// ==================== 房间1 - 小怪房 ====================
export const ROOM1_ENTRANCE = Vector(0, 3600, 128);     
export const ROOM1_MONSTERS = [
    // 第一排 (4个)
    Vector(-300, 4000, 128),
    Vector(-100, 4000, 128),
    Vector(100, 4000, 128),
    Vector(300, 4000, 128),
    // 第二排 (3个)
    Vector(-200, 4200, 128),
    Vector(0, 4200, 128),
    Vector(200, 4200, 128),
    // 第三排 (3个)
    Vector(-200, 4400, 128),
    Vector(0, 4400, 128),
    Vector(200, 4400, 128)
];  // 共10个小怪

// ==================== 房间2 - 精英房 ====================
export const ROOM2_ENTRANCE = Vector(0, 5600, 128);     
export const ROOM2_MONSTERS = [
    // 第一排 (5个)
    Vector(-400, 6000, 128),
    Vector(-200, 6000, 128),
    Vector(0, 6000, 128),
    Vector(200, 6000, 128),
    Vector(400, 6000, 128),
    // 第二排 (5个)
    Vector(-400, 6200, 128),
    Vector(-200, 6200, 128),
    Vector(0, 6200, 128),
    Vector(200, 6200, 128),
    Vector(400, 6200, 128),
    // 第三排 (5个)
    Vector(-400, 6400, 128),
    Vector(-200, 6400, 128),
    Vector(0, 6400, 128),
    Vector(200, 6400, 128),
    Vector(400, 6400, 128),
    // 第四排 (5个)
    Vector(-400, 6600, 128),
    Vector(-200, 6600, 128),
    Vector(0, 6600, 128),
    Vector(200, 6600, 128),
    Vector(400, 6600, 128)
];  // 共20个精英怪

// ==================== 房间3 - Boss房 ====================
export const ROOM3_ENTRANCE = Vector(0, 7600, 128);      
export const ROOM3_BOSS = [
    Vector(0, 8000, 128)
];  // 1个Boss