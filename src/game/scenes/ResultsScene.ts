import Phaser from 'phaser';
import { CHARACTERS } from '@/content/characters/data';
import { RecipeDefinition } from '@/content/schemas/recipe';
import { WEAPONS } from '@/content/weapons/data';
import { RunStatistics } from '../systems/CollisionSystem';
import { SaveManager } from '@/save/storage';
import { AudioManager } from '../presentation/audio';

export interface ResultsData {
  isVictory: boolean;
  characterId: string;
  waveReached: number;
  stats: RunStatistics;
  activeRecipes: RecipeDefinition[];
  seed: number | string;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  public create(data: ResultsData): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // 播放结算音效并保存战绩
    if (data.isVictory) {
      AudioManager.getInstance().playSfx('sfx_levelup', 0.9);
    } else {
      AudioManager.getInstance().playSfx('sfx_gameover', 0.8);
    }

    const kills = data.stats?.totalKills ?? 0;
    const wave = data.waveReached || 1;
    SaveManager.recordRun(wave, kills);

    // 1. 背景渐变
    const bg = this.add.graphics();
    bg.fillStyle(0x080f11, 1);
    bg.fillRect(0, 0, width, height);

    // 2. 顶部主标题
    const titleStr = data.isVictory ? '🎉 营业大吉！夜市名扬四海！' : '💀 营业结束！摊位被百鬼淹没';
    const titleColor = data.isVictory ? '#ffd166' : '#e76f51';

    const title = this.add.text(width / 2, 35, titleStr, {
      fontSize: '28px',
      color: titleColor,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);

    // 3. 副标题
    const charName = CHARACTERS[data.characterId]?.nameKey || '神厨';
    const subTitle = this.add.text(
      width / 2,
      76,
      `出战大厨: ${charName} | 营业地图: 山海夜市外街 | Seed: ${data.seed}`,
      {
        fontSize: '12px',
        color: '#8fa3a6',
      },
    );
    subTitle.setOrigin(0.5, 0);

    // 4. 数据统计卡片 (左侧基本战报，右侧伤害构筑分析)
    const cardW = 380;
    const cardH = 260;

    // 左卡片：基础经营数据
    this.renderBasicStatsCard(data, width / 2 - cardW / 2 - 10, 240, cardW, cardH);

    // 右卡片：伤害构成与菜谱
    this.renderDamageStatsCard(data, width / 2 + cardW / 2 + 10, 240, cardW, cardH);

    // 5. 底部按钮
    const btnW = 180;
    const btnH = 42;

    // 立即再来一局
    const replayX = width / 2 - 100;
    const replayY = height - 55;
    const replayGfx = this.add.graphics();
    replayGfx.fillStyle(0xe76f51, 1);
    replayGfx.fillRoundedRect(replayX - btnW / 2, replayY - btnH / 2, btnW, btnH, 8);

    const replayText = this.add.text(replayX, replayY, '🔥 再次出摊 🔥', {
      fontSize: '15px',
      color: '#0b1315',
      fontStyle: 'bold',
    });
    replayText.setOrigin(0.5, 0.5);

    const replayZone = this.add.zone(replayX, replayY, btnW, btnH);
    replayZone.setInteractive({ useHandCursor: true });
    replayZone.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.6);
      this.scene.start('RunScene', { characterId: data.characterId });
    });

    // 返回主菜单
    const menuX = width / 2 + 100;
    const menuY = height - 55;
    const menuGfx = this.add.graphics();
    menuGfx.fillStyle(0x2a9d8f, 1);
    menuGfx.fillRoundedRect(menuX - btnW / 2, menuY - btnH / 2, btnW, btnH, 8);

    const menuText = this.add.text(menuX, menuY, '返回主菜单', {
      fontSize: '15px',
      color: '#0b1315',
      fontStyle: 'bold',
    });
    menuText.setOrigin(0.5, 0.5);

    const menuZone = this.add.zone(menuX, menuY, btnW, btnH);
    menuZone.setInteractive({ useHandCursor: true });
    menuZone.on('pointerdown', () => {
      AudioManager.getInstance().playSfx('sfx_click', 0.6);
      this.scene.start('MenuScene');
    });
  }

  private renderBasicStatsCard(
    data: ResultsData,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const card = this.add.container(x, y);

    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(1.5, 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    card.add(bgGfx);

    const title = this.add.text(0, -h / 2 + 16, '📊 基础营业战报', {
      fontSize: '15px',
      color: '#f4a261',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    card.add(title);

    const timeSec = data.stats?.timeSurvivedSec ?? 0;
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    const timeStr = `${mins}分${secs.toString().padStart(2, '0')}秒`;

    const totalKills = data.stats?.totalKills ?? 0;
    const totalDmg = data.stats?.totalDamageDealt ?? 0;
    const ingredients = data.stats?.ingredientsEarned ?? 0;

    const infoList = [
      `到达波次: 第 ${data.waveReached || 1} 波 / 共 12 波`,
      `存活时间: ${timeStr}`,
      `驱除妖怪: ${totalKills} 只`,
      `造成总伤害: ${totalDmg}`,
      `赚取食材: 🥟 ${ingredients}`,
    ];

    for (let i = 0; i < infoList.length; i++) {
      const text = this.add.text(-w / 2 + 25, -h / 2 + 55 + i * 32, infoList[i], {
        fontSize: '13px',
        color: '#d8e2dc',
      });
      card.add(text);
    }
  }

  private renderDamageStatsCard(
    data: ResultsData,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const card = this.add.container(x, y);

    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x121c20, 0.95);
    bgGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bgGfx.lineStyle(1.5, 0x3d5a5b, 1);
    bgGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    card.add(bgGfx);

    const title = this.add.text(0, -h / 2 + 16, '🍳 构筑输出占比 & 神厨菜谱', {
      fontSize: '15px',
      color: '#2a9d8f',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    card.add(title);

    // 武器伤害占比列表
    const totalDmg = Math.max(1, data.stats?.totalDamageDealt || 0);
    const damageByWeapon = data.stats?.damageByWeapon || {};
    const weaponEntries = Object.entries(damageByWeapon).sort((a, b) => b[1] - a[1]);

    let startOffsetY = -h / 2 + 50;
    if (weaponEntries.length === 0) {
      const noDmgText = this.add.text(-w / 2 + 25, startOffsetY, '尚未造成武器伤害', {
        fontSize: '12px',
        color: '#8fa3a6',
      });
      card.add(noDmgText);
      startOffsetY += 30;
    } else {
      for (let i = 0; i < Math.min(4, weaponEntries.length); i++) {
        const [wId, dmg] = weaponEntries[i];
        const wName = WEAPONS[wId]?.nameKey || wId;
        const pct = Math.round((dmg / totalDmg) * 100);

        const wText = this.add.text(
          -w / 2 + 25,
          startOffsetY,
          `${wName}: ${dmg} (${pct}%)`,
          {
            fontSize: '12px',
            color: '#ffd166',
          },
        );
        card.add(wText);

        // 小进度条
        const barGfx = this.add.graphics();
        barGfx.fillStyle(0x2a9d8f, 0.9);
        barGfx.fillRect(-w / 2 + 200, startOffsetY + 2, (w - 230) * (pct / 100), 8);
        card.add(barGfx);

        startOffsetY += 26;
      }
    }

    // 激活的菜谱
    const activeRecipes = data.activeRecipes || [];
    const recipeNames = activeRecipes.map(r => `【${r.transformation?.transformedNameKey || r.nameKey}】`).join(' ');
    const recipeTitle = this.add.text(
      -w / 2 + 25,
      startOffsetY + 10,
      `激活菜谱: ${recipeNames || '无 (未达成质变)'}`,
      {
        fontSize: '12px',
        color: '#06d6a0',
        wordWrap: { width: w - 40, useAdvancedWrap: true },
      },
    );
    card.add(recipeTitle);
  }
}
