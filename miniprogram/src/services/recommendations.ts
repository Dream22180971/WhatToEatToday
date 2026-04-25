import type { MealLog, Recipe, UserPreferences } from '../types'
import { chatComplete } from './qwen'

export interface RecommendationInput {
  preferences?: UserPreferences
  logs?: MealLog[]
}

function fallback(recipes: Recipe[]): Recipe[] {
  if (!recipes.length) return []
  const shuffled = [...recipes].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export interface RecommendationsResult {
  recipes: Recipe[]
  /** 是否成功走通大模型；false 表示已降级为本地随机 */
  fromModel: boolean
}

function currentMealHint(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return '早餐时段'
  if (h >= 10 && h < 14) return '午餐时段'
  if (h >= 14 && h < 17) return '下午茶 / 点心时段'
  if (h >= 17 && h < 21) return '晚餐时段'
  return '深夜宵夜时段'
}

/**
 * 使用阿里通义千问做「今日份的小幸运」智能推荐。
 * 失败（网络 / 解析异常）会自动降级为本地随机推 3 道。
 */
export async function getRecommendations(
  input: RecommendationInput,
  recipes: Recipe[]
): Promise<RecommendationsResult> {
  if (!recipes.length) return { recipes: [], fromModel: false }
  try {
    const catalog = recipes
      .map(
        (r) =>
          `- ${r.id} | ${r.title} | 餐段:${r.mealTypes.join('/')} | 分类:${
            r.categories?.join('、') || '家常'
          }`
      )
      .join('\n')

    const recent =
      (input.logs || [])
        .slice(-6)
        .map((l) => l.recipeTitle)
        .filter(Boolean)
        .join('、') || '无'
    const diet = input.preferences?.dietaryType || 'none'
    const dislike = (input.preferences?.dislikedIngredients || []).join('、') || '无'

    const prompt = `你是一位温暖、懂生活的中式营养 & 美食推荐助手。
当前：${currentMealHint()}
用户最近几餐：${recent}
饮食偏好：${diet}
不喜欢的食材：${dislike}

请从下面菜谱库挑 3 道最合适的今日推荐，规则：
- 尽量匹配当前餐段；
- 避开最近已吃的相似菜；
- 保持多样化，不要 3 道都是同类；
- 严格只返回 JSON 数组（例如 ["r-3","r-7","r-1"]），不要解释，不要 markdown。

菜谱库（id | 名称 | 餐段 | 分类）：
${catalog}`

    const raw = await chatComplete(
      [
        { role: 'system', content: '你是严谨的推荐引擎，输出只能是合法 JSON 数组。' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 400 }
    )

    const match = raw.match(/\[[\s\S]*?\]/)
    if (!match) throw new Error('模型未返回 JSON 数组')
    const ids = JSON.parse(match[0]) as string[]

    const picks: Recipe[] = []
    for (const id of ids) {
      const hit = recipes.find((r) => r.id === id)
      if (hit && !picks.find((p) => p.id === hit.id)) picks.push(hit)
    }
    // 不足 3 道时补足
    if (picks.length < 3) {
      for (const r of recipes) {
        if (picks.length >= 3) break
        if (!picks.find((p) => p.id === r.id)) picks.push(r)
      }
    }
    if (!picks.length) throw new Error('推荐为空')
    return { recipes: picks.slice(0, 3), fromModel: true }
  } catch (e) {
    console.warn('[qwen][recommend] 降级到本地随机:', e)
    return { recipes: fallback(recipes), fromModel: false }
  }
}
