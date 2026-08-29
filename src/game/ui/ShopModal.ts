import Phaser from 'phaser';
import { ITEMS } from '@/content/items/data';
import { formatTags } from '@/content/schemas/common';
import { ItemDefinition } from '@/content/schemas/item';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { SeededRNG } from '@/core/rng';
import { Player } from '../entities/Player';
import { SynergySystem } from '../systems/SynergySystem';

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

      // 45% 概率刷出武器，55% 概率刷出食材秘方
      const isWeapon = rng.next() < 0.45;
      if (isWeapon) {
        let chosenWeapon: WeaponDefinition;
        if (player && player.weapons.length >= player.maxWeapons) {
          // 槽位已满，仅刷出当前已拥有且未满级的武器升阶
          const upgradeable = player.weapons
            .filter(w => w.level < w.definition.levels.length)
            .map(w => w.definition);
          if (upgradeable.length > 0) {
            chosenWeapon = rng.pick(upgradeable);
          } else {
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

    // 1. 半透明遮罩
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.95);
    bg.setScrollFactor(0);
    bg.setInteractive();
    this.container.add(bg);

    // 2. 顶部状态栏 (夜市营收与收获利息)
    const title = this.scene.add.text(
      width / 2,
      30,
      `🏮 夜市整备铺 · 第 ${waveNumber} 波战前补给 🏮`,
      {
        fontSize: '24px',
        color: '#ffd166',
        fontStyle: 'bold',
      },
    );
    title.setOrigin(0.5, 0);
    this.container.add(title);

    const subTitle = this.scene.add.text(
      width / 2,
      64,
      `🥟 拥有食材: ${player.ingredients}  |  🌾 营收收获: +${player.harvest}/波  |  🍀 幸运: ${player.luck}  |  🔪 已配武器: ${player.weapons.length}/${player.maxWeapons}`,
      {
        fontSize: '13px',
        color: '#00f5d4',
      },
    );
    subTitle.setOrigin(0.5, 0);
    this.container.add(subTitle);

    // 3. 上方：已装备神兵管理栏（支持变卖回收与升阶）
    this.renderEquippedWeaponsBar(player, width, 95);

    // 4. 中间：4 个货架商品卡片
    const cardW = 245;
    const cardH = 300;
    const gap = 16;
    const totalW = 4 * cardW + 3 * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 + 50;

    for (let i = 0; i < 4; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const cx = startX + i * (cardW + gap);
      const cardContainer = this.renderCard(slot, cx, cardY, cardW, cardH, player, rng, waveNumber);
      this.container.add(cardContainer);
    }

    // 5. 底部流派羁绊条与准备就绪栏
    this.renderBottomBar(player, rng, waveNumber);
  }

  private renderEquippedWeaponsBar(player: Player, screenW: number, y: number): void {
    const barW = 1040;
    const barH = 75;
    const barGfx = this.scene.add.graphics();
    barGfx.fillStyle(0x0c1619, 0.9);
    barGfx.fillRoundedRect(screenW / 2 - barW / 2, y, barW, barH, 8);
    barGfx.lineStyle(1, 0x22363e, 0.8);
    barGfx.strokeRoundedRect(screenW / 2 - barW / 2, y, barW, barH, 8);
    this.container.add(barGfx);

    const barTitle = this.scene.add.text(screenW / 2 - barW / 2 + 16, y + 8, `🎒 厨神背包 (点击武器可折价变卖回收食材)`, {
      fontSize: '12px',
      color: '#8fa3a6',
      fontStyle: 'bold',
    });
    this.container.add(barTitle);

    // 渲染 6 个武器槽位
    const slotW = 155;
    const slotH = 46;
    const startX = screenW / 2 - barW / 2 + 16 + slotW / 2;
    const slotY = y + 45;

    for (let i = 0; i < player.maxWeapons; i++) {
      const wState = player.weapons[i];
      const cx = startX + i * (slotW + 12);

      const slotGfx = this.scene.add.graphics();
      slotGfx.fillStyle(wState ? 0x14252c : 0x091012, 0.9);
      slotGfx.fillRoundedRect(cx - slotW / 2, slotY - slotH / 2, slotW, slotH, 6);
      slotGfx.lineStyle(1, wState ? 0x2a9d8f : 0x1f2e33, 1);
      slotGfx.strokeRoundedRect(cx - slotW / 2, slotY - slotH / 2, slotW, slotH, 6);
      this.container.add(slotGfx);

      if (wState) {
        // 武器名与等级
        const wTxt = this.scene.add.text(cx - slotW / 2 + 8, slotY - 12, `${wState.definition.nameKey}`, {
          fontSize: '11px',
          color: wState.definition.color || '#ffd166',
          fontStyle: 'bold',
        });
        this.container.add(wTxt);

        const lvlTxt = this.scene.add.text(cx + slotW / 2 - 8, slotY - 12, `Lv.${wState.level}`, {
          fontSize: '10px',
          color: '#00f5d4',
          fontStyle: 'bold',
        });
        lvlTxt.setOrigin(1, 0);
        this.container.add(lvlTxt);

        // 变卖按钮
        const sellValue = Math.max(3, Math.floor((wState.definition.cost || 10) * 0.7 * wState.level));
        const sellBtn = this.scene.add.text(cx, slotY + 9, `♻️ 变卖 (+${sellValue}🥟)`, {
          fontSize: '10px',
          color: '#e76f51',
          backgroundColor: '#0a1012',
          padding: { x: 4, y: 1 },
        });
        sellBtn.setOrigin(0.5, 0.5);
        sellBtn.setInteractive({ useHandCursor: true });
        sellBtn.on('pointerdown', () => {
          player.removeWeapon(i);
          player.ingredients += sellValue;
          EventBus.getInstance().emit('sound:play', { key: 'sfx_coin', volume: 0.8 });
          this.render(player, this.scene.registry.get('rng') || new SeededRNG(1), 1);
        });
        this.container.add(sellBtn);
      } else {
        const emptyTxt = this.scene.add.text(cx, slotY, `空槽位 ${i + 1}`, {
          fontSize: '11px',
          color: '#3d5057',
        });
        emptyTxt.setOrigin(0.5, 0.5);
        this.container.add(emptyTxt);
      }
    }
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
    bgGfx.fillStyle(slot.isBought ? 0x091012 : 0x101a1e, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(1.5, slot.isLocked ? 0xffd166 : 0x2f4850, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    card.add(bgGfx);

    if (slot.isBought) {
      const soldText = this.scene.add.text(0, 0, '【已采购】', {
        fontSize: '18px',
        color: '#6c757d',
        fontStyle: 'bold',
      });
      soldText.setOrigin(0.5, 0.5);
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
          tagStr = `【升阶合成】Lv.${existing.level} ➔ Lv.${nextLvl}`;
        }
      } else {
        if (player.weapons.length >= player.maxWeapons) {
          isFullBlocked = true;
          tagStr = `【槽位已满 (${player.weapons.length}/${player.maxWeapons})】`;
          descStr = `已装备 ${player.maxWeapons} 把武器，请先变卖闲置厨具`;
        } else {
          descStr = slot.weapon!.levels[0].descriptionKey;
          tagStr = `新增神兵 · ${formatTags(slot.weapon!.tags)}`;
        }
      }
    } else {
      const stacks = player.getItemCount(slot.item!.id);
      descStr = slot.item!.descriptionKey;
      tagStr = `口味 · ${formatTags(slot.item!.tags)} (${stacks}/${slot.item!.maxStacks})`;
    }

    // 分类标签
    const tagText = this.scene.add.text(0, -h / 2 + 16, tagStr, {
      fontSize: '12px',
      color: isMergeUpgrade ? '#ffd166' : isFullBlocked ? '#e76f51' : '#00f5d4',
      fontStyle: 'bold',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      align: 'center',
    });
    tagText.setOrigin(0.5, 0);
    card.add(tagText);

    // 标题
    const titleText = this.scene.add.text(0, -h / 2 + 42, titleStr, {
      fontSize: '17px',
      color: slot.type === 'weapon' ? slot.weapon!.color : slot.item!.color,
      fontStyle: 'bold',
      align: 'center',
    });
    titleText.setOrigin(0.5, 0);
    card.add(titleText);

    // 描述
    const descText = this.scene.add.text(0, -h / 2 + 82, descStr, {
      fontSize: '12px',
      color: '#d8e2dc',
      wordWrap: { width: w - 24, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // 锁定按钮
    const lockBtn = this.scene.add.text(
      -w / 2 + 16,
      h / 2 - 28,
      slot.isLocked ? '🔒 已锁' : '🔓 锁定',
      {
        fontSize: '12px',
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
    const canAfford = player.ingredients >= slot.cost && !isFullBlocked && !isMaxLevelBlocked;
    let buyBtnLabel = `🥟 ${slot.cost}`;
    if (isFullBlocked) buyBtnLabel = '槽位已满';
    else if (isMaxLevelBlocked) buyBtnLabel = '已满级';

    const buyBtnGfx = this.scene.add.graphics();
    buyBtnGfx.fillStyle(canAfford ? 0xe76f51 : 0x2a363c, 1);
    buyBtnGfx.fillRoundedRect(w / 2 - 96, h / 2 - 42, 86, 30, 6);
    card.add(buyBtnGfx);

    const buyBtnText = this.scene.add.text(w / 2 - 53, h / 2 - 27, buyBtnLabel, {
      fontSize: isFullBlocked || isMaxLevelBlocked ? '11px' : '13px',
      color: canAfford ? '#ffffff' : '#8fa3a6',
      fontStyle: 'bold',
    });
    buyBtnText.setOrigin(0.5, 0.5);
    card.add(buyBtnText);

    if (canAfford) {
      const buyZone = this.scene.add.zone(w / 2 - 53, h / 2 - 27, 86, 30);
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

    // 1. 流派羁绊提示行
    const synergies = SynergySystem.getActiveSynergies(player);
    const synTextList = synergies.map(s => `${s.synergy.icon} ${s.synergy.name} (${s.count}件)`);
    const synSummary = synTextList.length > 0 ? synTextList.join('  ·  ') : '暂无激活的流派套装羁绊';

    const synLabel = this.scene.add.text(width / 2, height - 76, `✨ 当前神兵流派共鸣: ${synSummary}`, {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    synLabel.setOrigin(0.5, 0);
    this.container.add(synLabel);

    // 2. 刷新货架按钮
    const refW = 180;
    const refH = 38;
    const rx = width / 2 - 130;
    const ry = height - 32;

    const canRefresh = player.ingredients >= this.refreshCost;
    const refGfx = this.scene.add.graphics();
    refGfx.fillStyle(canRefresh ? 0x2a9d8f : 0x2a363c, 1);
    refGfx.fillRoundedRect(rx - refW / 2, ry - refH / 2, refW, refH, 8);
    this.container.add(refGfx);

    const refText = this.scene.add.text(rx, ry, `🔄 进货刷新 (🥟 ${this.refreshCost})`, {
      fontSize: '13px',
      color: canRefresh ? '#060b0c' : '#8fa3a6',
      fontStyle: 'bold',
    });
    refText.setOrigin(0.5, 0.5);
    this.container.add(refText);

    if (canRefresh) {
      const refZone = this.scene.add.zone(rx, ry, refW, refH);
      refZone.setInteractive({ useHandCursor: true });
      refZone.on('pointerdown', () => {
        player.ingredients -= this.refreshCost;
        this.refreshCost += 1; // 阶梯刷新递增
        this.generateSlots(player, rng, true);
        EventBus.getInstance().emit('sound:play', { key: 'sfx_click', volume: 0.5 });
        this.render(player, rng, waveNumber);
      });
      this.container.add(refZone);
    }

    // 3. 出摊迎战按钮
    const rdyW = 200;
    const rdyH = 38;
    const rdx = width / 2 + 130;
    const rdy = height - 32;

    const rdyGfx = this.scene.add.graphics();
    rdyGfx.fillStyle(0xe76f51, 1);
    rdyGfx.fillRoundedRect(rdx - rdyW / 2, rdy - rdyH / 2, rdyW, rdyH, 8);
    this.container.add(rdyGfx);

    const rdyText = this.scene.add.text(rdx, rdy, '🔥 准备就绪 · 出摊迎战 🔥', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    rdyText.setOrigin(0.5, 0.5);
    this.container.add(rdyText);

    const rdyZone = this.scene.add.zone(rdx, rdy, rdyW, rdyH);
    rdyZone.setInteractive({ useHandCursor: true });
    rdyZone.on('pointerdown', () => {
      this.hide();
      this.onReadyCallback();
    });
    this.container.add(rdyZone);
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
