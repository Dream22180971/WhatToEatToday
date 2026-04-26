import { chatComplete } from './qwen'
import type { Ingredient, Nutrition, Recipe } from '../types'

export interface GeneratedRecipe {
  title: string
  description: string
  categories: string[]
  mealTypes: Recipe['mealTypes']
  ingredients: Ingredient[]
  seasonings: Ingredient[]
  instructions: string[]
  nutrition?: Nutrition
}

function sanitizeIngredients(list: unknown): Ingredient[] {
  if (!Array.isArray(list)) return []
  return list
    .map((raw: any) => ({
      name: String(raw?.name || '').trim(),
      amount: String(raw?.amount ?? '').trim(),
      unit: String(raw?.unit ?? '').trim(),
    }))
    .filter((i) => i.name)
    .slice(0, 30)
}

function sanitizeMealTypes(list: unknown): Recipe['mealTypes'] {
  const allowed = ['breakfast', 'lunch', 'dinner', 'snack'] as const
  if (!Array.isArray(list)) return ['dinner']
  const picked = list
    .map((v) => String(v).toLowerCase())
    .filter((v) => (allowed as readonly string[]).includes(v)) as Recipe['mealTypes']
  return picked.length ? picked.slice(0, 3) : ['dinner']
}

function sanitizeNutrition(n: unknown): Nutrition | undefined {
  if (!n || typeof n !== 'object') return undefined
  const obj = n as Record<string, unknown>
  const nu: Nutrition = {
    calories: String(obj.calories || '').trim(),
    protein: String(obj.protein || '').trim(),
    carbs: String(obj.carbs || '').trim(),
    fat: String(obj.fat || '').trim(),
  }
  if (!nu.calories && !nu.protein && !nu.carbs && !nu.fat) return undefined
  return nu
}

/**
 * 用 AI 从菜名生成一份可落库的菜谱结构。
 * 生成失败会抛错，由调用方决定是否改走搜索/手动录入。
 */
export async function generateRecipeFromDish(params: {
  dish: string
  userContext?: { diet?: string; dislike?: string }
}): Promise<GeneratedRecipe> {
  const dish = params.dish.trim()
  if (!dish) throw new Error('缺少菜名')

  const hintDiet = params.userContext?.diet ? `饮食类型：${params.userContext.diet}` : ''
  const hintDislike = params.userContext?.dislike ? `忌口：${params.userContext.dislike}` : ''

  const prompt = `你是家常菜谱编辑。请为「${dish}」生成一份真实可做的家常菜谱，并严格只输出 JSON（不要 markdown/解释）。
${hintDiet}
${hintDislike}

JSON schema：
{
  "title": "菜名（不要书名号）",
  "description": "不超过40字的暖心描述",
  "categories": ["家常"],
  "mealTypes": ["breakfast"|"lunch"|"dinner"|"snack"],
  "ingredients": [{"name":"","amount":"","unit":""}],
  "seasonings": [{"name":"","amount":"","unit":""}],
  "instructions": ["步骤1","步骤2","步骤3","步骤4"],
  "nutrition": {"calories":"约Xkcal","protein":"Xg","carbs":"Xg","fat":"Xg"}
}
要求：
- ingredients 至少 3 条；instructions 4~8 步，动词开头；
- amount/unit 可为空字符串，但 name 不能为空；
- mealTypes 1~2 个；
- **一致性强约束**：ingredients/seasonings 必须覆盖步骤里出现的所有食材/调料；并且清单里的每个 name 至少在某一步中出现一次（不要多写用不到的）；
- 不要出现“AI/模型/数据”等字样。`

  const raw = await chatComplete(
    [
      { role: 'system', content: '只输出合法 JSON 对象。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 900 }
  )

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('模型未返回 JSON')

  let data: any
  try {
    data = JSON.parse(match[0])
  } catch {
    throw new Error('菜谱 JSON 解析失败')
  }

  const title = String(data?.title || '').trim().replace(/[「」《》]/g, '')
  if (!title) throw new Error('生成菜名失败')

  return {
    title,
    description: String(data?.description || '').trim(),
    categories: Array.isArray(data?.categories)
      ? (data.categories as unknown[]).map((c) => String(c)).filter(Boolean).slice(0, 6)
      : ['AI 生成'],
    mealTypes: sanitizeMealTypes(data?.mealTypes),
    ingredients: sanitizeIngredients(data?.ingredients),
    seasonings: sanitizeIngredients(data?.seasonings),
    instructions: Array.isArray(data?.instructions)
      ? (data.instructions as unknown[]).map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
      : [],
    nutrition: sanitizeNutrition(data?.nutrition),
  }
}

