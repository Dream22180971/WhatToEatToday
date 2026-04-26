// 云函数入口文件
const cloud = require('wx-server-sdk')
const tcb = require('@cloudbase/node-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const app = tcb.init({
  // 显式指定环境，避免云函数运行时取错环境
  env: 'cloud1-d5g1waohpc2fbf6bf',
})
const ai = typeof app.ai === 'function' ? app.ai() : app.ai
const SERVICE_VERSION = 'cloudbase-node-ai-v7-daily-limit-20260426'
const db = cloud.database()
const dbCmd = db.command
const DAILY_USAGE_COLLECTION = 'ai_daily_usage'
const DAILY_AI_LIMITS = {
  visionRecipe: {
    limit: 10,
    message: '今天的 AI 图片识别次数已用完（10 次/天）。明天会自动恢复，也可以先手动录入菜谱。',
  },
  recipeCover: {
    limit: 20,
    message: '今天的 AI 生成封面次数已用完（20 次/天）。可以先上传本地封面，明天再继续生成。',
  },
  smartRecommend: {
    limit: 30,
    message: '今天的 AI 智能推荐次数已用完（30 次/天）。先尝尝已有推荐或试试美食抽签，明天再来换新灵感。',
  },
}
let usageCollectionReady = false

function normalizeImageSize(size) {
  return String(size || '1024x1024').replace('*', 'x')
}

function requireAI() {
  if (!ai) {
    const err = new Error(
      '云函数未启用 CloudBase AI：当前 @cloudbase/node-sdk 未暴露 app.ai，请确认依赖已随 aiService 一起上传部署。'
    )
    err.code = 403
    throw err
  }
}

function todayKey() {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

function getOpenId(context) {
  try {
    const wxContext = cloud.getWXContext()
    return wxContext.OPENID || context?.OPENID || context?.openid || 'anonymous'
  } catch {
    return context?.OPENID || context?.openid || 'anonymous'
  }
}

function usageDocId(openid, kind, dateKey) {
  return `${openid}_${kind}_${dateKey}`.replace(/[^\w-]/g, '_')
}

function isDailyLimitError(error) {
  return error?.code === 429 || error?.dailyAiLimit
}

async function ensureUsageCollection() {
  if (usageCollectionReady) return
  try {
    if (typeof db.createCollection === 'function') {
      await db.createCollection(DAILY_USAGE_COLLECTION)
    }
  } catch {
    // 已存在或当前环境不允许创建时继续使用；真正读写失败会在调用处暴露。
  }
  usageCollectionReady = true
}

async function readDailyUsage(openid, kind, dateKey) {
  await ensureUsageCollection()
  const docId = usageDocId(openid, kind, dateKey)
  try {
    const res = await db.collection(DAILY_USAGE_COLLECTION).doc(docId).get()
    return Number(res?.data?.used || 0)
  } catch (error) {
    const msg = String(error?.errMsg || error?.message || '')
    if (msg.includes('does not exist') || msg.includes('document not exist') || msg.includes('not found')) {
      return 0
    }
    throw error
  }
}

async function increaseDailyUsage(openid, kind, dateKey) {
  await ensureUsageCollection()
  const docId = usageDocId(openid, kind, dateKey)
  const col = db.collection(DAILY_USAGE_COLLECTION)
  const data = {
    openid,
    kind,
    dateKey,
    used: 1,
    updatedAt: db.serverDate(),
  }
  try {
    await col.doc(docId).update({
      data: {
        used: dbCmd.inc(1),
        updatedAt: db.serverDate(),
      },
    })
  } catch {
    try {
      await col.doc(docId).set({
        data: {
          ...data,
          createdAt: db.serverDate(),
        },
      })
    } catch {
      // 并发创建冲突时再尝试一次递增。
      await col.doc(docId).update({
        data: {
          used: dbCmd.inc(1),
          updatedAt: db.serverDate(),
        },
      })
    }
  }
}

async function withDailyAiUsageLimit(kind, context, run) {
  const config = DAILY_AI_LIMITS[kind]
  if (!config) return await run()

  const openid = getOpenId(context)
  const dateKey = todayKey()
  const used = await readDailyUsage(openid, kind, dateKey)
  if (used >= config.limit) {
    const err = new Error(config.message)
    err.code = 429
    err.dailyAiLimit = { kind, limit: config.limit, used, dateKey }
    throw err
  }

  const result = await run()
  await increaseDailyUsage(openid, kind, dateKey)
  return result
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
        version: SERVICE_VERSION,
        aiMethods: ai ? Object.getOwnPropertyNames(Object.getPrototypeOf(ai)).filter((k) => k !== 'constructor') : [],
        payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : [],
      })
    )

    switch (action) {
      case 'chatComplete':
        return await handleChatComplete(payload, context)
      case 'visionAnalyze':
        return await handleVisionAnalyze(payload, context)
      case 'generateImage':
        return await handleGenerateImage(payload, context)
      default:
        return {
          code: 400,
          message: `未知的操作类型: ${String(action)}`
        }
    }
  } catch (error) {
    console.error('云函数错误:', error)
    return {
      code: error?.code || 500,
      message: error.message || '服务内部错误'
    }
  }
}

// 处理对话补全
async function handleChatComplete({ messages, options }, context) {
  try {
    requireAI()
    const run = async () => {
      const model = options?.model || 'hunyuan-2.0-instruct-20251111'
      const res = await ai.createModel('hunyuan-exp').streamText({
        model,
        messages: Array.isArray(messages) ? messages : [],
      })

      let text = ''
      for await (const chunk of res.textStream) {
        if (chunk) text += chunk
      }
      return { code: 0, result: text }
    }

    return await withDailyAiUsageLimit(options?.usageKind, context, run)
  } catch (error) {
    console.error('chatComplete 错误:', error?.message)
    if (isDailyLimitError(error)) throw error
    throw new Error('对话补全失败: ' + (error?.message || 'unknown'))
  }
}

// 处理视觉分析
async function handleVisionAnalyze({ image, prompt, options }, context) {
  try {
    return await withDailyAiUsageLimit('visionRecipe', context, async () => {
      requireAI()
      const url = image?.url
      if (!url) throw new Error('visionAnalyze 仅支持 image.url')

      const visionMessages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: String(prompt || '') },
            { type: 'image_url', image_url: { url } },
          ],
        },
      ]

      const candidates = [
        // 你已在 CloudBase 控制台接入的阿里云百炼 OpenAI 兼容全模态模型
        { provider: 'dashscope-custom', model: 'qwen3.5-omni-flash' },
        // CloudBase 图生文文档推荐：自定义模型 + hunyuan-vision
        { provider: 'hunyuan-custom', model: 'hunyuan-vision' },
        // 如果环境直接授权了 hunyuan-vision，也尝试内置 provider
        { provider: 'hunyuan-exp', model: 'hunyuan-vision' },
        // 最后尝试控制台已启用的文本模型；多数环境会因不支持 image_url 而失败
        { provider: 'hunyuan-exp', model: options?.model || 'hunyuan-turbos-latest' },
      ]

      const errors = []
      for (const candidate of candidates) {
        try {
          console.log(
            '[aiService] visionAnalyze input',
            JSON.stringify({
              version: SERVICE_VERSION,
              provider: candidate.provider,
              model: candidate.model,
              messageCount: visionMessages.length,
              firstContentTypes: visionMessages[0].content.map((item) => item.type),
            })
          )

          const res = await ai.createModel(candidate.provider).streamText({
            model: candidate.model,
            messages: visionMessages,
          })

          let text = ''
          for await (const chunk of res.textStream) {
            if (chunk) text += chunk
          }
          if (text) return { code: 0, result: text }
          errors.push(`${candidate.provider}/${candidate.model}: 空响应`)
        } catch (error) {
          const message = error?.message || String(error)
          console.error('[aiService] visionAnalyze candidate failed:', candidate, message)
          errors.push(`${candidate.provider}/${candidate.model}: ${message}`)
        }
      }

      throw new Error(
        '当前 CloudBase 环境没有可用的图生文模型。请在 AI > 生文模型中确认已接入 dashscope-custom/qwen3.5-omni-flash 或 hunyuan-custom/hunyuan-vision。尝试结果：' +
          errors.join(' | ')
      )
    })
  } catch (error) {
    console.error('visionAnalyze 错误:', error?.message)
    if (isDailyLimitError(error)) throw error
    throw new Error('视觉分析失败: ' + (error?.message || 'unknown'))
  }
}

// 处理图像生成
async function handleGenerateImage({ prompt, options }, context) {
  try {
    return await withDailyAiUsageLimit('recipeCover', context, async () => {
      requireAI()
      const promptText = String(prompt || '').trim()
      if (!promptText) throw new Error('prompt 不能为空')

      const size = normalizeImageSize(options?.size)
      const revise = options?.revise !== false
      const footnote = typeof options?.footnote === 'string' ? options.footnote : undefined
      const seed = typeof options?.seed === 'number' ? options.seed : undefined

      const imageModel = ai.createImageModel('hunyuan-exp')
      const raw = await imageModel.generateImage({
        model: 'hunyuan-image',
        prompt: promptText,
        size,
        revise,
        n: 1,
        ...(footnote ? { footnote } : {}),
        ...(seed ? { seed } : {}),
      })

      // 只返回可序列化的字段，避免云函数 runtime 因为复杂对象导致异常退出
      const first = Array.isArray(raw?.data) ? raw.data[0] : undefined
      const imageUrl = first?.url || raw?.imageUrl || raw?.result?.imageUrl
      const revised_prompt = first?.revised_prompt || raw?.revised_prompt || raw?.result?.revised_prompt
      if (!imageUrl) {
        console.log('[aiService][generateImage] unexpected response keys:', raw ? Object.keys(raw) : [])
        throw new Error('未返回 imageUrl')
      }
      return { code: 0, result: { imageUrl, revised_prompt } }
    })
  } catch (error) {
    console.error('generateImage 错误:', error?.message)
    if (isDailyLimitError(error)) throw error
    throw new Error('图像生成失败: ' + (error?.message || 'unknown'))
  }
}
