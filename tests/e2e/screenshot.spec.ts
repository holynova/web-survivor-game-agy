import { test } from '@playwright/test';

test.describe('Visual Screenshot Tests', () => {
  test('capture menu, levelup modal and shop modal', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');

    // 1. 点击 HTML 开始按钮
    await page.click('#start-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/desktop-menu.png' });

    // 2. 点击 Phaser 菜单中的“开始夜市营业”按钮
    const canvas = await page.waitForSelector('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const scaleX = box.width / 960;
      const scaleY = box.height / 540;

      // 点击开始按钮 (480, 500)
      await page.mouse.click(box.x + 480 * scaleX, box.y + 500 * scaleY);
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'test-results/desktop-battle.png' });

      // 3. 通过 Phaser 场景实例直接触发 LevelUpModal 展现
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const runScene = game.scene.getScene('RunScene');
        if (runScene && runScene.levelUpModal) {
          runScene.levelUpModal.show(runScene.world.player, runScene.world.rng);
        }
      });
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'test-results/desktop-levelup.png' });

      // 4. 关闭升级弹窗，展现 ShopModal (夜市商店)
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const runScene = game.scene.getScene('RunScene');
        if (runScene && runScene.shopModal) {
          runScene.levelUpModal.hide();
          runScene.shopModal.show(runScene.world.player, runScene.world.rng, runScene.world.waveSystem.currentWave.waveNumber);
        }
      });
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'test-results/desktop-shop.png' });
    }
  });
});
