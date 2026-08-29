import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/content/characters/data';
import { ENEMIES } from '@/content/enemies/data';
import { ITEMS } from '@/content/items/data';
import { validateContentIntegrity } from '@/content/manifest';
import { RECIPES } from '@/content/recipes/data';
import { CharacterDefinitionSchema } from '@/content/schemas/character';
import { EnemyDefinitionSchema } from '@/content/schemas/enemy';
import { ItemDefinitionSchema } from '@/content/schemas/item';
import { RecipeDefinitionSchema } from '@/content/schemas/recipe';
import { WaveDefinitionSchema } from '@/content/schemas/wave';
import { WeaponDefinitionSchema } from '@/content/schemas/weapon';
import { WAVES } from '@/content/waves/data';
import { WEAPONS } from '@/content/weapons/data';

describe('Content Schemas & Data Integrity', () => {
  it('should validate all characters successfully', () => {
    for (const char of Object.values(CHARACTERS)) {
      expect(() => CharacterDefinitionSchema.parse(char)).not.toThrow();
    }
  });

  it('should validate all weapons successfully', () => {
    for (const weapon of Object.values(WEAPONS)) {
      expect(() => WeaponDefinitionSchema.parse(weapon)).not.toThrow();
    }
  });

  it('should validate all items successfully', () => {
    for (const item of Object.values(ITEMS)) {
      expect(() => ItemDefinitionSchema.parse(item)).not.toThrow();
    }
  });

  it('should validate all enemies successfully', () => {
    for (const enemy of Object.values(ENEMIES)) {
      expect(() => EnemyDefinitionSchema.parse(enemy)).not.toThrow();
    }
  });

  it('should validate all waves successfully', () => {
    expect(WAVES).toHaveLength(12);
    for (const wave of WAVES) {
      expect(() => WaveDefinitionSchema.parse(wave)).not.toThrow();
    }
  });

  it('should validate all recipes successfully', () => {
    for (const recipe of Object.values(RECIPES)) {
      expect(() => RecipeDefinitionSchema.parse(recipe)).not.toThrow();
    }
  });

  it('validateContentIntegrity should pass with 0 errors', () => {
    const report = validateContentIntegrity();
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
  });
});
