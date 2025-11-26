import { BaseAbility, registerAbility } from "../utils/dota_ts_adapter";

@registerAbility()
export class portal_logic extends BaseAbility {
    OnThink(): void {
        const portalLocation = this.GetCaster().GetAbsOrigin();
        const players: PlayerID[] = [];

        // 遍历所有有效玩家
        const playerCount = PlayerResource.GetPlayerCount();
        for (let i = 0; i < playerCount; i++) {
            if (PlayerResource.IsValidPlayerID(i)) {
                players.push(i);
            }
        }

        // 检测玩家是否进入传送范围
        players.forEach(playerId => {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (!hero || !hero.IsAlive()) return;

            const pos1 = hero.GetAbsOrigin();
            const pos2 = portalLocation;

            // 计算玩家位置与传送门的距离
            const distance = ((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2) ** 0.5;
            if (distance <= 200) { // 玩家进入传送门范围
                this.TriggerTeleport(hero, playerId);
            }
        });
    }

    private TriggerTeleport(hero: CDOTA_BaseNPC_Hero, playerId: PlayerID): void {
        const dungeonEntrance = Vector(0, 0, 0); // 副本入口实际坐标
        FindClearSpaceForUnit(hero, dungeonEntrance, true);

        hero.EmitSound("Portal.Hero_Appear");

        GameRules.SendCustomMessage(
            `<font color='#FF6600'>你已通过传送门进入副本！</font>`,
            playerId,
            0
        );
    }
}