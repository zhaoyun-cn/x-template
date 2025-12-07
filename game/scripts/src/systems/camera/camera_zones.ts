// game/scripts/src/systems/camera/camera_zones.ts

export enum CameraZone {
    TOWN = "town",
    BATTLE_ROOM = "battle",
    BOSS_ROOM = "boss"  // 保留用于向后兼容，实际上所有副本都使用 BATTLE_ROOM
}

export interface CameraZoneBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

// ⭐ 更新后的坐标 - 主城 4024x4024，中心点 (0, 0)
export const CAMERA_ZONES: Record<CameraZone, CameraZoneBounds> = {
    [CameraZone.TOWN]: {
        minX: -2012,
        maxX: 2012,
        minY: -2012,
        maxY: 2012
    },
    // 统一的副本区域 - 所有副本都在这个区域构建
    [CameraZone.BATTLE_ROOM]: {
        minX: -2000,
        maxX: 2000,
        minY: 2000,
        maxY: 10000
    },
    // 保留用于向后兼容，但新代码应使用 BATTLE_ROOM
    [CameraZone.BOSS_ROOM]: {
        minX: -2000,
        maxX: 2000,
        minY: 2000,
        maxY: 10000
    }
};

// ⭐ 更新后的出生点坐标
export const TOWN_SPAWN = Vector(0, -896, 128);
export const BATTLE_ROOM_SPAWN = Vector(0, 4500, 256);  // 副本区域中心
export const BOSS_ROOM_SPAWN = Vector(0, 9000, 512);  // 保留用于向后兼容