/**
 * 魔兽编辑器单位ID到DOTA2单位名的映射表
 * 在魔兽编辑器中设计关卡时，可以使用这些ID标记刷怪点
 */
export const UNIT_MAPPINGS: Record<string, string> = {
    // ===== 小怪 =====
    'h000': 'npc_dota_creature_kobold',           // 狗头人
    'h001': 'npc_dota_creature_gnoll_assassin',   // 豺狼人刺客
    'h002': 'npc_dota_neutral_ice_shaman',        // 冰霜萨满
    'h003': 'npc_dota_neutral_polar_furbolg_champion', // 雪怪战士
    'h004': 'npc_dota_creature_ogre_magi',        // 食人魔法师
    
    // ===== 精英怪 =====
    'e000': 'npc_dota_creature_ice_troll',        // 冰霜巨魔
    'e001': 'npc_dota_neutral_centaur_khan',      // 半人马可汗
    'e002': 'npc_dota_neutral_big_thunder_lizard', // 雷霆蜥蜴
    
    // ===== BOSS =====
    'b000': 'npc_dota_roshan',                    // 肉山（示例BOSS）
    'b001': 'npc_dota_neutral_black_dragon',      // 黑龙
    
    // ===== 环境物体 =====
    'w000': 'npc_dummy_unit',                     // 墙壁（隐形单位）
    'w001': 'npc_dota_creature_statue',           // 雕像
};

/**
 * 获取DOTA2单位名
 */
export function GetDotaUnitName(wc3UnitId: string): string {
    return UNIT_MAPPINGS[wc3UnitId] || 'npc_dota_creature_kobold';
}