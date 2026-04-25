import Taro from '@tarojs/taro'

const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function generateKey(): string {
  try {
    const deviceId =
      Taro.getStorageSync('deviceId') ||
      Taro.getSystemInfoSync().deviceId ||
      'default'
    const salt = 'san-can-you-yi-si-salt-2026'
    let hash = 0
    const combined = deviceId + salt
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padEnd(16, '0').substring(0, 16)
  } catch {
    return 'default-key-123456'
  }
}

function utf8Encode(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    } else {
      i++
      const code2 = str.charCodeAt(i)
      const cp = 0x10000 + ((code - 0xd800) << 10) + (code2 - 0xdc00)
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      )
    }
  }
  return bytes
}

function utf8Decode(bytes: number[]): string {
  const chars: string[] = []
  let i = 0
  while (i < bytes.length) {
    const b1 = bytes[i++]
    if (b1 < 0x80) {
      chars.push(String.fromCharCode(b1))
    } else if (b1 < 0xe0) {
      const b2 = bytes[i++]
      chars.push(String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f)))
    } else if (b1 < 0xf0) {
      const b2 = bytes[i++]
      const b3 = bytes[i++]
      chars.push(
        String.fromCharCode(
          ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)
        )
      )
    } else {
      const b2 = bytes[i++]
      const b3 = bytes[i++]
      const b4 = bytes[i++]
      const cp =
        ((b1 & 0x07) << 18) |
        ((b2 & 0x3f) << 12) |
        ((b3 & 0x3f) << 6) |
        (b4 & 0x3f)
      chars.push(String.fromCodePoint(cp))
    }
  }
  return chars.join('')
}

/** 纯 JS 实现 base64 编码（不依赖 btoa / Buffer）。 */
function bytesToBase64(bytes: number[]): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0

    result += BASE64[b1 >> 2]
    result += BASE64[((b1 & 3) << 4) | (b2 >> 4)]

    if (i + 1 < bytes.length) {
      result += BASE64[((b2 & 15) << 2) | (b3 >> 6)]
    } else {
      result += '='
    }

    if (i + 2 < bytes.length) {
      result += BASE64[b3 & 63]
    } else {
      result += '='
    }
  }
  return result
}

/** 纯 JS 实现 base64 解码（不依赖 atob / Buffer）。 */
function base64ToBytes(str: string): number[] {
  const input = str.replace(/=+$/, '')
  const bytes: number[] = []
  for (let i = 0; i < input.length; i += 4) {
    const c1 = BASE64.indexOf(input[i])
    const c2 = BASE64.indexOf(input[i + 1])
    const c3 = BASE64.indexOf(input[i + 2])
    const c4 = BASE64.indexOf(input[i + 3])

    if (c1 === -1 || c2 === -1) break

    bytes.push((c1 << 2) | (c2 >> 4))

    if (c3 !== -1) {
      bytes.push(((c2 & 15) << 4) | (c3 >> 2))
    }

    if (c4 !== -1) {
      bytes.push(((c3 & 3) << 6) | c4)
    }
  }
  return bytes
}

/** 判断字符串是否全部由 Latin-1（0-255）字符组成。 */
function isLatin1(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) return false
  }
  return true
}

export function encrypt(data: string): string {
  try {
    const key = generateKey()
    const keyBytes = utf8Encode(key)
    const dataBytes = utf8Encode(data)

    for (let i = 0; i < dataBytes.length; i++) {
      dataBytes[i] ^= keyBytes[i % keyBytes.length]
    }

    return 'v2:' + bytesToBase64(dataBytes)
  } catch (error) {
    console.error('加密失败:', error)
    return data
  }
}

export function decrypt(encryptedData: string): string {
  try {
    // ---- v2 格式 ----
    if (encryptedData.startsWith('v2:')) {
      const key = generateKey()
      const keyBytes = utf8Encode(key)
      const dataBytes = base64ToBytes(encryptedData.slice(3))

      for (let i = 0; i < dataBytes.length; i++) {
        dataBytes[i] ^= keyBytes[i % keyBytes.length]
      }

      return utf8Decode(dataBytes)
    }

    // ---- 旧版格式（降级兼容） ----
    try {
      const key = generateKey()
      let decoded: string

      if (typeof atob === 'function' && isLatin1(encryptedData)) {
        decoded = decodeURIComponent(escape(atob(encryptedData)))
      } else if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(encryptedData, 'base64').toString()
      } else {
        // 不满足任何解码条件，直接返回原始数据
        return encryptedData
      }

      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        const charCode =
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        result += String.fromCharCode(charCode)
      }
      return result
    } catch {
      return encryptedData
    }
  } catch (error) {
    console.error('解密失败:', error)
    return encryptedData
  }
}
