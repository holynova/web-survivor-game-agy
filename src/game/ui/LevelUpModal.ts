import Phaser from 'phaser';
import { ITEMS } from '@/content/items/data';
import { ItemDefinition } from '@/content/schemas/item';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { SeededRNG } from '@/core/rng';
import { Player } from '../entities/Player';

export type UpgradeOption =
  | { type: 'weapon_upgrade'; weapon: WeaponDefinition; nextLevel: number }
  | { type: 'weapon_new'; weapon: WeaponDefinition }
  | { type: 'item_new'; item: ItemDefinition };

export class LevelUpModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onSelectCallback: () => void;

  constructor(scene: Phaser.Scene, onSelect: () => void) {
    this.scene = scene;
    this.onSelectCallback = onSelect;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(200);
    this.container.setVisible(false);
  }

  public show(player: Player, rng: SeededRNG): void {
    this.container.removeAll(true);
    this.container.setVisible(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明背景遮罩
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.85);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // 标题
    const title = this.scene.add.text(width / 2, 60, '★ 神厨升级！选择一项犒赏 ★', {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // 生成 3 个可选升级
    const options = this.generateUpgradeOptions(player, rng);

    const cardWidth = 220;
    const cardHeight = 280;
    const totalW = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (width - totalW) / 2 + cardWidth / 2;
    const cardY = height / 2 + 10;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const cx = startX + i * (cardWidth + 20);
      const cardContainer = this.createCard(opt, cx, cardY, cardWidth, cardHeight, player);
      this.container.add(cardContainer);
    }
  }

  private createCard(
    opt: UpgradeOption,
    x: number,
    y: number,
    w: number,
    h: number,
    player: Player,
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(2, 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    card.add(bgGfx);

    let nameText = '';
    let typeTag = '';
    let descText = '';
    let tagsStr = '';
    let colorHex = '#f4a261';

    if (opt.type === 'weapon_upgrade') {
      nameText = opt.weapon.nameKey;
      typeTag = `厨具升级 -> Lv.${opt.nextLevel}`;
      descText = opt.weapon.levels[opt.nextLevel - 1].descriptionKey;
      tagsStr = opt.weapon.tags.map(t => `#${t}`).join(' ');
      colorHex = opt.weapon.color;
    } else if (opt.type === 'weapon_new') {
      nameText = opt.weapon.nameKey;
      typeTag = '新入厨具 (Lv.1)';
      descText = opt.weapon.levels[0].descriptionKey;
      tagsStr = opt.weapon.tags.map(t => `#${t}`).join(' ');
      colorHex = opt.weapon.color;
    } else {
      nameText = opt.item.nameKey;
      typeTag = '口味配方';
      descText = opt.item.descriptionKey;
      tagsStr = opt.item.tags.map(t => `#${t}`).join(' ');
      colorHex = opt.item.color;
    }

    // 标签分类
    const tagObj = this.scene.add.text(0, -h / 2 + 20, typeTag, {
      fontSize: '11px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    tagObj.setOrigin(0.5, 0);
    card.add(tagObj);

    // 物品名
    const titleObj = this.scene.add.text(0, -h / 2 + 45, nameText, {
      fontSize: '16px',
      color: colorHex,
      fontStyle: 'bold',
      wordWrap: { width: w - 20 },
      align: 'center',
    });
    titleObj.setOrigin(0.5, 0);
    card.add(titleObj);

    // 属性描述
    const descObj = this.scene.add.text(0, -h / 2 + 90, descText, {
      fontSize: '12px',
      color: '#d8e2dc',
      wordWrap: { width: w - 24 },
      align: 'center',
      lineSpacing: 4,
    });
    descObj.setOrigin(0.5, 0);
    card.add(descObj);

    // 底部标签
    const tagsObj = this.scene.add.text(0, h / 2 - 50, tagsStr, {
      fontSize: '11px',
      color: '#8fa3a6',
    });
    tagsObj.setOrigin(0.5, 0);
    card.add(tagsObj);

    // 选择按钮
    const btnGfx = this.scene.add.graphics();
    btnGfx.fillStyle(0x2a9d8f, 1);
    btnGfx.fillRoundedRect(-w / 2 + 20, h / 2 - 38, w - 40, 28, 6);
    card.add(btnGfx);

    const btnText = this.scene.add.text(0, h / 2 - 24, '选 取', {
      fontSize: '13px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    card.add(btnText);

    // 卡片交互热区
    const hitZone = this.scene.add.zone(0, 0, w, h);
    hitZone.setInteractive({ useHandCursor: true });
    card.add(hitZone);

    hitZone.on('pointerover', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x1a2b32, 1);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bgGfx.lineStyle(2, 0x00f5d4, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      card.setScale(1.03);
    });

    hitZone.on('pointerout', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x121c20, 0.95);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bgGfx.lineStyle(2, 0x3d5a5b, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      card.setScale(1.0);
    });

    hitZone.on('pointerdown', () => {
      this.applyUpgrade(opt, player);
      EventBus.getInstance().emit('sound:play', { key: 'sfx_pickup', volume: 0.8 });
      this.hide();
      this.onSelectCallback();
    });

    return card;
  }

  private generateUpgradeOptions(player: Player, rng: SeededRNG): UpgradeOption[] {
    const candidates: UpgradeOption[] = [];

    // 1. 已装备武器的升级选项
    for (const w of player.weapons) {
      if (w.level < w.definition.levels.length) {
        candidates.push({
          type: 'weapon_upgrade',
          weapon: w.definition,
          nextLevel: w.level + 1,
        });
      }
    }

    // 2. 新武器选项 (如果武器栏未满，最多 4 把武器)
    if (player.weapons.length < 4) {
      const equippedIds = new Set(player.weapons.map(w => w.definition.id));
      for (const weapon of Object.values(WEAPONS)) {
        if (!equippedIds.has(weapon.id)) {
          candidates.push({ type: 'weapon_new', weapon });
        }
      }
    }

    // 3. 口味被动道具选项
    for (const item of Object.values(ITEMS)) {
      const currentItem = player.items.find(i => i.definition.id === item.id);
      if (!currentItem || currentItem.count < item.maxStacks) {
        candidates.push({ type: 'item_new', item });
      }
    }

    // 洗牌并截取 3 个
    const shuffled = rng.shuffle(candidates);
    return shuffled.slice(0, 3);
  }

  private applyUpgrade(opt: UpgradeOption, player: Player): void {
    if (opt.type === 'weapon_upgrade' || opt.type === 'weapon_new') {
      player.equipWeapon(opt.weapon);
    } else if (opt.type === 'item_new') {
      player.addItem(opt.item);
    }
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
