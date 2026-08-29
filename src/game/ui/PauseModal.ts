import Phaser from 'phaser';
import { formatTags, TAG_NAMES } from '@/content/schemas/common';
import { Player } from '../entities/Player';
import { SimulationWorld } from '../simulation/world';

export class PauseModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onResumeCallback: () => void;
  private onRestartCallback: () => void;
  private onSettingsCallback?: () => void;
  private onCodexCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    onResume: () => void,
    onRestart: () => void,
    onSettings?: () => void,
    onCodex?: () => void,
  ) {
    this.scene = scene;
    this.onResumeCallback = onResume;
    this.onRestartCallback = onRestart;
    this.onSettingsCallback = onSettings;
    this.onCodexCallback = onCodex;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);
    this.container.setVisible(false);
  }

  public show(player?: Player, world?: SimulationWorld): void {
    this.container.removeAll(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. 半透明背景
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.98);
    bg.setScrollFactor(0);
    bg.setInteractive();
    this.container.add(bg);

    // 2. 面板主框 (1080 x 580)
    const cardW = 1080;
    const cardH = 580;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x0e171a, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 14);
    cardGfx.lineStyle(2, 0x3d5a5b, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 14);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 3. 顶部标题
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 22, '⏸ 游戏暂停 · 神厨当前状态详情', {
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    if (player) {
      const colW = 330;
      const colH = 420;
      const colY = height / 2 - 12;

      // 1. 左栏：已配厨具 (最多 4 把)
      this.renderWeaponsColumn(player, width / 2 - colW - 20, colY, colW, colH);

      // 2. 中栏：口味秘方 & 菜谱
      this.renderItemsColumn(player, width / 2, colY, colW, colH);

      // 3. 右栏：大厨全维属性 (双列紧凑排版，绝不撑破容器)
      this.renderStatsColumn(player, world, width / 2 + colW + 20, colY, colW, colH);
    }

    // 4. 底部控制按钮栏
    this.renderBottomButtons(width, height, cardH);

    this.container.setVisible(true);
  }

  private renderWeaponsColumn(player: Player, cx: number, cy: number, w: number, h: number): void {
    const card = this.scene.add.container(cx, cy);
    card.setScrollFactor(0);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(0x132025, 0.9);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(1.5, 0x2a9d8f, 0.8);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.setScrollFactor(0);
    card.add(bgGfx);

    const title = this.scene.add.text(0, -h / 2 + 14, `🔪 装备厨具 (${player.weapons.length}/${player.maxWeapons})`, {
      fontSize: '15px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    let startY = -h / 2 + 45;
    const slotH = 82;

    for (let i = 0; i < player.maxWeapons; i++) {
      const wState = player.weapons[i];
      const slotBox = this.scene.add.graphics();

      if (wState) {
        const wDef = wState.definition;
        const curLvlDef = wDef.levels[wState.level - 1];

        slotBox.fillStyle(0x0a1215, 0.8);
        slotBox.fillRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 8, 6);
        slotBox.lineStyle(1, 0x223a40, 0.9);
        slotBox.strokeRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 8, 6);
        card.add(slotBox);

        // 武器图标
        const iconKey = this.getWeaponTextureKey(wDef.id);
        const icon = this.scene.add.image(-w / 2 + 32, startY + (slotH - 8) / 2, iconKey);
        icon.setDisplaySize(32, 32);
        card.add(icon);

        // 武器名与等级
        const wName = this.scene.add.text(
          -w / 2 + 56,
          startY + 8,
          `${wDef.nameKey} (Lv.${wState.level})`,
          {
            fontSize: '13px',
            color: wDef.color || '#f4a261',
            fontStyle: 'bold',
          },
        );
        card.add(wName);

        // 描述
        const wDesc = this.scene.add.text(
          -w / 2 + 56,
          startY + 28,
          curLvlDef ? curLvlDef.descriptionKey : '',
          {
            fontSize: '11px',
            color: '#d8e2dc',
            wordWrap: { width: w - 85, useAdvancedWrap: true },
            lineSpacing: 2,
          },
        );
        card.add(wDesc);
      } else {
        // 空槽位
        slotBox.fillStyle(0x090e10, 0.5);
        slotBox.fillRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 8, 6);
        slotBox.lineStyle(1, 0x1a262b, 0.6);
        slotBox.strokeRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 8, 6);
        card.add(slotBox);

        const emptyText = this.scene.add.text(0, startY + (slotH - 8) / 2, `【空置槽位 ${i + 1}】升级或商店可添置`, {
          fontSize: '12px',
          color: '#55666c',
        });
        emptyText.setOrigin(0.5, 0.5);
        card.add(emptyText);
      }

      startY += slotH;
    }

    this.container.add(card);
  }

  private renderItemsColumn(player: Player, cx: number, cy: number, w: number, h: number): void {
    const card = this.scene.add.container(cx, cy);
    card.setScrollFactor(0);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(0x132025, 0.9);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(1.5, 0xf4a261, 0.8);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.setScrollFactor(0);
    card.add(bgGfx);

    const title = this.scene.add.text(0, -h / 2 + 14, `🌶️ 口味秘方 & 菜谱`, {
      fontSize: '15px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    let startY = -h / 2 + 45;

    // 1. 已激活菜谱
    if (player.activeRecipes.length > 0) {
      const recipeTitle = this.scene.add.text(-w / 2 + 16, startY, '🔥 质变绝技菜谱:', {
        fontSize: '13px',
        color: '#06d6a0',
        fontStyle: 'bold',
      });
      card.add(recipeTitle);
      startY += 20;

      for (const r of player.activeRecipes) {
        const rText = this.scene.add.text(
          -w / 2 + 16,
          startY,
          `• 【${r.transformation?.transformedNameKey || r.nameKey}】`,
          {
            fontSize: '12px',
            color: '#ffd166',
            wordWrap: { width: w - 32, useAdvancedWrap: true },
          },
        );
        card.add(rText);
        startY += 20;
      }
      startY += 8;
    }

    // 2. 被动食材秘方
    const itemTitle = this.scene.add.text(-w / 2 + 16, startY, '📦 已获秘方食材:', {
      fontSize: '13px',
      color: '#8fa3a6',
      fontStyle: 'bold',
    });
    card.add(itemTitle);
    startY += 20;

    if (player.items.length === 0) {
      const noItemText = this.scene.add.text(-w / 2 + 16, startY, '暂未采购秘方食材', {
        fontSize: '12px',
        color: '#55666c',
      });
      card.add(noItemText);
    } else {
      for (const item of player.items) {
        const itemText = this.scene.add.text(
          -w / 2 + 16,
          startY,
          `• ${item.definition.nameKey} (${item.count}/${item.definition.maxStacks}) - ${formatTags(item.definition.tags)}`,
          {
            fontSize: '11px',
            color: item.definition.color || '#e2ece9',
            wordWrap: { width: w - 32, useAdvancedWrap: true },
          },
        );
        card.add(itemText);
        startY += 20;
      }
    }

    this.container.add(card);
  }

  private renderStatsColumn(
    player: Player,
    world: SimulationWorld | undefined,
    cx: number,
    cy: number,
    w: number,
    h: number,
  ): void {
    const card = this.scene.add.container(cx, cy);
    card.setScrollFactor(0);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(0x132025, 0.9);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(1.5, 0x00f5d4, 0.8);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.setScrollFactor(0);
    card.add(bgGfx);

    const title = this.scene.add.text(0, -h / 2 + 14, `📊 大厨全维属性`, {
      fontSize: '15px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    // 双列网格排版，确保每项规整且不撑出容器
    const leftStats = [
      `❤️ 生命: ${Math.round(player.currentHp)}/${player.maxHp}`,
      `🏃 移速: ${Math.round(player.moveSpeed)}`,
      `⚔️ 伤害: +${Math.round((player.damageMultiplier - 1) * 100)}%`,
      `⚡ 攻频: +${Math.round((player.attackSpeedMultiplier - 1) * 100)}%`,
      `🎯 暴击: ${Math.round(player.critChance * 100)}%`,
    ];

    const rightStats = [
      `💥 爆伤: ${player.critMultiplier.toFixed(1)}x`,
      `🛡️ 护甲: ${player.armor}`,
      `🧲 拾取: ${player.pickupRadius}px`,
      `🥟 食材: ${player.ingredients}`,
      `✨ 双倍: ${world?.doubleLootRemaining || 0}个`,
    ];

    let startY = -h / 2 + 48;
    for (let i = 0; i < leftStats.length; i++) {
      // 左列
      const lText = this.scene.add.text(-w / 2 + 16, startY, leftStats[i], {
        fontSize: '12px',
        color: '#d8e2dc',
      });
      card.add(lText);

      // 右列
      const rText = this.scene.add.text(-w / 2 + 170, startY, rightStats[i], {
        fontSize: '12px',
        color: '#d8e2dc',
      });
      card.add(rText);

      startY += 26;
    }

    // 分割线与风味词条栏
    startY += 10;
    const divGfx = this.scene.add.graphics();
    divGfx.lineStyle(1, 0x223a40, 0.8);
    divGfx.lineBetween(-w / 2 + 16, startY, w / 2 - 16, startY);
    card.add(divGfx);

    startY += 12;
    const tagTitle = this.scene.add.text(-w / 2 + 16, startY, '🏷️ 激活风味词条:', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    card.add(tagTitle);

    startY += 22;
    const activeTags = Object.entries(player.tagCounts).filter(([, count]) => (count || 0) > 0);
    if (activeTags.length === 0) {
      const noTagText = this.scene.add.text(-w / 2 + 16, startY, '暂无风味词条共鸣', {
        fontSize: '12px',
        color: '#55666c',
      });
      card.add(noTagText);
    } else {
      const tagStrings = activeTags.map(([tag, count]) => {
        const name = TAG_NAMES[tag as keyof typeof TAG_NAMES] || tag;
        return `${name} Lv.${count}`;
      });
      const tagContent = this.scene.add.text(-w / 2 + 16, startY, tagStrings.join('  ·  '), {
        fontSize: '12px',
        color: '#00f5d4',
        wordWrap: { width: w - 32, useAdvancedWrap: true },
        lineSpacing: 4,
      });
      card.add(tagContent);
    }

    this.container.add(card);
  }

  private renderBottomButtons(width: number, height: number, cardH: number): void {
    const btnY = height / 2 + cardH / 2 - 38;
    const btnW = 150;
    const btnH = 38;
    const gap = 16;
    const totalW = 5 * btnW + 4 * gap;
    const startX = width / 2 - totalW / 2 + btnW / 2;

    // 1. 继续游戏
    const resumeX = startX;
    const resGfx = this.scene.add.graphics();
    resGfx.fillStyle(0x2a9d8f, 1);
    resGfx.fillRoundedRect(resumeX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    resGfx.setScrollFactor(0);
    this.container.add(resGfx);

    const resText = this.scene.add.text(resumeX, btnY, '▶️ 继续出摊', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    resText.setOrigin(0.5, 0.5);
    resText.setScrollFactor(0);
    this.container.add(resText);

    const resZone = this.scene.add.zone(resumeX, btnY, btnW, btnH);
    resZone.setScrollFactor(0);
    resZone.setInteractive({ useHandCursor: true });
    resZone.on('pointerdown', () => {
      this.hide();
      this.onResumeCallback();
    });
    this.container.add(resZone);

    // 2. 查看图鉴
    const cdxX = startX + (btnW + gap);
    const cdxGfx = this.scene.add.graphics();
    cdxGfx.fillStyle(0x193b3f, 1);
    cdxGfx.fillRoundedRect(cdxX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    cdxGfx.lineStyle(1.5, 0x00f5d4, 1);
    cdxGfx.strokeRoundedRect(cdxX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    cdxGfx.setScrollFactor(0);
    this.container.add(cdxGfx);

    const cdxText = this.scene.add.text(cdxX, btnY, '📖 查看图鉴', {
      fontSize: '14px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    cdxText.setOrigin(0.5, 0.5);
    cdxText.setScrollFactor(0);
    this.container.add(cdxText);

    const cdxZone = this.scene.add.zone(cdxX, btnY, btnW, btnH);
    cdxZone.setScrollFactor(0);
    cdxZone.setInteractive({ useHandCursor: true });
    cdxZone.on('pointerdown', () => {
      this.hide();
      if (this.onCodexCallback) {
        this.onCodexCallback();
      }
    });
    this.container.add(cdxZone);

    // 3. 游戏设置
    const setX = startX + 2 * (btnW + gap);
    const setGfx = this.scene.add.graphics();
    setGfx.fillStyle(0x3d5a5b, 1);
    setGfx.fillRoundedRect(setX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    setGfx.setScrollFactor(0);
    this.container.add(setGfx);

    const setText = this.scene.add.text(setX, btnY, '⚙️ 偏好设置', {
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    setText.setOrigin(0.5, 0.5);
    setText.setScrollFactor(0);
    this.container.add(setText);

    const setZone = this.scene.add.zone(setX, btnY, btnW, btnH);
    setZone.setScrollFactor(0);
    setZone.setInteractive({ useHandCursor: true });
    setZone.on('pointerdown', () => {
      this.hide();
      if (this.onSettingsCallback) {
        this.onSettingsCallback();
      }
    });
    this.container.add(setZone);

    // 4. 重新开始
    const restX = startX + 3 * (btnW + gap);
    const restGfx = this.scene.add.graphics();
    restGfx.fillStyle(0xe76f51, 1);
    restGfx.fillRoundedRect(restX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    restGfx.setScrollFactor(0);
    this.container.add(restGfx);

    const restText = this.scene.add.text(restX, btnY, '🔄 重新开始', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    restText.setOrigin(0.5, 0.5);
    restText.setScrollFactor(0);
    this.container.add(restText);

    const restZone = this.scene.add.zone(restX, btnY, btnW, btnH);
    restZone.setScrollFactor(0);
    restZone.setInteractive({ useHandCursor: true });
    restZone.on('pointerdown', () => {
      this.hide();
      this.onRestartCallback();
    });
    this.container.add(restZone);

    // 5. 返回主菜单
    const menuX = startX + 4 * (btnW + gap);
    const menuGfx = this.scene.add.graphics();
    menuGfx.fillStyle(0x1f3036, 1);
    menuGfx.fillRoundedRect(menuX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    menuGfx.setScrollFactor(0);
    this.container.add(menuGfx);

    const menuText = this.scene.add.text(menuX, btnY, '🚪 退出菜单', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    menuText.setOrigin(0.5, 0.5);
    menuText.setScrollFactor(0);
    this.container.add(menuText);

    const menuZone = this.scene.add.zone(menuX, btnY, btnW, btnH);
    menuZone.setScrollFactor(0);
    menuZone.setInteractive({ useHandCursor: true });
    menuZone.on('pointerdown', () => {
      this.hide();
      this.scene.scene.start('MenuScene');
    });
    this.container.add(menuZone);
  }

  private getWeaponTextureKey(weaponId: string): string {
    const key = `weapon_${weaponId}`;
    if (this.scene.textures.exists(key)) return key;
    if (weaponId === 'cleaver') return 'weapon_cleaver';
    if (weaponId === 'bamboo_skewer') return 'item_skewer';
    if (weaponId === 'seasoning_jar') return 'item_potion';
    return 'weapon_cleaver';
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
