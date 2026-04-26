import type { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import '@taroify/icons/index.css'
import './app.css'
import { auditAndFixDefaultRecipesOnce } from './services/defaultRecipeAudit'

declare const wx: any

export default function App({ children }: PropsWithChildren) {
  // 必须初始化云开发，否则 Taro.cloud.* 会报 Cloud API isn't enabled
  // 显式指定 env，避免开发者工具“默认环境”选错导致 401/资源不可用
  try {
    // 多次调用 init 没关系（只有第一次生效）
    Taro.cloud?.init?.({ env: 'cloud1-d5g1waohpc2fbf6bf', traceUser: true })
    // 同步初始化 wx.cloud，确保 wx.cloud.extend.AI 绑定到同一环境
    wx?.cloud?.init?.({ env: 'cloud1-d5g1waohpc2fbf6bf', traceUser: true })
  } catch (e) {
    // 忽略：非 weapp 环境或未启用云开发时
  }
  // 默认 10 道菜：一致性审查与自动修复（一次性后台执行）
  try {
    void auditAndFixDefaultRecipesOnce()
  } catch {
    // ignore
  }
  return children
}
