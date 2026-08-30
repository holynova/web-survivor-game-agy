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

      // 45% 概率刷出神兵厨具，55% 概率刷出秘方食材
      const isWeapon = rng.next() < 0.45;
      if (isWeapon) {
        let chosenWeapon: WeaponDefinition;
        if (player && player.weapons.length >= player.maxWeapons) {
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

    // 1. 半透明遮罩背景
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.96);
    bg.setScrollFactor(0);
    this.container.add(bg);

    // 2. 顶部状态栏
    const title = this.scene.add.text(
      width / 2,
      25,
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
      58,
      `🥟 食材资产: ${player.ingredients}  |  🌾 营收收获: +${player.harvest}/波  |  🍀 幸运: ${player.luck}  |  🔪 装备厨具: ${player.weapons.length}/${player.maxWeapons}`,
      {
        fontSize: '13px',
        color: '#00f5d4',
      },
    );
    subTitle.setOrigin(0.5, 0);
    this.container.add(subTitle);

    // 3. 上方：已装备神兵背包管理栏（支持折价变卖）
    this.renderEquippedWeaponsBar(player, width, 88, rng, waveNumber);

    // 4. 中间：4 个货架商品卡片（大尺寸 Hero 独立像素图标与展示台）
    const cardW = 250;
    const cardH = 340;
    const gap = 16;
    const totalW = 4 * cardW + 3 * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 + 55;

    for (let i = 0; i < 4; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const cx = startX + i * (cardW + gap);
      const cardContainer = this.renderCard(slot, cx, cardY, cardW, cardH, player, rng, waveNumber);
      this.container.add(cardContainer);
    }

    // 5. 底部流派羁绊条与控制按钮
    this.renderBottomBar(player, rng, waveNumber);
  }

  private renderEquippedWeaponsBar(player: Player, screenW: number, y: number, rng: SeededRNG, waveNumber: number): void {
    const barW = 1048;
    const barH = 72;
    const barGfx = this.scene.add.graphics();
    barGfx.fillStyle(0x0c1619, 0.95);
    barGfx.fillRoundedRect(screenW / 2 - barW / 2, y, barW, barH, 8);
    barGfx.lineStyle(1, 0x22363e, 0.8);
    barGfx.strokeRoundedRect(screenW / 2 - barW / 2, y, barW, barH, 8);
    this.container.add(barGfx);

    const barTitle = this.scene.add.text(screenW / 2 - barW / 2 + 16, y + 6, `🎒 厨神背包 (点击变卖按钮可折价回收食材，腾出槽位)`, {
      fontSize: '11px',
      color: '#8fa3a6',
      fontStyle: 'bold',
    });
    this.container.add(barTitle);

    const slotW = 158;
    const slotH = 44;
    const startX = screenW / 2 - barW / 2 + 16 + slotW / 2;
    const slotY = y + 43;

    for (let i = 0; i < player.maxWeapons; i++) {
      const wState = player.weapons[i];
      const cx = startX + i * (slotW + 10);

      const slotGfx = this.scene.add.graphics();
      slotGfx.fillStyle(wState ? 0x14252c : 0x091012, 0.95);
      slotGfx.fillRoundedRect(cx - slotW / 2, slotY - slotH / 2, slotW, slotH, 6);
      slotGfx.lineStyle(1, wState ? 0x2a9d8f : 0x1f2e33, 1);
      slotGfx.strokeRoundedRect(cx - slotW / 2, slotY - slotH / 2, slotW, slotH, 6);
      this.container.add(slotGfx);

      if (wState) {
        // 专属武器图标
        const iconKey = this.getWeaponTexture(wState.definition.id);
        const icon = this.scene.add.image(cx - slotW / 2 + 18, slotY, iconKey);
        icon.setDisplaySize(24, 24);
        this.container.add(icon);

        // 武器名与等级
        const wTxt = this.scene.add.text(cx - slotW / 2 + 34, slotY - 11, `${wState.definition.nameKey}`, {
          fontSize: '11px',
          color: wState.definition.color || '#ffd166',
          fontStyle: 'bold',
        });
        this.container.add(wTxt);

        const lvlTxt = this.scene.add.text(cx + slotW / 2 - 6, slotY - 11, `Lv.${wState.level}`, {
          fontSize: '10px',
          color: '#00f5d4',
          fontStyle: 'bold',
        });
        lvlTxt.setOrigin(1, 0);
        this.container.add(lvlTxt);

        // 变卖回收按钮
        const sellValue = Math.max(3, Math.floor((wState.definition.cost || 10) * 0.7 * wState.level));
        const sellContainer = this.scene.add.container(cx + 8, slotY + 9);
        const sellBg = this.scene.add.graphics();
        sellBg.fillStyle(0x3a1515, 0.9);
        sellBg.fillRoundedRect(-48, -8, 96, 16, 4);
        sellBg.lineStyle(1, 0xe76f51, 0.8);
        sellBg.strokeRoundedRect(-48, -8, 96, 16, 4);
        sellContainer.add(sellBg);

        const sellTxt = this.scene.add.text(0, 0, `♻️ 变卖 (+${sellValue}🥟)`, {
          fontSize: '10px',
          color: '#ffd166',
          fontStyle: 'bold',
        });
        sellTxt.setOrigin(0.5, 0.5);
        sellContainer.add(sellTxt);

        const sellZone = this.scene.add.zone(0, 0, 96, 16);
        sellZone.setInteractive({ useHandCursor: true });
        sellZone.on('pointerdown', () => {
          player.removeWeapon(i);
          player.ingredients += sellValue;
          EventBus.getInstance().emit('sound:play', { key: 'sfx_coin', volume: 0.8 });
          this.render(player, rng, waveNumber);
        });
        sellContainer.add(sellZone);

        this.container.add(sellContainer);
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
    bgGfx.fillStyle(slot.isBought ? 0x091012 : 0x101a1e, 0.98);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(2, slot.isLocked ? 0xffd166 : 0x2f4850, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    card.add(bgGfx);

    if (slot.isBought) {
      const soldText = this.scene.add.text(0, 0, '【已采购】', {
        fontSize: '20px',
        color: '#6c757d',
        fontStyle: 'bold',
      });
      soldText.setOrigin(0.5, 0.5);
      card.add(soldText);
      return card;
    }

    const titleStr = slot.type === 'weapon' ? slot.weapon!.nameKey : slot.item!.nameKey;
    const colorHex = slot.type === 'weapon' ? slot.weapon!.color || '#f4a261' : slot.item!.color || '#2a9d8f';
    const textureKey = this.getTextureForSlot(slot);

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
          descStr = `已满 ${player.maxWeapons} 把武器，请先变卖闲置厨具`;
        } else {
          descStr = slot.weapon!.levels[0].descriptionKey;
          tagStr = `新增神兵 · ${formatTags(slot.weapon!.tags)}`;
        }
      }
    } else {
      const stacks = player.getItemCount(slot.item!.id);
      descStr = slot.item!.descriptionKey;
      tagStr = `口味秘方 · ${formatTags(slot.item!.tags)} (${stacks}/${slot.item!.maxStacks})`;
    }

    // 1. 顶部状态标签
    const tagText = this.scene.add.text(0, -h / 2 + 14, tagStr, {
      fontSize: '11px',
      color: isMergeUpgrade ? '#ffd166' : isFullBlocked ? '#e76f51' : '#00f5d4',
      fontStyle: 'bold',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      align: 'center',
    });
    tagText.setOrigin(0.5, 0);
    card.add(tagText);

    // 2. 主体艺术展示台 (Hero Artwork Pedestal - 独立专属像素贴图)
    const pedestalY = -h / 2 + 82;
    const pedestalGfx = this.scene.add.graphics();
    pedestalGfx.fillStyle(0x15242a, 0.95);
    pedestalGfx.fillCircle(0, pedestalY, 40);
    pedestalGfx.lineStyle(2, parseInt(colorHex.replace('#', '0x'), 16) || 0x2a9d8f, 0.85);
    pedestalGfx.strokeCircle(0, pedestalY, 40);
    pedestalGfx.lineStyle(1, 0xffffff, 0.2);
    pedestalGfx.strokeCircle(0, pedestalY, 34);
    card.add(pedestalGfx);

    // 专属大尺寸像素艺术图标
    const heroImage = this.scene.add.image(0, pedestalY, textureKey);
    heroImage.setDisplaySize(60, 60);
    card.add(heroImage);

    // 呼吸动态
    this.scene.tweens.add({
      targets: heroImage,
      y: pedestalY - 3,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. 物品名称
    const titleText = this.scene.add.text(0, -h / 2 + 134, titleStr, {
      fontSize: '18px',
      color: colorHex,
      fontStyle: 'bold',
      align: 'center',
    });
    titleText.setOrigin(0.5, 0);
    card.add(titleText);

    // 4. 描述
    const descText = this.scene.add.text(0, -h / 2 + 164, descStr, {
      fontSize: '12px',
      color: '#d8e2dc',
      wordWrap: { width: w - 24, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 3,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    const canAfford = player.ingredients >= slot.cost && !isFullBlocked && !isMaxLevelBlocked;

    const doBuy = () => {
      if (!canAfford) {
        this.scene.tweens.add({
          targets: card,
          x: x + 6,
          duration: 60,
          yoyo: true,
          repeat: 2,
        });
        return;
      }

      player.ingredients -= slot.cost;
      slot.isBought = true;

      if (slot.type === 'weapon') {
        player.equipWeapon(slot.weapon!);
      } else {
        player.addItem(slot.item!);
      }

      EventBus.getInstance().emit('sound:play', { key: 'sfx_pickup', volume: 0.8 });
      this.render(player, rng, waveNumber);
    };

    // 5. 整张卡片支持点击响应与悬停动效
    card.setSize(w, h);
    const cardHitZone = this.scene.add.zone(0, 0, w, h);
    cardHitZone.setScrollFactor(0);
    cardHitZone.setInteractive({ useHandCursor: true });

    cardHitZone.on('pointerover', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x16262d, 1);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bgGfx.lineStyle(2.5, canAfford ? 0x00f5d4 : 0xe76f51, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      card.setScale(1.03);
    });

    cardHitZone.on('pointerout', () => {
      bgGfx.clear();
      bgGfx.fillStyle(slot.isBought ? 0x091012 : 0x101a1e, 0.98);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bgGfx.lineStyle(2, slot.isLocked ? 0xffd166 : 0x2f4850, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      card.setScale(1.0);
    });

    cardHitZone.on('pointerdown', () => {
      doBuy();
    });
    card.add(cardHitZone);

    // 6. 锁定切换按钮 (置于最顶层，阻断向卡片传递购买事件)
    const lockContainer = this.scene.add.container(-w / 2 + 38, h / 2 - 28);
    const lockBg = this.scene.add.graphics();
    lockBg.fillStyle(slot.isLocked ? 0x3d3008 : 0x142024, 0.9);
    lockBg.fillRoundedRect(-28, -12, 56, 24, 4);
    lockBg.lineStyle(1, slot.isLocked ? 0xffd166 : 0x22363e, 1);
    lockBg.strokeRoundedRect(-28, -12, 56, 24, 4);
    lockContainer.add(lockBg);

    const lockTxt = this.scene.add.text(0, 0, slot.isLocked ? '🔒 已锁' : '🔓 锁定', {
      fontSize: '11px',
      color: slot.isLocked ? '#ffd166' : '#8fa3a6',
      fontStyle: 'bold',
    });
    lockTxt.setOrigin(0.5, 0.5);
    lockContainer.add(lockTxt);

    const lockZone = this.scene.add.zone(0, 0, 56, 24);
    lockZone.setInteractive({ useHandCursor: true });
    lockZone.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      slot.isLocked = !slot.isLocked;
      EventBus.getInstance().emit('sound:play', { key: 'sfx_click', volume: 0.5 });
      this.render(player, rng, waveNumber);
    });
    lockContainer.add(lockZone);
    card.add(lockContainer);

    // 7. 购买行动按钮视觉
    const canAffordBtn = canAfford;
    let buyBtnLabel = `🥟 ${slot.cost} 购买`;
    if (isFullBlocked) buyBtnLabel = '槽位已满';
    else if (isMaxLevelBlocked) buyBtnLabel = '已满级';

    const buyBtnContainer = this.scene.add.container(w / 2 - 62, h / 2 - 28);
    const buyBtnW = 104;
    const buyBtnH = 32;

    const buyGfx = this.scene.add.graphics();
    buyGfx.fillStyle(canAffordBtn ? 0xe76f51 : 0x2a363c, 1);
    buyGfx.fillRoundedRect(-buyBtnW / 2, -buyBtnH / 2, buyBtnW, buyBtnH, 6);
    if (canAffordBtn) {
      buyGfx.lineStyle(1.5, 0xffd166, 0.9);
      buyGfx.strokeRoundedRect(-buyBtnW / 2, -buyBtnH / 2, buyBtnW, buyBtnH, 6);
    }
    buyBtnContainer.add(buyGfx);

    const buyTxt = this.scene.add.text(0, 0, buyBtnLabel, {
      fontSize: isFullBlocked || isMaxLevelBlocked ? '11px' : '13px',
      color: canAffordBtn ? '#ffffff' : '#8fa3a6',
      fontStyle: 'bold',
    });
    buyTxt.setOrigin(0.5, 0.5);
    buyBtnContainer.add(buyTxt);
    card.add(buyBtnContainer);

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

    // 2. 进货刷新按钮
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
        this.refreshCost += 1;
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

  private getWeaponTexture(weaponId: string): string {
    const key = `weapon_${weaponId}`;
    if (this.scene.textures.exists(key)) return key;
    if (weaponId === 'cleaver') return 'weapon_cleaver';
    if (weaponId === 'bamboo_skewer') return 'weapon_bamboo_skewer';
    if (weaponId === 'seasoning_jar') return 'weapon_seasoning_jar';
    if (weaponId === 'iron_wok') return 'weapon_iron_wok';
    if (weaponId === 'stove_flame') return 'weapon_stove_flame';
    if (weaponId === 'service_bell') return 'weapon_service_bell';
    if (weaponId === 'dragon_spatula') return 'weapon_dragon_spatula';
    if (weaponId === 'popcorn_popper') return 'weapon_popcorn_popper';
    if (weaponId === 'jade_teapot') return 'weapon_jade_teapot';
    if (weaponId === 'flavor_vortex') return 'weapon_flavor_vortex';
    return 'weapon_cleaver';
  }

  private getTextureForSlot(slot: ShopSlot): string {
    if (slot.type === 'weapon' && slot.weapon) {
      return this.getWeaponTexture(slot.weapon.id);
    } else if (slot.item) {
      const id = slot.item.id;
      if (this.scene.textures.exists(`item_${id}`)) return `item_${id}`;
      if (id === 'chili_pepper' || id === 'heavy_spices') return 'item_chili_pepper';
      if (id === 'ice_cube' || id === 'aged_vinegar') return 'item_ice_cube';
      if (id === 'sesame_oil') return 'item_sesame_oil';
      if (id === 'cane_sugar' || id === 'golden_spatula') return 'item_cane_sugar';
      if (id === 'fermented_sauce') return 'item_fermented_sauce';
      if (id === 'bamboo_steamer' || id === 'iron_stomach') return 'item_bamboo_steamer';
      if (id === 'garlic_clove') return 'item_garlic_clove';
      if (id === 'star_anise') return 'item_star_anise';
      if (id === 'dang_gui_herb') return 'item_herb';
      if (id === 'wolfberry_wine') return 'item_potion';
      if (id === 'lucky_cat') return 'item_lucky_cat';
      return 'item_food';
    }
    return 'item_food';
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
