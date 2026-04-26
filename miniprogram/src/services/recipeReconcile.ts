import type { Ingredient, Recipe } from '../types'

function norm(s: string) {
  return String(s || '').replace(/\s+/g, '').toLowerCase()
}

function appearsInSteps(name: string, stepsTextNorm: string) {
  const n = norm(name)
  if (!n) return false
  // 过短容易误伤（如“盐/油”），但依然比“全量展示”更贴近步骤一致性
  return stepsTextNorm.includes(n)
}

const COMMON_SEASONINGS = [
  '食用油',
  '植物油',
  '猪油',
  '盐',
  '食盐',
  '糖',
  '白糖',
  '冰糖',
  '酱油',
  '生抽',
  '老抽',
  '蚝油',
  '醋',
  '陈醋',
  '米醋',
  '料酒',
  '黄酒',
  '鸡精',
  '味精',
  '胡椒粉',
  '花椒',
  '花椒粉',
  '辣椒',
  '干辣椒',
  '辣椒粉',
  '豆瓣酱',
  '番茄酱',
  '淀粉',
  '玉米淀粉',
  '生粉',
  '大蒜粉',
  '孜然',
] as const

const COMMON_INGREDIENTS = ['葱', '姜', '蒜', '葱姜蒜', '香菜', '洋葱'] as const

function uniqueByName(list: Ingredient[]) {
  const seen = new Set<string>()
  const out: Ingredient[] = []
  for (const it of list) {
    const k = norm(it?.name || '')
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

function fillMissingFromLexicon(params: {
  stepsTextNorm: string
  current: Ingredient[]
  lexicon: readonly string[]
}) {
  const { stepsTextNorm, current, lexicon } = params
  if (!stepsTextNorm) return current
  const have = new Set(current.map((i) => norm(i.name)))
  const missing: Ingredient[] = []
  for (const name of lexicon) {
    const n = norm(name)
    if (!n || have.has(n)) continue
    if (stepsTextNorm.includes(n)) {
      missing.push({ name, amount: '适量', unit: '' })
    }
  }
  return missing.length ? uniqueByName([...current, ...missing]) : current
}

/**
 * 展示层对齐：优先只展示步骤里出现过的项。
 * 若筛选后为空，则回退原清单（避免“步骤缺失导致空列表”）。
 */
export function reconcileRecipeListsByInstructions(recipe: Pick<Recipe, 'ingredients' | 'seasonings' | 'instructions'>): {
  ingredients: Ingredient[]
  seasonings: Ingredient[]
} {
  const stepsTextNorm = norm((recipe.instructions || []).join(' '))

  const ing = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const sea = Array.isArray(recipe.seasonings) ? recipe.seasonings : []

  const filledIng = fillMissingFromLexicon({
    stepsTextNorm,
    current: ing,
    lexicon: COMMON_INGREDIENTS,
  })
  const filledSea = fillMissingFromLexicon({
    stepsTextNorm,
    current: sea,
    lexicon: COMMON_SEASONINGS,
  })

  const filteredIng = stepsTextNorm ? filledIng.filter((i) => appearsInSteps(i.name, stepsTextNorm)) : filledIng
  const filteredSea = stepsTextNorm ? filledSea.filter((i) => appearsInSteps(i.name, stepsTextNorm)) : filledSea

  return {
    ingredients: filteredIng.length ? filteredIng : filledIng,
    seasonings: filteredSea.length ? filteredSea : filledSea,
  }
}

/**
 * 落库层对齐：把“步骤里出现的常见食材/调料”补齐进 recipe，并返回是否有变更。
 * 说明：这是保守补齐，只补常见词表命中的缺失项，避免误加。
 */
export function reconcileRecipeForStorage(recipe: Recipe): { recipe: Recipe; changed: boolean } {
  const stepsTextNorm = norm((recipe.instructions || []).join(' '))
  if (!stepsTextNorm) return { recipe, changed: false }

  const beforeIng = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const beforeSea = Array.isArray(recipe.seasonings) ? recipe.seasonings : []

  const nextIng = fillMissingFromLexicon({
    stepsTextNorm,
    current: beforeIng,
    lexicon: COMMON_INGREDIENTS,
  })
  const nextSea = fillMissingFromLexicon({
    stepsTextNorm,
    current: beforeSea,
    lexicon: COMMON_SEASONINGS,
  })

  const changed = nextIng.length !== beforeIng.length || nextSea.length !== beforeSea.length
  return {
    recipe: changed ? { ...recipe, ingredients: nextIng, seasonings: nextSea } : recipe,
    changed,
  }
}

