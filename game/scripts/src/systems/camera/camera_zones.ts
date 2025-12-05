// game/scripts/src/systems/camera/camera_zones.ts

export enum CameraZone {
    TOWN = "town",
    BATTLE_ROOM = "battle",
    BOSS_ROOM = "boss"
}

export interface CameraZoneBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

// ⭐ 更新后的坐标 - 主城 5024x5024，中心点 (0, 0)
export const CAMERA_ZONES: Record<CameraZone, CameraZoneBounds> = {
    [CameraZone. TOWN]: {
        minX: -2512,
        maxX: 2512,
        minY: -2512,
        maxY: 2512
    },
    [CameraZone.BATTLE_ROOM]: {
        minX: -1500,
        maxX: 1500,
        minY: 2000,
        maxY: 7000
    },
    [CameraZone.BOSS_ROOM]: {
        minX: -1500,
        maxX: 1500,
        minY: 8000,
        maxY: 10000
    }
};

// ⭐ 更新后的出生点坐标
export const TOWN_SPAWN = Vector(0, -896, 192);
export const BATTLE_ROOM_SPAWN = Vector(0, 3000, 256);
export const BOSS_ROOM_SPAWN = Vector(0, 9000, 512);