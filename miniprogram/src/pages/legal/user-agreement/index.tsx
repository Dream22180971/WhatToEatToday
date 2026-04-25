import React from 'react'
import { View, Text } from '@tarojs/components'
import './index.css'

export default function UserAgreementPage() {
  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">协议</Text>
        <Text className="block text-2xl font-black italic text-espresso mb-6">用户协议</Text>

        <View className="bg-white rounded-3xl p-5 border border-orange-50-50 shadow-card">
          <Text className="block text-xs font-bold text-espresso leading-relaxed whitespace-pre-line">
            {`更新日期：2026-04-25

欢迎使用「三餐有意思」。

1. 产品定位
本小程序为本地体验版，默认将数据保存于你的设备本地（包括：菜谱、收藏、饮食记录、购物清单、个人资料等）。

2. 使用规范
你应遵守法律法规与平台规则，不得利用本小程序从事违法违规活动。

3. 内容与建议
本小程序提供的推荐/文案仅作生活灵感参考，不构成医疗或专业营养建议。若你有特殊健康状况，请以专业意见为准。

4. 账号与登录
当你选择进行「微信登录授权」时，我们会在本地记录授权信息用于展示与体验（详见《隐私政策》）。

5. 变更与生效
我们可能会更新本协议。更新后将以本页面展示为准。`}
          </Text>
        </View>
      </View>
    </View>
  )
}

