/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const DIST_DIR = path.resolve(__dirname, '..', 'dist')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function stripBanners(content) {
  // Taro/webpack sometimes emits webpack module banners into wxss which WXSS parser can't handle well.
  // Example starts with:
  // /*!****!*\
  //   !*** css ./node_modules/css-loader/... ***!
  //   \*****/  (contains backslashes)
  // Remove any leading /*! ... */ block that mentions css-loader/postcss-loader.
  const leadingBanner = /^\/\*![\s\S]*?\*\/\s*/g
  let next = content

  // Remove only if banner looks like webpack loader banner.
  if (/^\/\*![\s\S]*?css-loader[\s\S]*?\*\//.test(next) || /^\/\*![\s\S]*?postcss-loader[\s\S]*?\*\//.test(next)) {
    next = next.replace(leadingBanner, '')
  }

  // Some builds can include multiple consecutive webpack banners.
  while (/^\/\*![\s\S]*?css-loader[\s\S]*?\*\//.test(next) || /^\/\*![\s\S]*?postcss-loader[\s\S]*?\*\//.test(next)) {
    next = next.replace(leadingBanner, '')
  }

  return next
}

function processOnce() {
  if (!fs.existsSync(DIST_DIR)) return
  const files = walk(DIST_DIR).filter((f) => f.endsWith('.wxss'))
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8')
    const next = stripBanners(raw)
    if (next !== raw) {
      fs.writeFileSync(f, next, 'utf8')
      console.log(`[strip-wxss-banner] cleaned ${path.relative(process.cwd(), f)}`)
    }
  }
}

function watch() {
  if (!fs.existsSync(DIST_DIR)) return
  let timer = null
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      try {
        processOnce()
      } catch (e) {
        // keep watching
      }
    }, 200)
  }

  fs.watch(DIST_DIR, { recursive: true }, (_evt, filename) => {
    if (!filename || !filename.endsWith('.wxss')) return
    schedule()
  })

  // initial pass
  processOnce()
  console.log('[strip-wxss-banner] watching dist/*.wxss')
}

const args = new Set(process.argv.slice(2))
if (args.has('--watch')) watch()
else processOnce()

