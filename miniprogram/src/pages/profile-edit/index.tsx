import React, { useCallback, useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { UserProfile } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

function defaultProfile(): UserProfile {
  return {
    uid: 'user',
    displayName: '美食爱好者',
    email: 'user@example.com',
    preferences: { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] },
    tier: 'standard',
    extraSlots: 0,
    createdAt: new Date().toISOString(),
  }
}

export default function ProfileEditPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  const hydrate = useCallback(() => {
    const db = loadDB()
    const p = db.profile || defaultProfile()
    setDisplayName(p.displayName || '')
    setEmail(p.email || '')
    setAvatarUrl(p.avatarUrl)
  }, [])

  useDidShow(hydrate)

  const save = () => {
    const db = loadDB()
    const prev = db.profile || defaultProfile()
    const next: UserProfile = {
      ...prev,
      displayName: displayName.trim() || prev.displayName || '美食爱好者',
      email: email.trim() || prev.email || 'user@example.com',
      avatarUrl: avatarUrl || prev.avatarUrl,
    }
    saveDB({
      ...db,
      profile: next,
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
    Taro.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      Taro.navigateBack().catch(() => {})
    }, 350)
  }

  const syncFromWechat = async () => {
    try {
      Taro.showLoading({ title: '获取中…' })
      const r = await Taro.getUserProfile({ desc: '用于完善个人资料展示' })
      const userInfo = (r as any)?.userInfo
      const nickName = userInfo?.nickName
      const a = userInfo?.avatarUrl
      if (typeof nickName === 'string' && nickName.trim()) setDisplayName(nickName.trim())
      if (typeof a === 'string' && a) setAvatarUrl(a)
      Taro.showToast({ title: '已更新', icon: 'success' })
    } catch (e) {
      console.warn('[profile-edit] getUserProfile failed:', e)
      Taro.showToast({ title: '未获取到', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <View className="mb-6">
          <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">资料</Text>
          <Text className="block text-2xl font-black italic text-espresso">个人资料编辑</Text>
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-4">
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-3">
              <View className="w-12 h-12 bg-orange-100 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {avatarUrl ? (
                  <View
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <Icon name="user" size={22} color="#FF7E33" strokeWidth={2.4} />
                )}
              </View>
              <View>
                <Text className="block text-xs font-black text-espresso tracking-tight">头像与昵称</Text>
                <Text className="block text-10px font-bold text-espresso-40 tracking-wide mt-1">可从微信资料一键同步</Text>
              </View>
            </View>
            <View className="px-3 py-2 bg-orange-50 rounded-full border border-orange-100 press-scale" onClick={syncFromWechat}>
              <Text className="text-10px font-black text-primary">从微信同步</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-4">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">昵称</Text>
          <Input
            className="text-sm font-bold text-espresso"
            value={displayName}
            placeholder="想怎么被称呼"
            onInput={(e) => setDisplayName(e.detail.value)}
          />
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-8">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">邮箱</Text>
          <Input
            className="text-sm font-bold text-espresso"
            value={email}
            placeholder="用于找回/联系（可留空）"
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

        <Button className={cn('w-full bg-primary text-white py-3 rounded-healing text-sm font-black shadow-orange')} onClick={save}>
          保存
        </Button>
      </View>
    </View>
  )
}

