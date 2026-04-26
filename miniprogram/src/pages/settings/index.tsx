import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { clearAllLocalData, loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import type { IconName } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

const APP_VERSION = '1.0.0'

function Row({
  label,
  sub,
  icon,
  color,
  bg,
  danger,
  onClick,
}: {
  label: string
  sub?: string
  icon: IconName
  color: string
  bg: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <View
      className={cn(
        'flex items-center justify-between p-5 rounded-3xl border press-scale',
        danger ? 'bg-white border border-red-200' : 'bg-white shadow-card border-orange-50-50'
      )}
      onClick={onClick}
    >
      <View className="flex items-center gap-4 flex-1 min-w-0">
        <View className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', bg)}>
          <Icon name={icon} size={20} color={color} strokeWidth={2.4} />
        </View>
        <View className="min-w-0">
          <Text className={cn('block font-black text-espresso tracking-tight', danger && 'text-red-700')}>{label}</Text>
          {sub ? <Text className="block text-10px font-bold text-espresso-40 tracking-wide mt-0.5">{sub}</Text> : null}
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={danger ? '#f87171' : '#e5e7eb'} strokeWidth={3} />
    </View>
  )
}

export default function SettingsPage() {
  const goProfileEdit = () => Taro.navigateTo({ url: '/pages/profile-edit/index' })
  const goUserAgreement = () => Taro.navigateTo({ url: '/pages/legal/user-agreement/index' })
  const goPrivacy = () => Taro.navigateTo({ url: '/pages/legal/privacy-policy/index' })

  const wechatLogin = async () => {
    try {
      Taro.showLoading({ title: '授权中…' })
      const loginRes = await Taro.login()
      const code = (loginRes as { code?: string })?.code
      if (!code) throw new Error('no code')

      // 尝试拉取微信头像昵称（需用户确认）；失败则不阻断登录
      let nickName: string | undefined
      let avatarUrl: string | undefined
      try {
        const r = await Taro.getUserProfile({ desc: '用于完善个人资料展示' })
        const userInfo = (r as any)?.userInfo
        nickName = userInfo?.nickName
        avatarUrl = userInfo?.avatarUrl
      } catch {
        // ignore
      }

      const db = loadDB()
      const prev = db.profile
      const nextProfile = prev
        ? {
            ...prev,
            displayName: nickName?.trim() ? nickName.trim() : prev.displayName,
            avatarUrl: avatarUrl || (prev as any).avatarUrl,
          }
        : {
            uid: 'user',
            displayName: nickName?.trim() ? nickName.trim() : '美食爱好者',
            email: 'user@example.com',
            preferences: { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] },
            tier: 'standard' as const,
            extraSlots: 0,
            createdAt: new Date().toISOString(),
            avatarUrl,
          }

      saveDB({
        ...db,
        profile: nextProfile as any,
        wxAuth: { code, nickName, avatarUrl, lastLoginAt: new Date().toISOString() } as any,
        recipes: db.recipes || [],
        logs: db.logs || [],
        shopping: db.shopping || [],
        favorites: db.favorites || [],
      })
      Taro.showToast({ title: '已授权', icon: 'success' })
    } catch (e) {
      console.warn('[wechatLogin] failed:', e)
      Taro.showToast({ title: '授权失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const authAndEditProfile = async () => {
    // 先尝试授权同步微信头像昵称（失败不阻断），再进入资料编辑页继续完善
    await wechatLogin()
    goProfileEdit()
  }

  const clearData = () => {
    Taro.showModal({
      title: '清除本地数据',
      content: '将删除本机全部菜谱、饮食记录、收藏、购物清单与个人资料等，且不可恢复。是否继续？',
      confirmColor: '#FF7E33',
      success: (res) => {
        if (!res.confirm) return
        clearAllLocalData()
        Taro.showToast({ title: '已清除', icon: 'success' })
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/home/index' })
        }, 500)
      },
    })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <View className="mb-8 text-center">
          <View className="w-20 h-20 bg-orange-100 rounded-healing mx-auto mb-3 flex items-center justify-center border-4 border-white shadow-card">
            <Icon name="sun" size={36} color="#FF7E33" strokeWidth={2.4} />
          </View>
          <Text className="block text-xl font-black italic text-espresso">三餐有意思</Text>
          <Text className="block text-10px font-bold text-espresso-40 tracking-widest mt-1">版本 {APP_VERSION}</Text>
        </View>

        <View className="mb-2 px-1">
          <Text className="text-10px font-black text-primary tracking-widest uppercase">功能</Text>
        </View>
        <View className="space-y-3 mb-8">
          <Row
            label="微信授权与资料同步"
            sub="同步头像昵称 · 完善个人资料"
            icon="user"
            color="#22c55e"
            bg="bg-green-50"
            onClick={() => void authAndEditProfile()}
          />
        </View>

        <View className="mb-2 px-1">
          <Text className="text-10px font-black text-primary tracking-widest uppercase">协议</Text>
        </View>
        <View className="space-y-3 mb-8">
          <Row
            label="用户协议"
            sub="使用条款与说明"
            icon="book"
            color="#4b5563"
            bg="bg-gray-100"
            onClick={goUserAgreement}
          />
          <Row
            label="隐私政策"
            sub="数据与权限说明"
            icon="filter"
            color="#4b5563"
            bg="bg-gray-100"
            onClick={goPrivacy}
          />
        </View>

        <View className="mb-2 px-1">
          <Text className="text-10px font-black text-primary tracking-widest uppercase">数据</Text>
        </View>
        <View className="space-y-3 mb-8">
          <Row
            label="清除本机数据"
            sub="恢复为初次打开状态"
            icon="x"
            color="#ef4444"
            bg="bg-red-50"
            danger
            onClick={clearData}
          />
        </View>

        <View className="mb-2 px-1">
          <Text className="text-10px font-black text-primary tracking-widest uppercase">关于我们</Text>
        </View>
        <View className="space-y-3 mb-8">
          <View className="bg-white rounded-3xl p-5 border border-orange-50-50 shadow-card">
            <Text className="block text-lg font-black text-espresso mb-3">软件名称：三餐有意思</Text>
            <Text className="block text-sm font-bold text-espresso-40 mb-3">软件介绍：一款轻松有趣的记录菜谱的软件</Text>
            <Text className="block text-sm font-bold text-espresso-40 mb-2">开发者：白日梦想家</Text>
            <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
              邮箱：3310103904@qq.com
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-orange-50-50">
          <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
            本小程序为本地体验版：数据保存在你的设备中。若需云端同步、多人协作或正式环境调用 AI，请使用服务端托管配置与账号体系。
          </Text>
        </View>
      </View>
    </View>
  )
}
