import { test } from '@playwright/test';

test.describe('Combat Hit Feedback & Impact Verification', () => {
  test('verify enemy hit flash, floating damage numbers, and impact sparks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');
    await page.click('#start-btn');
    await page.waitForTimeout(600);

    // 直接启动 RunScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) {
        menuScene.scene.start('RunScene', { characterId: 'wok_master' });
      }
    });
    await page.waitForTimeout(600);

    // 在玩家周围生成几个怪物并让武器命中
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.world) {
        const world = runScene.world;
        const px = world.player.position.x;
        const py = world.player.position.y;
        for (let i = 0; i < 4; i++) {
          const enemy = world.enemyPool.acquire();
          enemy.spawn(
            world.spawnerSystem['enemyDefs']?.hungry_ghost || {
              id: 'hungry_ghost',
              nameKey: '饥饿游魂',
              category: 'normal',
              maxHp: 200,
              moveSpeed: 50,
              contactDamage: 0,
              radius: 14,
              knockbackResistance: 0.1,
              expValue: 2,
              ingredientChance: 0.3,
              ingredientValue: 1,
              color: '#8fa3a6',
              assetKey: 'enemy_hungry_ghost',
              behaviors: [],
            },
            px + 35 + i * 10,
            py,
          );
        }
      }
    });

    // 等待 800ms 让铁锅挥舞击中产生白闪、火花与飘字
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/combat-hit-feedback.png' });
  });
});
