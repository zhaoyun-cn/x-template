import { 
    BOSS_LOOT, 
    DIFFICULTY_REWARDS, 
    DungeonDifficulty,
    ItemDrop,
    CHEST_COMMON_ITEMS,
    CHEST_RARE_ITEMS,
    CHEST_EPIC_ITEMS,
    CHEST_LEGENDARY_ITEMS
} from "./reward_config";

export class LootSystem {
    
    /**
     * Boss 死亡时掉落物品
     */
    public static DropBossLoot(boss: CDOTA_BaseNPC, difficulty: DungeonDifficulty, playerId: PlayerID): void {
        print(`[LootSystem] Boss defeated! Dropping loot for difficulty: ${difficulty}`);
        
        const lootConfig = BOSS_LOOT[difficulty];
        const bossPos = boss.GetAbsOrigin();
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        
        if (!hero) return;
        
        // 1. 必掉物品
        for (const itemName of lootConfig.guaranteedItems) {
            this.CreateItemDrop(itemName, bossPos);
            print(`[LootSystem] Dropped guaranteed: ${itemName}`);
        }
        
        // 2.  随机掉落
        for (const itemDrop of lootConfig.randomItems) {
            if (RandomFloat(0, 1) <= itemDrop.dropChance) {
                const count = RandomInt(itemDrop.minCount, itemDrop.maxCount);
                for (let i = 0; i < count; i++) {
                    this.CreateItemDrop(itemDrop.itemName, bossPos);
                }
                print(`[LootSystem] Dropped random: ${itemDrop.itemName} x${count}`);
            }
        }
        
        // 3. 掉落金币
        const goldAmount = RandomInt(lootConfig. gold.min, lootConfig.gold.max);
        hero.ModifyGold(goldAmount, true, ModifyGoldReason. UNSPECIFIED);
        
        GameRules.SendCustomMessage(
            `<font color='#FFD700'>💰 Boss掉落：+${goldAmount}金币</font>`,
            playerId,
            0
        );
    }
    
    /**
     * 通关奖励
     */
    public static GiveCompletionReward(playerId: PlayerID, difficulty: DungeonDifficulty): void {
        print(`[LootSystem] Giving completion reward for difficulty: ${difficulty}`);
        
        const reward = DIFFICULTY_REWARDS[difficulty];
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        
        if (!hero) return;
        
        // 1. 金币
        hero.ModifyGold(reward. gold, true, ModifyGoldReason.UNSPECIFIED);
        
        // 2.  经验
        hero.AddExperience(reward.experience, ModifyXpReason.UNSPECIFIED, false, true);
        
        // 3. 奖励物品直接放入背包
        for (const itemName of reward.items) {
            // ⭐ 修复：使用 null 而不是 hero
            const item = CreateItem(itemName, null, null);
            if (item) {
                hero.AddItem(item);
                print(`[LootSystem] Awarded item: ${itemName}`);
            }
        }
        
        // 显示奖励消息
        let difficultyText = "";
        if (difficulty === DungeonDifficulty.EASY_1 || difficulty === DungeonDifficulty.EASY_2 || difficulty === DungeonDifficulty.EASY_3) {
            difficultyText = "简单";
        } else if (difficulty === DungeonDifficulty.NORMAL_1 || difficulty === DungeonDifficulty.NORMAL_2 || difficulty === DungeonDifficulty.NORMAL_3) {
            difficultyText = "普通";
        } else if (difficulty === DungeonDifficulty.HARD_1 || difficulty === DungeonDifficulty.HARD_2 || difficulty === DungeonDifficulty.HARD_3) {
            difficultyText = "困难";
        }
        
        GameRules. SendCustomMessage(
            `<font color='#00FF00'>🎉 ${difficultyText}难度通关奖励：+${reward.gold}金币 +${reward.experience}经验</font>`,
            playerId,
            0
        );
        
        Timers.CreateTimer(1.0, () => {
            GameRules.SendCustomMessage(
                `<font color='#FF6EC7'>🎁 获得物品：${reward.items.join(", ")}</font>`,
                playerId,
                0
            );
            return undefined;
        });
    }
    
    /**
     * 在地面创建物品掉落
     */
    private static CreateItemDrop(itemName: string, position: Vector): void {
        // ⭐ 修复：使用 null 替代 undefined
        const item = CreateItem(itemName, null, null);
        if (item) {
            // 随机偏移位置，避免物品重叠
            const offsetX = RandomFloat(-100, 100);
            const offsetY = RandomFloat(-100, 100);
            const dropPos = Vector(position.x + offsetX, position.y + offsetY, position.z);
            
            CreateItemOnPositionSync(dropPos, item);
            
            // 特效
            const particle = ParticleManager.CreateParticle(
                "particles/generic_gameplay/dropped_item.vpcf",
                ParticleAttachment.CUSTOMORIGIN,
                undefined
            );
            ParticleManager.SetParticleControl(particle, 0, dropPos);
            ParticleManager. ReleaseParticleIndex(particle);
        }
    }
    
    /**
     * 生成宝箱
     */
    public static SpawnChest(position: Vector, chestType: "common" | "rare" | "epic" | "legendary"): CDOTA_Item_Physical | undefined {
        print(`[LootSystem] Spawning ${chestType} chest at ${position}`);
        
        // 创建宝箱实体（使用物理物品）
        let itemPool: string[];
        
        switch (chestType) {
            case "common":
                itemPool = CHEST_COMMON_ITEMS;
                break;
            case "rare":
                itemPool = CHEST_RARE_ITEMS;
                break;
            case "epic":
                itemPool = CHEST_EPIC_ITEMS;
                break;
            case "legendary":
                itemPool = CHEST_LEGENDARY_ITEMS;
                break;
        }
        
        // 从物品池随机选择
        const randomItem = itemPool[RandomInt(0, itemPool.length - 1)];
        // ⭐ 修复：使用 null
        const item = CreateItem(randomItem, null, null);
        
        if (item) {
            const chest = CreateItemOnPositionSync(position, item);
            
            // 宝箱特效
            const particle = ParticleManager.CreateParticle(
                "particles/items2_fx/teleport_end.vpcf",
                ParticleAttachment.CUSTOMORIGIN,
                undefined
            );
            ParticleManager.SetParticleControl(particle, 0, position);
            ParticleManager.ReleaseParticleIndex(particle);
            
            return chest;
        }
        
        return undefined;
    }
}