import { CameraZone, CAMERA_ZONES, TOWN_SPAWN, BATTLE_ROOM_SPAWN, BOSS_ROOM_SPAWN } from "./camera_zones";

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

                if (! this.playerZones.has(playerId)) {
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
            // ⭐ 使用 as never 来绕过类型检查
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                "camera_set_zone" as never,
                { 
                    zone: zone, 
                    bounds: {
                        minX: bounds.minX,
                        maxX: bounds.maxX,
                        minY: bounds.minY,
                        maxY: bounds.maxY
                    }
                } as never
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

        if (!player || !hero) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            "camera_fade_out" as never,
            { duration: 0.3 } as never
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
                "camera_fade_in" as never,
                { duration: 0.3 } as never
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

    // ==================== 聊天命令（用 - 前缀）====================
    
    public static RegisterChatCommands(): void {
        // 监听玩家聊天
        ListenToGameEvent("player_chat", (event) => {
            const text = event.text.toLowerCase().trim();
            const playerId = event.playerid as PlayerID;
            
            // -pos 显示位置
            if (text === "-pos") {
                const hero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (hero) {
                    const pos = hero.GetAbsOrigin();
                    const msg = `位置: (${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)})`;
                    print(`[CameraSystem] ${msg}`);
                    GameRules.SendCustomMessage(`<font color='#00FF00'>${msg}</font>`, playerId, 0);
                }
            }
            
            // -cam_town 切换到主城
            else if (text === "-cam_town") {
                this.ReturnToTown(playerId);
                print(`[CameraSystem] 玩家 ${playerId} 切换到主城`);
                GameRules.SendCustomMessage(`<font color='#00FF00'>传送到主城</font>`, playerId, 0);
            }
            
            // -cam_battle 切换到战斗房
            else if (text === "-cam_battle") {
                this.TransitionToZone(playerId, CameraZone.BATTLE_ROOM, BATTLE_ROOM_SPAWN);
                print(`[CameraSystem] 玩家 ${playerId} 切换到战斗房`);
                GameRules.SendCustomMessage(`<font color='#00FF00'>传送到战斗房</font>`, playerId, 0);
            }
            
            // -cam_boss 切换到Boss房
            else if (text === "-cam_boss") {
                this.TransitionToZone(playerId, CameraZone.BOSS_ROOM, BOSS_ROOM_SPAWN);
                print(`[CameraSystem] 玩家 ${playerId} 切换到Boss房`);
                GameRules.SendCustomMessage(`<font color='#00FF00'>传送到Boss房</font>`, playerId, 0);
            }
            
            // -cam_info 显示摄像机信息
            else if (text === "-cam_info") {
                const zone = this.GetZone(playerId);
                const bounds = CAMERA_ZONES[zone];
                const msg = `区域: ${zone} | X(${bounds.minX}~${bounds.maxX}) Y(${bounds.minY}~${bounds.maxY})`;
                print(`[CameraSystem] ${msg}`);
                GameRules.SendCustomMessage(`<font color='#00FF00'>${msg}</font>`, playerId, 0);
            }
            
            // -cam_help 显示帮助
            else if (text === "-cam_help") {
                GameRules.SendCustomMessage(`<font color='#FFD700'>===== 摄像机命令 =====</font>`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00FF00'>-pos</font> - 显示当前位置`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00FF00'>-cam_town</font> - 传送到主城`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00FF00'>-cam_battle</font> - 传送到战斗房`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00FF00'>-cam_boss</font> - 传送到Boss房`, playerId, 0);
                GameRules.SendCustomMessage(`<font color='#00FF00'>-cam_info</font> - 显示当前区域信息`, playerId, 0);
            }
            
        }, undefined);

        print("[CameraSystem] 聊天命令已注册: -pos, -cam_town, -cam_battle, -cam_boss, -cam_info, -cam_help");
    }
}