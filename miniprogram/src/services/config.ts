/**
 * 阿里百炼 / 通义千问 (DashScope) AI 能力配置
 *
 * 安全提示
 * ---------------------------------------------------------------
 * API Key 已移至云函数或环境变量中，客户端不再直接存储敏感信息。
 * 小程序端通过云函数调用 AI 服务，确保 API Key 的安全。
 */
export const AI_CONFIG = {
  // 大语言模型
  chatModel: 'qwen3.6-plus',
  // 全模态模型（图片理解）
  visionModel: 'qwen3.5-omni-plus-2026-03-15',
  // 文生图
  imageModel: 'qwen-image-2.0-pro',
  // 北京区（国内）endpoint
  baseUrl: 'https://dashscope.aliyuncs.com',
  compatibleUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  // 文本请求 60s，图片轮询最多 150s
  textTimeout: 60000,
  imageTimeout: 150000,
} as const

export type AIConfig = typeof AI_CONFIG
