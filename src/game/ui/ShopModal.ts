import Phaser from 'phaser';
import { ITEMS } from '@/content/items/data';
import { RECIPES } from '@/content/recipes/data';
import { Tag, formatTags, TAG_NAMES } from '@/content/schemas/common';
import { ItemDefinition } from '@/content/schemas/item';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { SeededRNG } from '@/core/rng';
import { Player } from '../entities/Player';

export interface ShopSlot {
  id: string;
  type: 'weapon' | 'item';
  weapon?: WeaponDefinition;
  item?: ItemDefinition;
  cost: number;
  isLocked: boolean;
  isBought: boolean;
}

export class ShopModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onReadyCallback: () => void;

  private slots: ShopSlot[] = [];
  private refreshCost = 2;

  constructor(scene: Phaser.Scene, onReady: () => void) {
    this.scene = scene;
    this.onReadyCallback = onReady;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(200);
    this.container.setVisible(false);
  }

  public show(player: Player, rng: SeededRNG, waveNumber: number): void {
    this.refreshCost = 2;
    this.generateSlots(player, rng, false);
    this.render(player, rng, waveNumber);
    this.container.setVisible(true);
  }

  private generateSlots(_player: Player, rng: SeededRNG, isRefresh: boolean): void {
    const newSlots: ShopSlot[] = [];

    // 保留被锁定的商品
    if (isRefresh) {
      for (const s of this.slots) {
        if (s.isLocked && !s.isBought) {
          newSlots.push(s);
        }
      }
    }

    const allWeapons = Object.values(WEAPONS);
    const allItems = Object.values(ITEMS);

    while (newSlots.length < 4) {
      const isWeapon = rng.next() < 0.45;
      if (isWeapon) {
        const weapon = rng.pick(allWeapons);
        newSlots.push({
          id: `shop_w_${weapon.id}_${Date.now()}_${newSlots.length}`,
          type: 'weapon',
          weapon,
          cost: weapon.cost,
          isLocked: false,
          isBought: false,
        });
      } else {
        const item = rng.pick(allItems);
        newSlots.push({
          id: `shop_i_${item.id}_${Date.now()}_${newSlots.length}`,
          type: 'item',
          item,
          cost: item.cost,
          isLocked: false,
          isBought: false,
        });
      }
    }

    this.slots = newSlots;
  }

  private render(player: Player, rng: SeededRNG, waveNumber: number): void {
    this.container.removeAll(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. 背景遮罩
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.9);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // 2. 标题与食材余额
    const title = this.scene.add.text(
      width / 2,
      28,
      `🏪 山海夜市餐车整备 (第 ${waveNumber} 波夜战前夕)`,
      {
        fontSize: '20px',
        color: '#f4a261',
        fontStyle: 'bold',
      },
    );
    title.setOrigin(0.5, 0);
    this.container.add(title);

    const balance = this.scene.add.text(width / 2, 54, `当前食材资产: 🥟 ${player.ingredients}`, {
      fontSize: '15px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    balance.setOrigin(0.5, 0);
    this.container.add(balance);

    // 3. 商品槽位 (4 个卡片)
    const cardW = 200;
    const cardH = 250;
    const totalW = 4 * cardW + 3 * 16;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = 200;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const cx = startX + i * (cardW + 16);
      const card = this.renderSlotCard(slot, cx, cardY, cardW, cardH, player, rng, waveNumber);
      this.container.add(card);
    }

    // 4. 底部栏：刷新货架、菜谱预览、出摊迎战
    this.renderBottomBar(player, rng, waveNumber);
  }

  private renderSlotCard(
    slot: ShopSlot,
    x: number,
    y: number,
    w: number,
    h: number,
    player: Player,
    rng: SeededRNG,
    waveNumber: number,
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(slot.isBought ? 0x0a1012 : 0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(2, slot.isLocked ? 0xffbe0b : 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    card.add(bgGfx);

    if (slot.isBought) {
      const boughtText = this.scene.add.text(0, 0, '【已售罄】', {
        fontSize: '16px',
        color: '#8fa3a6',
        fontStyle: 'bold',
      });
      boughtText.setOrigin(0.5, 0.5);
      card.add(boughtText);
      return card;
    }

    const titleStr = slot.type === 'weapon' ? slot.weapon!.nameKey : slot.item!.nameKey;
    let isMergeUpgrade = false;
    let descStr = '';
    let tagStr = '';

    if (slot.type === 'weapon') {
      const existing = player.weapons.find(w => w.definition.id === slot.weapon!.id);
      if (existing) {
        isMergeUpgrade = true;
        const nextLvl = Math.min(slot.weapon!.levels.length, existing.level + 1);
        descStr = slot.weapon!.levels[nextLvl - 1].descriptionKey;
        tagStr = `【合成升星】Lv.${existing.level} ➔ Lv.${nextLvl}`;
      } else {
        descStr = slot.weapon!.levels[0].descriptionKey;
        tagStr = `厨具 · ${formatTags(slot.weapon!.tags)}`;
      }
    } else {
      const existingItem = player.items.find(i => i.definition.id === slot.item!.id);
      const stacks = existingItem ? existingItem.count : 0;
      descStr = slot.item!.descriptionKey;
      tagStr = `口味 · ${formatTags(slot.item!.tags)} (已有 ${stacks}/${slot.item!.maxStacks})`;
    }

    // 分类
    const tagText = this.scene.add.text(0, -h / 2 + 16, tagStr, {
      fontSize: '11px',
      color: isMergeUpgrade ? '#ffd166' : '#2a9d8f',
      fontStyle: 'bold',
      wordWrap: { width: w - 16, useAdvancedWrap: true },
      align: 'center',
    });
    tagText.setOrigin(0.5, 0);
    card.add(tagText);

    // 标题
    const titleText = this.scene.add.text(0, -h / 2 + 38, titleStr, {
      fontSize: '15px',
      color: slot.type === 'weapon' ? slot.weapon!.color : slot.item!.color,
      fontStyle: 'bold',
      wordWrap: { width: w - 16, useAdvancedWrap: true },
      align: 'center',
    });
    titleText.setOrigin(0.5, 0);
    card.add(titleText);

    // 描述
    const descText = this.scene.add.text(0, -h / 2 + 75, descStr, {
      fontSize: '11px',
      color: '#d8e2dc',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 3,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // 锁定按钮
    const lockBtn = this.scene.add.text(
      -w / 2 + 14,
      h / 2 - 24,
      slot.isLocked ? '🔒 已锁' : '🔓 锁定',
      {
        fontSize: '11px',
        color: slot.isLocked ? '#ffd166' : '#8fa3a6',
      },
    );
    lockBtn.setInteractive({ useHandCursor: true });
    lockBtn.on('pointerdown', () => {
      slot.isLocked = !slot.isLocked;
      this.render(player, rng, waveNumber);
    });
    card.add(lockBtn);

    // 购买按钮
    const canAfford = player.ingredients >= slot.cost;
    const buyBtnGfx = this.scene.add.graphics();
    buyBtnGfx.fillStyle(canAfford ? 0xe76f51 : 0x444444, 1);
    buyBtnGfx.fillRoundedRect(w / 2 - 85, h / 2 - 36, 75, 26, 4);
    card.add(buyBtnGfx);

    const buyBtnText = this.scene.add.text(w / 2 - 47, h / 2 - 23, `🥟 ${slot.cost}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buyBtnText.setOrigin(0.5, 0.5);
    card.add(buyBtnText);

    if (canAfford) {
      const buyZone = this.scene.add.zone(w / 2 - 47, h / 2 - 23, 75, 26);
      buyZone.setInteractive({ useHandCursor: true });
      buyZone.on('pointerdown', () => {
        player.ingredients -= slot.cost;
        slot.isBought = true;

        if (slot.type === 'weapon') {
          player.equipWeapon(slot.weapon!);
        } else {
          player.addItem(slot.item!);
        }

        EventBus.getInstance().emit('sound:play', { key: 'sfx_pickup', volume: 0.8 });
        this.render(player, rng, waveNumber);
      });
      card.add(buyZone);
    }

    return card;
  }

  private renderBottomBar(player: Player, rng: SeededRNG, waveNumber: number): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. 刷新按钮
    const refreshBtnW = 160;
    const refreshBtnH = 38;
    const rx = width / 2 - 140;
    const ry = height - 60;

    const canRefresh = player.ingredients >= this.refreshCost;
    const refGfx = this.scene.add.graphics();
    refGfx.fillStyle(canRefresh ? 0x2a9d8f : 0x444444, 1);
    refGfx.fillRoundedRect(rx - refreshBtnW / 2, ry - refreshBtnH / 2, refreshBtnW, refreshBtnH, 6);
    this.container.add(refGfx);

    const refText = this.scene.add.text(rx, ry, `🔄 刷新 (🥟 ${this.refreshCost})`, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    refText.setOrigin(0.5, 0.5);
    this.container.add(refText);

    if (canRefresh) {
      const refZone = this.scene.add.zone(rx, ry, refreshBtnW, refreshBtnH);
      refZone.setInteractive({ useHandCursor: true });
      refZone.on('pointerdown', () => {
        player.ingredients -= this.refreshCost;
        this.refreshCost += 1;
        this.generateSlots(player, rng, true);
        this.render(player, rng, waveNumber);
      });
      this.container.add(refZone);
    }

    // 2. 出摊迎战按钮
    const startBtnW = 160;
    const startBtnH = 38;
    const sx = width / 2 + 140;
    const sy = height - 60;

    const startGfx = this.scene.add.graphics();
    startGfx.fillStyle(0xe76f51, 1);
    startGfx.fillRoundedRect(sx - startBtnW / 2, sy - startBtnH / 2, startBtnW, startBtnH, 6);
    this.container.add(startGfx);

    const startText = this.scene.add.text(sx, sy, '⚔️ 出摊迎战！', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    startText.setOrigin(0.5, 0.5);
    this.container.add(startText);

    const startZone = this.scene.add.zone(sx, sy, startBtnW, startBtnH);
    startZone.setInteractive({ useHandCursor: true });
    startZone.on('pointerdown', () => {
      this.hide();
      this.onReadyCallback();
    });
    this.container.add(startZone);

    // 3. 实时菜谱进度提示
    const recipeHints = Object.values(RECIPES)
      .filter(r => !player.activeRecipes.some(ar => ar.id === r.id))
      .map(r => {
        const wName = r.requirement.requiredWeaponId
          ? WEAPONS[r.requirement.requiredWeaponId]?.nameKey || ''
          : '';
        const tagReqs = r.requirement.requiredTagCounts
          ? Object.entries(r.requirement.requiredTagCounts)
              .map(([t, c]) => `${c}x#${TAG_NAMES[t as Tag] || t}(已有${player.tagCounts[t as Tag] || 0})`)
              .join(' ')
          : '';
        return `💡 菜谱【${r.nameKey}】: 需要 ${wName} + ${tagReqs}`;
      })
      .slice(0, 2)
      .join('  |  ');

    const hintText = this.scene.add.text(width / 2, height - 110, recipeHints, {
      fontSize: '11px',
      color: '#2a9d8f',
      fontStyle: 'bold',
      wordWrap: { width: width - 40, useAdvancedWrap: true },
      align: 'center',
    });
    hintText.setOrigin(0.5, 0.5);
    this.container.add(hintText);
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
