import axios from 'axios'

const apiKey = process.env.DASHSCOPE_API_KEY
if (!apiKey) {
  console.error('Missing env DASHSCOPE_API_KEY')
  process.exit(1)
}

const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'
const model = process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-2.0-pro'

async function main() {
  const prompt = process.env.DASHSCOPE_PROMPT || '一张精致的中式美食摄影图，热气腾腾的家常菜，暖色调，自然光，真实质感'

  const submitUrl = model.startsWith('qwen-image')
    ? `${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`
    : `${baseUrl}/api/v1/services/aigc/text2image/image-synthesis`

  console.log('submitUrl=', submitUrl)
  console.log('model=', model)

  try {
    const submit = await axios({
      url: submitUrl,
      method: 'POST',
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(model.startsWith('qwen-image') ? {} : { 'X-DashScope-Async': 'enable' }),
      },
      data: model.startsWith('qwen-image')
        ? {
            model,
            input: {
              messages: [
                {
                  role: 'user',
                  content: [{ text: prompt }],
                },
              ],
            },
            parameters: { size: '1024*1024', n: 1, watermark: false, prompt_extend: true },
          }
        : {
            model,
            input: { prompt },
            parameters: { size: '1024*1024', n: 1 },
          },
      validateStatus: () => true,
    })

    console.log('submitStatus=', submit.status)
    console.log('submitData=', JSON.stringify(submit.data).slice(0, 3000))

    if (model.startsWith('qwen-image')) {
      const urls = (submit.data?.output?.choices?.[0]?.message?.content || [])
        .map((x) => x?.image)
        .filter(Boolean)
      console.log('imageUrls=', urls)
      process.exit(0)
    }

    const taskId = submit.data?.output?.task_id
    if (!taskId) process.exit(0)

    const pollUrl = `${baseUrl}/api/v1/tasks/${taskId}`
    console.log('pollUrl=', pollUrl)

    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const poll = await axios({
        url: pollUrl,
        method: 'GET',
        timeout: 10000,
        headers: { Authorization: `Bearer ${apiKey}` },
        validateStatus: () => true,
      })
      console.log('pollStatus=', poll.status)
      console.log('pollData=', JSON.stringify(poll.data).slice(0, 3000))
      const status = poll.data?.output?.task_status
      if (status === 'SUCCEEDED' || status === 'FAILED') break
    }
  } catch (e) {
    console.error('request failed:', e?.message)
    if (e?.response) {
      console.error('status=', e.response.status)
      console.error('data=', e.response.data)
    }
    process.exit(1)
  }
}

main()

