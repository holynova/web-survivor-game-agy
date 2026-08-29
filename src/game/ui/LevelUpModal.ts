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
    this.container.setDepth(200);
    this.container.setVisible(false);
  }

  public show(player: Player, rng: SeededRNG): void {
    this.container.removeAll(true);
    this.container.setVisible(true);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 半透明夜市暗色背景遮罩
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060b0c, 0.88);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // 顶部发光标题
    const titleGlow = this.scene.add.text(width / 2, 45, '★ 神厨升级！选择一项犒赏 ★', {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    titleGlow.setOrigin(0.5, 0);
    this.container.add(titleGlow);

    const subTitle = this.scene.add.text(
      width / 2,
      76,
      `当前等级: Lv.${player.level}  |  生命: ${Math.round(player.currentHp)}/${player.maxHp}  |  食材: ${player.ingredients}`,
      {
        fontSize: '12px',
        color: '#8fa3a6',
      },
    );
    subTitle.setOrigin(0.5, 0);
    this.container.add(subTitle);

    // 生成 3 个可选升级
    const options = this.generateUpgradeOptions(player, rng);

    const cardWidth = 240;
    const cardHeight = 310;
    const totalW = options.length * cardWidth + (options.length - 1) * 24;
    const startX = (width - totalW) / 2 + cardWidth / 2;
    const cardY = height / 2 + 25;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const cx = startX + i * (cardWidth + 24);
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
    bgGfx.fillStyle(0x121c20, 0.96);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(2, 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    card.add(bgGfx);

    let nameText = '';
    let typeTag = '';
    let descText = '';
    let tagsStr = '';
    let colorHex = '#f4a261';
    let iconChar = '✨';

    if (opt.type === 'weapon_upgrade') {
      nameText = opt.weapon.nameKey;
      typeTag = `【厨具升星】Lv.${opt.currentLevel} ➔ Lv.${opt.nextLevel}`;
      descText = opt.weapon.levels[opt.nextLevel - 1].descriptionKey;
      tagsStr = formatTags(opt.weapon.tags);
      colorHex = opt.weapon.color;
      iconChar = this.getWeaponIcon(opt.weapon.id);
    } else if (opt.type === 'weapon_new') {
      nameText = opt.weapon.nameKey;
      typeTag = '【新增厨具】初始 Lv.1';
      descText = opt.weapon.levels[0].descriptionKey;
      tagsStr = formatTags(opt.weapon.tags);
      colorHex = opt.weapon.color;
      iconChar = this.getWeaponIcon(opt.weapon.id);
    } else if (opt.type === 'item_new') {
      nameText = opt.item.nameKey;
      typeTag = `【口味秘方】(已有 ${opt.currentStacks}/${opt.item.maxStacks})`;
      descText = opt.item.descriptionKey;
      tagsStr = formatTags(opt.item.tags);
      colorHex = opt.item.color;
      iconChar = this.getItemIcon(opt.item.id);
    } else if (opt.type === 'heal_pack') {
      nameText = '大排档养生煲';
      typeTag = '【保底滋补】';
      descText = `立即恢复 ${opt.amount} 点生命值 (50% 最大生命值)`;
      tagsStr = '#恢复 #治愈';
      colorHex = '#2a9d8f';
      iconChar = '🍲';
    } else {
      nameText = '夜市财神福袋';
      typeTag = '【保底食材】';
      descText = `立即获得 ${opt.amount} 份食材，可在整备期自由采购`;
      tagsStr = '#经济 #食材';
      colorHex = '#ffd166';
      iconChar = '💰';
    }

    // 1. 类型标签
    const tagObj = this.scene.add.text(0, -h / 2 + 18, typeTag, {
      fontSize: '11px',
      color: '#2a9d8f',
      fontStyle: 'bold',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      align: 'center',
    });
    tagObj.setOrigin(0.5, 0);
    card.add(tagObj);

    // 2. 物品图标与名称
    const titleObj = this.scene.add.text(0, -h / 2 + 45, `${iconChar} ${nameText}`, {
      fontSize: '17px',
      color: colorHex,
      fontStyle: 'bold',
      wordWrap: { width: w - 24, useAdvancedWrap: true },
      align: 'center',
    });
    titleObj.setOrigin(0.5, 0);
    card.add(titleObj);

    // 3. 详细属性与效果描述
    const descObj = this.scene.add.text(0, -h / 2 + 88, descText, {
      fontSize: '12px',
      color: '#e2ece9',
      wordWrap: { width: w - 28, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4,
    });
    descObj.setOrigin(0.5, 0);
    card.add(descObj);

    // 4. 底部词条标签
    const tagsObj = this.scene.add.text(0, h / 2 - 58, tagsStr, {
      fontSize: '11px',
      color: '#8fa3a6',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      align: 'center',
    });
    tagsObj.setOrigin(0.5, 0);
    card.add(tagsObj);

    // 5. 选取按钮
    const btnGfx = this.scene.add.graphics();
    btnGfx.fillStyle(0x2a9d8f, 1);
    btnGfx.fillRoundedRect(-w / 2 + 24, h / 2 - 42, w - 48, 30, 6);
    card.add(btnGfx);

    const btnText = this.scene.add.text(0, h / 2 - 27, '选 取', {
      fontSize: '14px',
      color: '#060b0c',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);
    card.add(btnText);

    // 6. 交互响应
    const hitZone = this.scene.add.zone(0, 0, w, h);
    hitZone.setInteractive({ useHandCursor: true });
    card.add(hitZone);

    hitZone.on('pointerover', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x1a2b32, 1);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bgGfx.lineStyle(2.5, 0x00f5d4, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      card.setScale(1.03);
    });

    hitZone.on('pointerout', () => {
      bgGfx.clear();
      bgGfx.fillStyle(0x121c20, 0.96);
      bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bgGfx.lineStyle(2, 0x3d5a5b, 1);
      bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      card.setScale(1.0);
    });

    hitZone.on('pointerdown', () => {
      this.applyUpgrade(opt, player);
      EventBus.getInstance().emit('sound:play', { key: 'sfx_coin', volume: 0.8 });
      this.hide();
      this.onSelectCallback();
    });

    return card;
  }

  private generateUpgradeOptions(player: Player, rng: SeededRNG): UpgradeOption[] {
    const candidates: UpgradeOption[] = [];

    // 1. 已装备武器的升级选项 (最高 Lv.3)
    for (const w of player.weapons) {
      if (w.level < w.definition.levels.length) {
        candidates.push({
          type: 'weapon_upgrade',
          weapon: w.definition,
          currentLevel: w.level,
          nextLevel: w.level + 1,
        });
      }
    }

    // 2. 新武器选项 (最多持有 4 把武器)
    if (player.weapons.length < 4) {
      const equippedIds = new Set(player.weapons.map(w => w.definition.id));
      for (const weapon of Object.values(WEAPONS)) {
        if (!equippedIds.has(weapon.id)) {
          candidates.push({ type: 'weapon_new', weapon });
        }
      }
    }

    // 3. 口味被动道具选项 (未达到堆叠上限)
    for (const item of Object.values(ITEMS)) {
      const currentItem = player.items.find(i => i.definition.id === item.id);
      const stacks = currentItem ? currentItem.count : 0;
      if (stacks < item.maxStacks) {
        candidates.push({ type: 'item_new', item, currentStacks: stacks });
      }
    }

    // 洗牌
    const shuffled = rng.shuffle(candidates);
    const result = shuffled.slice(0, 3);

    // 保底：若可选不足 3 项，填充恢复与食材包
    while (result.length < 3) {
      if (result.length === 1) {
        result.push({
          type: 'heal_pack',
          amount: Math.round(player.maxHp * 0.5),
        });
      } else {
        result.push({
          type: 'gold_pack',
          amount: 30,
        });
      }
    }

    return result;
  }

  private applyUpgrade(opt: UpgradeOption, player: Player): void {
    if (opt.type === 'weapon_upgrade' || opt.type === 'weapon_new') {
      player.equipWeapon(opt.weapon);
    } else if (opt.type === 'item_new') {
      player.addItem(opt.item);
    } else if (opt.type === 'heal_pack') {
      player.currentHp = Math.min(player.maxHp, player.currentHp + opt.amount);
    } else if (opt.type === 'gold_pack') {
      player.ingredients += opt.amount;
    }
  }

  private getWeaponIcon(weaponId: string): string {
    switch (weaponId) {
      case 'iron_wok':
        return '🍳';
      case 'cleaver':
        return '🔪';
      case 'bamboo_skewer':
        return '🍢';
      case 'stove_flame':
        return '🔥';
      case 'seasoning_jar':
        return '🏺';
      case 'service_bell':
        return '🔔';
      default:
        return '⚔️';
    }
  }

  private getItemIcon(itemId: string): string {
    switch (itemId) {
      case 'chili_pepper':
        return '🌶️';
      case 'ice_cube':
        return '🧊';
      case 'sesame_oil':
        return '🫒';
      case 'cane_sugar':
        return '🍬';
      case 'fermented_sauce':
        return '🍲';
      case 'bamboo_steamer':
        return '🥟';
      case 'garlic_clove':
        return '🧄';
      case 'star_anise':
        return '⭐';
      default:
        return '🧂';
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
