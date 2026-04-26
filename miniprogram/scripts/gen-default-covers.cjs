/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const https = require('https')

const BASE_URL = 'https://dashscope.aliyuncs.com'
const API_KEY = process.env.DASHSCOPE_API_KEY

const MODEL = 'wanx2.1-t2i-turbo'
const SIZE = '1024*1024'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function requestJson(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        method,
        headers,
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          const statusCode = res.statusCode || 0
          const ct = String(res.headers['content-type'] || '')
          let parsed = data
          if (ct.includes('application/json')) {
            try {
              parsed = JSON.parse(data || '{}')
            } catch {
              // ignore
            }
          } else {
            try {
              parsed = JSON.parse(data || '{}')
            } catch {
              // ignore
            }
          }
          resolve({ statusCode, data: parsed })
        })
      }
    )
    req.on('error', reject)
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body))
    req.end()
  })
}

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const file = fs.createWriteStream(filePath)
    https
      .get(url, (res) => {
        if ((res.statusCode || 0) >= 400) {
          reject(new Error(`download failed: ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close(resolve)
        })
      })
      .on('error', (err) => {
        try {
          fs.unlinkSync(filePath)
        } catch {
          // ignore
        }
        reject(err)
      })
  })
}

function buildPrompt(title, description) {
  const desc = (description || '').trim() ? `特色：${String(description).trim()}。` : ''
  return `一张精致的中式美食摄影图。
主体：${title}。${desc}
构图：俯拍 45°，浅景深，主体居中，自然光，木质餐桌搭配亚麻餐布，精致餐盘。
色调：暖色温，橙棕与米白自然融合，质感柔和，富有食欲。
细节：热气腾腾，光影写实，杂志 / 小红书风格，4K 高清。
限制：画面干净，无文字，无水印，无人物脸部特写。`
}

async function submitTask(prompt) {
  const submit = await requestJson(`${BASE_URL}/api/v1/services/aigc/text2image/image-synthesis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: {
      model: MODEL,
      input: {
        prompt,
        negative_prompt: '文字, 水印, logo, 低清, 模糊, 多余手, 变形',
      },
      parameters: { size: SIZE, n: 1 },
    },
  })
  if (submit.statusCode < 200 || submit.statusCode >= 300) {
    throw new Error(`submit failed: ${submit.statusCode} ${JSON.stringify(submit.data).slice(0, 500)}`)
  }
  const taskId = submit.data?.output?.task_id
  if (!taskId) throw new Error('no task_id')
  return taskId
}

async function pollTask(taskId, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(2000)
    const poll = await requestJson(`${BASE_URL}/api/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (poll.statusCode < 200 || poll.statusCode >= 300) continue
    const status = poll.data?.output?.task_status
    if (status === 'SUCCEEDED') {
      const url = poll.data?.output?.results?.[0]?.url
      if (!url) throw new Error('SUCCEEDED but no url')
      return url
    }
    if (status === 'FAILED' || status === 'UNKNOWN') {
      const msg = poll.data?.output?.message || poll.data?.output?.code || status
      throw new Error(`task failed: ${msg}`)
    }
  }
  throw new Error('poll timeout')
}

function safeSlug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .slice(0, 48)
}

async function main() {
  if (!API_KEY) {
    throw new Error('Missing DASHSCOPE_API_KEY environment variable')
  }

  const recipesPath = path.join(__dirname, '..', 'src', 'data', 'initialRecipes.ts')
  const raw = fs.readFileSync(recipesPath, 'utf8')
  const titles = []
  for (const m of raw.matchAll(/title:\s*'([^']+)'/g)) titles.push(m[1])
  const descs = []
  for (const m of raw.matchAll(/description:\s*'([^']+)'/g)) descs.push(m[1])

  const items = titles.slice(0, 10).map((t, i) => ({
    idx: i + 1,
    title: t,
    description: descs[i] || '',
  }))

  const outDir = path.join(__dirname, '..', 'src', 'assets', 'covers')
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`Generating ${items.length} covers using ${MODEL}...`)

  // simple sequential to reduce rate-limit issues
  for (const it of items) {
    const filename = `recipe-${String(it.idx).padStart(2, '0')}-${safeSlug(it.title)}.jpg`
    const outPath = path.join(outDir, filename)
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
      console.log(`[skip] ${filename}`)
      continue
    }
    const prompt = buildPrompt(it.title, it.description)
    process.stdout.write(`[${it.idx}/${items.length}] ${it.title} ... `)
    const taskId = await submitTask(prompt)
    const url = await pollTask(taskId)
    await downloadToFile(url, outPath)
    console.log('ok')
  }

  console.log('Done. Files in src/assets/covers/.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

