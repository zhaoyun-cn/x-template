import { 
    SPAWN_POINT, 
    ROOM1_ENTRANCE, 
    ROOM2_ENTRANCE,
    ROOM3_ENTRANCE,
    ROOM1_MONSTERS, 
    ROOM2_MONSTERS,
    ROOM3_BOSS
} from "./simple_config";
import { ShadowFiendBoss } from "./boss/shadow_fiend_boss";
import { LootSystem } from "./loot_system";
import { DungeonDifficulty, DIFFICULTY_NAMES, DIFFICULTY_MULTIPLIERS } from "./reward_config";
import { EXTERNAL_REWARD_POOL, ExternalRewardItem } from "./external_reward_pool";
import { EquipmentVaultSystem } from "../systems/equipment_vault_system";

export class SimpleDungeon {
    private monsters: CDOTA_BaseNPC[] = [];
    private currentRoom: number = 0;
    private playerId: PlayerID | undefined;
    private bossManager: ShadowFiendBoss | undefined;
    private currentDifficulty: DungeonDifficulty = DungeonDifficulty.NORMAL_1;
    private currentRewards: ExternalRewardItem[] = [];
    
    constructor() {
        print("=".repeat(50));
        print("[SimpleDungeon] Constructor called!");
        print("=".repeat(50));
        
        this.RegisterCommand();
        this.ListenToEvents();
        this.ListenToChatCommand();
        this.RegisterRewardSelectionListener();
        this.RegisterEquipmentListeners(); // ⭐ 只注册一次！
        
        print("[SimpleDungeon] Ready!  Type -start in chat");
    }

    // ⭐⭐⭐ 装备事件监听器 - 只注册一次！
    private RegisterEquipmentListeners(): void {
        // 装备物品 - 只注册一次！
        CustomGameEventManager.RegisterListener("equip_item_from_vault", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const index = event.index as number;
            
            print(`[SimpleDungeon] 玩家${playerId}从 UI 装备索引${index}的物品`);
            
            // EquipmentVaultSystem.EquipItem 内部会调用 PushDataToClient
            // 不要在这里再调用任何发送数据的方法！
            if (EquipmentVaultSystem.EquipItem(playerId, index)) {
                GameRules.SendCustomMessage("✅ 装备成功！", playerId, 0);
                print(`[SimpleDungeon] 装备成功`);
            } else {
                GameRules.SendCustomMessage("❌ 装备失败！", playerId, 0);
            }
        });

        // 卸下装备
        CustomGameEventManager.RegisterListener("unequip_item", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const slot = event.slot as string;
            
            print(`[SimpleDungeon] 玩家${playerId}卸下槽位${slot}的装备`);
            
            if (EquipmentVaultSystem.UnequipItem(playerId, slot)) {
                print(`[SimpleDungeon] ✓ 卸下成功`);
            }
        });

        // 请求装备界面数据
        CustomGameEventManager.RegisterListener("request_equipment_data", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[SimpleDungeon] 响应装备界面数据请求：${playerId}`);
            EquipmentVaultSystem.PushDataToClient(playerId);
        });

        // 请求仓库数据
        CustomGameEventManager.RegisterListener("request_vault_data", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[SimpleDungeon] 响应仓库数据请求：${playerId}`);
            EquipmentVaultSystem.PushDataToClient(playerId);
        });

        print("[SimpleDungeon] Equipment listeners registered (ONCE)");
    }

    private ListenToChatCommand(): void {
        ListenToGameEvent("player_chat", (event) => {
            const text = event.text.trim();
            const playerId = event.playerid as PlayerID;
            
            if (text === "-start" || text === "start") {
                this.StartDungeon(playerId);
            }
            
            if (text === "-vault" || text === "vault" || text === "-v" || text === "v") {
                const player = PlayerResource.GetPlayer(playerId);
                if (player) {
                    EquipmentVaultSystem.PushDataToClient(playerId);
                    (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'show_vault_ui', {});
                    print(`[SimpleDungeon] 打开仓库 UI`);
                }
            }
        }, this);
        
        // ⭐⭐⭐ 不要在这里注册 equip_item_from_vault！已经在 RegisterEquipmentListeners 中注册了！
        
        print("[SimpleDungeon] Chat listener registered");
    }

    private RegisterCommand(): void {
        Convars.RegisterCommand("start", () => {
            const playerController = Convars.GetCommandClient();
            if (playerController) {
                const playerId = playerController.GetPlayerID();
                this.StartDungeon(playerId);
            }
        }, "Start dungeon", 0);
    }

    private ListenToEvents(): void {
        ListenToGameEvent("entity_killed", (event) => {
            this.OnEntityKilled(event);
        }, this);
    }

    public StartDungeon(playerId: PlayerID, difficulty?: string): void {
        const diff = difficulty || "normal_1";
        print(`[SimpleDungeon] ========== START DUNGEON ==========`);
        
        const difficultyMap: Record<string, DungeonDifficulty> = {
            "easy_1": DungeonDifficulty.EASY_1,
            "easy_2": DungeonDifficulty.EASY_2,
            "easy_3": DungeonDifficulty.EASY_3,
            "normal_1": DungeonDifficulty.NORMAL_1,
            "normal_2": DungeonDifficulty.NORMAL_2,
            "normal_3": DungeonDifficulty.NORMAL_3,
            "hard_1": DungeonDifficulty.HARD_1,
            "hard_2": DungeonDifficulty.HARD_2,
            "hard_3": DungeonDifficulty.HARD_3
        };
        
        this.currentDifficulty = difficultyMap[diff] || DungeonDifficulty.NORMAL_1;
        this.playerId = playerId;
        this.currentRoom = 1;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print("[SimpleDungeon] ERROR: No hero found!");
            return;
        }

        this.TeleportToRoom(hero, 1);
        this.SpawnMonstersForRoom(1);
        
        const diffName = DIFFICULTY_NAMES[this.currentDifficulty];
        GameRules.SendCustomMessage(
            `<font color='#00FF00'>副本开始！房间 1/3 - ${diffName}</font>`, 
            playerId, 
            0
        );
    }

    private TeleportToRoom(hero: CDOTA_BaseNPC_Hero, roomNumber: number): void {
        let position: Vector;
        
        if (roomNumber === 1) position = ROOM1_ENTRANCE;
        else if (roomNumber === 2) position = ROOM2_ENTRANCE;
        else if (roomNumber === 3) position = ROOM3_ENTRANCE;
        else return;

        FindClearSpaceForUnit(hero, position, true);
    }

    private SpawnMonstersForRoom(roomNumber: number): void {
        this.monsters = [];

        let spawnPoints: Vector[];
        let monsterCount: number;
        let unitName: string;

        if (roomNumber === 1) {
            spawnPoints = ROOM1_MONSTERS;
            monsterCount = 3;
            unitName = "npc_dota_creep_badguys_melee";
        } else if (roomNumber === 2) {
            spawnPoints = ROOM2_MONSTERS;
            monsterCount = 5;
            unitName = "npc_dota_creep_badguys_melee";
        } else if (roomNumber === 3) {
            spawnPoints = ROOM3_BOSS;
            monsterCount = 1;
            unitName = "npc_dota_hero_nevermore";
        } else {
            return;
        }

        for (let i = 0; i < spawnPoints.length && i < monsterCount; i++) {
            const monster = CreateUnitByName(unitName, spawnPoints[i], true, undefined, undefined, DotaTeam.BADGUYS);
            if (monster) {
                if (roomNumber === 3) this.EnhanceBoss(monster);
                this.monsters.push(monster);
            }
        }
    }

    private EnhanceBoss(boss: CDOTA_BaseNPC): void {
        const multiplier = DIFFICULTY_MULTIPLIERS[this.currentDifficulty];
        
        if (boss.IsHero()) {
            const heroBoss = boss as CDOTA_BaseNPC_Hero;
            heroBoss.SetTeam(DotaTeam.BADGUYS);
            heroBoss.SetAbilityPoints(0);
            
            for (let i = 1; i <= 10; i++) heroBoss.HeroLevelUp(false);
            
            heroBoss.SetBaseStrength(Math.floor(500 * multiplier));
            heroBoss.SetBaseAgility(Math.floor(50 * multiplier));
            heroBoss.SetBaseIntellect(Math.floor(50 * multiplier));
            heroBoss.SetHealth(heroBoss.GetMaxHealth());
            heroBoss.SetMana(heroBoss.GetMaxMana());
            
            if (boss.GetUnitName() === "npc_dota_hero_nevermore") {
                boss.SetMoveCapability(UnitMoveCapability.NONE);
                boss.AddNewModifier(boss, undefined, "modifier_invulnerable", {});
                
                Timers.CreateTimer(2, () => {
                    if (! boss.IsAlive() || this.playerId === undefined) return;
                    this.bossManager = new ShadowFiendBoss(boss, this.playerId);
                    boss.RemoveModifierByName("modifier_invulnerable");
                    return undefined;
                });
            }
        }
    }

    private TriggerRewardSelection(): void {
        if (! this.playerId) return;

        this.currentRewards = this.GenerateRewards();

        const player = PlayerResource.GetPlayer(this.playerId);
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(player, "show_reward_selection", { 
                rewards: this.currentRewards
            });
        }
    }

    private GenerateRewards(): ExternalRewardItem[] {
        const rewards: ExternalRewardItem[] = [];
        const pool = [...EXTERNAL_REWARD_POOL];

        for (let i = 0; i < 3 && pool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            rewards.push(pool[randomIndex]);
            pool.splice(randomIndex, 1);
        }

        return rewards;
    }

    private RegisterRewardSelectionListener(): void {
        CustomGameEventManager.RegisterListener("reward_selected", (userId, event) => {
            const eventData = event as any;
            const playerId = eventData.PlayerID as PlayerID;
            const rewardIndex = eventData.rewardIndex as number;
            
            if (rewardIndex >= 0 && rewardIndex < this.currentRewards.length) {
                const selectedReward = this.currentRewards[rewardIndex];
                EquipmentVaultSystem.SaveToVault(playerId, selectedReward);
                
                GameRules.SendCustomMessage(
                    `<font color='#FF6EC7'>💾 已保存装备：${selectedReward.name}</font>`,
                    playerId,
                    0
                );
            }
        });
    }

    private OnEntityKilled(event: EntityKilledEvent): void {
        const killedUnit = EntIndexToHScript(event.entindex_killed);
        if (! killedUnit) return;

        const index = this.monsters.indexOf(killedUnit as CDOTA_BaseNPC);
        if (index !== -1) {
            this.monsters.splice(index, 1);

            if (this.monsters.length === 0) {
                if (this.currentRoom === 3 && this.playerId !== undefined) {
                    LootSystem.DropBossLoot(killedUnit as CDOTA_BaseNPC, this.currentDifficulty, this.playerId);
                    this.TriggerRewardSelection();
                }
                this.OnRoomCleared();
            }
        }
    }

    private OnRoomCleared(): void {
        if (this.playerId === undefined) return;

        if (this.currentRoom < 3) {
            const nextRoom = this.currentRoom + 1;
            GameRules.SendCustomMessage(`<font color='#00FF00'>✓ 房间${this.currentRoom}清空！</font>`, this.playerId, 0);

            Timers.CreateTimer(3.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId! );
                if (hero) {
                    this.currentRoom = nextRoom;
                    this.TeleportToRoom(hero, nextRoom);
                    Timers.CreateTimer(1.0, () => {
                        this.SpawnMonstersForRoom(nextRoom);
                        return undefined;
                    });
                }
                return undefined;
            });
        } else {
            this.OnComplete();
        }
    }

    private OnComplete(): void {
        if (this.playerId !== undefined) {
            LootSystem.GiveCompletionReward(this.playerId, this.currentDifficulty);

            Timers.CreateTimer(5.0, () => {
                const hero = PlayerResource.GetSelectedHeroEntity(this.playerId! );
                if (hero) {
                    FindClearSpaceForUnit(hero, SPAWN_POINT, true);
                    GameRules.SendCustomMessage("<font color='#00FFFF'>已返回主城</font>", this.playerId!, 0);
                }
                return undefined;
            });
        }

        this.currentRoom = 0;
        this.monsters = [];
    }
}