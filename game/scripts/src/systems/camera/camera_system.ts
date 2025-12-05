// game/scripts/src/systems/camera/camera_system.ts

import {
    CameraZone,
    CameraZoneBounds,
    CAMERA_ZONES,
    TOWN_SPAWN,
    BATTLE_ROOM_SPAWN,
    BOSS_ROOM_SPAWN
} from "./camera_zones";

declare global {
    interface CustomGameEventDeclarations {
        camera_fade_out: { duration: number };
        camera_fade_in: { duration: number };
        camera_pan_to: { x: number; y: number };
        camera_set_zone: { zone: string; bounds: CameraZoneBounds };
    }
}

export class CameraSystem {
    private static playerZones: Map<PlayerID, CameraZone> = new Map();
    private static isInitialized: boolean = false;

    public static Initialize(): void {
        if (this.isInitialized) {
            print("[CameraSystem] 已经初始化过了，跳过");
            return;
        }

        ListenToGameEvent("player_connect_full", (event) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[CameraSystem] 玩家 ${playerId} 连接`);

            Timers.CreateTimer(1.0, () => {
                this.OnPlayerReady(playerId);
                return undefined;
            });
        }, undefined);

        ListenToGameEvent("npc_spawned", (event) => {
            const unit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
            if (unit && unit.IsRealHero()) {
                const hero = unit as CDOTA_BaseNPC_Hero;
                const playerId = hero.GetPlayerID();

                if (!this.playerZones.has(playerId)) {
                    Timers.CreateTimer(0.5, () => {
                        this.OnPlayerReady(playerId);
                        return undefined;
                    });
                }
            }
        }, undefined);

        this.isInitialized = true;
        print("[CameraSystem] ✅ 初始化完成");
    }

    private static OnPlayerReady(playerId: PlayerID): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print(`[CameraSystem] 玩家 ${playerId} 还没有英雄，跳过`);
            return;
        }

        this.SetZone(playerId, CameraZone.TOWN);
        this.SnapCameraToHero(playerId);

        print(`[CameraSystem] 玩家 ${playerId} 初始化完成，区域: TOWN`);
    }

    public static SetZone(playerId: PlayerID, zone: CameraZone): void {
        this.playerZones.set(playerId, zone);

        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            const bounds = CAMERA_ZONES[zone];
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                "camera_set_zone",
                { zone: zone, bounds: bounds }
            );
        }

        print(`[CameraSystem] 玩家 ${playerId} 区域设置为: ${zone}`);
    }

    public static GetZone(playerId: PlayerID): CameraZone {
        return this.playerZones.get(playerId) || CameraZone.TOWN;
    }

    public static SnapCameraToHero(playerId: PlayerID): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;

        PlayerResource.SetCameraTarget(playerId, hero);

        Timers.CreateTimer(0.1, () => {
            PlayerResource.SetCameraTarget(playerId, undefined);
            return undefined;
        });
    }

    public static TransitionToZone(
        playerId: PlayerID,
        newZone: CameraZone,
        teleportPosition: Vector,
        onBlackScreen?: () => void
    ): void {
        const player = PlayerResource.GetPlayer(playerId);
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);

        if (! player || !hero) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            "camera_fade_out",
            { duration: 0.3 }
        );

        Timers.CreateTimer(0.3, () => {
            FindClearSpaceForUnit(hero, teleportPosition, true);
            this.SetZone(playerId, newZone);
            this.SnapCameraToHero(playerId);

            if (onBlackScreen) {
                onBlackScreen();
            }

            return undefined;
        });

        Timers.CreateTimer(0.5, () => {
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                "camera_fade_in",
                { duration: 0.3 }
            );
            return undefined;
        });
    }

    public static EnterDungeon(playerId: PlayerID, spawnPosition: Vector, onReady?: () => void): void {
        this.TransitionToZone(playerId, CameraZone.BATTLE_ROOM, spawnPosition, onReady);
    }

    public static EnterBossRoom(playerId: PlayerID, spawnPosition: Vector, onReady?: () => void): void {
        this.TransitionToZone(playerId, CameraZone.BOSS_ROOM, spawnPosition, onReady);
    }

    public static ReturnToTown(playerId: PlayerID, spawnPosition?: Vector): void {
        const spawn = spawnPosition || TOWN_SPAWN;
        this.TransitionToZone(playerId, CameraZone.TOWN, spawn);
    }

    public static RegisterDebugCommands(): void {
        // -pos 命令
        Convars.RegisterCommand("pos", () => {
            const player = Convars.GetCommandClient();
            if (player) {
                const playerId = player.GetPlayerID();
                const hero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (hero) {
                    const pos = hero.GetAbsOrigin();
                    const msg = `位置: (${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)})`;
                    print(`[CameraSystem] ${msg}`);
                    GameRules.SendCustomMessage(`<font color='#00FF00'>${msg}</font>`, playerId, 0);
                }
            }
        }, "显示当前位置", 0);

        // -cam_town 命令
        Convars.RegisterCommand("cam_town", () => {
            const player = Convars.GetCommandClient();
            if (player) {
                const playerId = player.GetPlayerID();
                this.ReturnToTown(playerId);
                print(`[CameraSystem] 调试: 切换到主城`);
            }
        }, "切换到主城", 0);

        // -cam_battle 命令
        Convars.RegisterCommand("cam_battle", () => {
            const player = Convars.GetCommandClient();
            if (player) {
                const playerId = player.GetPlayerID();
                this.TransitionToZone(playerId, CameraZone.BATTLE_ROOM, BATTLE_ROOM_SPAWN);
                print(`[CameraSystem] 调试: 切换到战斗房`);
            }
        }, "切换到战斗房", 0);

        // -cam_boss 命令
        Convars.RegisterCommand("cam_boss", () => {
            const player = Convars.GetCommandClient();
            if (player) {
                const playerId = player.GetPlayerID();
                this.TransitionToZone(playerId, CameraZone.BOSS_ROOM, BOSS_ROOM_SPAWN);
                print(`[CameraSystem] 调试: 切换到Boss房`);
            }
        }, "切换到Boss房", 0);

        // -cam_info 命令
        Convars.RegisterCommand("cam_info", () => {
            const player = Convars.GetCommandClient();
            if (player) {
                const playerId = player.GetPlayerID();
                const zone = this.GetZone(playerId);
                const bounds = CAMERA_ZONES[zone];
                print(`[CameraSystem] 当前区域: ${zone}`);
                print(`[CameraSystem] 边界: X(${bounds.minX} ~ ${bounds.maxX}), Y(${bounds.minY} ~ ${bounds.maxY})`);
                GameRules.SendCustomMessage(
                    `<font color='#00FF00'>区域: ${zone}</font>`,
                    playerId,
                    0
                );
            }
        }, "显示摄像机信息", 0);

        print("[CameraSystem] 调试命令已注册: pos, cam_town, cam_battle, cam_boss, cam_info");
    }
}