/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function main() {
  const dir = path.join(__dirname, '..', 'src', 'assets', 'covers')
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^recipe-\d\d\.jpg$/i.test(f))
    .sort()

  if (!files.length) {
    console.log('No cover files found.')
    return
  }

  console.log('Compressing covers...')

  // Target: keep each image small enough for weapp package
  // 4:3 layout in UI → 640px width is plenty on mobile.
  const width = 640
  const quality = 62

  for (const f of files) {
    const inPath = path.join(dir, f)
    const tmpPath = path.join(dir, `${f}.tmp`)

    const before = fs.statSync(inPath).size
    const img = sharp(inPath, { failOn: 'none' })
    const meta = await img.metadata()

    const resized =
      meta.width && meta.width > width
        ? img.resize({ width, withoutEnlargement: true })
        : img

    await resized
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      })
      .toFile(tmpPath)

    fs.renameSync(tmpPath, inPath)
    const after = fs.statSync(inPath).size
    console.log(`${f}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`)
  }

  const total = files.reduce((acc, f) => acc + fs.statSync(path.join(dir, f)).size, 0)
  console.log('TOTAL_MB', (total / 1024 / 1024).toFixed(2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

