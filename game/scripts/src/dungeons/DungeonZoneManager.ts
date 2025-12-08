/**
 * 副本区域管理器
 * 管理副本的固定区域分配和复用
 */

export interface DungeonZone {
    id: number;
    centerX: number;
    centerY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    occupied: boolean;
    instanceId?: string;
}

export class DungeonZoneManager {
    private static instance: DungeonZoneManager;
    private zones: Map<number, DungeonZone> = new Map();
    private nextZoneId: number = 0;
    
    // 副本区域配置
    private static readonly ZONE_MIN_X = -2000;
    private static readonly ZONE_MAX_X = 2000;
    private static readonly ZONE_MIN_Y = 2000;
    private static readonly ZONE_MAX_Y = 4000;
    private static readonly ZONE_WIDTH = 2000;  // 每个副本区域宽度
    private static readonly ZONE_HEIGHT = 2000; // 每个副本区域高度
    private static readonly DUNGEON_HEIGHT = 128;
    
    private constructor() {
        this.InitializeZones();
        print('[DungeonZoneManager] 副本区域管理器初始化');
    }
    
    public static GetInstance(): DungeonZoneManager {
        if (!DungeonZoneManager.instance) {
            DungeonZoneManager.instance = new DungeonZoneManager();
        }
        return DungeonZoneManager.instance;
    }
    
    /**
     * 初始化区域池
     * 将整个区域分割成 2x1 = 2 个子区域
     */
    private InitializeZones(): void {
        const totalWidth = DungeonZoneManager.ZONE_MAX_X - DungeonZoneManager.ZONE_MIN_X;
        const totalHeight = DungeonZoneManager.ZONE_MAX_Y - DungeonZoneManager.ZONE_MIN_Y;
        
        const cols = Math.floor(totalWidth / DungeonZoneManager.ZONE_WIDTH);
        const rows = Math.floor(totalHeight / DungeonZoneManager.ZONE_HEIGHT);
        
        print(`[DungeonZoneManager] 创建区域池: ${cols}x${rows} = ${cols * rows} 个区域`);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const minX = DungeonZoneManager.ZONE_MIN_X + col * DungeonZoneManager.ZONE_WIDTH;
                const maxX = minX + DungeonZoneManager.ZONE_WIDTH;
                const minY = DungeonZoneManager.ZONE_MIN_Y + row * DungeonZoneManager.ZONE_HEIGHT;
                const maxY = minY + DungeonZoneManager.ZONE_HEIGHT;
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                
                const zone: DungeonZone = {
                    id: this.nextZoneId++,
                    centerX,
                    centerY,
                    minX,
                    maxX,
                    minY,
                    maxY,
                    occupied: false
                };
                
                this.zones.set(zone.id, zone);
                print(`[DungeonZoneManager] 区域 ${zone.id}: 中心(${centerX}, ${centerY}), 范围[${minX}-${maxX}, ${minY}-${maxY}]`);
            }
        }
    }
    
    /**
     * 分配一个空闲区域
     */
    public AllocateZone(instanceId: string): DungeonZone | null {
        for (const zone of this.zones.values()) {
            if (!zone.occupied) {
                zone.occupied = true;
                zone.instanceId = instanceId;
                print(`[DungeonZoneManager] 分配区域 ${zone.id} 给副本 ${instanceId}`);
                return zone;
            }
        }
        
        print(`[DungeonZoneManager] 错误：没有空闲区域可分配！`);
        return null;
    }
    
    /**
     * 释放区域
     */
    public ReleaseZone(zoneId: number): void {
        const zone = this.zones.get(zoneId);
        if (zone) {
            print(`[DungeonZoneManager] 释放区域 ${zoneId}，之前占用者: ${zone.instanceId}`);
            
            // 清理区域内所有实体
            this.CleanupZone(zone);
            
            zone.occupied = false;
            zone.instanceId = undefined;
        }
    }
    
    /**
     * 通过副本ID释放区域
     */
    public ReleaseZoneByInstance(instanceId: string): void {
        for (const zone of this.zones.values()) {
            if (zone.instanceId === instanceId) {
                this.ReleaseZone(zone.id);
                return;
            }
        }
    }
    
/**
 * 清理区域内的所有实体
 */
/**
 * 清理区域内的所有实体
 */
private CleanupZone(zone: DungeonZone): void {
    print(`[DungeonZoneManager] 清理区域 ${zone.id} 内的实体`);
    
    const center = Vector(zone.centerX, zone.centerY, DungeonZoneManager.DUNGEON_HEIGHT);
    const radius = Math.sqrt(
        Math.pow(DungeonZoneManager.ZONE_WIDTH, 2) + 
        Math.pow(DungeonZoneManager.ZONE_HEIGHT, 2)
    ) / 2;
    
    // 清理单位
    const units = Entities.FindAllInSphere(center, radius) as CDOTA_BaseNPC[];
    let cleanedCount = 0;
    
    // ✅ 使用 filter 过滤，避免 continue
    const unitsToRemove = units.filter(unit => {
        if (! unit || !IsValidEntity(unit) || unit.IsNull()) {
            return false;
        }
        
        // 检查是否是玩家英雄
        try {
            if (unit.IsRealHero && unit.IsRealHero()) {
                return false;
            }
        } catch (e) {
            // 忽略
        }
        
        // 检查类名
        try {
            const className = unit.GetClassname();
            return (className === "npc_dota_creature" || 
                    className.includes("neutral") ||
                    className === "prop_dynamic" ||
                    className.includes("npc_dota_creep"));
        } catch (e) {
            return false;
        }
    });
    
    // 移除筛选出的单位
    for (const unit of unitsToRemove) {
        try {
            UTIL_Remove(unit);
            cleanedCount++;
        } catch (e) {
            // 忽略
        }
    }
    
    print(`[DungeonZoneManager] 区域 ${zone.id} 清理完成，移除 ${cleanedCount} 个实体`);
}
    
    /**
     * 获取区域中心位置
     */
    public GetZoneCenter(zoneId: number): Vector | null {
        const zone = this.zones.get(zoneId);
        if (zone) {
            return Vector(zone.centerX, zone.centerY, DungeonZoneManager.DUNGEON_HEIGHT);
        }
        return null;
    }
    
    /**
     * 获取所有区域信息（调试用）
     */
    public GetZonesInfo(): string {
        let info = `区域池状态 (${this.zones.size} 个区域):\n`;
        for (const zone of this.zones.values()) {
            const status = zone.occupied ? `占用(${zone.instanceId})` : '空闲';
            info += `  区域 ${zone.id}: ${status} - 中心(${zone.centerX}, ${zone.centerY})\n`;
        }
        return info;
    }
}

/**
 * 获取区域管理器
 */
export function GetDungeonZoneManager(): DungeonZoneManager {
    return DungeonZoneManager.GetInstance();
}