import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Recipe, UserProfile } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import type { IconName } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

const MENU_ITEMS: { label: string; sub: string; icon: IconName; color: string; bg: string }[] = [
  { label: '口味日记', sub: '记录每一次的味蕾偏好', icon: 'heart-pulse', color: '#ef4444', bg: 'bg-orange-50' },
  { label: '我的收藏', sub: '那些舍不得忘的滋味', icon: 'bookmark', color: '#FF7E33', bg: 'bg-orange-50' },
  { label: '饮食历程', sub: '一年三百六十五次对话', icon: 'history', color: '#8b5cf6', bg: 'bg-purple-50' },
  { label: '关于设置', sub: '提醒 · 主题 · 其他', icon: 'settings', color: '#4b5563', bg: 'bg-gray-100' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    setProfile(
      db.profile || {
        uid: 'user',
        displayName: '美食爱好者',
        email: 'user@example.com',
        preferences: { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] },
        tier: 'standard',
        extraSlots: 0,
        createdAt: new Date().toISOString(),
      }
    )
    setRecipes(db.recipes || [])
  }, [])

  useDidShow(() => {
    hydrate()
  })

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!profile) return
    const db = loadDB()
    saveDB({
      ...db,
      profile,
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
  }, [profile])

  const myRecipeCount = useMemo(() => recipes.filter((r) => r.creatorId === 'user').length, [recipes])
  const moments = useMemo(() => {
    const db = loadDB()
    return (db.logs || []).length + myRecipeCount
  }, [recipes, myRecipeCount])

  const notYet = () => Taro.showToast({ title: '功能即将上线', icon: 'none' })
  const showMembership = false

  const goSettings = () => Taro.navigateTo({ url: '/pages/settings/index' })

  const handleMenuClick = (label: string) => {
    if (label === '我的收藏') {
      Taro.navigateTo({ url: '/pages/my-favorites/index' })
      return
    }
    if (label === '口味日记') {
      Taro.navigateTo({ url: '/pages/taste-diary/index' })
      return
    }
    if (label === '饮食历程') {
      Taro.navigateTo({ url: '/pages/meal-history/index' })
      return
    }
    if (label === '关于设置') {
      goSettings()
      return
    }
    notYet()
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso relative overflow-hidden animate-page-in">
      <View className="absolute bg-glow-peach rounded-full" style={{ top: '-120rpx', left: '-120rpx', width: '480rpx', height: '480rpx' }} />
      <View className="absolute bg-glow-orange rounded-full" style={{ top: '800rpx', right: '-160rpx', width: '400rpx', height: '400rpx' }} />

      <View className="px-6 pt-6 pb-32 relative">
        {/* 个人概览：压缩标题、头像和 AI 快捷入口，避免顶部区域过高 */}
        {!!profile && (
          <View className="p-5 bg-white-60 rounded-healing border border-white shadow-card mb-8 relative overflow-hidden">
            <View className="absolute bg-glow-orange rounded-full opacity-60" style={{ top: '-96rpx', right: '-96rpx', width: '240rpx', height: '240rpx' }} />
            <View className="relative">
              <View className="flex items-center justify-between mb-5">
                <View className="flex items-center gap-2">
                  <View className="w-8 h-8 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Icon name="sun" size={16} color="#FF7E33" strokeWidth={2.4} />
                  </View>
                  <Text className="text-lg font-black italic tracking-tight">个人时光</Text>
                </View>
                <View
                  className="flex items-center gap-1 px-3 py-1-5 bg-white-90 rounded-full border border-orange-100 shadow-sm press-scale"
                  onClick={goSettings}
                >
                  <Icon name="settings" size={13} color="#FF7E33" strokeWidth={2.4} />
                  <Text className="text-10px font-black text-primary">设置</Text>
                </View>
              </View>

              <View className="flex items-center gap-4 mb-5">
                <View className="relative w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center shadow-sm border-4 border-white flex-shrink-0">
                  <Icon name="user" size={30} color="#FF7E33" strokeWidth={2.4} />
                  {profile.tier === 'vip' && (
                    <View
                      className="absolute bg-yellow-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{ top: '-6rpx', right: '-6rpx', width: '36rpx', height: '36rpx' }}
                    >
                      <Icon name="sparkles" size={11} color="#ffffff" fill="#ffffff" />
                    </View>
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="block text-xl font-black italic text-espresso tracking-tight mb-1">
                    {profile.displayName}
                  </Text>
                  <Text className="block text-10px text-espresso-30 font-bold tracking-widest uppercase">
                    已记录 {moments} 次生活 · {myRecipeCount} 道菜谱
                  </Text>
                </View>
              </View>

              <View className="pt-4 mt-1 border-t border-orange-50-50">
                <Text className="block text-9px font-bold text-espresso-40 leading-relaxed text-center">
                  智能推荐与灵感入口在首页；这里专注你的口味、收藏与记录
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* VIP 横幅 */}
        {showMembership && (
        <View
          className="rounded-healing p-8 mb-12 relative overflow-hidden shadow-card flex items-center justify-between animate-slide-up border border-orange-100-50"
          style={{ background: 'linear-gradient(135deg, #4D3E3E 0%, #6A5757 48%, #8A6A5A 100%)' }}
        >
          <View className="absolute bg-glow-orange rounded-full" style={{ top: '-30rpx', right: '-30rpx', width: '220rpx', height: '220rpx' }} />
          <View className="absolute opacity-20" style={{ top: '12rpx', right: '24rpx' }}>
            <Icon name="crown" size={86} color="#facc15" fill="#facc15" strokeWidth={1.2} />
          </View>
          <View className="relative">
            <View className="flex items-center gap-2 mb-3">
              <Icon name="crown" size={20} color="#facc15" fill="#facc15" />
              <Text className="text-xl font-black italic text-white">开启味蕾旅程</Text>
            </View>
            <Text className="block text-xs text-white-50 font-bold leading-relaxed">
              解锁智能推荐 · 万相生图 · 一周菜单
            </Text>
          </View>
          <View
            className="bg-white px-5 py-3 rounded-full shadow-lg press-scale flex items-center gap-1 relative border border-orange-100"
            onClick={notYet}
          >
            <Icon name="sparkles" size={14} color="#FF7E33" />
            <Text className="text-espresso font-black text-xs">去看看</Text>
            <Icon name="chevron-right" size={14} color="#4D3E3E" strokeWidth={3} />
          </View>
        </View>
        )}

        {/* 会员权益对比 */}
        {showMembership && (
        <>
        <View className="mb-12">
          <Text className="block text-2xl font-black italic text-espresso mb-6">会员权益对比</Text>
          <View className="bg-white rounded-32px overflow-hidden shadow-card border border-gray-50">
            <View className="grid grid-cols-3 bg-gray-50-50 border-b border-gray-50">
              <Text className="p-4 text-9px font-black text-gray-400 uppercase tracking-widest">功能</Text>
              <Text className="p-4 text-9px font-black text-gray-400 uppercase tracking-widest text-center">免费版</Text>
              <View className="p-4 bg-primary flex items-center justify-center">
                <Text className="text-9px font-black text-white uppercase tracking-widest">VIP 会员</Text>
              </View>
            </View>
            {(
              [
                { name: '基础推荐', free: true, vip: true },
                { name: '智能推荐 (高阶)', free: false, vip: true },
                { name: '一周不重样菜单', free: false, vip: true },
                { name: '拍照解析录入', free: false, vip: true },
                { name: '菜谱上限', free: '30道', vip: '200道+' },
              ] as const
            ).map((row, idx, arr) => (
              <View
                key={row.name}
                className={cn('grid grid-cols-3', idx < arr.length - 1 && 'border-b border-gray-50')}
              >
                <Text className="p-4 text-xs font-black text-gray-600">{row.name}</Text>
                <View className="p-4 flex justify-center items-center">
                  {typeof row.free === 'boolean' ? (
                    row.free ? (
                      <Icon name="check" size={16} color="#22c55e" strokeWidth={3} />
                    ) : (
                      <Icon name="x" size={16} color="#e5e7eb" strokeWidth={3} />
                    )
                  ) : (
                    <Text className="text-10px font-black text-gray-300">{row.free}</Text>
                  )}
                </View>
                <View className="p-4 flex justify-center items-center bg-orange-50-30">
                  {typeof row.vip === 'boolean' ? (
                    row.vip ? (
                      <Icon name="check" size={16} color="#FF7E33" strokeWidth={3} />
                    ) : (
                      <Icon name="x" size={16} color="#e5e7eb" strokeWidth={3} />
                    )
                  ) : (
                    <Text className="text-10px font-black text-primary">{row.vip}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 购买卡片 */}
        <View className="grid grid-cols-2 gap-4 mb-6">
          <View className="border-2 border-orange-500 bg-orange-50-30 rounded-3xl p-6 relative overflow-hidden press-scale" onClick={notYet}>
            <View className="absolute bg-primary px-3 py-1" style={{ top: 0, left: 0, borderBottomRightRadius: '32rpx' }}>
              <Text className="text-9px font-black text-white uppercase">超值推荐</Text>
            </View>
            <View className="flex justify-end mb-4">
              <Icon name="check" size={24} color="#FF7E33" strokeWidth={3} />
            </View>
            <Text className="block text-xs font-black text-gray-600 mb-1 mt-4">年卡会员</Text>
            <View className="flex items-baseline gap-1 mb-2">
              <Text className="text-sm font-black text-primary">¥</Text>
              <Text className="text-3xl font-black text-primary">29</Text>
              <Text className="text-10px font-bold text-gray-400">/年</Text>
            </View>
            <Text className="block text-10px text-gray-400 font-bold mb-4">每天不到1毛钱</Text>
            <View className="bg-orange-100-50 py-1 rounded-full flex items-center justify-center">
              <Text className="text-9px font-black text-primary">相当于每月 ¥2.4</Text>
            </View>
          </View>
          <View className="border-2 border-gray-100 bg-white rounded-3xl p-6 press-scale" onClick={notYet}>
            <View className="flex justify-end mb-4">
              <View className="w-6 h-6 rounded-full border-2 border-gray-100" />
            </View>
            <Text className="block text-xs font-black text-gray-600 mb-1">月卡会员</Text>
            <View className="flex items-baseline gap-1 mb-2">
              <Text className="text-sm font-black text-gray-800">¥</Text>
              <Text className="text-3xl font-black text-gray-800">9.9</Text>
              <Text className="text-10px font-bold text-gray-400">/月</Text>
            </View>
            <Text className="block text-10px text-gray-400 font-bold mb-4">灵活开通 随时取消</Text>
          </View>
        </View>

        <View
          className="bg-primary py-5 rounded-3xl shadow-orange press-scale flex items-center justify-center mb-8"
          onClick={notYet}
        >
          <Text className="text-white font-black text-lg">立即开通 VIP</Text>
        </View>

        <View className="flex justify-center gap-6 mb-12">
          {['安全支付', '随时可取消', '专属客服'].map((t) => (
            <View key={t} className="flex items-center gap-1">
              <Icon name="check" size={12} color="#9ca3af" strokeWidth={3} />
              <Text className="text-10px text-gray-400 font-bold">{t}</Text>
            </View>
          ))}
        </View>
        </>
        )}

        {/* 我的菜谱入口 + 菜单 */}
        <View className="mb-4 flex items-center gap-2 px-1">
          <Icon name="leaf" size={14} color="#FF7E33" strokeWidth={2.4} />
          <Text className="text-10px font-black text-primary tracking-widest uppercase">专属收藏</Text>
        </View>
        <View className="space-y-3">
          <View
            className="flex justify-between items-center p-5 bg-white rounded-3xl shadow-card border border-orange-50-50 press-scale"
            onClick={() => Taro.navigateTo({ url: '/pages/my-recipes/index' })}
          >
            <View className="flex items-center gap-4">
              <View className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center">
                <Icon name="book" size={20} color="#FF7E33" strokeWidth={2.4} />
              </View>
              <View>
                <Text className="block font-black text-espresso tracking-tight">我的菜谱</Text>
                <Text className="block text-10px font-bold text-espresso-40 tracking-wide">收录过的美味一键直达</Text>
              </View>
            </View>
            <View className="flex items-center gap-2">
              <View className="px-2 py-1 bg-orange-100-50 rounded-full">
                <Text className="text-10px font-black text-primary">{myRecipeCount} 道</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#fdba74" strokeWidth={3} />
            </View>
          </View>
          {MENU_ITEMS.map((item) => (
            <View
              key={item.label}
              className="flex justify-between items-center p-5 bg-white rounded-3xl shadow-card border border-orange-50-50 press-scale"
              onClick={() => handleMenuClick(item.label)}
            >
              <View className="flex items-center gap-4">
                <View className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', item.bg)}>
                  <Icon name={item.icon} size={20} color={item.color} strokeWidth={2.4} />
                </View>
                <View>
                  <Text className="block font-black text-espresso tracking-tight">{item.label}</Text>
                  <Text className="block text-10px font-bold text-espresso-40 tracking-wide">{item.sub}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#e5e7eb" strokeWidth={3} />
            </View>
          ))}
        </View>

        {/* 底部温馨话 */}
        <View className="mt-12 flex flex-col items-center gap-2 opacity-50">
          <Icon name="heart" size={18} color="#FF7E33" fill="#FFE4CC" strokeWidth={2} />
          <Text className="text-10px font-black text-espresso-40 tracking-widest">用心做饭 · 用心生活</Text>
        </View>
      </View>
    </View>
  )
}
