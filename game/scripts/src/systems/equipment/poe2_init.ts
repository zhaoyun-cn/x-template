/**
 * POE2 装备系统 - 初始化
 * 测试命令已迁移到 dev/test_commands.ts
 */

// ==================== 初始化标记 ====================
let initialized = false;

// ==================== 初始化函数 ====================
export function InitPOE2System(): void {
    if (initialized) {
        print('[POE2] 系统已初始化，跳过');
        return;
    }

    print('========================================');
    print('[POE2] 开始初始化 POE2 装备系统');
    print('========================================');

    initialized = true;
    print('[POE2] ✓ 初始化完成！');
    print('[POE2] 测试命令请查看 -poe2help');
}

