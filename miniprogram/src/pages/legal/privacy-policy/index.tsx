import React from 'react'
import { View, Text } from '@tarojs/components'
import './index.css'

export default function PrivacyPolicyPage() {
  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">隐私</Text>
        <Text className="block text-2xl font-black italic text-espresso mb-6">隐私政策</Text>

        <View className="bg-white rounded-3xl p-5 border border-orange-50-50 shadow-card">
          <Text className="block text-xs font-bold text-espresso leading-relaxed whitespace-pre-line">
            {`更新日期：2026-04-25

我们重视你的个人信息与隐私保护。本小程序采取多重安全措施确保你的数据安全。

1. 我们会处理哪些信息
- 你在小程序内主动创建/编辑的数据：菜谱、收藏、饮食记录、购物清单、个人资料等（默认仅存本地）。
- 当你点击「微信登录授权」并同意授权时：
  - 我们会调用微信提供的登录能力获取一次性 code；
  - 若你同意获取头像昵称，我们会读取你的微信昵称与头像用于展示；
  - 上述信息会记录在本地存储中，便于你后续查看与体验。

2. 数据安全措施
- 本地存储加密：所有本地存储的数据均经过加密处理，确保数据安全。
- API 密钥保护：AI 服务的 API 密钥存储在云函数环境变量中，客户端不会直接存储敏感信息。
- 网络请求安全：所有网络请求均通过云函数处理，避免在客户端直接暴露 API 调用。

3. 权限与调用说明
我们仅在你触发对应功能时请求授权，不会在后台静默获取。

4. 信息存储与删除
- 所有数据默认保存在你的设备本地，经过加密处理。
- 你可以在「关于设置」中通过「清除本机数据」一键删除所有本地数据。

5. 第三方服务
- 若你在使用过程中触发 AI 服务能力，相关调用会通过云函数处理，并遵循对应服务的隐私条款与平台规则。
- 万相生成的图片托管在临时 OSS 上（24h 左右过期），我们不会永久存储这些图片。

6. 联系方式
如需反馈隐私问题，可通过产品内反馈渠道联系（若已接入）。`}
          </Text>
        </View>
      </View>
    </View>
  )
}

