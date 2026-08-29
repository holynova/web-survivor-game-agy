import { expect, test } from '@playwright/test';

test.describe('Debug Menu & Full-Screen Cover Verification', () => {
  test('verify full-screen cover on start overlay and debug menu button clicks', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#start-overlay', { state: 'visible' });

    // 1. 验证首屏封面占据全屏 (全屏背景类存在)
    const startOverlay = page.locator('#start-overlay');
    await expect(startOverlay).toHaveClass(/full-cover-overlay/);

    // 截屏首屏全屏背景
    await page.screenshot({ path: 'test-results/audit-01-start-overlay-fullscreen.png' });

    // 2. 点击开启营业进入游戏
    await page.click('#start-btn');
    await page.waitForTimeout(600);

    // 3. 启动 RunScene 场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) {
        menuScene.scene.start('RunScene', { characterId: 'wok_master' });
      }
    });

    await page.waitForFunction(() => {
      const game = (window as any).__PHASER_GAME__;
      return game && game.scene && game.scene.isActive('RunScene');
    });
    await page.waitForTimeout(600);

    // 4. 打开调试测试菜单 (呼出 DebugModal)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.debugModal) {
        runScene.world.gameState = 'paused';
        runScene.world.clock.pause();
        runScene.debugModal.show(runScene.world);
      }
    });
    await page.waitForTimeout(500);

    // 截屏打开状态
    await page.screenshot({ path: 'test-results/audit-12-debug-modal-active.png' });

    // 5. 点击 "+100 食材" 按钮 (验证实际点击事件触发)
    const initialIngredients = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return runScene.world.player.ingredients;
    });

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();

    if (box) {
      // "+100 食材" 按钮位于第 2 行中间
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height / 2 - 250 + 105 + 50 + 14;
      await page.mouse.click(clickX, clickY);
    }
    await page.waitForTimeout(300);

    // 验证食材数量确实增加了 100
    const newIngredients = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return runScene.world.player.ingredients;
    });

    expect(newIngredients).toBe(initialIngredients + 100);

    // 6. 点击关闭测试面板按钮
    if (box) {
      const closeX = box.x + box.width / 2;
      const closeY = box.y + box.height / 2 + 250 - 45;
      await page.mouse.click(closeX, closeY);
    }
    await page.waitForTimeout(300);

    const isDebugVisible = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return runScene.debugModal.isVisible();
    });
    expect(isDebugVisible).toBe(false);
  });
});
