import type { MealLog, UserPreferences } from '../types'
import { chatComplete } from './qwen'

export interface HealingFoodSuggestion {
  dish: string
  /** 两段式治愈文案，含换行 */
  healing: string
  tagline: string
  fromModel: boolean
}

const FALLBACK_POOL: HealingFoodSuggestion[] = [
  {
    dish: '一碗萝卜排骨汤',
    healing: '把寒气关在碗外，把温柔喝进胃里。\n这一口「一碗萝卜排骨汤」，是今晚给自己的拥抱。',
    tagline: '慢慢喝，今天也辛苦了。',
    fromModel: false,
  },
  {
    dish: '番茄鸡蛋面',
    healing: '红黄相间的简单，却最像家的味道。\n让「番茄鸡蛋面」替你接住这一天的琐碎。',
    tagline: '先吃面，心事等会儿再想。',
    fromModel: false,
  },
  {
    dish: '桂花酒酿小圆子',
    healing: '甜一点也没关系，你本来就该被好好对待。\n「桂花酒酿小圆子」，给心情留一点回甘。',
    tagline: '小口小口吃，世界会轻一点。',
    fromModel: false,
  },
  {
    dish: '清炒时蔬配小米粥',
    healing: '清淡不是将就，是身体在向你点头致谢。\n「清炒时蔬配小米粥」，把节奏调回刚刚好的温度。',
    tagline: '今天也要好好照顾自己。',
    fromModel: false,
  },
]

function clampListText(items: string[], maxLen: number): string {
  const text = items.map((s) => s.trim()).filter(Boolean).join('、')
  if (!text) return '无'
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

function pickFallback(avoid: string[]): HealingFoodSuggestion {
  const set = new Set(avoid.map((s) => s.trim()).filter(Boolean))
  const candidates = FALLBACK_POOL.filter((x) => !set.has(x.dish))
  const pool = candidates.length ? candidates : FALLBACK_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getHealingFoodFallback(avoidDishes?: string[]): HealingFoodSuggestion {
  const fb = pickFallback(avoidDishes || [])
  return { ...fb, fromModel: false }
}

export async function getHealingFoodSuggestionFromModel(input: {
  preferences?: UserPreferences
  logs?: MealLog[]
  avoidDishes?: string[]
}): Promise<Omit<HealingFoodSuggestion, 'fromModel'>> {
  const recent = clampListText(
    (input.logs || [])
      .slice(-3)
      .map((l) => l.recipeTitle)
      .filter(Boolean) as string[],
    36
  )
  const diet = input.preferences?.dietaryType || 'none'
  const dislike = clampListText(input.preferences?.dislikedIngredients || [], 36)
  const avoid = clampListText((input.avoidDishes || []).filter(Boolean), 36)

  const prompt = `你是「三餐治愈」美食撰稿人。现在为用户推荐一道最合适的吃食（可自由构想，不必出现在任何菜谱库）。

饮食类型：${diet}
不喜欢：${dislike}
最近吃过：${recent}
避免重复：${avoid}

只输出一个 JSON（不要 markdown/解释）：
{"dish":"6~14字菜名","healing":"两段短句，共40~90字，用\\\\n换行；自然提到 dish 一次；不要出现AI/模型等词","tagline":"10~18字轻声叮嘱"}`

  const raw = await chatComplete(
    [
      { role: 'system', content: '只输出合法 JSON 对象（dish/healing/tagline），字符串内换行用 \\n。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.86, maxTokens: 280, usageKind: 'smartRecommend' }
  )

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('no json')
  const obj = JSON.parse(match[0]) as { dish?: string; healing?: string; tagline?: string }
  const dish = (obj.dish || '').trim().replace(/[「」《》]/g, '')
  const healing = (obj.healing || '').replace(/\\n/g, '\n').trim()
  const tagline = (obj.tagline || '').trim()
  if (!dish || !healing) throw new Error('empty fields')
  return { dish, healing, tagline: tagline || '先好好吃饭，其余慢慢来。' }
}

/**
 * 由通义千问生成「不限于现有菜谱」的治愈系吃食推荐（菜名 + 文案可切换）。
 * 失败时返回本地兜底文案。
 */
export async function getHealingFoodSuggestion(input: {
  preferences?: UserPreferences
  logs?: MealLog[]
  /** 希望避免重复的菜名（例如用户刚点过「换一道」） */
  avoidDishes?: string[]
}): Promise<HealingFoodSuggestion> {
  try {
    const s = await getHealingFoodSuggestionFromModel(input)
    return { ...s, fromModel: true }
  } catch (e) {
    console.warn('[qwen][healing-food] fallback:', e)
    return getHealingFoodFallback(input.avoidDishes)
  }
}
