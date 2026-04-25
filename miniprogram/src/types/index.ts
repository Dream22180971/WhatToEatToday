export type DietType = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'

export interface UserPreferences {
  dietaryType: DietType
  dislikedIngredients: string[]
  favoriteCuisines: string[]
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  preferences: UserPreferences
  tier: 'standard' | 'vip'
  extraSlots: number
  createdAt: string
  avatarUrl?: string
}

export interface WxAuth {
  /** Taro.login 获取的 code（仅用于本地体验版记录） */
  code: string
  nickName?: string
  avatarUrl?: string
  lastLoginAt: string
}

export interface Ingredient {
  name: string
  amount: string
  unit: string
}

export interface Nutrition {
  calories: string
  protein: string
  carbs: string
  fat: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  seasonings: Ingredient[]
  instructions: string[]
  categories: string[]
  nutrition?: Nutrition
  image?: string
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[]
  creatorId: string
  isPublic: boolean
  createdAt: string
}

export interface MealLog {
  id: string
  userId: string
  recipeId?: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipeTitle?: string
}

export interface ShoppingItem {
  id: string
  userId: string
  name: string
  amount: string
  completed: boolean
  recipeId?: string
  type: 'ingredient' | 'seasoning'
}

export interface Favorite {
  id: string
  userId: string
  recipeId: string
  createdAt: string
}

