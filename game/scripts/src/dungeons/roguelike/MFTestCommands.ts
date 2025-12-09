import { MagicFindSystem } from './MagicFindSystem';
import { BUFF_CHOICES, DEBUFF_CHOICES } from './RoomChoicesConfig';

/**
 * MF 测试命令
 */
export class MFTestCommands {
    public static RegisterCommands(): void {
        // 显示当前 MF
        Convars.RegisterCommand('-mf_show', () => {
            for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
                if (PlayerResource.IsValidPlayerID(i)) {
                    const totalMF = MagicFindSystem.GetTotalMF(i as PlayerID);
                    const breakdown = MagicFindSystem.GetMFBreakdown(i as PlayerID);
                    
                    print('='.repeat(50));
                    print(`[MF] 玩家 ${i} 总 MF: ${totalMF}%`);
                    print('[MF] 详细信息: ');
                    
                    for (const modifier of breakdown) {
                        print(`  - ${modifier.source}:  ${modifier.value}% (${modifier.type})`);
                    }
                    
                    print('='.repeat(50));
                    break;
                }
            }
        }, '显示当前 MF', 0);
        
        // 应用 Buff（测试）
        Convars.RegisterCommand('-mf_buff', (name, arg) => {
            const index = parseInt(arg) || 0;
            const choice = BUFF_CHOICES[index];
            
            if (! choice) {
                print(`[MF] 错误：找不到 Buff 索引 ${index}`);
                return;
            }
            
            for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
                if (PlayerResource.IsValidPlayerID(i)) {
                    MagicFindSystem.ApplyRoomChoice(i as PlayerID, choice);
                    print(`[MF] 应用 Buff: ${choice.name}`);
                    break;
                }
            }
        }, '应用 Buff (索引 0-3)', 0);
        
        // 应用 Debuff（测试）
        Convars.RegisterCommand('-mf_debuff', (name, arg) => {
            const index = parseInt(arg) || 0;
            const choice = DEBUFF_CHOICES[index];
            
            if (!choice) {
                print(`[MF] 错误：找不到 Debuff 索引 ${index}`);
                return;
            }
            
            for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
                if (PlayerResource.IsValidPlayerID(i)) {
                    MagicFindSystem.ApplyRoomChoice(i as PlayerID, choice);
                    print(`[MF] 应用 Debuff: ${choice.name}`);
                    break;
                }
            }
        }, '应用 Debuff (索引 0-4)', 0);
        
        // 清除房间效果
        Convars.RegisterCommand('-mf_clear', () => {
            for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
                if (PlayerResource.IsValidPlayerID(i)) {
                    MagicFindSystem.ClearRoomChoices(i as PlayerID);
                    print(`[MF] 清除玩家 ${i} 的房间效果`);
                    break;
                }
            }
        }, '清除房间效果', 0);
        
        // 列出所有选择
        Convars.RegisterCommand('-mf_list', () => {
            print('='.repeat(50));
            print('[MF] Buff 选择:');
            BUFF_CHOICES.forEach((choice, index) => {
                print(`  ${index}: ${choice.name} (MF ${choice.mfModifier}%)`);
            });
            
            print('[MF] Debuff 选择:');
            DEBUFF_CHOICES.forEach((choice, index) => {
                print(`  ${index}: ${choice.name} (MF +${choice.mfModifier}%)`);
            });
            print('='.repeat(50));
        }, '列出所有选择', 0);
        
        print('[MFTestCommands] ✅ MF 测试命令已注册');
    }
}