import Phaser from 'phaser';
import { formatTags } from '@/content/schemas/common';
import { Player } from '../entities/Player';
import { SimulationWorld } from '../simulation/world';
import { SynergySystem } from '../systems/SynergySystem';

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
    const title = this.scene.add.text(width / 2, height / 2 - cardH / 2 + 20, '⏸ 游戏暂停 · 神厨当前状态详情', {
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    if (player) {
      const colW = 330;
      const colH = 425;
      const colY = height / 2 - 10;

      // 1. 左栏：已配厨具 (最多 6 把)
      this.renderWeaponsColumn(player, width / 2 - colW - 20, colY, colW, colH);

      // 2. 中栏：口味秘方 & 菜谱
      this.renderItemsColumn(player, width / 2, colY, colW, colH);

      // 3. 右栏：大厨 12 维属性与羁绊
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

    const title = this.scene.add.text(0, -h / 2 + 12, `🔪 装备厨具 (${player.weapons.length}/${player.maxWeapons})`, {
      fontSize: '15px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    let startY = -h / 2 + 40;
    const maxSlots = player.maxWeapons;
    const slotH = maxSlots > 4 ? 58 : 82;

    for (let i = 0; i < maxSlots; i++) {
      const wState = player.weapons[i];
      const slotBox = this.scene.add.graphics();

      if (wState) {
        const wDef = wState.definition;
        const curLvlDef = wDef.levels[wState.level - 1];

        slotBox.fillStyle(0x0a1215, 0.8);
        slotBox.fillRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 6, 6);
        slotBox.lineStyle(1, 0x223a40, 0.9);
        slotBox.strokeRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 6, 6);
        card.add(slotBox);

        // 武器图标
        const iconKey = this.getWeaponTextureKey(wDef.id);
        const icon = this.scene.add.image(-w / 2 + 28, startY + (slotH - 6) / 2, iconKey);
        icon.setDisplaySize(26, 26);
        card.add(icon);

        // 武器名与等级
        const wName = this.scene.add.text(
          -w / 2 + 48,
          startY + (maxSlots > 4 ? 4 : 8),
          `${wDef.nameKey} (Lv.${wState.level})`,
          {
            fontSize: '12px',
            color: wDef.color || '#f4a261',
            fontStyle: 'bold',
          },
        );
        card.add(wName);

        // 描述
        const wDesc = this.scene.add.text(
          -w / 2 + 48,
          startY + (maxSlots > 4 ? 20 : 28),
          curLvlDef ? curLvlDef.descriptionKey : '',
          {
            fontSize: '10px',
            color: '#d8e2dc',
            wordWrap: { width: w - 75, useAdvancedWrap: true },
            lineSpacing: 1,
          },
        );
        card.add(wDesc);
      } else {
        // 空槽位
        slotBox.fillStyle(0x090e10, 0.5);
        slotBox.fillRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 6, 6);
        slotBox.lineStyle(1, 0x1a262b, 0.6);
        slotBox.strokeRoundedRect(-w / 2 + 12, startY, w - 24, slotH - 6, 6);
        card.add(slotBox);

        const emptyText = this.scene.add.text(0, startY + (slotH - 6) / 2, `【空置槽位 ${i + 1}】升级或商店添置`, {
          fontSize: '11px',
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

    const title = this.scene.add.text(0, -h / 2 + 12, `🌶️ 口味秘方 & 绝技`, {
      fontSize: '15px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    let startY = -h / 2 + 38;

    // 1. 已激活菜谱
    if (player.activeRecipes.length > 0) {
      const recipeTitle = this.scene.add.text(-w / 2 + 16, startY, '🔥 质变绝技菜谱:', {
        fontSize: '12px',
        color: '#06d6a0',
        fontStyle: 'bold',
      });
      card.add(recipeTitle);
      startY += 18;

      for (const r of player.activeRecipes) {
        const rText = this.scene.add.text(
          -w / 2 + 16,
          startY,
          `• 【${r.transformation?.transformedNameKey || r.nameKey}】`,
          {
            fontSize: '11px',
            color: '#ffd166',
            wordWrap: { width: w - 32, useAdvancedWrap: true },
          },
        );
        card.add(rText);
        startY += 18;
      }
      startY += 6;
    }

    // 2. 被动食材秘方
    const itemTitle = this.scene.add.text(-w / 2 + 16, startY, '📦 已获秘方食材:', {
      fontSize: '12px',
      color: '#8fa3a6',
      fontStyle: 'bold',
    });
    card.add(itemTitle);
    startY += 18;

    if (player.items.length === 0) {
      const noItemText = this.scene.add.text(-w / 2 + 16, startY, '暂未采购秘方食材', {
        fontSize: '11px',
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
        startY += 18;
      }
    }

    this.container.add(card);
  }

  private renderStatsColumn(
    player: Player,
    _world: SimulationWorld | undefined,
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

    const title = this.scene.add.text(0, -h / 2 + 12, `📊 12维全维属性`, {
      fontSize: '15px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    card.add(title);

    // 12 维深度双列网格属性
    const leftStats = [
      `❤️ 生命: ${Math.round(player.currentHp)}/${player.maxHp}`,
      `💖 秒回: +${player.hpRegen}/5s`,
      `🏃 移速: ${Math.round(player.moveSpeed)}`,
      `⚔️ 全伤: +${Math.round((player.damageMultiplier - 1) * 100)}%`,
      `⚡ 攻频: +${Math.round((player.attackSpeedMultiplier - 1) * 100)}%`,
      `🎯 暴击: ${Math.round(player.critChance * 100)}%`,
    ];

    const rightStats = [
      `💥 爆伤: ${player.critMultiplier.toFixed(1)}x`,
      `🛡️ 护甲: ${player.armor}`,
      `💨 闪避: ${Math.round(player.dodge * 100)}%`,
      `🌾 收获: +${player.harvest}/波`,
      `🍀 幸运: ${player.luck}`,
      `🥟 食材: ${player.ingredients}`,
    ];

    let startY = -h / 2 + 38;
    for (let i = 0; i < leftStats.length; i++) {
      const lText = this.scene.add.text(-w / 2 + 14, startY, leftStats[i], {
        fontSize: '11px',
        color: '#d8e2dc',
      });
      card.add(lText);

      const rText = this.scene.add.text(-w / 2 + 168, startY, rightStats[i], {
        fontSize: '11px',
        color: '#d8e2dc',
      });
      card.add(rText);

      startY += 22;
    }

    // 分割线与羁绊流派栏
    startY += 6;
    const divGfx = this.scene.add.graphics();
    divGfx.lineStyle(1, 0x223a40, 0.8);
    divGfx.lineBetween(-w / 2 + 14, startY, w / 2 - 14, startY);
    card.add(divGfx);

    startY += 8;
    const tagTitle = this.scene.add.text(-w / 2 + 14, startY, '✨ 流派套装共鸣 (Synergies):', {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    card.add(tagTitle);

    startY += 18;
    const synergies = SynergySystem.getActiveSynergies(player);
    if (synergies.length === 0) {
      const noTagText = this.scene.add.text(-w / 2 + 14, startY, '暂无流派羁绊共鸣', {
        fontSize: '11px',
        color: '#55666c',
      });
      card.add(noTagText);
    } else {
      const tagStrings = synergies.map(
        s => `${s.synergy.icon} ${s.synergy.name} (${s.count}件${s.activeTier > 0 ? ` · T${s.activeTier}` : ''})`,
      );
      const tagContent = this.scene.add.text(-w / 2 + 14, startY, tagStrings.join('  ·  '), {
        fontSize: '11px',
        color: '#00f5d4',
        wordWrap: { width: w - 28, useAdvancedWrap: true },
        lineSpacing: 3,
      });
      card.add(tagContent);
    }

    this.container.add(card);
  }

  private renderBottomButtons(width: number, height: number, cardH: number): void {
    const btnY = height / 2 + cardH / 2 - 36;
    const btnW = 150;
    const btnH = 36;
    const gap = 16;
    const totalW = 5 * btnW + 4 * gap;
    const startX = width / 2 - totalW / 2 + btnW / 2;

    // 1. 继续游戏
    const resumeX = startX;
    const resGfx = this.scene.add.graphics();
    resGfx.fillStyle(0x2a9d8f, 1);
    resGfx.fillRoundedRect(resumeX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    this.container.add(resGfx);

    const resText = this.scene.add.text(resumeX, btnY, '▶️ 继续出摊', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    resText.setOrigin(0.5, 0.5);
    this.container.add(resText);

    const resZone = this.scene.add.zone(resumeX, btnY, btnW, btnH);
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
    this.container.add(cdxGfx);

    const cdxText = this.scene.add.text(cdxX, btnY, '📖 查看图鉴', {
      fontSize: '14px',
      color: '#00f5d4',
      fontStyle: 'bold',
    });
    cdxText.setOrigin(0.5, 0.5);
    this.container.add(cdxText);

    const cdxZone = this.scene.add.zone(cdxX, btnY, btnW, btnH);
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
    this.container.add(setGfx);

    const setText = this.scene.add.text(setX, btnY, '⚙️ 偏好设置', {
      fontSize: '14px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    setText.setOrigin(0.5, 0.5);
    this.container.add(setText);

    const setZone = this.scene.add.zone(setX, btnY, btnW, btnH);
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
    this.container.add(restGfx);

    const restText = this.scene.add.text(restX, btnY, '🔄 重新开始', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    restText.setOrigin(0.5, 0.5);
    this.container.add(restText);

    const restZone = this.scene.add.zone(restX, btnY, btnW, btnH);
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
    this.container.add(menuGfx);

    const menuText = this.scene.add.text(menuX, btnY, '🚪 退出菜单', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    menuText.setOrigin(0.5, 0.5);
    this.container.add(menuText);

    const menuZone = this.scene.add.zone(menuX, btnY, btnW, btnH);
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
