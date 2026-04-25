import Taro from '@tarojs/taro'

// 安全日志级别
export enum SecurityLogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// 安全日志类型
export enum SecurityLogType {
  AUTH = 'AUTH',
  DATA_ACCESS = 'DATA_ACCESS',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  AI_SERVICE = 'AI_SERVICE',
  OTHER = 'OTHER'
}

// 安全日志接口
export interface SecurityLog {
  timestamp: number
  level: SecurityLogLevel
  type: SecurityLogType
  message: string
  details?: any
  userId?: string
}

// 安全日志存储键
const SECURITY_LOGS_KEY = 'san-can-you-yi-si-security-logs'
// 最大日志数量
const MAX_LOGS_COUNT = 1000

/**
 * 记录安全日志
 * @param level 日志级别
 * @param type 日志类型
 * @param message 日志消息
 * @param details 日志详情
 */
export function logSecurityEvent(
  level: SecurityLogLevel,
  type: SecurityLogType,
  message: string,
  details?: any
): void {
  try {
    // 获取当前用户ID（如果有）
    let userId: string | undefined
    try {
      const db = Taro.getStorageSync('san-can-you-yi-si-db')
      if (db && typeof db === 'string') {
        // 这里不进行解密，只尝试获取用户ID
        const parsed = JSON.parse(db)
        userId = parsed?.profile?.uid
      }
    } catch {
      // 忽略错误
    }

    // 创建日志对象
    const log: SecurityLog = {
      timestamp: Date.now(),
      level,
      type,
      message,
      details,
      userId
    }

    // 读取现有日志
    let logs: SecurityLog[] = []
    try {
      const existingLogs = Taro.getStorageSync(SECURITY_LOGS_KEY)
      if (existingLogs) {
        logs = Array.isArray(existingLogs) ? existingLogs : []
      }
    } catch {
      // 忽略错误
    }

    // 添加新日志
    logs.unshift(log) // 新日志放在前面

    // 限制日志数量
    if (logs.length > MAX_LOGS_COUNT) {
      logs = logs.slice(0, MAX_LOGS_COUNT)
    }

    // 保存日志
    Taro.setStorageSync(SECURITY_LOGS_KEY, logs)

    // 在开发环境中打印日志
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Log]', log)
    }
  } catch (error) {
    console.error('记录安全日志失败:', error)
  }
}

/**
 * 获取安全日志
 * @param limit 限制返回的日志数量
 * @returns 安全日志数组
 */
export function getSecurityLogs(limit: number = 100): SecurityLog[] {
  try {
    const logs = Taro.getStorageSync(SECURITY_LOGS_KEY)
    if (logs && Array.isArray(logs)) {
      return logs.slice(0, limit)
    }
  } catch (error) {
    console.error('获取安全日志失败:', error)
  }
  return []
}

/**
 * 清空安全日志
 */
export function clearSecurityLogs(): void {
  try {
    Taro.removeStorageSync(SECURITY_LOGS_KEY)
  } catch (error) {
    console.error('清空安全日志失败:', error)
  }
}

// 便捷方法
export const securityLogger = {
  info: (type: SecurityLogType, message: string, details?: any) => {
    logSecurityEvent(SecurityLogLevel.INFO, type, message, details)
  },
  warning: (type: SecurityLogType, message: string, details?: any) => {
    logSecurityEvent(SecurityLogLevel.WARNING, type, message, details)
  },
  error: (type: SecurityLogType, message: string, details?: any) => {
    logSecurityEvent(SecurityLogLevel.ERROR, type, message, details)
  },
  critical: (type: SecurityLogType, message: string, details?: any) => {
    logSecurityEvent(SecurityLogLevel.CRITICAL, type, message, details)
  },
  getLogs: getSecurityLogs,
  clearLogs: clearSecurityLogs
}
