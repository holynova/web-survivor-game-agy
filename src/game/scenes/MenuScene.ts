import Phaser from 'phaser';
import { CHARACTERS } from '@/content/characters/data';
import { formatTags } from '@/content/schemas/common';
import { CharacterDefinition } from '@/content/schemas/character';
import { WEAPONS } from '@/content/weapons/data';
import { SaveManager } from '@/save/storage';
import { AudioManager } from '../presentation/audio';

export class MenuScene extends Phaser.Scene {
  private selectedCharacterId = 'wok_master';

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const saveData = SaveManager.load();
    this.selectedCharacterId = saveData.selectedCharacterId || 'wok_master';

    // 绑定音频管理器并播放菜单音乐
    AudioManager.getInstance().setSoundManager(this.sound);
    AudioManager.getInstance().playBgm('bgm_menu', true, 0.4);

    // 1. 夜市背景氛围
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1315, 1);
    bg.fillRect(0, 0, width, height);

    // 装饰暖光灯笼
    bg.fillStyle(0xe76f51, 0.12);
    bg.fillCircle(width * 0.18, 100, 180);
    bg.fillCircle(width * 0.82, 100, 180);

    // 2. 标题
    const title = this.add.text(width / 2, 45, '山 海 夜 市', {
      fontSize: '44px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);

    const subTitle = this.add.text(width / 2, 102, '幽冥百鬼围攻，化厨具为神兵！构筑你的战斗厨房！', {
      fontSize: '15px',
      color: '#8fa3a6',
      wordWrap: { width: width - 60, useAdvancedWrap: true },
      align: 'center',
    });
    subTitle.setOrigin(0.5, 0);

    // 3. 角色选择卡片
    this.renderCharacterCards(width, height);

    // 4. 最高分与历史战绩
    const bestWave = saveData.highScores.highestWave;
    const maxKills = saveData.highScores.maxKills;
    const hsText = this.add.text(
      width / 2,
      height - 110,
      `🏆 最佳营业记录: 到达第 ${bestWave} 波 | 最高驱妖: ${maxKills} 只`,
      {
        fontSize: '14px',
        color: '#ffd166',
      },
    );
    hsText.setOrigin(0.5, 0);

    // 5. 开始营业按钮
    const btnW = 280;
    const btnH = 50;
    const btnX = width / 2;
    const btnY = height - 55;

    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0xe76f51, 1);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);

    const btnText = this.add.text(btnX, btnY, '🔥 开始夜市营业 🔥', {
      fontSize: '20px',
      color: '#0b1315',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      AudioManager.getInstance().unlock();
      AudioManager.getInstance().playSfx('sfx_click', 0.6);
      this.scene.start('RunScene', { characterId: this.selectedCharacterId });
    });
  }

  private renderCharacterCards(width: number, height: number): void {
    const characters = Object.values(CHARACTERS);
    const cardW = 280;
    const cardH = 300;
    const totalW = characters.length * cardW + (characters.length - 1) * 32;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 - 5;

    for (let i = 0; i < characters.length; i++) {
      const charDef = characters[i];
      const cx = startX + i * (cardW + 32);
      this.createCard(charDef, cx, cardY, cardW, cardH);
    }
  }

  private createCard(
    charDef: CharacterDefinition,
    x: number,
    y: number,
    w: number,
    h: number,
  ): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const isSelected = this.selectedCharacterId === charDef.id;

    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x121c20, 0.96);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bgGfx.lineStyle(2.5, isSelected ? 0x00f5d4 : 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    card.add(bgGfx);

    // 像素大厨精灵头像预览
    const charTextureKey = `char_${charDef.id}`;
    if (this.textures.exists(charTextureKey)) {
      const charSprite = this.add.sprite(0, -h / 2 + 50, charTextureKey, 0);
      charSprite.setScale(3.0);
      card.add(charSprite);
    }

    // 角色名
    const nameText = this.add.text(0, -h / 2 + 85, charDef.nameKey, {
      fontSize: '20px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5, 0);
    card.add(nameText);

    // 初始武器与定位
    const weaponName = WEAPONS[charDef.startingWeaponId]?.nameKey || '';
    const startWeaponText = this.add.text(0, -h / 2 + 118, `初始厨具: ${weaponName}`, {
      fontSize: '13px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    startWeaponText.setOrigin(0.5, 0);
    card.add(startWeaponText);

    // 描述 (使用 useAdvancedWrap: true 解决中文换行)
    const descText = this.add.text(0, -h / 2 + 148, charDef.descriptionKey, {
      fontSize: '13px',
      color: '#d8e2dc',
      wordWrap: { width: w - 32, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 5,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // 中文标签
    const tagsText = this.add.text(
      0,
      h / 2 - 32,
      formatTags(charDef.tags),
      {
        fontSize: '12px',
        color: '#8fa3a6',
        wordWrap: { width: w - 24, useAdvancedWrap: true },
        align: 'center',
      },
    );
    tagsText.setOrigin(0.5, 0);
    card.add(tagsText);

    // 交互点击选择角色
    const hitZone = this.add.zone(0, 0, w, h);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      this.selectedCharacterId = charDef.id;
      const saveData = SaveManager.load();
      saveData.selectedCharacterId = charDef.id;
      SaveManager.save(saveData);
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      this.scene.restart();
    });
    card.add(hitZone);

    return card;
  }
}
