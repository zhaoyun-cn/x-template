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

// 你的主城是 5056 x 5056，中心点 (-13856, 13856)
export const CAMERA_ZONES: Record<CameraZone, CameraZoneBounds> = {
    [CameraZone.TOWN]: {
        minX: -16384,
        maxX: -11328,
        minY: 11328,
        maxY: 16384
    },
    [CameraZone.BATTLE_ROOM]: {
        minX: -12900,
        maxX: -11100,
        minY: 5300,
        maxY: 6700
    },
    [CameraZone.BOSS_ROOM]: {
        minX: -13100,
        maxX: -10900,
        minY: 2100,
        maxY: 3900
    }
};

export const TOWN_SPAWN = Vector(-13856, 13856, 128);
export const BATTLE_ROOM_SPAWN = Vector(-12700, 6000, 128);
export const BOSS_ROOM_SPAWN = Vector(-12800, 3000, 128);