import Phaser from 'phaser';
import { ITEMS } from '@/content/items/data';
import { RECIPES } from '@/content/recipes/data';
import { formatTags, Tag, TAG_NAMES } from '@/content/schemas/common';
import { ItemDefinition } from '@/content/schemas/item';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { SeededRNG } from '@/core/rng';
import { Player } from '../entities/Player';

interface ShopSlot {
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
    this.container.removeAll(true);
    this.container.setVisible(true);
    this.refreshCost = 2;

    // 每次进入商店若没有锁定商品，则生成新一轮货架
    this.generateSlots(player, rng, false);
    this.render(player, rng, waveNumber);
  }

  private generateSlots(player: Player, rng: SeededRNG, forceRefreshAll = false): void {
    const newSlots: ShopSlot[] = [];

    for (let i = 0; i < 4; i++) {
      if (!forceRefreshAll && this.slots[i] && this.slots[i].isLocked && !this.slots[i].isBought) {
        newSlots.push(this.slots[i]);
        continue;
      }

      // 40% 概率刷出武器，60% 概率刷出食材道具
      const isWeapon = rng.next() < 0.4;
      if (isWeapon) {
        let chosenWeapon: WeaponDefinition;
        if (player && player.weapons.length >= player.maxWeapons) {
          // 槽位已满，仅刷出当前已拥有且未满级的武器升星
          const upgradeable = player.weapons
            .filter(w => w.level < w.definition.levels.length)
            .map(w => w.definition);
          if (upgradeable.length > 0) {
            chosenWeapon = rng.pick(upgradeable);
          } else {
            // 现有武器全满级，则转为刷出食材道具
            const chosenItem = rng.pick(Object.values(ITEMS));
            newSlots.push({
              type: 'item',
              item: chosenItem,
              cost: chosenItem.cost || 8,
              isLocked: false,
              isBought: false,
            });
            continue;
          }
        } else {
          chosenWeapon = rng.pick(Object.values(WEAPONS));
        }

        newSlots.push({
          type: 'weapon',
          weapon: chosenWeapon,
          cost: chosenWeapon.cost || 10,
          isLocked: false,
          isBought: false,
        });
      } else {
        const itemList = Object.values(ITEMS);
        const chosenItem = rng.pick(itemList);
        newSlots.push({
          type: 'item',
          item: chosenItem,
          cost: chosenItem.cost || 8,
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

    // 半透明遮罩
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.92);
    bg.fillRect(0, 0, width, height);
    bg.setScrollFactor(0);
    this.container.add(bg);

    // 阻挡背景穿透
    const blockerZone = this.scene.add.zone(width / 2, height / 2, width, height);
    blockerZone.setScrollFactor(0);
    blockerZone.setInteractive();
    this.container.add(blockerZone);

    // 顶部状态栏
    const title = this.scene.add.text(
      width / 2,
      40,
      `🏮 夜市整备铺 · 第 ${waveNumber} 波战前补给 🏮`,
      {
        fontSize: '26px',
        color: '#ffd166',
        fontStyle: 'bold',
      },
    );
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    const subTitle = this.scene.add.text(
      width / 2,
      78,
      `拥有食材: 🥟 ${player.ingredients}  |  生命: ${Math.round(player.currentHp)}/${player.maxHp}  |  已配武器: 🔪 ${player.weapons.length}/${player.maxWeapons}`,
      {
        fontSize: '14px',
        color: '#8fa3a6',
      },
    );
    subTitle.setOrigin(0.5, 0);
    subTitle.setScrollFactor(0);
    this.container.add(subTitle);

    // 4 个货架商品卡片
    const cardW = 240;
    const cardH = 340;
    const gap = 20;
    const totalW = 4 * cardW + 3 * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 - 10;

    for (let i = 0; i < 4; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const cx = startX + i * (cardW + gap);
      const cardContainer = this.renderCard(slot, cx, cardY, cardW, cardH, player, rng, waveNumber);
      this.container.add(cardContainer);
    }

    // 底部刷新与准备就绪栏
    this.renderBottomBar(player, rng, waveNumber);
  }

  private renderCard(
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
    card.setScrollFactor(0);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(slot.isBought ? 0x091012 : 0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(1.5, slot.isLocked ? 0xffd166 : 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.setScrollFactor(0);
    card.add(bgGfx);

    if (slot.isBought) {
      const soldText = this.scene.add.text(0, 0, '【已采购】', {
        fontSize: '20px',
        color: '#6c757d',
        fontStyle: 'bold',
      });
      soldText.setOrigin(0.5, 0.5);
      soldText.setScrollFactor(0);
      card.add(soldText);
      return card;
    }

    const titleStr = slot.type === 'weapon' ? slot.weapon!.nameKey : slot.item!.nameKey;
    let isMergeUpgrade = false;
    let isFullBlocked = false;
    let isMaxLevelBlocked = false;
    let descStr = '';
    let tagStr = '';

    if (slot.type === 'weapon') {
      const existing = player.weapons.find(w => w.definition.id === slot.weapon!.id);
      if (existing) {
        if (existing.level >= slot.weapon!.levels.length) {
          isMaxLevelBlocked = true;
          tagStr = '【已达顶级 Lv.3】';
          descStr = '此神兵已达最高精炼等级';
        } else {
          isMergeUpgrade = true;
          const nextLvl = existing.level + 1;
          descStr = slot.weapon!.levels[nextLvl - 1].descriptionKey;
          tagStr = `【合成升星】Lv.${existing.level} ➔ Lv.${nextLvl}`;
        }
      } else {
        if (player.weapons.length >= player.maxWeapons) {
          isFullBlocked = true;
          tagStr = `【槽位已满 (${player.weapons.length}/${player.maxWeapons})】`;
          descStr = `已装备 ${player.maxWeapons} 把武器，无法再配新厨具`;
        } else {
          descStr = slot.weapon!.levels[0].descriptionKey;
          tagStr = `新增神兵 · ${formatTags(slot.weapon!.tags)}`;
        }
      }
    } else {
      const stacks = player.getItemCount(slot.item!.id);
      descStr = slot.item!.descriptionKey;
      tagStr = `口味 · ${formatTags(slot.item!.tags)} (已有 ${stacks}/${slot.item!.maxStacks})`;
    }

    // 分类
    const tagText = this.scene.add.text(0, -h / 2 + 20, tagStr, {
      fontSize: '13px',
      color: isMergeUpgrade ? '#ffd166' : isFullBlocked ? '#e76f51' : '#2a9d8f',
      fontStyle: 'bold',
      wordWrap: { width: w - 24, useAdvancedWrap: true },
      align: 'center',
    });
    tagText.setOrigin(0.5, 0);
    tagText.setScrollFactor(0);
    card.add(tagText);

    // 标题
    const titleText = this.scene.add.text(0, -h / 2 + 48, titleStr, {
      fontSize: '18px',
      color: slot.type === 'weapon' ? slot.weapon!.color : slot.item!.color,
      fontStyle: 'bold',
      wordWrap: { width: w - 24, useAdvancedWrap: true },
      align: 'center',
    });
    titleText.setOrigin(0.5, 0);
    titleText.setScrollFactor(0);
    card.add(titleText);

    // 描述
    const descText = this.scene.add.text(0, -h / 2 + 95, descStr, {
      fontSize: '13px',
      color: '#d8e2dc',
      wordWrap: { width: w - 28, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 5,
    });
    descText.setOrigin(0.5, 0);
    descText.setScrollFactor(0);
    card.add(descText);

    // 锁定按钮
    const lockBtn = this.scene.add.text(
      -w / 2 + 18,
      h / 2 - 30,
      slot.isLocked ? '🔒 已锁' : '🔓 锁定',
      {
        fontSize: '13px',
        color: slot.isLocked ? '#ffd166' : '#8fa3a6',
      },
    );
    lockBtn.setScrollFactor(0);
    lockBtn.setInteractive({ useHandCursor: true });
    lockBtn.on('pointerdown', () => {
      slot.isLocked = !slot.isLocked;
      this.render(player, rng, waveNumber);
    });
    card.add(lockBtn);

    // 购买按钮
    const canAfford = player.ingredients >= slot.cost && !isFullBlocked && !isMaxLevelBlocked;
    let buyBtnLabel = `🥟 ${slot.cost}`;
    if (isFullBlocked) buyBtnLabel = '槽位已满';
    else if (isMaxLevelBlocked) buyBtnLabel = '已满级';

    const buyBtnGfx = this.scene.add.graphics();
    buyBtnGfx.fillStyle(canAfford ? 0xe76f51 : 0x334148, 1);
    buyBtnGfx.fillRoundedRect(w / 2 - 105, h / 2 - 46, 92, 32, 6);
    buyBtnGfx.setScrollFactor(0);
    card.add(buyBtnGfx);

    const buyBtnText = this.scene.add.text(w / 2 - 59, h / 2 - 30, buyBtnLabel, {
      fontSize: isFullBlocked || isMaxLevelBlocked ? '12px' : '14px',
      color: canAfford ? '#ffffff' : '#8fa3a6',
      fontStyle: 'bold',
    });
    buyBtnText.setOrigin(0.5, 0.5);
    buyBtnText.setScrollFactor(0);
    card.add(buyBtnText);

    if (canAfford) {
      const buyZone = this.scene.add.zone(w / 2 - 59, h / 2 - 30, 92, 32);
      buyZone.setScrollFactor(0);
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
    const refreshBtnW = 200;
    const refreshBtnH = 44;
    const rx = width / 2 - 160;
    const ry = height - 65;

    const canRefresh = player.ingredients >= this.refreshCost;
    const refGfx = this.scene.add.graphics();
    refGfx.fillStyle(canRefresh ? 0x2a9d8f : 0x444444, 1);
    refGfx.fillRoundedRect(rx - refreshBtnW / 2, ry - refreshBtnH / 2, refreshBtnW, refreshBtnH, 8);
    refGfx.setScrollFactor(0);
    this.container.add(refGfx);

    const refText = this.scene.add.text(rx, ry, `🔄 刷新货架 (🥟 ${this.refreshCost})`, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    refText.setOrigin(0.5, 0.5);
    refText.setScrollFactor(0);
    this.container.add(refText);

    if (canRefresh) {
      const refZone = this.scene.add.zone(rx, ry, refreshBtnW, refreshBtnH);
      refZone.setScrollFactor(0);
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
    const startBtnW = 200;
    const startBtnH = 44;
    const sx = width / 2 + 160;
    const sy = height - 65;

    const startGfx = this.scene.add.graphics();
    startGfx.fillStyle(0xe76f51, 1);
    startGfx.fillRoundedRect(sx - startBtnW / 2, sy - startBtnH / 2, startBtnW, startBtnH, 8);
    startGfx.setScrollFactor(0);
    this.container.add(startGfx);

    const startText = this.scene.add.text(sx, sy, '⚔️ 出摊迎战！', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    startText.setOrigin(0.5, 0.5);
    startText.setScrollFactor(0);
    this.container.add(startText);

    const startZone = this.scene.add.zone(sx, sy, startBtnW, startBtnH);
    startZone.setScrollFactor(0);
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

    const hintText = this.scene.add.text(width / 2, height - 122, recipeHints, {
      fontSize: '13px',
      color: '#2a9d8f',
      fontStyle: 'bold',
      wordWrap: { width: width - 60, useAdvancedWrap: true },
      align: 'center',
    });
    hintText.setOrigin(0.5, 0.5);
    hintText.setScrollFactor(0);
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
