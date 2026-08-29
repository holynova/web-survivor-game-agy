import Phaser from 'phaser';
import { ITEMS } from '@/content/items/data';
import { formatTags } from '@/content/schemas/common';
import { ItemDefinition } from '@/content/schemas/item';
import { WeaponDefinition } from '@/content/schemas/weapon';
import { WEAPONS } from '@/content/weapons/data';
import { EventBus } from '@/core/event-bus';
import { SeededRNG } from '@/core/rng';
import { Player } from '../entities/Player';

export type UpgradeOption =
  | { type: 'weapon_upgrade'; weapon: WeaponDefinition; nextLevel: number; currentLevel: number }
  | { type: 'weapon_new'; weapon: WeaponDefinition }
  | { type: 'item_new'; item: ItemDefinition; currentStacks: number }
  | { type: 'heal_pack'; amount: number }
  | { type: 'gold_pack'; amount: number };

export class LevelUpModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onSelectCallback: () => void;

  constructor(scene: Phaser.Scene, onSelect: () => void) {
    this.scene = scene;
    this.onSelectCallback = onSelect;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);
    this.container.setVisible(false);
  }

  public show(player: Player, rng: SeededRNG): void {
    this.container.removeAll(true);
    this.container.setVisible(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. 半透明夜市暗色背景遮罩
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.98);
    bg.setScrollFactor(0);
    bg.setInteractive();
    this.container.add(bg);

    // 2. 顶部发光标题与角色信息
    const titleGlow = this.scene.add.text(width / 2, 45, '★ 神厨升级！请选取一项绝技犒赏 ★', {
      fontSize: '26px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    titleGlow.setOrigin(0.5, 0);
    titleGlow.setScrollFactor(0);
    this.container.add(titleGlow);

    const subTitle = this.scene.add.text(
      width / 2,
      85,
      `当前神厨: Lv.${player.level}  |  生命: ${Math.round(player.currentHp)}/${player.maxHp}  |  拥有食材: 🥟 ${player.ingredients}`,
      {
        fontSize: '14px',
        color: '#8fa3a6',
      },
    );
    subTitle.setOrigin(0.5, 0);
    subTitle.setScrollFactor(0);
    this.container.add(subTitle);

    // 3. 生成 3 个可选升级
    const options = this.generateUpgradeOptions(player, rng);

    const cardWidth = 320;
    const cardHeight = 440;
    const totalW = options.length * cardWidth + (options.length - 1) * 32;
    const startX = (width - totalW) / 2 + cardWidth / 2;
    const cardY = height / 2 + 40;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const cx = startX + i * (cardWidth + 32);
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
    card.setScrollFactor(0);
    card.setSize(w, h);

    const bgGfx = this.scene.add.graphics();
    bgGfx.fillStyle(0x0f181b, 0.98);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bgGfx.lineStyle(2, 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    bgGfx.setScrollFactor(0);
    card.add(bgGfx);

    let nameText = '';
    let typeTag = '';
    let descText = '';
    let tagsStr = '';
    let colorHex = '#f4a261';
    let textureKey = 'weapon_cleaver';
    let starText = '';

    if (opt.type === 'weapon_upgrade') {
      nameText = opt.weapon.nameKey;
      typeTag = `【厨具升星】`;
      starText = `Lv.${opt.currentLevel} ➔ Lv.${opt.nextLevel}`;
      descText = opt.weapon.levels[opt.nextLevel - 1].descriptionKey;
      tagsStr = formatTags(opt.weapon.tags);
      colorHex = opt.weapon.color;
      textureKey = this.getWeaponTexture(opt.weapon.id);
    } else if (opt.type === 'weapon_new') {
      nameText = opt.weapon.nameKey;
      typeTag = '【新增神兵】';
      starText = '★ 初始 Lv.1';
      descText = opt.weapon.levels[0].descriptionKey;
      tagsStr = formatTags(opt.weapon.tags);
      colorHex = opt.weapon.color;
      textureKey = this.getWeaponTexture(opt.weapon.id);
    } else if (opt.type === 'item_new') {
      nameText = opt.item.nameKey;
      typeTag = `【绝品秘方】`;
      starText = `叠加: ${opt.currentStacks + 1}/${opt.item.maxStacks}`;
      descText = opt.item.descriptionKey;
      tagsStr = formatTags(opt.item.tags);
      colorHex = opt.item.color;
      textureKey = this.getItemTexture(opt.item.id);
    } else if (opt.type === 'heal_pack') {
      nameText = '大排档养生煲';
      typeTag = '【神效滋补】';
      starText = '💚 立即回血 50%';
      descText = `瞬时恢复 ${opt.amount} 点生命值，绝境逢生！`;
      tagsStr = '#恢复 #气血充盈';
      colorHex = '#06d6a0';
      textureKey = 'item_food';
    } else {
      nameText = '夜市财神福袋';
      typeTag = '【丰厚食材】';
      starText = `🥟 获得 +${opt.amount} 食材`;
      descText = `立即进账 ${opt.amount} 份食材，整备期可在商店随心采购！`;
      tagsStr = '#经济 #采购资本';
      colorHex = '#ffd166';
      textureKey = 'item_sugar';
    }

    // 1. 顶部类型标签徽章
    const tagObj = this.scene.add.text(0, -h / 2 + 18, typeTag, {
      fontSize: '13px',
      color: '#00f5d4',
      fontStyle: 'bold',
      align: 'center',
    });
    tagObj.setOrigin(0.5, 0);
    card.add(tagObj);

    // 2. 主体视觉展示台 (Hero Artwork Pedestal - 占据卡片核心显要位置)
    const pedestalY = -h / 2 + 95;
    const pedestalGfx = this.scene.add.graphics();
    pedestalGfx.fillStyle(0x16252b, 0.95);
    pedestalGfx.fillCircle(0, pedestalY, 48);
    pedestalGfx.lineStyle(2, parseInt(colorHex.replace('#', '0x'), 16) || 0x2a9d8f, 0.8);
    pedestalGfx.strokeCircle(0, pedestalY, 48);
    pedestalGfx.lineStyle(1, 0xffffff, 0.25);
    pedestalGfx.strokeCircle(0, pedestalY, 40);
    card.add(pedestalGfx);

    // 大尺寸高清像素图标
    const heroImage = this.scene.add.image(0, pedestalY, textureKey);
    heroImage.setDisplaySize(76, 76);
    card.add(heroImage);

    // 浮动呼吸动画
    this.scene.tweens.add({
      targets: heroImage,
      y: pedestalY - 4,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. 物品名称与星级标尺
    const titleObj = this.scene.add.text(0, -h / 2 + 160, nameText, {
      fontSize: '20px',
      color: colorHex,
      fontStyle: 'bold',
      align: 'center',
    });
    titleObj.setOrigin(0.5, 0);
    card.add(titleObj);

    const starObj = this.scene.add.text(0, -h / 2 + 188, starText, {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
      align: 'center',
    });
    starObj.setOrigin(0.5, 0);
    card.add(starObj);

    // 4. 详细属性描述容器框
    const descBoxW = w - 36;
    const descBoxH = 100;
    const descBoxY = -h / 2 + 215;

    const descBoxGfx = this.scene.add.graphics();
    descBoxGfx.fillStyle(0x0a1114, 0.85);
    descBoxGfx.fillRoundedRect(-descBoxW / 2, descBoxY, descBoxW, descBoxH, 8);
    descBoxGfx.lineStyle(1, 0x22363e, 0.7);
    descBoxGfx.strokeRoundedRect(-descBoxW / 2, descBoxY, descBoxW, descBoxH, 8);
    card.add(descBoxGfx);

    const descObj = this.scene.add.text(0, descBoxY + descBoxH / 2, descText, {
      fontSize: '13px',
      color: '#e2ece9',
      wordWrap: { width: descBoxW - 20, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 5,
    });
    descObj.setOrigin(0.5, 0.5);
    card.add(descObj);

    // 5. 底部词条标签
    const tagsObj = this.scene.add.text(0, h / 2 - 80, tagsStr, {
      fontSize: '12px',
      color: '#8fa3a6',
      align: 'center',
    });
    tagsObj.setOrigin(0.5, 0);
    card.add(tagsObj);

    // 6. 选取按钮背景与文字
    const btnW = w - 50;
    const btnH = 38;
    const btnY = h / 2 - 36;

    const btnGfx = this.scene.add.graphics();
    btnGfx.fillStyle(0x2a9d8f, 1);
    btnGfx.fillRoundedRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    card.add(btnGfx);

    const btnText = this.scene.add.text(0, btnY, '🔥 选 取 🔥', {
      fontSize: '15px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    card.add(btnText);

    // 7. 交互响应（整张卡片与按钮均可点击选择）
    const hitZone = this.scene.add.zone(0, 0, w, h);
    hitZone.setScrollFactor(0);
    hitZone.setInteractive({ useHandCursor: true });
    card.add(hitZone);

    const onSelectCard = () => {
      this.applyUpgrade(opt, player);
      EventBus.getInstance().emit('sound:play', { key: 'sfx_coin', volume: 0.8 });
      this.hide();
      this.onSelectCallback();
    };

    hitZone.on('pointerover', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x16262d, 1);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bgGfx.lineStyle(2.5, 0x00f5d4, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      card.setScale(1.04);
    });

    hitZone.on('pointerout', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x0f181b, 0.98);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bgGfx.lineStyle(2, 0x3d5a5b, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      card.setScale(1.0);
    });

    hitZone.on('pointerdown', onSelectCard);

    return card;
  }

  private getWeaponTexture(weaponId: string): string {
    const key = `weapon_${weaponId}`;
    if (this.scene.textures.exists(key)) return key;
    if (weaponId === 'cleaver') return 'weapon_cleaver';
    if (weaponId === 'bamboo_skewer') return 'item_skewer';
    if (weaponId === 'seasoning_jar') return 'item_potion';
    return 'weapon_cleaver';
  }

  private getItemTexture(itemId: string): string {
    if (itemId === 'dang_gui_herb') return 'item_herb';
    if (itemId === 'wolfberry_wine') return 'item_potion';
    if (itemId === 'sugar_candy' || itemId === 'sugar') return 'item_sugar';
    if (itemId === 'chili_oil' || itemId === 'soy_sauce' || itemId === 'vinegar') return 'item_potion';
    if (itemId === 'skewer_bamboo') return 'item_skewer';
    if (this.scene.textures.exists('item_potion')) return 'item_potion';
    return 'item_herb';
  }

  private generateUpgradeOptions(player: Player, rng: SeededRNG): UpgradeOption[] {
    const candidates: UpgradeOption[] = [];

    // 1. 已装备武器的升星选项 (最高 Lv.3)
    for (const w of player.weapons) {
      if (w.level < w.definition.levels.length) {
        candidates.push({
          type: 'weapon_upgrade',
          weapon: w.definition,
          nextLevel: w.level + 1,
          currentLevel: w.level,
        });
      }
    }

    // 2. 新武器选项 (若槽位未满 4 个)
    if (player.weapons.length < player.maxWeapons) {
      const ownedWeaponIds = new Set(player.weapons.map(w => w.definition.id));
      const unownedWeapons = Object.values(WEAPONS).filter(w => !ownedWeaponIds.has(w.id));
      for (const w of unownedWeapons) {
        candidates.push({
          type: 'weapon_new',
          weapon: w,
        });
      }
    }

    // 3. 口味秘方道具选项
    for (const item of Object.values(ITEMS)) {
      const currentStacks = player.getItemCount(item.id);
      if (currentStacks < item.maxStacks) {
        candidates.push({
          type: 'item_new',
          item,
          currentStacks,
        });
      }
    }

    // 洗牌并选出前 3 项
    const shuffled = rng.shuffle(candidates);
    const selected = shuffled.slice(0, 3);

    // 保底：若候选不足 3 项，填充恢复包或食材包
    while (selected.length < 3) {
      if (player.currentHp < player.maxHp * 0.7) {
        selected.push({
          type: 'heal_pack',
          amount: Math.round(player.maxHp * 0.5),
        });
      } else {
        selected.push({
          type: 'gold_pack',
          amount: 25,
        });
      }
    }

    return selected;
  }

  private applyUpgrade(option: UpgradeOption, player: Player): void {
    if (option.type === 'weapon_upgrade') {
      player.upgradeWeapon(option.weapon.id);
    } else if (option.type === 'weapon_new') {
      player.equipWeapon(option.weapon);
    } else if (option.type === 'item_new') {
      player.addItem(option.item);
    } else if (option.type === 'heal_pack') {
      player.heal(option.amount);
    } else if (option.type === 'gold_pack') {
      player.ingredients += option.amount;
    }
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
