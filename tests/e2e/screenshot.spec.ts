import { test } from '@playwright/test';

test.describe('Web Survivor Full Workflow Visual Audit', () => {
  test('Capture all key gameplay steps on Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');

    // 环节 1：启动手势解锁层
    await page.waitForSelector('#start-overlay');
    await page.screenshot({ path: 'test-results/audit-01-start-overlay.png' });

    // 环节 2：主菜单 / 角色三选一界面
    await page.click('#start-btn');
    await page.waitForFunction(() => {
      const game = (window as any).__PHASER_GAME__;
      return game && game.scene && game.scene.isActive('MenuScene');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/audit-02-character-menu.png' });

    // 环节 3：进入战斗（第 1 波夜战）
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
    await page.screenshot({ path: 'test-results/audit-03-battle-wave1.png' });

    // 环节 4：升级三选一弹窗
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.levelUpModal) {
        runScene.levelUpModal.show(runScene.world.player, runScene.world.rng);
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-04-levelup-3choices.png' });

    // 环节 5：夜市整备商店弹窗
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.shopModal) {
        runScene.levelUpModal.hide();
        runScene.shopModal.show(runScene.world.player, runScene.world.rng, 1);
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-05-shop-preparation.png' });

    // 环节 6：暂停弹窗
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.pauseModal) {
        runScene.shopModal.hide();
        runScene.pauseModal.show(runScene.world.player, runScene.world);
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-06-pause-modal.png' });

    // 环节 6.1：游戏画面与震动设置弹窗
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.settingsModal) {
        runScene.pauseModal.hide();
        runScene.settingsModal.show();
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-11-settings-modal.png' });

    // 环节 6.2：开发者测试指令弹窗 (Debug Menu)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.debugModal) {
        runScene.settingsModal.hide();
        runScene.debugModal.show(runScene.world);
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-12-debug-modal.png' });

    // 环节 6.3：百味神魔全图鉴系统弹窗 (Codex Modal)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene && runScene.codexModal) {
        runScene.debugModal.hide();
        runScene.codexModal.show();
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/audit-13-codex-modal.png' });

    // 环节 7：营业结算界面 (ResultsScene)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      if (runScene) {
        runScene.codexModal?.hide();
        runScene.debugModal?.hide();
        runScene.pauseModal?.hide();
        runScene.scene.start('ResultsScene', {
          isVictory: false,
          characterId: 'wok_master',
          waveReached: 6,
          stats: {
            totalDamageDealt: 12580,
            totalKills: 142,
            ingredientsEarned: 95,
            timeSurvivedSec: 245,
            damageByWeapon: {
              iron_wok: 8420,
              cleaver: 3160,
              stove_flame: 1000,
            },
          },
          activeRecipes: [
            {
              id: 'spicy_fire_wok',
              transformation: {
                transformedNameKey: '爆炒火环',
              },
            },
          ],
          seed: 12345,
        });
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/audit-07-settlement-results.png' });
  });

  test('Capture Mobile Portrait & Landscape Experience', async ({ page }) => {
    // 手机竖屏
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');
    await page.click('#start-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/audit-08-mobile-portrait-menu.png' });

    // 手机横屏
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');
    await page.click('#start-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/audit-09-mobile-landscape-menu.png' });
  });
});
