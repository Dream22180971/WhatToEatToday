import Taro from '@tarojs/taro'
import { AI_CONFIG } from './config'
import { securityLogger, SecurityLogType } from '../lib/securityLogger'
function devLog(...args: any[]) {
  try {
    // 仅开发态输出，避免生产噪音
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  } catch {
    // ignore
  }
}

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
  size?: '1024x1024' | '720x1280' | '1280x720' | '1152x768' | '768x1152' | '1024*1024' | '720*1280' | '1280*720' | '1152*768' | '768*1152'
  n?: number
  negativePrompt?: string
}

function normalizeImageSize(size?: ImageGenOptions['size']) {
  return (size || '1024x1024').replace('*', 'x')
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

    // 为了彻底规避客户端直连 401（环境/授权不一致），统一改为调用云函数 aiService（内部仍使用 cloud.extend.AI）
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
    const resp = callResult?.result as { code: number; result?: string; message?: string }
    if (resp?.code !== 0) throw new Error(resp?.message || '对话补全失败')
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

    if (!image?.url) {
      throw new Error('视觉分析仅支持图片 url：请先把图片上传到云存储并传入临时链接')
    }
    const callResult = await Taro.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'visionAnalyze',
        image: { url: image.url },
        prompt,
        options: {
          ...options,
          model: options.model || AI_CONFIG.visionModel,
        },
      },
    })
    const resp = callResult?.result as { code: number; result?: string; message?: string }
    if (resp?.code !== 0) throw new Error(resp?.message || '视觉分析失败')
    return resp?.result || ''
  } catch (error) {
    securityLogger.error(SecurityLogType.AI_SERVICE, '视觉分析服务调用异常', {
      error: (error as any)?.message
    })
    throw new Error((error as any)?.message || '视觉分析服务调用失败，请稍后再试')
  }
}

/**
 * 文生图（腾讯 CloudBase：hunyuan-image）
 * 注意：生图能力按官方指引需通过云函数调用。
 */
export async function generateImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<string[]> {
  try {
    const size = normalizeImageSize(options.size)
    securityLogger.info(SecurityLogType.AI_SERVICE, '开始调用图像生成服务(CloudBase)', {
      model: AI_CONFIG.imageModel,
      size,
    })

    const callResult = await Taro.cloud.callFunction({
      name: 'aiService',
      data: {
        action: 'generateImage',
        prompt,
        options: {
          size,
          revise: true,
        },
      },
    })

    const resp = callResult?.result as any
    // 兼容：云函数可能直接 return result，也可能包一层 { code, result }
    const maybeUrl = resp?.imageUrl || resp?.result?.imageUrl
    if (typeof maybeUrl === 'string' && maybeUrl) return [maybeUrl]

    // 兼容：可能返回 urls 数组
    const urls = resp?.result || resp?.imageUrls || resp?.urls
    if (Array.isArray(urls) && urls.length) return urls.filter(Boolean)

    throw new Error('未返回图片 URL')
  } catch (error) {
    securityLogger.error(SecurityLogType.AI_SERVICE, '图像生成服务调用异常', {
      error: (error as any)?.message,
    })
    throw new Error((error as any)?.message || '图像生成服务调用失败，请稍后再试')
  }
}
