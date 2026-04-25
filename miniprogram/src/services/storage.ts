import Taro from '@tarojs/taro'
import type { Favorite, MealLog, Recipe, ShoppingItem, UserProfile, WxAuth } from '../types'
import { encrypt, decrypt } from '../lib/crypto'
import { securityLogger, SecurityLogType } from '../lib/securityLogger'

export type DBShape = {
  profile?: UserProfile
  recipes: Recipe[]
  logs: MealLog[]
  shopping: ShoppingItem[]
  favorites: Favorite[]
  wxAuth?: WxAuth
}

const STORAGE_KEY = 'san-can-you-yi-si-db'

export function loadDB(): DBShape {
  const raw = Taro.getStorageSync(STORAGE_KEY)
  if (!raw) {
    securityLogger.info(SecurityLogType.STORAGE, '数据库为空，返回默认值')
    return { recipes: [], logs: [], shopping: [], favorites: [] }
  }
  try {
    // 解密数据
    const decrypted = decrypt(raw)
    const db = JSON.parse(decrypted) as DBShape
    securityLogger.info(SecurityLogType.STORAGE, '数据库加载成功')
    return db
  } catch (error) {
    securityLogger.error(SecurityLogType.STORAGE, '加载数据库失败', { error: error.message })
    return { recipes: [], logs: [], shopping: [], favorites: [] }
  }
}

export function saveDB(db: DBShape) {
  try {
    // 加密数据
    const encrypted = encrypt(JSON.stringify(db))
    Taro.setStorageSync(STORAGE_KEY, encrypted)
    securityLogger.info(SecurityLogType.STORAGE, '数据库保存成功')
  } catch (error) {
    securityLogger.error(SecurityLogType.STORAGE, '保存数据库失败', { error: error.message })
  }
}

/** 清空本机全部数据（菜谱、记录、收藏、购物清单、个人资料等） */
export function clearAllLocalData() {
  try {
    Taro.removeStorageSync(STORAGE_KEY)
    securityLogger.info(SecurityLogType.STORAGE, '本地数据已清空')
  } catch (error) {
    securityLogger.error(SecurityLogType.STORAGE, '清空数据失败', { error: error.message })
  }
}

