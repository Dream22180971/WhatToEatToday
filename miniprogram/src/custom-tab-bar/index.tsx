import React, { useCallback, useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

declare const wx: any

interface TabItem {
  label: string
  path: string
  glyph: string
}

const TABS: TabItem[] = [
  { label: '首页', path: '/pages/home/index', glyph: '🏠' },
  { label: '发现', path: '/pages/discovery/index', glyph: '🔍' },
  { label: '清单', path: '/pages/shopping/index', glyph: '📋' },
  { label: '我的', path: '/pages/profile/index', glyph: '👤' },
]

export default function CustomTabBar() {
  const [selected, setSelected] = useState(0)
  const [switching, setSwitching] = useState(false)

  const syncFromRoute = useCallback(() => {
    try {
      const pages = Taro.getCurrentPages()
      const current = pages[pages.length - 1]
      const route = '/' + (current?.route || '')
      const idx = TABS.findIndex((t) => route.startsWith(t.path))
      if (idx >= 0) setSelected(idx)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    syncFromRoute()
    const handler = (path: string) => {
      const idx = TABS.findIndex((t) => path === t.path || path === t.path.replace(/^\//, ''))
      if (idx >= 0) setSelected(idx)
    }
    Taro.eventCenter.on('tabbar-sync', handler)
    return () => {
      Taro.eventCenter.off('tabbar-sync', handler)
    }
  }, [syncFromRoute])

  useEffect(() => {
    const timer = setInterval(syncFromRoute, 260)
    return () => clearInterval(timer)
  }, [syncFromRoute])

  const switchTab = (idx: number) => {
    if (switching) return
    setSwitching(true)
    setSelected(idx)
    const switcher = (Taro as any).switchTab || (typeof wx !== 'undefined' ? wx.switchTab : undefined)
    Promise.resolve(
      switcher
        ? switcher({ url: TABS[idx].path })
        : Taro.switchTab({ url: TABS[idx].path })
    )
      .catch(() => {
        syncFromRoute()
      })
      .finally(() => {
        setTimeout(() => setSwitching(false), 160)
      })
  }

  return (
    <View className="tab-bar-wrapper">
      <View className="tab-bar-inner">
        {TABS.map((t, i) => {
          const active = i === selected
          const isProfile = i === 3
          return (
            <View key={t.path} className="tab-item" hoverClass="tab-item-hover" onClick={() => switchTab(i)}>
              <View className={active ? 'tab-icon-wrap tab-icon-wrap-active' : 'tab-icon-wrap'}>
                <View className="tab-icon-inner" style={{ lineHeight: 0 }}>
                  <Text className={`${active ? 'tab-glyph tab-glyph-active' : 'tab-glyph'} ${isProfile ? 'tab-avatar' : ''}`}>{t.glyph}</Text>
                </View>
              </View>
              <Text className={active ? 'tab-label tab-label-active' : 'tab-label'}>{t.label}</Text>
              {active && <View className="tab-active-line" />}
            </View>
          )
        })}
      </View>
    </View>
  )
}