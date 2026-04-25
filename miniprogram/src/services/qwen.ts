import Taro from '@tarojs/taro'
import { AI_CONFIG } from './config'
import { securityLogger, SecurityLogType } from '../lib/securityLogger'

/** OpenAI 兼容模式的消息内容片段。*/
export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatContentPart[]
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface VisionInput {
  /** 图片 base64（不带 data: 前缀） */
  base64?: string
  /** 默认 image/jpeg */
  mime?: string
  /** 或者直接传一张可公开访问的 https 图片 */
  url?: string
}

export interface ImageGenOptions {
  size?: '1024*1024' | '720*1280' | '1280*720' | '1152*768' | '768*1152'
  n?: number
  negativePrompt?: string
}

/** OpenAI 兼容模式的对话补全。 */
export async function chatComplete(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  try {
    securityLogger.info(SecurityLogType.AI_SERVICE, '开始调用对话补全服务', {
      model: options.model || AI_CONFIG.chatModel
    })
    
    // 调用云函数处理 AI 请求
    const callResult = await Taro.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'chatComplete',
        messages,
        options: {
          ...options,
          model: options.model || AI_CONFIG.chatModel,
        },
      },
    })

    const resp = callResult.result as { code: number; result: string; message?: string }
    if (resp?.code !== 0) {
      securityLogger.error(SecurityLogType.AI_SERVICE, '对话补全服务调用失败', {
        code: resp?.code,
        message: resp?.message
      })
      throw new Error(resp?.message ? `[${resp.code}] ${resp.message}` : 'AI 服务调用失败')
    }

    securityLogger.info(SecurityLogType.AI_SERVICE, '对话补全服务调用成功')
    return resp?.result || ''
  } catch (error) {
    securityLogger.error(SecurityLogType.AI_SERVICE, '对话补全服务调用异常', {
      error: (error as any)?.message
    })
    throw new Error((error as any)?.message || 'AI 服务调用失败，请稍后再试')
  }
}

/** 图像理解：传入 base64 或 url，加一段文字提示。 */
export async function visionAnalyze(
  image: VisionInput,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  try {
    securityLogger.info(SecurityLogType.AI_SERVICE, '开始调用视觉分析服务', {
      model: options.model || 'qwen3.6-plus',
      hasImage: !!image.base64 || !!image.url
    })
    
    // 调用云函数处理视觉分析
    const callResult = await Taro.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'visionAnalyze',
        image,
        prompt,
        options: {
          ...options,
          model: AI_CONFIG.visionModel,
        },
      },
    })

    const resp = callResult.result as { code: number; result: string; message?: string }
    if (resp?.code !== 0) {
      securityLogger.error(SecurityLogType.AI_SERVICE, '视觉分析服务调用失败', {
        code: resp?.code,
        message: resp?.message
      })
      throw new Error(resp?.message ? `[${resp.code}] ${resp.message}` : '视觉分析服务调用失败')
    }

    securityLogger.info(SecurityLogType.AI_SERVICE, '视觉分析服务调用成功')
    return resp?.result || ''
  } catch (error) {
    securityLogger.error(SecurityLogType.AI_SERVICE, '视觉分析服务调用异常', {
      error: (error as any)?.message
    })
    throw new Error((error as any)?.message || '视觉分析服务调用失败，请稍后再试')
  }
}

/**
 * 文生图（使用通义万相API）。
 * 返回一个或多个 https:// 图片 URL（OSS 临时地址，~24h 过期）。
 */
export async function generateImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<string[]> {
  try {
    securityLogger.info(SecurityLogType.AI_SERVICE, '开始调用图像生成服务', {
      model: options.model || AI_CONFIG.imageModel,
      size: options.size || '1024*1024'
    })
    
    // 调用云函数处理图像生成
    const callResult = await Taro.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'generateImage',
        prompt,
        options: {
          ...options,
          model: AI_CONFIG.imageModel,
        },
      },
    })

    const resp = callResult.result as { code: number; result: string[]; message?: string }
    if (resp?.code !== 0) {
      securityLogger.error(SecurityLogType.AI_SERVICE, '图像生成服务调用失败', {
        code: resp?.code,
        message: resp?.message
      })
      throw new Error(resp?.message ? `[${resp.code}] ${resp.message}` : '图像生成服务调用失败')
    }

    securityLogger.info(SecurityLogType.AI_SERVICE, '图像生成服务调用成功', {
      imageCount: resp?.result?.length || 0
    })
    return resp?.result || []
  } catch (error) {
    securityLogger.error(SecurityLogType.AI_SERVICE, '图像生成服务调用异常', {
      error: (error as any)?.message
    })
    throw new Error((error as any)?.message || '图像生成服务调用失败，请稍后再试')
  }
}
