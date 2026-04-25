// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 从环境变量获取 API Key
const API_KEY = process.env.DASHSCOPE_API_KEY;
if (!API_KEY) {
  console.error('缺少 DASHSCOPE_API_KEY 环境变量')
}

// 阿里百炼 API 配置
const AI_CONFIG = {
  apiKey: API_KEY,
  baseUrl: 'https://dashscope.aliyuncs.com',
  compatibleUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  textTimeout: 60000,
  imageTimeout: 150000,
}

if (!AI_CONFIG.apiKey) {
  console.error('缺少 DASHSCOPE_API_KEY 环境变量，云函数将返回错误。');
}

function toErrorMessage(data, statusCode) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data)
  return `[${statusCode}] ${raw}`
}

function pickDashscopeMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  const msg =
    data?.message ||
    data?.error?.message ||
    data?.error?.code ||
    data?.code ||
    data?.output?.message ||
    data?.output?.code
  try {
    return msg ? String(msg) : JSON.stringify(data)
  } catch {
    return String(msg || '')
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 兼容：部分调用方会把参数包在 event.data 下
    const input =
      event && typeof event === 'object' && event.data && typeof event.data === 'object'
        ? event.data
        : event

    const { action, ...payload } = input || {}

    console.log(
      '[aiService] incoming',
      JSON.stringify({
        hasEvent: !!event,
        topKeys: event && typeof event === 'object' ? Object.keys(event).slice(0, 20) : [],
        hasDataWrapper: !!(event && typeof event === 'object' && event.data),
        action,
        payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : [],
      })
    )

    if (!AI_CONFIG.apiKey) {
      return {
        code: 401,
        message: 'AI 服务未配置：缺少 DASHSCOPE_API_KEY 环境变量',
      }
    }
    
    switch (action) {
      case 'chatComplete':
        return await handleChatComplete(payload)
      case 'visionAnalyze':
        return await handleVisionAnalyze(payload)
      case 'generateImage':
        return await handleGenerateImage(payload)
      default:
        return {
          code: 400,
          message: `未知的操作类型: ${String(action)}`
        }
    }
  } catch (error) {
    console.error('云函数错误:', error)
    return {
      code: 500,
      message: error.message || '服务内部错误'
    }
  }
}

// 处理对话补全
async function handleChatComplete({ messages, options }) {
  try {
    const response = await axios({
      url: `${AI_CONFIG.compatibleUrl}/chat/completions`,
      method: 'POST',
      timeout: AI_CONFIG.textTimeout,
      headers: {
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: options.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1800,
      },
    })
    
    const content = response.data?.choices?.[0]?.message?.content
    if (typeof content === 'string') return { code: 0, result: content }
    if (Array.isArray(content)) {
      return { code: 0, result: content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join('') }
    }
    return { code: 0, result: '' }
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data
    console.error('chatComplete 错误:', error?.message, 'status=', status, 'data=', data)
    const detail = pickDashscopeMessage(data) || error.message
    throw new Error('对话补全失败: ' + (status ? `[HTTP ${status}] ` : '') + detail)
  }
}

// 处理视觉分析
async function handleVisionAnalyze({ image, prompt, options }) {
  try {
    const url = image.url || `data:${image.mime || 'image/jpeg'};base64,${image.base64 || ''}`

    // 使用 OpenAI 兼容模式调用全模态模型
    const response = await axios({
      url: `${AI_CONFIG.compatibleUrl}/chat/completions`,
      method: 'POST',
      timeout: AI_CONFIG.imageTimeout,
      headers: {
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: options.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2200,
      },
    })

    const content = response.data?.choices?.[0]?.message?.content
    if (typeof content === 'string') return { code: 0, result: content }
    if (Array.isArray(content)) {
      return { code: 0, result: content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join('') }
    }
    return { code: 0, result: '' }
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data
    console.error('visionAnalyze 错误:', error?.message, 'status=', status, 'data=', data)
    const detail = pickDashscopeMessage(data) || error.message
    throw new Error('视觉分析失败: ' + (status ? `[HTTP ${status}] ` : '') + detail)
  }
}

// 处理图像生成
async function handleGenerateImage({ prompt, options }) {
  try {
    // Qwen-Image：走 multimodal-generation（同步），返回 output.choices[0].message.content[].image
    if (typeof options?.model === 'string' && options.model.startsWith('qwen-image')) {
      const response = await axios({
        url: `${AI_CONFIG.baseUrl}/api/v1/services/aigc/multimodal-generation/generation`,
        method: 'POST',
        timeout: AI_CONFIG.imageTimeout,
        headers: {
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: options.model,
          input: {
            messages: [
              {
                role: 'user',
                content: [{ text: prompt }],
              },
            ],
          },
          parameters: {
            negative_prompt: options.negativePrompt,
            size: options.size || '1024*1024',
            n: options.n || 1,
            prompt_extend: true,
            watermark: false,
          },
        },
      })

      const content = response.data?.output?.choices?.[0]?.message?.content
      const urls = Array.isArray(content)
        ? content.map((x) => x?.image).filter(Boolean)
        : []

      if (urls.length) return { code: 0, result: urls }
      console.error('[imggen] unexpected qwen-image response:', JSON.stringify(response.data)?.slice(0, 2000))
      throw new Error('未返回图片 URL')
    }

    // 其他模型：使用通义万相API（DashScope 原生异步文生图），提交任务 + 轮询结果
      const submitResponse = await axios({
        url: `${AI_CONFIG.baseUrl}/api/v1/services/aigc/text2image/image-synthesis`,
        method: 'POST',
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        data: {
          model: options.model,
          input: {
            prompt,
            ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
          },
          parameters: {
            size: options.size || '1024*1024',
            n: options.n || 1,
          },
        },
      })
      
      const taskId = submitResponse.data?.output?.task_id
      if (!taskId) throw new Error('万相未返回 task_id')

      // 轮询任务结果
      const deadline = Date.now() + 300000 // 5分钟超时
      let pollingInterval = 2000 // 初始轮询间隔
      let attempt = 0
      const maxAttempts = 100 // 最大轮询次数

      while (Date.now() < deadline && attempt < maxAttempts) {
        attempt++
        await delay(pollingInterval)
        
        // 逐渐增加轮询间隔
        if (attempt > 10) {
          pollingInterval = 3000
        } else if (attempt > 20) {
          pollingInterval = 5000
        }

        try {
          const pollResponse = await axios({
            url: `${AI_CONFIG.baseUrl}/api/v1/tasks/${taskId}`,
            method: 'GET',
            timeout: 10000,
            headers: { Authorization: `Bearer ${AI_CONFIG.apiKey}` },
          })
          
          const status = pollResponse.data?.output?.task_status
          
          if (status === 'SUCCEEDED') {
            const urls = ((pollResponse.data?.output?.results || [])).map((r) => r.url).filter(Boolean)
            if (urls.length) return { code: 0, result: urls }
            throw new Error('图片生成完成但未返回 URL')
          }
          
          if (status === 'FAILED' || status === 'UNKNOWN') {
            const msg = pollResponse.data?.output?.message || pollResponse.data?.output?.code || status
            throw new Error('图片生成失败: ' + msg)
          }
          
          // PENDING / RUNNING: 继续等
        } catch (error) {
          console.log('轮询错误:', error)
          // 轮询错误时继续尝试
        }
      }
      
      throw new Error('图片生成超时，请稍后再试')
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data
    console.error('generateImage 错误:', error?.message, 'status=', status, 'data=', data)
    const detail = pickDashscopeMessage(data) || error.message
    throw new Error('图像生成失败: ' + (status ? `[HTTP ${status}] ` : '') + detail)
  }
}
