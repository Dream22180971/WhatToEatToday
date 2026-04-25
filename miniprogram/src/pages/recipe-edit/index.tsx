import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { Ingredient, Recipe } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import './index.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_LABEL: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '零食',
}

export default function RecipeEditPage() {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [seasonings, setSeasonings] = useState<Ingredient[]>([])
  const [instructions, setInstructions] = useState<string[]>([])
  const [mealTypes, setMealTypes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const recipeId = (router.params?.id as string | undefined) || ''

  const loadRecipe = useCallback(() => {
    if (!recipeId) return
    const db = loadDB()
    const r = db.recipes?.find((x) => x.id === recipeId) || null
    if (r) {
      setRecipe(r)
      setTitle(r.title || '')
      setDescription(r.description || '')
      setIngredients(r.ingredients || [])
      setSeasonings(r.seasonings || [])
      setInstructions(r.instructions || [])
      setMealTypes(r.mealTypes || [])
    }
  }, [recipeId])

  useEffect(() => {
    loadRecipe()
  }, [loadRecipe])

  const handleAddIngredient = (type: 'ingredient' | 'seasoning') => {
    if (type === 'ingredient') {
      setIngredients([...ingredients, { name: '', amount: '', unit: '' }])
    } else {
      setSeasonings([...seasonings, { name: '', amount: '', unit: '' }])
    }
  }

  const handleRemoveIngredient = (type: 'ingredient' | 'seasoning', index: number) => {
    if (type === 'ingredient') {
      const newIngredients = [...ingredients]
      newIngredients.splice(index, 1)
      setIngredients(newIngredients)
    } else {
      const newSeasonings = [...seasonings]
      newSeasonings.splice(index, 1)
      setSeasonings(newSeasonings)
    }
  }

  const handleUpdateIngredient = (type: 'ingredient' | 'seasoning', index: number, field: keyof Ingredient, value: string) => {
    if (type === 'ingredient') {
      const newIngredients = [...ingredients]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      setIngredients(newIngredients)
    } else {
      const newSeasonings = [...seasonings]
      newSeasonings[index] = { ...newSeasonings[index], [field]: value }
      setSeasonings(newSeasonings)
    }
  }

  const handleAddInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const handleUpdateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions]
    newInstructions[index] = value
    setInstructions(newInstructions)
  }

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = [...instructions]
    newInstructions.splice(index, 1)
    setInstructions(newInstructions)
  }

  const toggleMealType = (type: string) => {
    setMealTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  const handleSave = async () => {
    if (!title.trim() || !ingredients.length || !instructions.length) {
      Taro.showToast({ title: '请填写必要信息', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const db = loadDB()
      const updatedRecipe: Recipe = {
        ...recipe!,
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.filter(i => i.name.trim()),
        seasonings: seasonings.filter(s => s.name.trim()),
        instructions: instructions.filter(i => i.trim()),
        mealTypes,
        updatedAt: new Date().toISOString(),
      }

      const nextRecipes = (db.recipes || []).map(r =>
        r.id === recipeId ? updatedRecipe : r
      )

      saveDB({
        ...db,
        recipes: nextRecipes,
      })

      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    Taro.navigateBack()
  }

  if (!recipe) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-warm-bg">
        <Text className="text-espresso-40 font-bold">加载中…</Text>
      </View>
    )
  }

  return (
    <View className="recipe-edit-container animate-page-in">
      {/* 标题 */}
      <View className="form-group">
        <Text className="form-label">菜谱名称</Text>
        <Input
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.detail.value)}
          placeholder="给你的菜谱起个名字"
          placeholderStyle="color: rgba(77,62,62,0.38)"
        />
      </View>

      {/* 描述 */}
      <View className="form-group">
        <Text className="form-label">菜谱描述</Text>
        <Textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.detail.value)}
          placeholder="简单描述一下这道菜的特色"
          placeholderStyle="color: rgba(77,62,62,0.38)"
        />
      </View>

      {/* 用餐时间 */}
      <View className="form-group">
        <Text className="form-label">用餐时间</Text>
        <View className="meal-type-tags">
          {MEAL_TYPES.map((type) => (
            <View
              key={type}
              className={cn('meal-type-tag', mealTypes.includes(type) ? 'active' : 'inactive')}
              onClick={() => toggleMealType(type)}
            >
              <Text>{MEAL_LABEL[type]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 食材 */}
      <View className="form-group">
        <Text className="form-label">食材清单</Text>
        {ingredients.map((ing, index) => (
          <View key={`ing-${index}`} className="ingredient-item">
            <Input
              className="ingredient-input"
              value={ing.name}
              onChange={(e) => handleUpdateIngredient('ingredient', index, 'name', e.detail.value)}
              placeholder="食材名称"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <Input
              className="ingredient-input"
              value={ing.amount}
              onChange={(e) => handleUpdateIngredient('ingredient', index, 'amount', e.detail.value)}
              placeholder="数量"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <Input
              className="ingredient-input"
              value={ing.unit}
              onChange={(e) => handleUpdateIngredient('ingredient', index, 'unit', e.detail.value)}
              placeholder="单位"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <View
              className="remove-btn"
              onClick={() => handleRemoveIngredient('ingredient', index)}
            >
              <Icon name="x" size={16} color="#ef4444" strokeWidth={2.4} />
            </View>
          </View>
        ))}
        <View className="add-btn" onClick={() => handleAddIngredient('ingredient')}>
          <Icon name="plus" size={16} color="#FF7E33" strokeWidth={2.4} />
          <Text>添加食材</Text>
        </View>
      </View>

      {/* 调料 */}
      <View className="form-group">
        <Text className="form-label">烹饪调料</Text>
        {seasonings.map((seasoning, index) => (
          <View key={`seasoning-${index}`} className="ingredient-item">
            <Input
              className="ingredient-input"
              value={seasoning.name}
              onChange={(e) => handleUpdateIngredient('seasoning', index, 'name', e.detail.value)}
              placeholder="调料名称"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <Input
              className="ingredient-input"
              value={seasoning.amount}
              onChange={(e) => handleUpdateIngredient('seasoning', index, 'amount', e.detail.value)}
              placeholder="数量"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <Input
              className="ingredient-input"
              value={seasoning.unit}
              onChange={(e) => handleUpdateIngredient('seasoning', index, 'unit', e.detail.value)}
              placeholder="单位"
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <View
              className="remove-btn"
              onClick={() => handleRemoveIngredient('seasoning', index)}
            >
              <Icon name="x" size={16} color="#ef4444" strokeWidth={2.4} />
            </View>
          </View>
        ))}
        <View className="add-btn" onClick={() => handleAddIngredient('seasoning')}>
          <Icon name="plus" size={16} color="#FF7E33" strokeWidth={2.4} />
          <Text>添加调料</Text>
        </View>
      </View>

      {/* 步骤 */}
      <View className="form-group">
        <Text className="form-label">烹饪步骤</Text>
        {instructions.map((step, index) => (
          <View key={`step-${index}`} className="ingredient-item">
            <Text className="text-24rpx font-black text-espresso-40 w-16">{index + 1}.</Text>
            <Textarea
              className="form-textarea flex-1"
              value={step}
              onChange={(e) => handleUpdateInstruction(index, e.detail.value)}
              placeholder={`步骤 ${index + 1}`}
              placeholderStyle="color: rgba(77,62,62,0.38)"
            />
            <View
              className="remove-btn"
              onClick={() => handleRemoveInstruction(index)}
            >
              <Icon name="x" size={16} color="#ef4444" strokeWidth={2.4} />
            </View>
          </View>
        ))}
        <View className="add-btn" onClick={handleAddInstruction}>
          <Icon name="plus" size={16} color="#FF7E33" strokeWidth={2.4} />
          <Text>添加步骤</Text>
        </View>
      </View>

      {/* 保存按钮 */}
      <View className="flex gap-4 mt-8">
        <View
          className="flex-1 py-24rpx rounded-24rpx bg-white border border-orange-50-50 text-center"
          onClick={handleCancel}
        >
          <Text className="text-28rpx font-black text-espresso">取消</Text>
        </View>
        <View
          className={cn('submit-btn flex-1', saving ? 'opacity-70' : '')}
          onClick={handleSave}
          disabled={saving}
        >
          <Text>{saving ? '保存中...' : '保存'}</Text>
        </View>
      </View>
    </View>
  )
}
