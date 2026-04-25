import type { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import '@taroify/icons/index.css'
import './app.css'

export default function App({ children }: PropsWithChildren) {
  // 必须初始化云开发，否则 Taro.cloud.* 会报 Cloud API isn't enabled
  // 这里不传 env：使用微信开发者工具/小程序里配置的默认云环境
  try {
    // 多次调用 init 没关系（只有第一次生效）
    Taro.cloud?.init?.({ traceUser: true })
  } catch (e) {
    // 忽略：非 weapp 环境或未启用云开发时
  }
  return children
}
