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

function pickFallback(avoid: string[]): HealingFoodSuggestion {
  const set = new Set(avoid.map((s) => s.trim()).filter(Boolean))
  const candidates = FALLBACK_POOL.filter((x) => !set.has(x.dish))
  const pool = candidates.length ? candidates : FALLBACK_POOL
  return pool[Math.floor(Math.random() * pool.length)]
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
  const recent =
    (input.logs || [])
      .slice(-6)
      .map((l) => l.recipeTitle)
      .filter(Boolean)
      .join('、') || '无'
  const diet = input.preferences?.dietaryType || 'none'
  const dislike = (input.preferences?.dislikedIngredients || []).join('、') || '无'
  const avoid = (input.avoidDishes || []).filter(Boolean).join('、') || '无'

  try {
    const prompt = `你是温柔懂生活的「三餐治愈」美食撰稿人。
请**自由构想一道此刻最合适的吃食或餐点组合**（可以是家常菜、汤羹面点、暖胃小食、饮品甜品、路边摊风味、轻食拼盘……**不必**出现在任何真实菜谱库里，也**不要**只从常见家常菜模板里机械挑选。

用户饮食类型偏好：${diet}
不喜欢的食材：${dislike}
最近吃过/记录过：${recent}
请避免与下面菜名重复或极度相似：${avoid}

请严格只输出一个 JSON 对象（不要 markdown，不要解释），字段如下：
{"dish":"6~14个汉字内的菜名，不要书名号","healing":"两段治愈短句，共50~120个汉字，用\\\\n换行；把 dish 自然嵌入其中一次；不要出现AI/模型/数据/菜谱库等词","tagline":"12~22个汉字，像朋友轻声叮嘱"}

语气：真诚、克制、像深夜厨房的一盏小灯。`

    const raw = await chatComplete(
      [
        { role: 'system', content: '你只输出合法 JSON 对象，键为 dish、healing、tagline，字符串内换行用 \\n 表示。' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.92, maxTokens: 500 }
    )

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no json')
    const obj = JSON.parse(match[0]) as { dish?: string; healing?: string; tagline?: string }
    const dish = (obj.dish || '').trim().replace(/[「」《》]/g, '')
    const healing = (obj.healing || '').replace(/\\n/g, '\n').trim()
    const tagline = (obj.tagline || '').trim()
    if (!dish || !healing) throw new Error('empty fields')
    return { dish, healing, tagline: tagline || '先好好吃饭，其余慢慢来。', fromModel: true }
  } catch (e) {
    console.warn('[qwen][healing-food] fallback:', e)
    const fb = pickFallback(input.avoidDishes || [])
    return { ...fb, fromModel: false }
  }
}
