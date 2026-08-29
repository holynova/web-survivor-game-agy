import { expect, test } from '@playwright/test';

test.describe('Web Survivor Game E2E Smoke Test', () => {
  test('should load page, display start overlay, and launch Phaser game canvas', async ({
    page,
  }) => {
    // 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. 验证标题与启动页
    await expect(page).toHaveTitle(/山海夜市/);
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();

    // 2. 点击进入游戏
    await startBtn.click();

    // 3. 验证启动遮罩隐藏并挂载 Canvas
    const startOverlay = page.locator('#start-overlay');
    await expect(startOverlay).toHaveClass(/hidden/);

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // 4. 等待 2 秒确认无崩溃与异常
    await page.waitForTimeout(2000);
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toEqual([]);
  });
});
