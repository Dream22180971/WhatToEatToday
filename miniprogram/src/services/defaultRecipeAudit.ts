import Taro from '@tarojs/taro'
import type { Recipe } from '../types'
import { loadDB, saveDB } from './storage'
import { generateRecipeFromDish } from './recipeGenerator'
import { reconcileRecipeForStorage } from './recipeReconcile'

const AUDIT_KEY = 'default-recipes-audit-v1'

function norm(s: string) {
  return String(s || '').replace(/\s+/g, '').toLowerCase()
}

function isProbablyInconsistent(r: Recipe) {
  const title = norm(r.title)
  if (!title) return true
  const names = [
    ...(Array.isArray(r.ingredients) ? r.ingredients : []),
    ...(Array.isArray(r.seasonings) ? r.seasonings : []),
  ]
    .map((x) => norm((x as any)?.name || ''))
    .filter(Boolean)

  // 经验规则：只要标题里能命中任意一个清单项，就认为大体一致
  const hitList = names.some((n) => n && title.includes(n))

  // 或者步骤/描述里命中标题关键字（粗略）
  const stepsText = norm((r.instructions || []).join(' '))
  const desc = norm(r.description || '')
  const hitText = stepsText.includes(title) || desc.includes(title)

  // 两者都不命中，认为“菜名与内容”可能不一致
  return !hitList && !hitText
}

export async function auditAndFixDefaultRecipesOnce() {
  try {
    const done = Taro.getStorageSync(AUDIT_KEY)
    if (done) return
    Taro.setStorageSync(AUDIT_KEY, 'running')
  } catch {
    // ignore
  }

  const db = loadDB()
  const recipes = Array.isArray(db.recipes) ? db.recipes : []
  if (!recipes.length) {
    try {
      Taro.setStorageSync(AUDIT_KEY, '1')
    } catch {}
    return
  }

  const targets = recipes.filter((r) => r?.creatorId === 'system' && Number(r?.id) >= 1 && Number(r?.id) <= 10)
  if (!targets.length) {
    try {
      Taro.setStorageSync(AUDIT_KEY, '1')
    } catch {}
    return
  }

  let changed = false
  const nextRecipes: Recipe[] = recipes.map((r) => {
    const t = targets.find((x) => x.id === r.id)
    return t ? r : r
  }) as any

  for (const r of targets) {
    if (!isProbablyInconsistent(r)) continue
    try {
      const gen = await generateRecipeFromDish({ dish: r.title })
      const patched: Recipe = {
        ...r,
        title: gen.title || r.title,
        description: gen.description || r.description,
        categories: gen.categories || r.categories,
        mealTypes: gen.mealTypes || r.mealTypes,
        ingredients: gen.ingredients || r.ingredients,
        seasonings: gen.seasonings || r.seasonings,
        instructions: gen.instructions || r.instructions,
        nutrition: gen.nutrition || r.nutrition,
      }
      const reconciled = reconcileRecipeForStorage(patched).recipe
      const idx = nextRecipes.findIndex((x) => x.id === r.id)
      if (idx !== -1) {
        nextRecipes[idx] = reconciled
        changed = true
      }
    } catch {
      // 单个失败不阻断整批
    }
    // 轻微让步：避免连续 10 次调用触发限流
    await new Promise((res) => setTimeout(res, 180))
  }

  if (changed) {
    saveDB({
      ...db,
      recipes: nextRecipes,
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
      profile: db.profile,
    })
  }

  try {
    Taro.setStorageSync(AUDIT_KEY, '1')
  } catch {}
}

