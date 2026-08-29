import Phaser from 'phaser';
import { CHARACTERS } from '@/content/characters/data';
import { DIFFICULTIES } from '@/content/difficulty/data';
import { formatTags } from '@/content/schemas/common';
import { CharacterDefinition } from '@/content/schemas/character';
import { WEAPONS } from '@/content/weapons/data';
import { SaveManager } from '@/save/storage';
import { AudioManager } from '../presentation/audio';
import { SettingsModal } from '../ui/SettingsModal';

export class MenuScene extends Phaser.Scene {
  private selectedCharacterId = 'wok_master';
  private selectedDifficultyId = 'normal';

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const saveData = SaveManager.load();
    this.selectedCharacterId = saveData.selectedCharacterId || 'wok_master';
    this.selectedDifficultyId = saveData.selectedDifficultyId || 'normal';

    // 绑定音频管理器并播放菜单音乐
    AudioManager.getInstance().setSoundManager(this.sound);
    AudioManager.getInstance().playBgm('bgm_menu', true, 0.4);

    // 1. 夜市背景氛围 (全屏高清插画 + 氛围遮罩)
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1315, 1);
    bg.fillRect(0, 0, width, height);

    if (this.textures.exists('cover_night_market')) {
      const coverBg = this.add.image(width / 2, height / 2, 'cover_night_market');
      coverBg.setDisplaySize(width, height);
      coverBg.setAlpha(0.32);
    }

    // 装饰暖光灯笼
    bg.fillStyle(0xe76f51, 0.12);
    bg.fillCircle(width * 0.18, 90, 160);
    bg.fillCircle(width * 0.82, 90, 160);

    // 2. 标题
    const title = this.add.text(width / 2, 35, '山 海 夜 市', {
      fontSize: '40px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);

    const subTitle = this.add.text(width / 2, 85, '幽冥百鬼围攻，化厨具为神兵！构筑你的战斗厨房！', {
      fontSize: '14px',
      color: '#8fa3a6',
      wordWrap: { width: width - 60, useAdvancedWrap: true },
      align: 'center',
    });
    subTitle.setOrigin(0.5, 0);

    // 3. 右上角偏好设置按钮
    const settingsModal = new SettingsModal(this);
    const setBtnW = 100;
    const setBtnH = 34;
    const setBtnX = width - 70;
    const setBtnY = 45;

    const setGfx = this.add.graphics();
    setGfx.fillStyle(0x19282f, 0.9);
    setGfx.fillRoundedRect(setBtnX - setBtnW / 2, setBtnY - setBtnH / 2, setBtnW, setBtnH, 6);
    setGfx.lineStyle(1.5, 0x3d5a5b, 1);
    setGfx.strokeRoundedRect(setBtnX - setBtnW / 2, setBtnY - setBtnH / 2, setBtnW, setBtnH, 6);

    const setText = this.add.text(setBtnX, setBtnY, '⚙️ 游戏设置', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
    });
    setText.setOrigin(0.5, 0.5);

    const setZone = this.add.zone(setBtnX, setBtnY, setBtnW, setBtnH);
    setZone.setInteractive({ useHandCursor: true });
    setZone.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.5);
      settingsModal.show();
    });

    // 4. 角色选择卡片
    this.renderCharacterCards(width, height);

    // 5. 五级难度选择器
    this.renderDifficultySelector(width, height);

    // 5. 最高分与历史战绩
    const bestWave = saveData.highScores.highestWave;
    const maxKills = saveData.highScores.maxKills;
    const hsText = this.add.text(
      width / 2,
      height - 86,
      `🏆 最佳营业记录: 到达第 ${bestWave} 波 | 最高驱妖: ${maxKills} 只`,
      {
        fontSize: '13px',
        color: '#ffd166',
      },
    );
    hsText.setOrigin(0.5, 0);

    // 6. 开始营业按钮
    const btnW = 280;
    const btnH = 46;
    const btnX = width / 2;
    const btnY = height - 38;

    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0xe76f51, 1);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = this.add.text(btnX, btnY, '🔥 开始夜市营业 🔥', {
      fontSize: '19px',
      color: '#0b1315',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5, 0.5);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      AudioManager.getInstance().unlock();
      AudioManager.getInstance().playSfx('sfx_click', 0.6);
      this.scene.start('RunScene', {
        characterId: this.selectedCharacterId,
        difficultyId: this.selectedDifficultyId,
      });
    });
  }

  private renderCharacterCards(width: number, height: number): void {
    const characters = Object.values(CHARACTERS);
    const cardW = 275;
    const cardH = 290;
    const totalW = characters.length * cardW + (characters.length - 1) * 28;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 - 40;

    for (let i = 0; i < characters.length; i++) {
      const charDef = characters[i];
      const cx = startX + i * (cardW + 28);
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
      const charSprite = this.add.sprite(0, -h / 2 + 45, charTextureKey, 0);
      charSprite.setScale(2.8);
      card.add(charSprite);
    }

    // 角色名
    const nameText = this.add.text(0, -h / 2 + 78, charDef.nameKey, {
      fontSize: '19px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5, 0);
    card.add(nameText);

    // 初始武器与定位
    const weaponName = WEAPONS[charDef.startingWeaponId]?.nameKey || '';
    const startWeaponText = this.add.text(0, -h / 2 + 108, `初始厨具: ${weaponName}`, {
      fontSize: '12px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    startWeaponText.setOrigin(0.5, 0);
    card.add(startWeaponText);

    // 描述
    const descText = this.add.text(0, -h / 2 + 135, charDef.descriptionKey, {
      fontSize: '12px',
      color: '#d8e2dc',
      wordWrap: { width: w - 28, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // 中文标签
    const tagsText = this.add.text(
      0,
      h / 2 - 28,
      formatTags(charDef.tags),
      {
        fontSize: '11px',
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

  private renderDifficultySelector(width: number, height: number): void {
    const diffList = Object.values(DIFFICULTIES);
    const btnW = 148;
    const btnH = 34;
    const gap = 12;
    const totalW = diffList.length * btnW + (diffList.length - 1) * gap;
    const startX = (width - totalW) / 2 + btnW / 2;
    const selectorY = height - 165;

    // 难度标题
    const curDiff = DIFFICULTIES[this.selectedDifficultyId] || DIFFICULTIES.normal;
    const diffTitle = this.add.text(
      width / 2,
      selectorY - 26,
      `🎯 选择挑战难度 · 当前模式: 【${curDiff.nameKey}】 ${curDiff.badge}`,
      {
        fontSize: '14px',
        color: curDiff.color,
        fontStyle: 'bold',
      },
    );
    diffTitle.setOrigin(0.5, 0.5);

    // 5 级难度按钮
    for (let i = 0; i < diffList.length; i++) {
      const diff = diffList[i];
      const isSelected = this.selectedDifficultyId === diff.id;
      const bx = startX + i * (btnW + gap);

      const btnGfx = this.add.graphics();
      btnGfx.fillStyle(isSelected ? 0x1a2b32 : 0x101a1d, 1);
      btnGfx.fillRoundedRect(bx - btnW / 2, selectorY - btnH / 2, btnW, btnH, 6);
      btnGfx.lineStyle(isSelected ? 2 : 1, isSelected ? 0x00f5d4 : 0x3d5a5b, 1);
      btnGfx.strokeRoundedRect(bx - btnW / 2, selectorY - btnH / 2, btnW, btnH, 6);

      const text = this.add.text(bx, selectorY, `${diff.nameKey}`, {
        fontSize: '13px',
        color: isSelected ? '#ffffff' : '#8fa3a6',
        fontStyle: isSelected ? 'bold' : 'normal',
      });
      text.setOrigin(0.5, 0.5);

      const zone = this.add.zone(bx, selectorY, btnW, btnH);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.selectedDifficultyId = diff.id;
        const saveData = SaveManager.load();
        saveData.selectedDifficultyId = diff.id;
        SaveManager.save(saveData);
        AudioManager.getInstance().playSfx('sfx_click', 0.5);
        this.scene.restart();
      });
    }

    // 难度效果说明文本
    const descText = this.add.text(width / 2, selectorY + 28, curDiff.descriptionKey, {
      fontSize: '12px',
      color: '#d8e2dc',
      wordWrap: { width: width - 60, useAdvancedWrap: true },
      align: 'center',
    });
    descText.setOrigin(0.5, 0.5);
  }
}
