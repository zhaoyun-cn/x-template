// 影魔Boss装备配置
export const ShadowFiendCosmetics = {
    // 基础模型
    base: [
        "models/heroes/shadow_fiend/shadow_fiend. vmdl",
        "models/heroes/shadow_fiend/shadow_fiend_head.vmdl",
        "models/heroes/shadow_fiend/shadow_fiend_shoulders.vmdl",
        "models/heroes/shadow_fiend/shadow_fiend_arms.vmdl",
    ],
    
    // ✅ 暂时不使用套装，用特效代替
    sets: {},
    
    // 粒子特效
    particles: [
        "particles/units/heroes/hero_nevermore/nevermore_shadowraze. vpcf",
        "particles/units/heroes/hero_nevermore/nevermore_shadowraze_a.vpcf",
        "particles/units/heroes/hero_nevermore/nevermore_necro_souls.vpcf",
        "particles/units/heroes/hero_leshrac/leshrac_split_earth.vpcf",
        "particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf",
        "particles/items2_fx/smoke_of_deceit_buff.vpcf",
        
        // ✅ 阶段特效
        "particles/units/heroes/hero_shadow_demon/shadow_demon_soul_catcher.vpcf",
        "particles/econ/items/doom/doom_f2p_death_effect/doom_bringer_f2p_death. vpcf",
        "particles/units/heroes/hero_necrolyte/necrolyte_pulse_enemy.vpcf",
        "particles/units/heroes/hero_doom_bringer/doom_bringer_scorched_earth.vpcf",
    ],
    
    // 音效
    sounds: [
        "soundevents/game_sounds_heroes/game_sounds_nevermore. vsndevts",
        "soundevents/game_sounds_heroes/game_sounds_phoenix.vsndevts",
        "soundevents/game_sounds_heroes/game_sounds_ursa.vsndevts",
    ],
};

// 获取所有需要预加载的模型
export function GetAllModels(): string[] {
    return [... ShadowFiendCosmetics.base];
}

// ✅ 阶段配置 - 不使用装备，只用视觉效果
export const PhaseConfig = {
    1: {
        name: "暗影形态",
        healthPercent: 66,
        modelScale: 1.0,
        color: { r: 80, g: 80, b: 120 },  // 深蓝灰色
        projectileCount: 4,
        baseDamage: 100,
        attackSpeed: 1.7,
        cosmetics: null,
        particleEffect: "particles/items2_fx/smoke_of_deceit_buff.vpcf",  // ✅ 黑烟
    },
    2: {
        name: "烈焰形态",
        healthPercent: 33,
        modelScale: 1.3,
        color: { r: 255, g: 60, b: 0 },  // 火红色
        projectileCount: 8,
        baseDamage: 180,
        attackSpeed: 1.2,
        cosmetics: null,
        particleEffect: "particles/units/heroes/hero_doom_bringer/doom_bringer_scorched_earth.vpcf",  // ✅ 火焰地面
    },
    3: {
        name: "恶魔领主",
        healthPercent: 0,
        modelScale: 1.6,
        color: { r: 150, g: 0, b: 255 },  // 紫色
        projectileCount: 16,
        baseDamage: 250,
        attackSpeed: 0.8,
        cosmetics: null,
        particleEffect: "particles/units/heroes/hero_necrolyte/necrolyte_pulse_enemy.vpcf",  // ✅ 紫色脉冲
    },
};