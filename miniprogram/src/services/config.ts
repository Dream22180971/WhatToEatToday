/**
 * AI 能力配置
 *
 * 安全提示
 * ---------------------------------------------------------------
 * API Key 已移至云函数或环境变量中，客户端不再直接存储敏感信息。
 * 小程序端通过云函数调用 AI 服务，确保 API Key 的安全。
 */
export const AI_CONFIG = {
  // 大语言模型
  // CloudBase AI：不同账号/环境开通的模型可能不同；优先使用更通用的 instruct 型号
  chatModel: 'hunyuan-2.0-instruct-20251111',
  // 全模态模型（图片理解）
  // 你的控制台当前已启用的可用模型之一（避免 hunyuan-vision 这类无权限报 401）
  visionModel: 'hunyuan-turbos-latest',
  // 文生图
  imageModel: 'hunyuan-image',
} as const

export type AIConfig = typeof AI_CONFIG
