import Phaser from 'phaser';
import { CHARACTERS } from '@/content/characters/data';
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
    bg.fillCircle(width * 0.2, 80, 140);
    bg.fillCircle(width * 0.8, 80, 140);

    // 2. 标题
    const title = this.add.text(width / 2, 40, '山 海 夜 市', {
      fontSize: '36px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);

    const subTitle = this.add.text(width / 2, 85, '幽冥百鬼围攻，化厨具为神兵！构筑你的战斗厨房！', {
      fontSize: '13px',
      color: '#8fa3a6',
    });
    subTitle.setOrigin(0.5, 0);

    // 3. 角色选择卡片
    this.renderCharacterCards(width, height);

    // 4. 最高分与历史战绩
    const bestWave = saveData.highScores.highestWave;
    const maxKills = saveData.highScores.maxKills;
    const hsText = this.add.text(
      width / 2,
      height - 95,
      `🏆 最佳营业记录: 到达第 ${bestWave} 波 | 最高驱妖: ${maxKills} 只`,
      {
        fontSize: '12px',
        color: '#ffd166',
      },
    );
    hsText.setOrigin(0.5, 0);

    // 5. 开始营业按钮
    const btnW = 220;
    const btnH = 44;
    const btnX = width / 2;
    const btnY = height - 45;

    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0xe76f51, 1);
    btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = this.add.text(btnX, btnY, '🔥 开始夜市营业 🔥', {
      fontSize: '18px',
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
    const cardW = 230;
    const cardH = 230;
    const totalW = characters.length * cardW + (characters.length - 1) * 20;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 - 5;

    for (let i = 0; i < characters.length; i++) {
      const charDef = characters[i];
      const cx = startX + i * (cardW + 20);
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
    bgGfx.fillStyle(0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(2, isSelected ? 0x00f5d4 : 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    card.add(bgGfx);

    // 像素大厨精灵头像预览
    const charTextureKey = `char_${charDef.id}`;
    if (this.textures.exists(charTextureKey)) {
      const charSprite = this.add.sprite(0, -h / 2 + 38, charTextureKey, 0);
      charSprite.setScale(2.5);
      card.add(charSprite);
    }

    // 角色名
    const nameText = this.add.text(0, -h / 2 + 65, charDef.nameKey, {
      fontSize: '17px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5, 0);
    card.add(nameText);

    // 初始武器与定位
    const weaponName = WEAPONS[charDef.startingWeaponId]?.nameKey || '';
    const startWeaponText = this.add.text(0, -h / 2 + 92, `初始厨具: ${weaponName}`, {
      fontSize: '12px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    startWeaponText.setOrigin(0.5, 0);
    card.add(startWeaponText);

    // 描述
    const descText = this.add.text(0, -h / 2 + 118, charDef.descriptionKey, {
      fontSize: '11px',
      color: '#d8e2dc',
      wordWrap: { width: w - 24 },
      align: 'center',
      lineSpacing: 3,
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // 标签
    const tagsText = this.add.text(
      0,
      h / 2 - 25,
      charDef.tags.map(t => `#${t}`).join(' '),
      {
        fontSize: '11px',
        color: '#8fa3a6',
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
