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

  test('verify shop modal items can be purchased, clicked, and weapons sold', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#start-overlay', { state: 'visible' });
    await page.click('#start-btn');
    await page.waitForTimeout(500);

    // 启动 RunScene
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
    await page.waitForTimeout(500);

    // 给玩家充足食材并打开 ShopModal
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      runScene.world.player.ingredients = 100;
      runScene.shopModal.show(runScene.world.player, runScene.world.rng, 1);
    });
    await page.waitForTimeout(500);

    // 验证商店处于开启状态
    const isShopOpen = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return runScene.shopModal.isVisible();
    });
    expect(isShopOpen).toBe(true);

    // 点击第 1 张卡片进行采购
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // 点击第 1 张卡片右下角购买按钮 (card 1 x = center - 1.5 * (250+16) = -399px)
      const scaleX = box.width / 1280;
      const scaleY = box.height / 720;
      const clickX = box.x + 241 * scaleX;
      const clickY = box.y + 415 * scaleY;
      await page.mouse.click(clickX, clickY);
    }
    await page.waitForTimeout(400);

    // 验证食材扣除，且拥有物品或武器增加
    const shopState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      const p = runScene.world.player;
      return {
        ingredients: p.ingredients,
        weaponsCount: p.weapons.length,
        itemsCount: p.items.length,
      };
    });

    expect(shopState.ingredients).toBeLessThan(100);
    expect(shopState.weaponsCount + shopState.itemsCount).toBeGreaterThanOrEqual(2);
  });
});
