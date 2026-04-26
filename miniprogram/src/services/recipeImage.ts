import { generateImage } from './qwen'

/**
 * 为一道菜生成一张 1024x1024 的暖色调美食摄影封面。
 * 返回 https 图片 URL（万相临时 OSS 地址）。
 */
export async function generateRecipeCover(
  title: string,
  description = ''
): Promise<string | null> {
  const desc = description.trim() ? `特色：${description.trim()}。` : ''
  const prompt = `一张精致的中式美食摄影图。
主体：${title}。${desc}
构图：俯拍 45°，浅景深，主体居中，自然光，木质餐桌搭配亚麻餐布，精致餐盘。
色调：暖色温，橙棕与米白自然融合，质感柔和，富有食欲。
细节：热气腾腾，光影写实，杂志 / 小红书风格，4K 高清。
限制：画面干净，无文字，无水印，无人物脸部特写。`

  const urls = await generateImage(prompt, {
    size: '1024x1024',
    n: 1,
    negativePrompt: '文字, 水印, logo, 低清, 模糊, 多余手, 变形',
  })
  return urls[0] || null
}
