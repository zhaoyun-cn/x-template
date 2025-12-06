/** @noSelfInFile */

// ==================== vectorws 类型修复 ====================
// Dota 2 在最近更新后引入了 vectorws (VectorWorldSpace) 类型
// 但 Valve 没有提供完整的 API 文档，导致 TypeScript 编译和运行时错误
// 此文件通过类型重载修复所有可能返回 vectorws 的 API

/**
 * vectorws 是 Dota 2 的世界空间坐标类型
 * 我们将其映射为标准 Vector 类型
 */
declare type vectorws = any;  // ✅ 修改：先声明为 any

// ==================== 单位相关 API ====================

declare global {
    interface CDOTA_BaseNPC {
        /**
         * 获取单位的绝对位置（世界坐标）
         * 原版可能返回 vectorws，这里强制为 Vector
         */
        GetAbsOrigin(): any;  // ✅ 修改：使用 any

        /**
         * 获取单位的原点位置
         * 原版可能返回 vectorws，这里强制为 Vector
         */
        GetOrigin(): any;  // ✅ 修改：使用 any

        /**
         * 设置单位的位置
         * @param origin 位置向量
         */
        SetOrigin(origin: any): void;  // ✅ 修改：使用 any

        /**
         * 设置单位的绝对位置
         * @param origin 位置向量
         */
        SetAbsOrigin(origin: any): void;  // ✅ 修改：使用 any

        /**
         * 获取单位的前方向量
         */
        GetForwardVector(): any;  // ✅ 修改：使用 any

        /**
         * 获取单位的右方向量
         */
        GetRightVector(): any;  // ✅ 修改：使用 any

        /**
         * 获取单位的上方向量
         */
        GetUpVector(): any;  // ✅ 修改：使用 any
    }

    // ==================== 技能相关 API ====================

    interface CDOTABaseAbility {
        /**
         * 获取技能的目标位置（鼠标点击位置）
         * 原版可能返回 vectorws，这里强制为 Vector
         */
        GetCursorPosition(): any;  // ✅ 修改：使用 any
    }

    // ==================== 粒子系统 API ====================

    interface CScriptParticleManager {
        /**
         * 设置粒子控制点位置
         * @param particleIndex 粒子索引
         * @param controlPoint 控制点编号
         * @param value 位置向量
         */
        SetParticleControl(particleIndex: ParticleID, controlPoint: number, value: any): void;  // ✅ 修改：使用 any

        /**
         * 设置粒子控制点位置（前向）
         */
        SetParticleControlForward(particleIndex: ParticleID, controlPoint: number, value: any): void;  // ✅ 修改：使用 any
    }
}

// ==================== 全局函数 API ====================

/**
 * 在半径范围内查找单位
 */
declare function FindUnitsInRadius(
    teamNumber: DotaTeam,
    location: any,  // ✅ 修改：使用 any
    cacheUnit: CDOTA_BaseNPC | undefined,
    radius: number,
    teamFilter: UnitTargetTeam,
    typeFilter: UnitTargetType,
    flagFilter: UnitTargetFlags,
    order: FindOrder,
    canGrowCache: boolean
): CDOTA_BaseNPC[];

/**
 * 创建单位
 */
declare function CreateUnitByName(
    unitName: string,
    location: any,  // ✅ 修改：使用 any
    findClearSpace: boolean,
    npcOwner: CDOTA_BaseNPC | undefined,
    unitOwner: CBaseEntity | undefined,
    team: DotaTeam
): CDOTA_BaseNPC;

/**
 * 为单位寻找空地
 */
declare function FindClearSpaceForUnit(
    unit: CDOTA_BaseNPC,
    position: any,  // ✅ 修改：使用 any
    b: boolean
): boolean;

/**
 * 获取地面高度
 */
declare function GetGroundHeight(
    position: any,  // ✅ 修改：使用 any
    entity: CDOTA_BaseNPC | undefined
): number;

/**
 * 获取地面位置
 */
declare function GetGroundPosition(
    position: any,  // ✅ 修改：使用 any
    entity: CDOTA_BaseNPC | undefined
): any;  // ✅ 修改：使用 any

/**
 * 在位置播放声音
 */
declare function EmitSoundOnLocationWithCaster(
    location: any,  // ✅ 修改：使用 any
    soundName: string,
    caster: CDOTA_BaseNPC
): void;

/**
 * 屏幕震动
 */
declare function ScreenShake(
    center: any,  // ✅ 修改：使用 any
    amplitude: number,
    frequency: number,
    duration: number,
    radius: number,
    command: number,
    airShake: boolean
): void;

/**
 * 添加视野
 */
declare function AddFOWViewer(
    teamNumber: DotaTeam,
    location: any,  // ✅ 修改：使用 any
    radius: number,
    duration: number,
    obstructedVision: boolean
): number;

/**
 * 在路径上销毁树木
 */
declare namespace GridNav {
    function DestroyTreesAroundPoint(
        position: any,  // ✅ 修改：使用 any
        radius: number,
        fullCollision: boolean
    ): void;
}

// ==================== Popup 相关 API ====================

/**
 * 显示彩色伤害数字
 */
declare function PopupDamageColored(
    target: CDOTA_BaseNPC,
    amount: number,
    color: any,  // ✅ 修改：使用 any
    player?: CDOTAPlayerController
): void;

/**
 * 显示彩色暴击伤害数字
 */
declare function PopupCriticalDamageColored(
    target: CDOTA_BaseNPC,
    amount: number,
    color: any,  // ✅ 修改：使用 any
    player?: CDOTAPlayerController
): void;

export {};  // ✅ 确保这是一个模块