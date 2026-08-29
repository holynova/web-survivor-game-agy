import Phaser from 'phaser';
import { ENEMIES } from '@/content/enemies/data';
import { ITEMS } from '@/content/items/data';
import { RECIPES } from '@/content/recipes/data';
import { formatTags } from '@/content/schemas/common';
import { WEAPONS } from '@/content/weapons/data';
import { AudioManager } from '../presentation/audio';

type CodexTab = 'weapons' | 'items' | 'recipes' | 'enemies';

export class CodexModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private currentTab: CodexTab = 'weapons';
  private selectedIndex = 0;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    this.scene = scene;
    this.onCloseCallback = onClose;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(500);
    this.container.setVisible(false);
  }

  public show(): void {
    this.selectedIndex = 0;
    this.render();
    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  private render(): void {
    this.container.removeAll(true);
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. 半透明暗色背景与防穿透
    const blocker = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x060b0c, 0.98);
    blocker.setScrollFactor(0);
    blocker.setInteractive();
    this.container.add(blocker);

    // 2. 主面板卡片 (980 x 560)
    const cardW = 980;
    const cardH = 560;
    const cardGfx = this.scene.add.graphics();
    cardGfx.fillStyle(0x0e181c, 0.98);
    cardGfx.fillRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 14);
    cardGfx.lineStyle(2, 0x3d5a5b, 1);
    cardGfx.strokeRoundedRect(width / 2 - cardW / 2, height / 2 - cardH / 2, cardW, cardH, 14);
    cardGfx.setScrollFactor(0);
    this.container.add(cardGfx);

    // 3. 顶部标题
    const title = this.scene.add.text(width / 2 - cardW / 2 + 30, height / 2 - cardH / 2 + 25, '📖 山海夜市 · 百味神魔全图鉴', {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    title.setOrigin(0, 0);
    this.container.add(title);

    // 4. 选项卡 Tab 切换栏
    const tabs: { id: CodexTab; label: string }[] = [
      { id: 'weapons', label: '🔪 厨具神兵' },
      { id: 'items', label: '🌿 口味秘方' },
      { id: 'recipes', label: '🍲 绝品菜谱' },
      { id: 'enemies', label: '👹 幽冥妖怪' },
    ];

    const tabStartX = width / 2 + 60;
    const tabY = height / 2 - cardH / 2 + 38;
    const tabW = 105;
    const tabH = 32;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tx = tabStartX + i * (tabW + 10);
      const isCur = this.currentTab === tab.id;

      const tabContainer = this.scene.add.container(tx, tabY);
      tabContainer.setScrollFactor(0);
      tabContainer.setSize(tabW, tabH);

      const tabGfx = this.scene.add.graphics();
      tabGfx.fillStyle(isCur ? 0x2a9d8f : 0x142227, 1);
      tabGfx.fillRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 6);
      tabGfx.lineStyle(1.5, isCur ? 0x00f5d4 : 0x3d5a5b, 1);
      tabGfx.strokeRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 6);
      tabContainer.add(tabGfx);

      const tabTxt = this.scene.add.text(0, 0, tab.label, {
        fontSize: '13px',
        color: isCur ? '#060b0c' : '#d8e2dc',
        fontStyle: isCur ? 'bold' : 'normal',
      });
      tabTxt.setOrigin(0.5, 0.5);
      tabContainer.add(tabTxt);

      const hit = this.scene.add.zone(0, 0, tabW, tabH);
      hit.setScrollFactor(0);
      hit.setInteractive({ useHandCursor: true });
      tabContainer.add(hit);

      hit.on('pointerdown', () => {
        if (this.currentTab !== tab.id) {
          AudioManager.getInstance().playSfx('sfx_click', 0.5);
          this.currentTab = tab.id;
          this.selectedIndex = 0;
          this.render();
        }
      });

      this.container.add(tabContainer);
    }

    // 5. 渲染图鉴列表区 (左侧) 与 详情展示区 (右侧)
    this.renderContentArea(width, height, cardW, cardH);

    // 6. 底部关闭按钮
    const closeW = 160;
    const closeH = 38;
    const closeX = width / 2;
    const closeY = height / 2 + cardH / 2 - 35;

    const closeContainer = this.scene.add.container(closeX, closeY);
    closeContainer.setScrollFactor(0);
    closeContainer.setSize(closeW, closeH);

    const closeGfx = this.scene.add.graphics();
    closeGfx.fillStyle(0x3d5a5b, 1);
    closeGfx.fillRoundedRect(-closeW / 2, -closeH / 2, closeW, closeH, 8);
    closeContainer.add(closeGfx);

    const closeTxt = this.scene.add.text(0, 0, '关闭图鉴', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeTxt.setOrigin(0.5, 0.5);
    closeContainer.add(closeTxt);

    const closeHit = this.scene.add.zone(0, 0, closeW, closeH);
    closeHit.setScrollFactor(0);
    closeHit.setInteractive({ useHandCursor: true });
    closeContainer.add(closeHit);

    closeHit.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      this.hide();
    });

    this.container.add(closeContainer);
  }

  private renderContentArea(screenWidth: number, screenHeight: number, cardW: number, cardH: number): void {
    const listX = screenWidth / 2 - cardW / 2 + 30;
    const listY = screenHeight / 2 - cardH / 2 + 75;
    const listW = 360;
    const listH = cardH - 130;

    // 左侧列表背景
    const listGfx = this.scene.add.graphics();
    listGfx.fillStyle(0x091012, 0.8);
    listGfx.fillRoundedRect(listX, listY, listW, listH, 8);
    listGfx.lineStyle(1, 0x1f3239, 1);
    listGfx.strokeRoundedRect(listX, listY, listW, listH, 8);
    this.container.add(listGfx);

    // 右侧详情背景
    const detailX = listX + listW + 20;
    const detailY = listY;
    const detailW = cardW - listW - 80;
    const detailH = listH;

    const detailGfx = this.scene.add.graphics();
    detailGfx.fillStyle(0x091012, 0.8);
    detailGfx.fillRoundedRect(detailX, detailY, detailW, detailH, 8);
    detailGfx.lineStyle(1, 0x1f3239, 1);
    detailGfx.strokeRoundedRect(detailX, detailY, detailW, detailH, 8);
    this.container.add(detailGfx);

    // 获取当前 Tab 的数据条目
    const items = this.getCurrentTabItems();
    if (this.selectedIndex >= items.length) {
      this.selectedIndex = 0;
    }

    // 渲染左侧条目列表 (支持多行网格/列表)
    const itemH = 40;
    const maxVisible = Math.floor(listH / (itemH + 6));

    for (let i = 0; i < Math.min(items.length, maxVisible); i++) {
      const it = items[i];
      const isSel = i === this.selectedIndex;
      const iy = listY + 10 + i * (itemH + 6) + itemH / 2;
      const ix = listX + listW / 2;

      const itemContainer = this.scene.add.container(ix, iy);
      itemContainer.setScrollFactor(0);
      itemContainer.setSize(listW - 16, itemH);

      const itGfx = this.scene.add.graphics();
      itGfx.fillStyle(isSel ? 0x192e34 : 0x0f1b1f, 1);
      itGfx.fillRoundedRect(-(listW - 16) / 2, -itemH / 2, listW - 16, itemH, 6);
      itGfx.lineStyle(1.5, isSel ? 0x00f5d4 : 0x22363e, 1);
      itGfx.strokeRoundedRect(-(listW - 16) / 2, -itemH / 2, listW - 16, itemH, 6);
      itemContainer.add(itGfx);

      // 图标
      const icon = this.scene.add.image(-(listW - 16) / 2 + 22, 0, it.textureKey);
      icon.setDisplaySize(24, 24);
      itemContainer.add(icon);

      // 名称与副标
      const nameTxt = this.scene.add.text(-(listW - 16) / 2 + 42, 0, it.name, {
        fontSize: '13px',
        color: isSel ? '#00f5d4' : '#e2ece9',
        fontStyle: isSel ? 'bold' : 'normal',
      });
      nameTxt.setOrigin(0, 0.5);
      itemContainer.add(nameTxt);

      const subTxt = this.scene.add.text((listW - 16) / 2 - 12, 0, it.badge, {
        fontSize: '11px',
        color: '#f4a261',
      });
      subTxt.setOrigin(1, 0.5);
      itemContainer.add(subTxt);

      const hit = this.scene.add.zone(0, 0, listW - 16, itemH);
      hit.setScrollFactor(0);
      hit.setInteractive({ useHandCursor: true });
      itemContainer.add(hit);

      hit.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx_click', 0.4);
        this.selectedIndex = i;
        this.render();
      });

      this.container.add(itemContainer);
    }

    // 渲染右侧选定条目的详细档案
    const curItem = items[this.selectedIndex];
    if (curItem) {
      this.renderDetailPane(curItem, detailX, detailY, detailW, detailH);
    }
  }

  private renderDetailPane(item: CodexEntry, dx: number, dy: number, dw: number, _dh: number): void {
    const cx = dx + dw / 2;

    // 1. 顶部大尺寸物品展示台
    const pedestalY = dy + 65;
    const pedGfx = this.scene.add.graphics();
    pedGfx.fillStyle(0x13242a, 0.95);
    pedGfx.fillCircle(cx, pedestalY, 48);
    pedGfx.lineStyle(2, 0x00f5d4, 0.8);
    pedGfx.strokeCircle(cx, pedestalY, 48);
    this.container.add(pedGfx);

    const bigImg = this.scene.add.image(cx, pedestalY, item.textureKey);
    bigImg.setDisplaySize(72, 72);
    this.container.add(bigImg);

    // 2. 标题与分类
    const titleTxt = this.scene.add.text(cx, dy + 128, item.name, {
      fontSize: '22px',
      color: '#ffd166',
      fontStyle: 'bold',
      align: 'center',
    });
    titleTxt.setOrigin(0.5, 0);
    this.container.add(titleTxt);

    const badgeTxt = this.scene.add.text(cx, dy + 158, `【${item.category}】 ${item.badge}`, {
      fontSize: '12px',
      color: '#00f5d4',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeTxt.setOrigin(0.5, 0);
    this.container.add(badgeTxt);

    // 3. 核心机制与效果描述
    const descBoxW = dw - 40;
    const descBoxY = dy + 185;
    const descBoxH = 90;

    const descBoxGfx = this.scene.add.graphics();
    descBoxGfx.fillStyle(0x0c1518, 0.9);
    descBoxGfx.fillRoundedRect(dx + 20, descBoxY, descBoxW, descBoxH, 8);
    descBoxGfx.lineStyle(1, 0x22363e, 0.8);
    descBoxGfx.strokeRoundedRect(dx + 20, descBoxY, descBoxW, descBoxH, 8);
    this.container.add(descBoxGfx);

    const descTxt = this.scene.add.text(cx, descBoxY + descBoxH / 2, item.description, {
      fontSize: '13px',
      color: '#e2ece9',
      wordWrap: { width: descBoxW - 20, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 5,
    });
    descTxt.setOrigin(0.5, 0.5);
    this.container.add(descTxt);

    // 4. 详细数值属性卡 / 升星信息
    let statY = dy + 290;
    for (const stat of item.stats) {
      const statTxt = this.scene.add.text(dx + 30, statY, stat, {
        fontSize: '12px',
        color: '#f4a261',
      });
      this.container.add(statTxt);
      statY += 24;
    }

    // 5. 底部典故/风味文本
    if (item.flavorText) {
      const flavorTxt = this.scene.add.text(cx, dy + _dh - 30, `“ ${item.flavorText} ”`, {
        fontSize: '12px',
        color: '#8fa3a6',
        fontStyle: 'italic',
        align: 'center',
      });
      flavorTxt.setOrigin(0.5, 0.5);
      this.container.add(flavorTxt);
    }
  }

  private formatAttackPattern(pattern: string): string {
    const map: Record<string, string> = {
      arc: '扇面挥砍',
      projectile: '直线飞掷',
      pierceLine: '穿心贯透',
      area: '猛火地烈',
      orbit: '环绕护体',
      summon: '帮厨助阵',
      boomerang: '回旋折返',
      mortar: '抛物爆裂',
      beam: '极寒射线',
      vortex: '黑洞聚引',
    };
    return map[pattern] || pattern;
  }

  private getCurrentTabItems(): CodexEntry[] {
    if (this.currentTab === 'weapons') {
      return Object.values(WEAPONS).map(w => ({
        id: w.id,
        name: w.nameKey,
        category: '神兵厨具',
        badge: `模式: ${this.formatAttackPattern(w.attackPattern)}`,
        textureKey: this.getWeaponTextureKey(w.id),
        description: w.levels[0].descriptionKey,
        stats: [
          `🔥 初始威力: 伤害 ${w.levels[0].damage} | 攻击范围 ${w.levels[0].range}px`,
          `⏱️ 冷却时间: ${(w.levels[0].cooldownMs / 1000).toFixed(2)}s | 穿透上限: ${w.levels[0].pierce} 次`,
          `⭐ 满星形态: ${w.levels[w.levels.length - 1].descriptionKey}`,
          `🏷️ 词条风味: ${formatTags(w.tags)}`,
        ],
        flavorText: '山海界神厨传承厨具，历经百火淬炼，可御百鬼。',
      }));
    } else if (this.currentTab === 'items') {
      return Object.values(ITEMS).map(it => ({
        id: it.id,
        name: it.nameKey,
        category: '口味秘方',
        badge: `可叠加 ${it.maxStacks} 层`,
        textureKey: this.getItemTextureKey(it.id),
        description: it.descriptionKey,
        stats: [
          `✨ 秘方效果: ${it.descriptionKey}`,
          `📦 叠加上限: 最大可采购 ${it.maxStacks} 份`,
          `🏷️ 秘方标签: ${formatTags(it.tags)}`,
        ],
        flavorText: '夜市老字号秘制佐料，滴滴入魂，激发生命潜能。',
      }));
    } else if (this.currentTab === 'recipes') {
      return Object.values(RECIPES).map(rcp => ({
        id: rcp.id,
        name: rcp.nameKey,
        category: '绝品菜谱',
        badge: `质变神技: ${rcp.transformation?.transformedNameKey || '共鸣爆发'}`,
        textureKey: 'weapon_dragon_spatula',
        description: `【质变公式】${rcp.requirement.requiredWeaponId || '神兵'} (Lv.3) + 秘方配料 ➔ 进化为终极神技`,
        stats: [
          `🔥 终极技能: ${rcp.transformation?.transformedNameKey || '神火共鸣'}`,
          `⚡ 质变增幅: 伤害提升 ${(rcp.transformation?.damageMultiplier || 1.5) * 100}% | 冷却加速`,
          `🌟 附加特效: 攻击附带全屏火海与金色神龙流光！`,
        ],
        flavorText: '山海饕餮谱传世合体绝学，刀火相生，天下无双。',
      }));
    } else {
      return Object.values(ENEMIES).map(e => ({
        id: e.id,
        name: e.nameKey,
        category: e.category === 'boss' ? '👑 幽冥首领' : e.category === 'elite' ? '🏮 狂暴精英' : '👻 游荡妖物',
        badge: `基础生命: ${e.maxHp} HP`,
        textureKey: e.assetKey || 'enemy_hungry_ghost',
        description: `徘徊于山海夜市的幽界怪物。移动速度: ${e.moveSpeed}px/s | 触碰伤害: ${e.contactDamage} 点。`,
        stats: [
          `❤️ 基础生命: ${e.maxHp} HP | 移动速度: ${e.moveSpeed} px/s`,
          `⚔️ 触碰伤害: ${e.contactDamage} 点 | 击杀掉落经验: ${e.expValue} 点`,
          `🥟 掉落食材率: ${Math.round(e.ingredientChance * 100)}% (掉落 ${e.ingredientValue} 份)`,
        ],
        flavorText: '因垂涎夜市人间烟火气而聚集的魑魅魍魉，需以烈火猛炒驱散。',
      }));
    }
  }

  private getWeaponTextureKey(weaponId: string): string {
    const key = `weapon_${weaponId}`;
    if (this.scene.textures.exists(key)) return key;
    if (weaponId === 'cleaver') return 'weapon_cleaver';
    if (weaponId === 'bamboo_skewer') return 'item_skewer';
    if (weaponId === 'seasoning_jar') return 'item_potion';
    return 'weapon_cleaver';
  }

  private getItemTextureKey(itemId: string): string {
    if (itemId === 'dang_gui_herb') return 'item_herb';
    if (itemId === 'wolfberry_wine') return 'item_potion';
    if (itemId === 'sugar_candy' || itemId === 'sugar') return 'item_sugar';
    if (itemId === 'chili_oil' || itemId === 'soy_sauce' || itemId === 'vinegar') return 'item_potion';
    if (itemId === 'skewer_bamboo') return 'item_skewer';
    return 'item_herb';
  }
}

interface CodexEntry {
  id: string;
  name: string;
  category: string;
  badge: string;
  textureKey: string;
  description: string;
  stats: string[];
  flavorText?: string;
}
