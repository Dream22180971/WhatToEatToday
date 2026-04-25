import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Icon } from '../../components/Icon'
import './index.css'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export default function WeeklyMenuPage() {
  const goDiscovery = () => {
    Taro.switchTab({ url: '/pages/discovery/index' })
  }

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">规划感</Text>
        <Text className="block text-2xl font-black italic text-espresso mb-2">一周菜单</Text>
        <Text className="block text-xs font-bold text-espresso-40 leading-relaxed mb-8">
          用发现页搭配灵感、用首页 AI 推荐，慢慢形成自己的「一周不重样」。这里先为你留好七天位置，后续可扩展为真正周计划。
        </Text>

        <View className="space-y-2 mb-8">
          {DAYS.map((d) => (
            <View
              key={d}
              className="flex items-center justify-between p-4 bg-white rounded-3xl border border-orange-50-50 shadow-card"
            >
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Icon name="calendar" size={18} color="#FF7E33" strokeWidth={2.2} />
                </View>
                <View>
                  <Text className="block text-sm font-black text-espresso">{d}</Text>
                  <Text className="block text-9px font-bold text-espresso-40">自由发挥，从收藏与推荐里挑一道</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Button
          className="w-full bg-primary text-white py-3 rounded-healing text-sm font-black shadow-orange mb-3"
          onClick={goDiscovery}
        >
          去发现页寻味
        </Button>
        <Button className="w-full bg-warm-bg text-espresso py-3 rounded-healing text-sm font-black border border-orange-100" onClick={goHome}>
          去首页看今日推荐
        </Button>
      </View>
    </View>
  )
}
