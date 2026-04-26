import React from 'react'
import type { CSSProperties } from 'react'
import { View, Text } from '@tarojs/components'
import {
  AddOutlined,
  AppsOutlined,
  ArrowDown,
  ArrowRight,
  BookmarkOutlined,
  BrowsingHistoryOutlined,
  BulbOutlined,
  CalendarOutlined,
  ClockOutlined,
  Cross,
  DescriptionOutlined,
  FireOutlined,
  FilterOutlined,
  FlowerOutlined,
  GiftOutlined,
  HomeOutlined,
  HotOutlined,
  LikeOutlined,
  LocationOutlined,
  NotesOutlined,
  PhotoOutlined,
  Plus,
  Search,
  SettingOutlined,
  ShareOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  Success,
  TodoListOutlined,
  UnderwayOutlined,
  Upgrade,
  UserOutlined,
  VipCardOutlined,
} from '@taroify/icons'

export type IconName =
  | 'sparkles'
  | 'grid'
  | 'camera'
  | 'book'
  | 'utensils'
  | 'yummy'
  | 'plus-circle'
  | 'plus'
  | 'chef-hat'
  | 'search'
  | 'x'
  | 'chevron-right'
  | 'chevron-down'
  | 'heart'
  | 'share'
  | 'check'
  | 'home'
  | 'bag'
  | 'user'
  | 'filter'
  | 'upload'
  | 'leaf'
  | 'flame'
  | 'clock'
  | 'calendar'
  | 'settings'
  | 'crown'
  | 'gift'
  | 'list'
  | 'history'
  | 'heart-pulse'
  | 'compass'
  | 'bookmark'
  | 'coffee'
  | 'sun'
  | 'moon'

type IconComponent = React.ComponentType<{
  size?: number | string
  color?: string
  className?: string
  style?: CSSProperties
}>

const YummyEmojiIcon: IconComponent = ({ size = 24, color = '#4D3E3E', className, style }) => {
  const finalSize = typeof size === 'number' ? size : parseFloat(String(size)) || 24
  return (
    <View
      className={className}
      style={{
        width: finalSize,
        height: finalSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(style || {}),
      }}
    >
      <Text
        style={{
          fontSize: finalSize,
          lineHeight: `${finalSize}px`,
          color,
        }}
      >
        😋
      </Text>
    </View>
  )
}

const ForkChopsticksIcon: IconComponent = ({ size = 24, color = '#4D3E3E', className, style }) => {
  const finalSize = typeof size === 'number' ? size : parseFloat(String(size)) || 24
  const w = finalSize
  const h = finalSize
  const line = Math.max(2, Math.round(finalSize / 12))
  const prongLen = Math.round(finalSize * 0.26)
  const prongTop = Math.round(finalSize * 0.12)
  const handleTop = Math.round(finalSize * 0.35)
  const stickTop = Math.round(finalSize * 0.14)

  return (
    <View className={className} style={{ width: w, height: h, position: 'relative', ...(style || {}) }}>
      {/* fork handle */}
      <View
        style={{
          position: 'absolute',
          left: Math.round(finalSize * 0.32),
          top: handleTop,
          width: line,
          height: Math.round(finalSize * 0.6),
          backgroundColor: color,
          borderRadius: line,
        }}
      />
      {/* fork prongs */}
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: Math.round(finalSize * (0.24 + i * 0.08)),
            top: prongTop,
            width: line,
            height: prongLen,
            backgroundColor: color,
            borderRadius: line,
          }}
        />
      ))}

      {/* chopsticks (no transform for compatibility) */}
      <View
        style={{
          position: 'absolute',
          left: Math.round(finalSize * 0.62),
          top: stickTop,
          width: line,
          height: Math.round(finalSize * 0.82),
          backgroundColor: color,
          borderRadius: line,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: Math.round(finalSize * 0.72),
          top: stickTop + Math.round(finalSize * 0.03),
          width: line,
          height: Math.round(finalSize * 0.78),
          backgroundColor: color,
          borderRadius: line,
          opacity: 0.92,
        }}
      />
    </View>
  )
}

const ICON_COMPONENTS: Record<IconName, IconComponent> = {
  sparkles: StarOutlined,
  grid: AppsOutlined,
  camera: PhotoOutlined,
  book: DescriptionOutlined,
  utensils: ForkChopsticksIcon,
  yummy: YummyEmojiIcon,
  'plus-circle': AddOutlined,
  plus: Plus,
  'chef-hat': PhotoOutlined,
  search: Search,
  x: Cross,
  'chevron-right': ArrowRight,
  'chevron-down': ArrowDown,
  heart: LikeOutlined,
  share: ShareOutlined,
  check: Success,
  home: HomeOutlined,
  bag: ShoppingCartOutlined,
  user: UserOutlined,
  filter: FilterOutlined,
  upload: Upgrade,
  leaf: FlowerOutlined,
  flame: FireOutlined,
  clock: ClockOutlined,
  calendar: CalendarOutlined,
  settings: SettingOutlined,
  crown: VipCardOutlined,
  gift: GiftOutlined,
  list: TodoListOutlined,
  history: BrowsingHistoryOutlined,
  'heart-pulse': LikeOutlined,
  compass: LocationOutlined,
  bookmark: BookmarkOutlined,
  coffee: HotOutlined,
  sun: BulbOutlined,
  moon: UnderwayOutlined,
}

export interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  fill?: string
  className?: string
  style?: CSSProperties
}

export function Icon({
  name,
  size = 24,
  color = '#4D3E3E',
  strokeWidth = 2,
  className,
  style,
}: IconProps) {
  const Component = ICON_COMPONENTS[name] || StarOutlined
  const finalSize = typeof size === 'number' ? size : parseFloat(String(size)) || 24

  return <Component size={finalSize + Math.max(0, strokeWidth - 2)} color={color} className={className} style={style} />
}

export default Icon
