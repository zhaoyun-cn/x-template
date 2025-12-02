/**
 * 角色属性请求处理
 * 读取装备的全局属性并发送给客户端
 */

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

export function InitCharacterStatsHandler(): void {
    print('[CharacterStatsHandler] 初始化角色属性请求处理');
    
    CustomGameEventManager.RegisterListener('request_character_stats', (_, data: any) => {
        const playerId = data.PlayerID as PlayerID;
        
        print('[CharacterStatsHandler] 收到角色属性请求: ' + playerId);
        
        // ⭐ 从装备系统读取属性
        const equipStats = _G.EquipmentStats ?  _G.EquipmentStats[playerId] : null;
        
        const stats = {
            // ⭐ 基础属性（从装备读取）
            strength: equipStats?.strength || 0,
            agility: equipStats?.agility || 0,
            intelligence: equipStats?.intelligence || 0,
            
            // ⭐ 攻击属性
            attackDamage: equipStats?.attack_damage || 0,
            attackSpeed: equipStats?.attack_speed || 0,
            critChance: 5 + (equipStats?.crit_chance || 0),  // 基础5%
            critMultiplier: 150 + (equipStats?.crit_multiplier || 0),  // 基础150%
            
            // ⭐ 防御属性
            armor: equipStats?.armor || 0,
            health: equipStats?.health || 0,
            mana: equipStats?.mana || 0,
            evasion: equipStats?.evasion || 0,
            
            // ⭐ 抗性
            fireResistance: equipStats?.fire_resistance || 0,
            coldResistance: equipStats?.cold_resistance || 0,
            lightningResistance: equipStats?.lightning_resistance || 0,
            magicResistance: equipStats?.magic_resistance || 0,
            
            // ⭐ 移动
            moveSpeed: equipStats?.move_speed || 0,
            
            // ⭐ 其他（保持兼容）
            increasedDamage: equipStats?.attack_damage || 0,
            increasedPhysicalDamage: 0,
            increasedElementalDamage: 0,
            increasedFireDamage: 0,
            increasedColdDamage: 0,
            increasedLightningDamage: 0,
            moreDamageValues: [] as number[],
            projectileDamage: 0,
            areaDamage: 0,
            meleeDamage: 0,
            spellDamage: 0,
            dotDamage: 0,
            cooldownReduction: equipStats?.cooldown_reduction || 0,
            areaOfEffect: 0,
            castSpeed: 0,
            lifesteal: 0,
        };
        
        print(`[CharacterStatsHandler] 装备属性: 力量=${stats.strength}, 生命=${stats.health}, 攻击=${stats.attackDamage}, 暴击=${stats.critChance}%`);
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(
                player,
                'update_character_stats',
                stats
            );
            print('[CharacterStatsHandler] 发送角色属性数据完成');
        }
    });
}