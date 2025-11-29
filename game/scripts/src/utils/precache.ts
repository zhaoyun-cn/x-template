/** @noSelfInFile */
// 导出的预载入方法，用来给addon_game_mode.ts调用
export default function Precache(context: CScriptPrecacheContext) {
    // 需要预载的所有资源
    precacheResource(
        [ 
            // === 雷霆一击（E 技能） ===
            'particles/units/heroes/hero_brewmaster/brewmaster_thunder_clap.vpcf',
            'particles/units/heroes/hero_zuus/zuus_lightning_bolt.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_brewmaster.vsndevts',
            'soundevents/game_sounds_heroes/game_sounds_zuus.vsndevts',
            
            // === 重伤（先天技能） ===
            'particles/units/heroes/hero_bloodseeker/bloodseeker_rupture.vpcf',
            'particles/units/heroes/hero_bloodseeker/bloodseeker_bloodbath.vpcf',
            'particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_bloodseeker.vsndevts',
            'soundevents/game_sounds_heroes/game_sounds_phantom_assassin.vsndevts',
            
            // === 冲锋（Q 技能） ===
            'particles/units/heroes/hero_spirit_breaker/spirit_breaker_charge.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_spirit_breaker.vsndevts',
            
            // === 巨人打击（W 技能） ===
            'particles/units/heroes/hero_sven/sven_spell_great_cleave.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_sven.vsndevts',
            'particles/units/heroes/hero_elder_titan/elder_titan_echo_stomp_cracks.vpcf',
            'particles/units/heroes/hero_zuus/zuus_arc_lightning.vpcf',

            // === 斩杀（R 技能） ===
            'particles/units/heroes/hero_juggernaut/juggernaut_omni_slash_tgt.vpcf',
            'particles/units/heroes/hero_juggernaut/juggernaut_crit_blur.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_juggernaut.vsndevts',
            
            // === 影魔Boss - 基础模型 ===
            'models/heroes/shadow_fiend/shadow_fiend.vmdl',
            'models/heroes/shadow_fiend/shadow_fiend_head.vmdl',
            'models/heroes/shadow_fiend/shadow_fiend_shoulders.vmdl',
            'models/heroes/shadow_fiend/shadow_fiend_arms.vmdl',
            
            // === 影魔Boss - 技能粒子 ===
            'particles/units/heroes/hero_nevermore/nevermore_shadowraze.vpcf',
            'particles/units/heroes/hero_nevermore/nevermore_shadowraze_a.vpcf',
            'particles/units/heroes/hero_nevermore/nevermore_necro_souls.vpcf',
            'particles/units/heroes/hero_nevermore/nevermore_base_attack.vpcf',
            
            // === 影魔Boss - 战斗特效 ===
            'particles/units/heroes/hero_leshrac/leshrac_split_earth.vpcf',
            'particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf',
            'particles/items2_fx/smoke_of_deceit_buff.vpcf',
            
            // === 影魔Boss - 至宝套装 (Demon Eater) ===
            'models/items/nevermore/demon_eater/demon_eater_head.vmdl',
            'models/items/nevermore/demon_eater/demon_eater_arms.vmdl',
            'models/items/nevermore/demon_eater/demon_eater_shoulders.vmdl',
            'particles/econ/items/shadow_fiend/sf_fire_arcana/sf_fire_arcana_ambient.vpcf',
            
            'models/props_gameplay/team_portal/team_portal.vmdl',
           
            // === 影魔Boss - 荒芜之臂套装 (Arms of Desolation) ===
            'models/items/nevermore/arms_of_desolation/arms_of_desolation.vmdl',
            'particles/econ/items/shadow_fiend/sf_arms_of_desolation/sf_desolation_ambient_flame_column.vpcf',
            
            // === 影魔Boss - 音效 ===
            'soundevents/game_sounds_heroes/game_sounds_nevermore.vsndevts',
            'soundevents/game_sounds_heroes/game_sounds_phoenix.vsndevts',
            'soundevents/game_sounds_heroes/game_sounds_ursa.vsndevts',
            
            // === 通用特效 ===
            'particles/generic_gameplay/generic_hit_blood.vpcf',
            'soundevents/game_sounds_heroes/game_sounds_earthshaker.vsndevts',
            
            // === 冥魂大帝 Boss - 完整模型 ===
            'models/heroes/wraith_king/wraith_king.vmdl',
            'models/heroes/wraith_king/wraith_king_base.vmdl',
            'models/heroes/wraith_king/wraith_king_head.vmdl',
            'models/heroes/wraith_king/wraith_king_weapon.vmdl',
            'models/heroes/wraith_king/wraith_king_legs.vmdl',
            'models/heroes/wraith_king/wraith_king_arms.vmdl',
            'models/heroes/wraith_king/wraith_king_shoulder.vmdl',
            'models/heroes/wraith_king/wraith_king_cape.vmdl',
            'models/heroes/wraith_king/wraith_king_armor.vmdl',
            
            // === 冥魂大帝 - 粒子特效 ===
            'particles/units/heroes/hero_skeletonking/skeletonking_ambient.vpcf',
            'particles/units/heroes/hero_skeletonking/skeletonking_sword_ambient.vpcf',
            
            // === 冥魂大帝 - 音效 ===
            'soundevents/game_sounds_heroes/game_sounds_skeletonking.vsndevts',
            
            // === 光环词条特效 ===
            'particles/generic_gameplay/generic_slowed_cold.vpcf',
            'particles/units/heroes/hero_huskar/huskar_burning_spear_debuff.vpcf',
            
            // === 刷怪区域 - 词条系统特效 ===
            'particles/items_fx/black_king_bar_avatar.vpcf',
            'particles/units/heroes/hero_enigma/enigma_demonic_conversion.vpcf',
            'particles/units/heroes/hero_crystalmaiden/maiden_freezing_field_snow.vpcf',
            'particles/units/heroes/hero_ember_spirit/ember_spirit_flameguard.vpcf',
            'particles/units/heroes/hero_huskar/huskar_berserkers_blood.vpcf',
            'particles/units/heroes/hero_skeletonking/skeleton_king_reincarnate.vpcf',
            'particles/units/heroes/hero_broodmother/broodmother_spiderlings_spawn.vpcf',
            'particles/generic_gameplay/generic_buff.vpcf',
            'particles/econ/events/ti10/portal/portal_open_good.vpcf',
        ],
        context
    );
    
    // 预缓存装备图标
    precacheEquipmentIcons(context);
    
    // ⭐ 修正：使用完整路径加载 KV 文件
    precacheEveryResourceInKV(
        [
            'scripts/npc/npc_abilities_custom.txt',
        ],
        context
    );
    
    // 需要预载入的单位
    precacheUnits(
        [
            'npc_dota_hero_nevermore',
            'npc_dota_hero_skeleton_king'
        ],
        context
    );
    
    // 需要预载入的物品
    precacheItems([], context);
    
    print('[Precache] Precache finished.');
}

// 预缓存装备图标
function precacheEquipmentIcons(context: CScriptPrecacheContext) {
    const equipmentIcons = [
        'file://{images}/custom_game/sword.png',
        'file://{images}/custom_game/sword_steel.png',
        'file://{images}/custom_game/armor.png',
        'file://{images}/custom_game/armor_chain.png',
        'file://{images}/custom_game/helmet.png',
        'file://{images}/custom_game/helmet_heavy.png',
        'file://{images}/custom_game/necklace.png',
        'file://{images}/custom_game/ring.png',
    ];
    
    equipmentIcons.forEach(icon => {
        PrecacheResource('panorama', icon, context);
    });
    
    print('[Precache] Precached ' + equipmentIcons.length + ' equipment icons.');
}

// 预载入KV文件中的所有资源
function precacheEveryResourceInKV(kvFileList: string[], context: CScriptPrecacheContext) {
    kvFileList.forEach(file => {
        print('[Precache] Loading KV file: ' + file);
        const kvTable = LoadKeyValues(file);
        
        if (kvTable == null) {
            print('[Precache] ERROR: Failed to load KV file: ' + file);
            print('[Precache] Trying alternative path...');
            
            // ⭐ 尝试不同的路径格式
            const altPaths = [
                file,
                'scripts/npc/' + file,
                file.replace('scripts/npc/', ''),
            ];
            
            for (const altPath of altPaths) {
                const altTable = LoadKeyValues(altPath);
                if (altTable != null) {
                    print('[Precache] SUCCESS with path: ' + altPath);
                    precacheEverythingFromTable(altTable, context);
                    return;
                }
            }
            
            print('[Precache] WARNING: Could not load KV file with any path variant');
            return;
        }
        
        print('[Precache] KV file loaded successfully: ' + file);
        precacheEverythingFromTable(kvTable, context);
    });
}

// 预载入资源列表
function precacheResource(resourceList: string[], context: CScriptPrecacheContext) {
    resourceList.forEach(resource => {
        precacheResString(resource, context);
    });
}

function precacheResString(res: string, context: CScriptPrecacheContext) {
    if (res.endsWith('.vpcf')) {
        PrecacheResource('particle', res, context);
    } else if (res.endsWith('.vsndevts')) {
        PrecacheResource('soundfile', res, context);
    } else if (res.endsWith('.vmdl')) {
        PrecacheResource('model', res, context);
    }
}

// 预载入单位列表
function precacheUnits(unitNamesList: string[], context?: CScriptPrecacheContext) {
    if (context != null) {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameSync(unitName, context);
        });
    } else {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameAsync(unitName, () => {});
        });
    }
}

// 预载入物品列表
function precacheItems(itemList: string[], context: CScriptPrecacheContext) {
    itemList.forEach(itemName => {
        PrecacheItemByNameSync(itemName, context);
    });
}

// 从KV表中解析出所有资源并预载入
function precacheEverythingFromTable(kvTable: any, context: CScriptPrecacheContext) {
    if (kvTable == null) {
        return;
    }
    
    for (const [k, v] of pairs(kvTable)) {
        if (v == null) {
            continue;
        }
        
        const valueType = type(v);
        
        if (valueType === 'table') {
            precacheEverythingFromTable(v, context);
        } else if (valueType === 'string') {
            const str = v as string;
            // 只预缓存资源文件
            if (str.endsWith('.vpcf') || str.endsWith('.vsndevts') || str.endsWith('.vmdl')) {
                precacheResString(str, context);
            }
        }
    }
}