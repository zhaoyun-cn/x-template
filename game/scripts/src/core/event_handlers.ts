import { reloadable } from '../utils/tstl-utils';
import { GetDungeonManager } from '../dungeons/DungeonManager';
import { GetAllDungeonConfigs, DUNGEON_CONFIGS } from '../dungeons/configs/index';
import { ClassSystem } from '../systems/player/class_system';

// 全局变量：记录每个玩家最后触发传送门菜单的时间
const lastMenuTriggerTime: Record<number, number> = {};

/**
 * 事件处理器
 * 统一管理所有自定义游戏事件
 */
@reloadable
export class EventHandlers {
    private static dungeonPortalInstance: CDOTA_BaseNPC | undefined = undefined;
    
    /**
     * 注册所有事件处理器
     */
    public static RegisterAllEvents(): void {
        print('[EventHandlers] 开始注册所有事件处理器');
        
        this.RegisterPlayerConnectEvent();
        this.RegisterHeroSpawnEvent();
        this.RegisterDungeonEvents();
        this.RegisterEquipmentEvents();
        this.RegisterChatCommands();
        this.RegisterCombatEvents();
        this.RegisterItemEvents();
        this.RegisterUIEvents();
        
        print('[EventHandlers] 所有事件处理器注册完成');
    }
    
    /**
     * 注册副本相关事件
     */
    private static RegisterDungeonEvents(): void {
        // 请求副本列表
        CustomGameEventManager.RegisterListener("request_dungeon_list", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            
            print(`[EventHandlers] 玩家 ${playerId} 请求副本列表`);
            
            const dungeonList: any[] = [];
            const allConfigs = GetAllDungeonConfigs();
            
            allConfigs.forEach(({ id, config }) => {
                dungeonList.push({
                    id: id,
                    name: config.mapName,
                    description: config.description || "暂无描述"
                });
                print(`[EventHandlers] 副本: ${id} - ${config.mapName} - ${config.description || "暂无描述"}`);
            });
            
            const player = PlayerResource.GetPlayer(playerId);
            if (player) {
                (CustomGameEventManager.Send_ServerToPlayer as any)(player, "update_dungeon_list", {
                    dungeons: dungeonList
                });
                print(`[EventHandlers] 发送副本列表: ${dungeonList.length} 个副本`);
            }
        });
        
        // 选择副本
        CustomGameEventManager.RegisterListener("select_dungeon", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const dungeonId = event.dungeon_id as string;
            
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (!hero) {
                print(`[EventHandlers] 错误：玩家 ${playerId} 没有英雄`);
                return;
            }
            
            print(`[EventHandlers] 玩家 ${playerId} 选择副本: ${dungeonId}`);
            
            const manager = GetDungeonManager();
            
            // 创建副本（会自动分配区域）
            const instanceId = manager.CreateDungeon(dungeonId, playerId);
            
            if (instanceId) {
                // 进入副本
                const success = manager.EnterDungeon(playerId, instanceId);
                
                if (success) {
                    hero.EmitSound("Portal.Hero_Appear");
                    
                    GameRules.SendCustomMessage(
                        `<font color='#00FF00'>正在进入副本...</font>`,
                        playerId,
                        0
                    );
                    
                    print(`[EventHandlers] 玩家 ${playerId} 成功进入副本 ${instanceId}`);
                } else {
                    print(`[EventHandlers] 玩家 ${playerId} 进入副本失败`);
                    // 如果进入失败，清理刚创建的副本
                    manager.CleanupDungeon(instanceId);
                }
            } else {
                print(`[EventHandlers] 副本创建失败: ${dungeonId}`);
            }
        });
        
        // 离开副本
        CustomGameEventManager.RegisterListener("leave_dungeon", (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            
            print(`[EventHandlers] 玩家 ${playerId} 请求离开副本`);
            
            const manager = GetDungeonManager();
            manager.LeaveDungeon(playerId, 'manual');
        });
        
        // 监听玩家死亡（用于副本）
        ListenToGameEvent("entity_killed", (event) => {
            const killedUnit = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC;
            
            if (killedUnit && killedUnit.IsRealHero()) {
                const playerId = killedUnit.GetPlayerOwnerID();
                const manager = GetDungeonManager();
                const instanceId = manager.GetPlayerDungeon(playerId);
                
                if (instanceId) {
                    print(`[EventHandlers] 玩家 ${playerId} 在副本 ${instanceId} 中死亡`);
                    
                    const instance = manager.GetDungeonInstance(instanceId);
                    if (instance) {
                        // 通知副本实例玩家死亡
                        (instance as any).OnPlayerDeath?.(playerId);
                    }
                }
            }
        }, undefined);
    }
    
    /**
     * 生成副本传送门
     */
    public static SpawnDungeonPortal(): void {
        const portalLocation = Vector(-0, 500, 192);

        const portal = CreateUnitByName(
            "npc_dota_portal_to_dungeon",
            portalLocation,
            false,
            undefined,
            undefined,
            DotaTeam.GOODGUYS
        );
        
        if (portal) {
            print("[EventHandlers] 传送门已生成");
            portal.SetMoveCapability(UnitMoveCapability.NONE);
            portal.SetForwardVector(Vector(0, 1, 0));
            this.dungeonPortalInstance = portal;
            this.MonitorPortalTrigger();
        } else {
            print("[EventHandlers] 传送门创建失败");
        }
    }

    /**
     * 监控传送门触发
     */
   private static MonitorPortalTrigger(): void {
    Timers.CreateTimer(0.25, () => {
        if (!this.dungeonPortalInstance || this.dungeonPortalInstance.IsNull()) {
            return 0.25;
        }

        const currentTime = GameRules.GetGameTime();
        const playerCount = PlayerResource.GetPlayerCount();
        const manager = GetDungeonManager(); // 🆕 获取副本管理器

        for (let i = 0; i < playerCount; i++) {
            if (! PlayerResource.IsValidPlayerID(i)) continue;
            
            // 检查玩家是否选择了职业
            if (!ClassSystem.HasSelectedClass(i as PlayerID)) continue;

             // 🆕 检查玩家是否已在副本中
            if (manager.GetPlayerDungeon(i as PlayerID)) {
                continue; // 玩家已在副本中，跳过检测
            }
            
            
            
            const hero = PlayerResource.GetSelectedHeroEntity(i);
            if (!hero || !hero.IsAlive()) continue;

            const portalPos = this.dungeonPortalInstance.GetAbsOrigin();
            const heroPos = hero.GetAbsOrigin();
            const dx = portalPos.x - heroPos. x;
            const dy = portalPos.y - heroPos. y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= 200) {
                const lastTrigger = lastMenuTriggerTime[i] || 0;
                if (currentTime - lastTrigger < 3.0) {
                    continue;
                }
                
                lastMenuTriggerTime[i] = currentTime;
                
                CustomGameEventManager.Send_ServerToPlayer<{}>(
                    PlayerResource.GetPlayer(i)! ,
                    "show_dungeon_menu",
                    {}
                );
            }
        }
        
        return 0.25;
    });
}
    
    /**
     * 注册玩家连接事件
     */
    private static RegisterPlayerConnectEvent(): void {
        ListenToGameEvent("player_connect_full", (event) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家${playerId}连接`);
        }, undefined);
        
        // 玩家断开
        ListenToGameEvent("player_disconnect", (event) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家 ${playerId} 断开连接`);
            
            // 如果玩家在副本中，让其离开
            const manager = GetDungeonManager();
            const instanceId = manager.GetPlayerDungeon(playerId);
            if (instanceId) {
                manager.LeaveDungeon(playerId, 'manual');
            }
        }, undefined);
        
        // 游戏状态改变
        ListenToGameEvent("game_rules_state_change", (event) => {
            const state = GameRules.State_Get();
            print(`[EventHandlers] 游戏状态改变: ${state}`);
            
            // 游戏结束时清理所有副本
            if (state === GameState.POST_GAME) {
                print('[EventHandlers] 游戏结束，清理所有副本');
                GetDungeonManager().CleanupAll();
            }
        }, undefined);
    }

    /**
     * 注册英雄生成事件
     */
    private static RegisterHeroSpawnEvent(): void {
        ListenToGameEvent("npc_spawned", (event) => {
            const spawnedUnit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
            
            if (! spawnedUnit || !spawnedUnit.IsRealHero()) {
                return;
            }
            
            const playerId = spawnedUnit.GetPlayerOwnerID();
            print(`[EventHandlers] 玩家 ${playerId} 的英雄已生成`);
            
            // 这里可以添加英雄生成后的初始化逻辑
        }, undefined);
    }
    
    /**
     * 注册装备相关事件
     */
    private static RegisterEquipmentEvents(): void {
        // 装备穿戴
        CustomGameEventManager.RegisterListener('equip_item', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const slot = event.slot;
            const itemId = event.item_id;
            
            print(`[EventHandlers] 玩家 ${playerId} 装备物品 ${itemId} 到槽位 ${slot}`);
            
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero) {
                print(`[EventHandlers] 装备成功`);
            }
        });
        
        // 装备卸下
        CustomGameEventManager.RegisterListener('unequip_item', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const slot = event.slot;
            
            print(`[EventHandlers] 玩家 ${playerId} 卸下槽位 ${slot} 的装备`);
            
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (hero) {
                print(`[EventHandlers] 卸下成功`);
            }
        });
    }
    
    /**
     * 注册聊天命令
     */
    private static RegisterChatCommands(): void {
        // 这里可以添加聊天命令的注册
        print('[EventHandlers] 聊天命令已注册');
    }
    
    /**
     * 注册战斗相关事件
     */
    private static RegisterCombatEvents(): void {
        // 监听伤害事件
        CustomGameEventManager.RegisterListener('damage_dealt', (userId, event: any) => {
            const attackerId = event.attacker_id;
            const targetId = event.target_id;
            const damage = event.damage;
            
            // print(`[EventHandlers] 伤害事件: ${attackerId} -> ${targetId}, 伤害: ${damage}`);
        });
        
        // 监听治疗事件
        CustomGameEventManager.RegisterListener('heal_dealt', (userId, event: any) => {
            const healerId = event.healer_id;
            const targetId = event.target_id;
            const heal = event.heal;
            
            // print(`[EventHandlers] 治疗事件: ${healerId} -> ${targetId}, 治疗: ${heal}`);
        });
    }
    
    /**
     * 注册物品相关事件
     */
    private static RegisterItemEvents(): void {
        // 物品拾取
        CustomGameEventManager.RegisterListener('item_picked_up', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const itemName = event.item_name;
            
            print(`[EventHandlers] 玩家 ${playerId} 拾取物品: ${itemName}`);
        });
        
        // 物品使用
        CustomGameEventManager.RegisterListener('item_used', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const itemName = event.item_name;
            
            print(`[EventHandlers] 玩家 ${playerId} 使用物品: ${itemName}`);
        });
        
        // 物品丢弃
        CustomGameEventManager.RegisterListener('item_dropped', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const itemName = event.item_name;
            
            print(`[EventHandlers] 玩家 ${playerId} 丢弃物品: ${itemName}`);
        });
    }
    
    /**
     * 注册UI相关事件
     */
    private static RegisterUIEvents(): void {
        // 打开背包
        CustomGameEventManager.RegisterListener('open_inventory', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家 ${playerId} 打开背包`);
        });
        
        // 关闭背包
        CustomGameEventManager.RegisterListener('close_inventory', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家 ${playerId} 关闭背包`);
        });
        
        // 打开商店
        CustomGameEventManager.RegisterListener('open_shop', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家 ${playerId} 打开商店`);
        });
        
        // 关闭商店
        CustomGameEventManager.RegisterListener('close_shop', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[EventHandlers] 玩家 ${playerId} 关闭商店`);
        });
    }
}