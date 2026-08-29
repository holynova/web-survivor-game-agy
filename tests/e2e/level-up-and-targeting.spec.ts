import { test, expect } from '@playwright/test';

test.describe('Level Up Selection & Walking Auto-Targeting Tests', () => {
  test('verify level up modal is clickable and selectable after camera scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');
    await page.click('#start-btn');
    await page.waitForTimeout(500);

    // 启动游戏
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) {
        menuScene.scene.start('RunScene', { characterId: 'wok_master' });
      }
    });
    await page.waitForTimeout(600);

    // 移动玩家一段距离使镜头发生位移 (Camera Scroll)
    await page.keyboard.down('KeyD');
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyD');
    await page.keyboard.up('KeyS');

    // 触发升级弹窗
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      const player = runScene.world.player;
      if (player.addExp(25)) {
        runScene.world.gameState = 'levelup';
        runScene.world.clock.pause();
        runScene.levelUpModal.show(player, runScene.world.rng);
      }
    });

    await page.waitForTimeout(500);

    // 检查升级弹窗已显示
    const isModalVisible = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return runScene.levelUpModal.isVisible();
    });
    expect(isModalVisible).toBe(true);

    // 截图记录升级弹窗
    await page.screenshot({ path: 'test-results/audit-10-levelup-clickable.png' });

    // 点击第一张卡片 (位于屏幕中心偏左 card 1 位置)
    const canvas = await page.waitForSelector('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const scaleX = box.width / 1280;
      const scaleY = box.height / 720;
      // 卡片 1 大致在 (320, 400)
      await page.mouse.click(box.x + 320 * scaleX, box.y + 400 * scaleY);
    }
    await page.waitForTimeout(600);

    // 验证弹窗已关闭且玩家已恢复游玩状态
    const stateAfter = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      return {
        isModalVisible: runScene.levelUpModal.isVisible(),
        gameState: runScene.world.gameState,
      };
    });

    expect(stateAfter.isModalVisible).toBe(false);
    expect(stateAfter.gameState).toBe('playing');
  });

  test('verify weapon auto targets nearest monster while player is walking away', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#start-btn');
    await page.click('#start-btn');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) {
        menuScene.scene.start('RunScene', { characterId: 'wok_master' });
      }
    });
    await page.waitForTimeout(600);

    // 在玩家右上方生成怪物，玩家往左下方移动 (W/A/S/D)
    const targetingResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runScene = game.scene.getScene('RunScene');
      const world = runScene.world;
      const player = world.player;

      // 玩家向左下方移动输入
      world.inputVector = { x: -1, y: 1 };
      player.facingDirection.set(-1, 1).normalize();

      // 在玩家右上方 (dx=100, dy=-100) 放置一只怪物
      const enemy = world.enemyPool.acquire();
      enemy.spawn(
        world.spawnerSystem['enemyDefs']?.hungry_ghost || {
          id: 'hungry_ghost',
          nameKey: '饥饿游魂',
          category: 'normal',
          maxHp: 30,
          moveSpeed: 60,
          contactDamage: 8,
          radius: 14,
          knockbackResistance: 0.1,
          expValue: 2,
          ingredientChance: 0.3,
          ingredientValue: 1,
          color: '#8fa3a6',
          assetKey: 'enemy_hungry_ghost',
          behaviors: [],
        },
        player.position.x + 100,
        player.position.y - 100,
      );

      // 计算武器瞄准方向
      const targetDir = world.weaponSystem['findTargetDirection'](
        player,
        'nearest',
        world.enemyPool.getActiveItems(),
        200,
      );

      return {
        walkingDirX: player.facingDirection.x,
        walkingDirY: player.facingDirection.y,
        targetDirX: targetDir.x,
        targetDirY: targetDir.y,
      };
    });

    // 玩家朝向 (-0.707, 0.707) 往左下
    expect(targetingResult.walkingDirX).toBeLessThan(0);
    expect(targetingResult.walkingDirY).toBeGreaterThan(0);

    // 武器索敌方向应该是 (+0.707, -0.707) 往右上敌人
    expect(targetingResult.targetDirX).toBeGreaterThan(0);
    expect(targetingResult.targetDirY).toBeLessThan(0);
  });
});
