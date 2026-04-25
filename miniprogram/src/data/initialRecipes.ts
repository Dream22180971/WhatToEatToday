import type { Recipe } from '../types'

import cover01 from '../assets/covers/recipe-01.jpg'
import cover02 from '../assets/covers/recipe-02.jpg'
import cover03 from '../assets/covers/recipe-03.jpg'
import cover04 from '../assets/covers/recipe-04.jpg'
import cover05 from '../assets/covers/recipe-05.jpg'
import cover06 from '../assets/covers/recipe-06.jpg'
import cover07 from '../assets/covers/recipe-07.jpg'
import cover08 from '../assets/covers/recipe-08.jpg'
import cover09 from '../assets/covers/recipe-09.jpg'
import cover10 from '../assets/covers/recipe-10.jpg'

const now = new Date().toISOString()

export const initialRecipes: Recipe[] = [
  {
    id: '1',
    title: '西红柿炒鸡蛋',
    description: '经典家常菜，酸甜适口，营养丰富。',
    image: cover01,
    ingredients: [
      { name: '西红柿', amount: '2', unit: '个' },
      { name: '鸡蛋', amount: '3', unit: '个' },
    ],
    seasonings: [
      { name: '食用油', amount: '适量', unit: '' },
      { name: '食盐', amount: '1', unit: '小勺' },
      { name: '白糖', amount: '0.5', unit: '小勺' },
    ],
    nutrition: { calories: '245kcal', protein: '15g', carbs: '8g', fat: '18g' },
    instructions: [
      '鸡蛋打散，加少许盐拌匀',
      '西红柿洗净切块',
      '锅中倒油，烧热后放入蛋液炒熟盛出',
      '锅中留底油，下西红柿炒出汁',
      '放入鸡蛋块，加盐和少量白糖翻炒均匀即可',
    ],
    categories: ['家常菜', '快手菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '2',
    title: '全麦牛油果吐司',
    description: '活力早餐，开启美好一天。',
    image: cover02,
    ingredients: [
      { name: '全麦吐司', amount: '2', unit: '片' },
      { name: '牛油果', amount: '0.5', unit: '个' },
    ],
    seasonings: [
      { name: '黑胡椒', amount: '少许', unit: '' },
      { name: '海盐', amount: '少许', unit: '' },
    ],
    nutrition: { calories: '320kcal', protein: '9g', carbs: '28g', fat: '21g' },
    instructions: [
      '吐司放入面包机或平底锅烤至微焦',
      '牛油果去核切片或捣成泥',
      '将牛油果铺在吐司上',
      '撒上少许黑胡椒和海盐即可',
    ],
    categories: ['早餐', '减脂'],
    mealTypes: ['breakfast'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '3',
    title: '鱼香肉丝',
    description: '川菜经典，酸辣咸甜五味俱全。',
    image: cover03,
    ingredients: [
      { name: '猪里脊', amount: '200', unit: 'g' },
      { name: '木耳', amount: '50', unit: 'g' },
      { name: '胡萝卜', amount: '50', unit: 'g' },
    ],
    seasonings: [
      { name: '豆瓣酱', amount: '1', unit: '勺' },
      { name: '泡椒', amount: '适量', unit: '' },
    ],
    instructions: ['肉丝上浆', '配菜切丝', '调鱼香汁', '热油炒肉变色', '下配菜和汁翻炒'],
    categories: ['家常菜', '川菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '4',
    title: '麻婆豆腐',
    description: '麻、辣、烫、鲜、嫩、香、酥。',
    image: cover04,
    ingredients: [
      { name: '嫩豆腐', amount: '1', unit: '块' },
      { name: '牛肉末', amount: '50', unit: 'g' },
    ],
    seasonings: [
      { name: '郫县豆瓣', amount: '1', unit: '勺' },
      { name: '花椒粉', amount: '适量', unit: '' },
    ],
    instructions: ['豆腐切块焯水', '牛末炒酥', '下酱炒红油', '加水和豆腐烧制', '勾芡撒花椒粉'],
    categories: ['川菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '5',
    title: '宫保鸡丁',
    description: '红而不辣、辣而不猛、香辣味浓。',
    image: cover05,
    ingredients: [
      { name: '鸡胸肉', amount: '250', unit: 'g' },
      { name: '花生米', amount: '50', unit: 'g' },
    ],
    seasonings: [{ name: '干辣椒', amount: '适量', unit: '' }],
    instructions: ['鸡丁腌制', '油炸花生', '炒香料', '下鸡丁滑散', '入料汁和花生翻炒'],
    categories: ['家常菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '6',
    title: '地三鲜',
    description: '百吃不厌的素食经典。',
    image: cover06,
    ingredients: [
      { name: '土豆', amount: '1', unit: '个' },
      { name: '茄子', amount: '1', unit: '个' },
      { name: '青椒', amount: '1', unit: '个' },
    ],
    seasonings: [{ name: '生抽', amount: '适量', unit: '' }],
    instructions: ['土豆茄子切块油炸', '炒香蒜末', '下配菜并倒入勾好的欠汁'],
    categories: ['家常菜', '素食'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '7',
    title: '红烧肉',
    description: '肥而不腻，瘦而不柴。',
    image: cover07,
    ingredients: [{ name: '五花肉', amount: '500', unit: 'g' }],
    seasonings: [
      { name: '冰糖', amount: '适量', unit: '' },
      { name: '八角', amount: '2', unit: '个' },
    ],
    instructions: ['肉块焯水', '炒糖色', '下肉翻炒上色', '加水炖煮1小时'],
    categories: ['经典菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '8',
    title: '清蒸鱼',
    description: '保留鱼肉最鲜美的原味。',
    image: cover08,
    ingredients: [{ name: '鲈鱼', amount: '1', unit: '条' }],
    seasonings: [
      { name: '葱姜丝', amount: '适量', unit: '' },
      { name: '蒸鱼豉油', amount: '适量', unit: '' },
    ],
    instructions: ['鱼处理干净垫葱姜', '大火蒸8分钟', '倒掉余水淋油和豉油'],
    categories: ['海鲜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '9',
    title: '醋溜土豆丝',
    description: '人人都会的国民菜。',
    image: cover09,
    ingredients: [{ name: '土豆', amount: '2', unit: '个' }],
    seasonings: [
      { name: '陈醋', amount: '1', unit: '勺' },
      { name: '干辣椒', amount: '适量', unit: '' },
    ],
    instructions: ['土豆切丝泡水', '热油炸香辣椒', '下土豆丝大火快炒', '沿锅边泼醋'],
    categories: ['快手菜'],
    mealTypes: ['lunch', 'dinner'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
  {
    id: '10',
    title: '白灼生菜',
    description: '清爽健康，5分钟搞定。',
    image: cover10,
    ingredients: [{ name: '生菜', amount: '200', unit: 'g' }],
    seasonings: [
      { name: '生抽', amount: '适量', unit: '' },
      { name: '大蒜粉', amount: '适量', unit: '' },
    ],
    instructions: ['生菜烫熟捞出', '淋上酱料和热油'],
    categories: ['快手菜', '健康'],
    mealTypes: ['lunch', 'dinner', 'breakfast'],
    creatorId: 'system',
    isPublic: true,
    createdAt: now,
  },
]
