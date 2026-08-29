import { z } from 'zod';

export const TagSchema = z.enum([
  'wok',
  'cleaver',
  'skewer',
  'fire',
  'ice',
  'oil',
  'sugar',
  'ferment',
  'melee',
  'projectile',
  'pierce',
  'orbit',
  'area',
  'summon',
  'speed',
  'defense',
  'crit',
  'economy',
]);

export type Tag = z.infer<typeof TagSchema>;

export const TAG_NAMES: Record<Tag, string> = {
  wok: '铁锅',
  cleaver: '菜刀',
  skewer: '竹签',
  fire: '火候',
  ice: '冰爽',
  oil: '香油',
  sugar: '蔗糖',
  ferment: '酱香',
  melee: '近战',
  projectile: '飞刀',
  pierce: '穿透',
  orbit: '环绕',
  area: '火域',
  summon: '帮厨',
  speed: '神速',
  defense: '坚守',
  crit: '暴击',
  economy: '生财',
};

export function formatTags(tags: Tag[]): string {
  return tags.map(t => `#${TAG_NAMES[t] || t}`).join(' ');
}

export const EffectDefinitionSchema = z.object({
  type: z.enum(['damage', 'knockback', 'burn', 'slow', 'pierce', 'split', 'heal']),
  value: z.number(),
  durationMs: z.number().optional(),
  tickIntervalMs: z.number().optional(),
  chance: z.number().min(0).max(1).optional().default(1),
});

export type EffectDefinition = z.infer<typeof EffectDefinitionSchema>;
