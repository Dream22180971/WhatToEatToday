import type { ChatMessage } from './qwen'

declare const wx: any

export type CloudbaseAIModelProvider = 'hunyuan-exp'

export async function cloudbaseStreamText(params: {
  provider?: CloudbaseAIModelProvider
  model: string
  messages: ChatMessage[]
}): Promise<{ text: string; reasoning?: string }> {
  const provider = params.provider || 'hunyuan-exp'
  const ai = wx?.cloud?.extend?.AI
  if (!ai?.createModel) throw new Error('未启用 CloudBase AI：wx.cloud.extend.AI 不可用')

  const res = await ai.createModel(provider).streamText({
    data: {
      model: params.model,
      messages: params.messages,
    },
  })

  let text = ''
  let reasoning = ''

  for await (const event of res.eventStream) {
    if (event?.data === '[DONE]') break
    if (!event?.data) continue
    let data: any = null
    try {
      data = JSON.parse(event.data)
    } catch {
      continue
    }
    const think = data?.choices?.[0]?.delta?.reasoning_content
    if (think) reasoning += String(think)
    const chunk = data?.choices?.[0]?.delta?.content
    if (chunk) text += String(chunk)
  }

  return { text, reasoning: reasoning || undefined }
}

