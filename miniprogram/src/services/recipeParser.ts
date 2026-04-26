import type { Ingredient, Nutrition, Recipe } from '../types'
import { visionAnalyze } from './qwen'

export interface ParsedRecipe {
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
}

function sanitizeMealTypes(list: unknown): Recipe['mealTypes'] {
  const allowed = ['breakfast', 'lunch', 'dinner', 'snack'] as const
  if (!Array.isArray(list)) return ['lunch']
  const picked = list
    .map((v) => String(v).toLowerCase())
    .filter((v) => (allowed as readonly string[]).includes(v)) as Recipe['mealTypes']
  return picked.length ? picked : ['lunch']
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
 * 调用 Qwen-VL 把图片识别成菜谱结构。
 * 图片可以是相册 / 拍照得到的 base64（不带 data: 前缀）。
 */
export async function parseRecipeFromImage(image: {
  base64?: string
  url?: string
  mime?: string
}): Promise<ParsedRecipe> {
  if (!image.url && !image.base64) {
    throw new Error('缺少图片数据')
  }
  const prompt = `你是专业菜谱抽取助手。请识别图片中的菜品并严格按下面的 JSON schema 返回（只返回 JSON，不要解释、不要 markdown 代码块）：
{
  "title": "菜名",
  "description": "一两句温暖自然的菜品描述（不要超过 40 字）",
  "categories": ["家常"],
  "mealTypes": ["breakfast"|"lunch"|"dinner"|"snack"],
  "ingredients": [{"name": "", "amount": "", "unit": ""}],
  "seasonings": [{"name": "", "amount": "", "unit": ""}],
  "instructions": ["步骤1", "步骤2"],
  "nutrition": {"calories": "约Xkcal", "protein": "Xg", "carbs": "Xg", "fat": "Xg"}
}
要求：
- 如果图片不是食物或菜谱，请把 title 设为 "无法识别"；
- amount 与 unit 允许为空字符串；
- mealTypes 至少 1 个、最多 3 个；
- 步骤尽量给出 4~8 步，动词开头，短句；
- **一致性强约束**：ingredients/seasonings 必须覆盖步骤里出现的所有食材/调料；并且清单里的每个 name 至少在某一步中出现一次（不要多写用不到的）。`

  const raw = await visionAnalyze(
    image.url ? { url: image.url } : { base64: image.base64, mime: image.mime || 'image/jpeg' },
    prompt
  )
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('模型未返回 JSON')

  let data: any
  try {
    data = JSON.parse(match[0])
  } catch (e) {
    throw new Error('菜谱 JSON 解析失败')
  }

  const title = String(data?.title || '').trim()
  if (!title || title === '无法识别') {
    throw new Error('这张图似乎不是菜谱，换一张再试？')
  }

  return {
    title,
    description: String(data?.description || '').trim(),
    categories: Array.isArray(data?.categories)
      ? (data.categories as unknown[]).map((c) => String(c)).filter(Boolean)
      : [],
    mealTypes: sanitizeMealTypes(data?.mealTypes),
    ingredients: sanitizeIngredients(data?.ingredients),
    seasonings: sanitizeIngredients(data?.seasonings),
    instructions: Array.isArray(data?.instructions)
      ? (data.instructions as unknown[]).map((s) => String(s).trim()).filter(Boolean)
      : [],
    nutrition: sanitizeNutrition(data?.nutrition),
  }
}
