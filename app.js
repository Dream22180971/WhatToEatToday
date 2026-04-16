// app.js
App({
  globalData: {
    userInfo: null,
    recipes: [
      {
        id: 1,
        title: "意式玛格丽特披萨",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZTxx21vA3xDm8tDCRr7dHjZbUF1lpFNjw5nG7-trv4cHE2pxpZa4Pxwe1Eu31gv0sNo9mgQDGKgXowO1x-dW9ALyGoMHGW80jMMKMNsTBnsereXTFic4vcIoQ_T_Pfzy0qGqdgrpuJfJ95HqiX9StqETyKLd9UwovmfgCBgLs-C3oMierjxL9iV7-XoiJazp9T3b_bqE27VHpcf17VqLD3mI3W1qv0m26qxC5kUqN3vRJVY23RdCBad0RAYb7FwEYm-fpCOXJEj4",
        time: "15-20分钟",
        category: "西餐",
        calories: "320千卡",
        difficulty: "简单",
        servings: "2人",
        tags: ["热门", "西餐", "快手"],
        ingredients: [
          "1份披萨 dough",
          "1/2杯番茄酱",
          "8盎司马苏里拉奶酪",
          "新鲜罗勒叶",
          "2汤匙橄榄油",
          "适量盐"
        ],
        steps: [
          {
            description: "预热烤箱至475°F (245°C)。",
            image: "https://example.com/step1.jpg"
          },
          {
            description: "在撒有面粉的表面上擀开披萨面团。",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "在面团上均匀涂抹番茄酱。",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "撒上马苏里拉奶酪和新鲜罗勒。",
            image: "https://example.com/step4.jpg"
          },
          {
            description: "淋上橄榄油并撒上盐。",
            image: "https://example.com/step5.jpg"
          },
          {
            description: "烘烤12-15分钟，直到 crust呈金黄色。",
            image: "https://example.com/step6.jpg"
          }
        ],
        nutrition: {
          calories: "320",
          protein: "12g",
          carbs: "45g",
          fat: "12g"
        }
      },
      {
        id: 2,
        title: "牛油果吐司",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avocado%20toast%20with%20sliced%20avocado%20on%20toasted%20bread%20with%20red%20pepper%20flakes%20and%20lemon%20juice&image_size=square_hd",
        time: "5-10分钟",
        category: "早餐",
        calories: "280千卡",
        difficulty: "简单",
        servings: "1人",
        tags: ["健康", "早餐", "快手"],
        ingredients: [
          "2片面包",
          "1个成熟的牛油果",
          "1茶匙柠檬汁",
          "适量盐和胡椒",
          "红辣椒片（可选）"
        ],
        steps: [
          {
            description: "将面包片烤至金黄色。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=toasting%20bread%20slices%20in%20a%20toaster&image_size=square_hd"
          },
          {
            description: "将牛油果与柠檬汁一起捣碎在碗中。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mashing%20avocado%20in%20a%20bowl%20with%20lemon%20juice&image_size=square_hd"
          },
          {
            description: "将牛油果混合物涂抹在吐司上。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spreading%20mashed%20avocado%20on%20toast&image_size=square_hd"
          },
          {
            description: "撒上盐、胡椒和红辣椒片调味。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avocado%20toast%20seasoned%20with%20salt%20pepper%20and%20red%20pepper%20flakes&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "280",
          protein: "8g",
          carbs: "30g",
          fat: "16g"
        }
      },
      {
        id: 3,
        title: "宫保鸡丁",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken%20stir%20fry%20with%20bell%20peppers%20and%20broccoli%20in%20a%20wok&image_size=square_hd",
        time: "20-25分钟",
        category: "中餐",
        calories: "350千卡",
        difficulty: "中等",
        servings: "2人",
        tags: ["高蛋白", "中餐", "均衡"],
        ingredients: [
          "1个鸡胸肉，切片",
          "1个 bell pepper，切片",
          "1杯西兰花 florets",
          "2瓣大蒜，切碎",
          "1汤匙酱油",
          "1汤匙蚝油",
          "1茶匙芝麻油",
          "2汤匙植物油"
        ],
        steps: [
          {
            description: "在 wok 或煎锅中加热植物油。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=heating%20vegetable%20oil%20in%20a%20wok&image_size=square_hd"
          },
          {
            description: "加入大蒜和鸡肉，炒至棕色。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20chicken%20and%20garlic%20in%20a%20wok&image_size=square_hd"
          },
          {
            description: "加入 bell pepper 和西兰花，翻炒 3-4 分钟。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20frying%20bell%20peppers%20and%20broccoli%20with%20chicken&image_size=square_hd"
          },
          {
            description: "加入酱油、蚝油和芝麻油。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adding%20soy%20sauce%20and%20oyster%20sauce%20to%20stir%20fry&image_size=square_hd"
          },
          {
            description: "再炒 2 分钟，直到所有食材都裹上酱汁。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=finished%20chicken%20stir%20fry%20in%20a%20wok&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "350",
          protein: "25g",
          carbs: "20g",
          fat: "20g"
        }
      },
      {
        id: 4,
        title: "卡普雷塞沙拉",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=caprese%20salad%20with%20tomato%20slices%20mozzarella%20and%20basil%20leaves%20drizzled%20with%20olive%20oil&image_size=square_hd",
        time: "10-15分钟",
        category: "沙拉",
        calories: "220千卡",
        difficulty: "简单",
        servings: "2人",
        tags: ["健康", "西餐", "清爽"],
        ingredients: [
          "2个大番茄，切片",
          "8盎司新鲜马苏里拉奶酪，切片",
          "新鲜罗勒叶",
          "3汤匙橄榄油",
          "1汤匙 balsamic vinegar",
          "适量盐和胡椒"
        ],
        steps: [
          {
            description: "在盘子上排列番茄和马苏里拉奶酪片。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=arranging%20tomato%20and%20mozzarella%20slices%20on%20a%20plate&image_size=square_hd"
          },
          {
            description: "在切片之间插入罗勒叶。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placing%20basil%20leaves%20between%20tomato%20and%20mozzarella%20slices&image_size=square_hd"
          },
          {
            description: "淋上橄榄油和 balsamic vinegar。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drizzling%20olive%20oil%20and%20balsamic%20vinegar%20over%20caprese%20salad&image_size=square_hd"
          },
          {
            description: "撒上盐和胡椒调味。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=seasoning%20caprese%20salad%20with%20salt%20and%20pepper&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "220",
          protein: "10g",
          carbs: "8g",
          fat: "18g"
        }
      },
      {
        id: 5,
        title: "巧克力曲奇",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=freshly%20baked%20chocolate%20chip%20cookies%20on%20a%20cookie%20sheet&image_size=square_hd",
        time: "30-35分钟",
        category: "甜点",
        calories: "180千卡",
        difficulty: "中等",
        servings: "12个",
        tags: ["甜点", "甜食", " comfort"],
        ingredients: [
          "2 1/4杯通用面粉",
          "1茶匙小苏打",
          "1茶匙盐",
          "1杯无盐黄油，软化",
          "3/4杯白砂糖",
          "3/4杯红糖",
          "2个大鸡蛋",
          "2茶匙香草精",
          "2杯巧克力豆"
        ],
        steps: [
          {
            description: "预热烤箱至375°F (190°C)。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=preheating%20oven%20to%20375%20degrees&image_size=square_hd"
          },
          {
            description: "在小碗中，混合面粉、小苏打和盐。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixing%20flour%20baking%20soda%20and%20salt%20in%20a%20bowl&image_size=square_hd"
          },
          {
            description: "在大碗中，将黄油和糖打发至轻盈蓬松。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creaming%20butter%20and%20sugars%20in%20a%20large%20bowl&image_size=square_hd"
          },
          {
            description: "一次一个地加入鸡蛋，然后搅拌入香草精。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adding%20eggs%20to%20butter%20and%20sugar%20mixture&image_size=square_hd"
          },
          {
            description: "逐渐混入干性材料。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixing%20dry%20ingredients%20into%20wet%20mixture&image_size=square_hd"
          },
          {
            description: "搅拌入巧克力豆。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stirring%20chocolate%20chips%20into%20cookie%20dough&image_size=square_hd"
          },
          {
            description: "用圆形汤匙将面团滴在未涂油的烤盘上。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dropping%20cookie%20dough%20onto%20baking%20sheet&image_size=square_hd"
          },
          {
            description: "烘烤9至11分钟，直到金黄色。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baking%20chocolate%20chip%20cookies%20in%20the%20oven&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "180",
          protein: "2g",
          carbs: "25g",
          fat: "9g"
        }
      },
      {
        id: 6,
        title: "鱼香肉丝",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20fish%20fragrant%20shredded%20pork%20with%20vegetables&image_size=square_hd",
        time: "25分钟",
        category: "中餐",
        calories: "420千卡",
        difficulty: "中等",
        servings: "2人",
        tags: ["家常菜", "中餐", "经典"],
        ingredients: [
          "200克猪里脊肉，切丝",
          "100克青椒，切丝",
          "100克胡萝卜，切丝",
          "2瓣大蒜，切碎",
          "1汤匙姜，切丝",
          "2汤匙鱼香酱",
          "1汤匙料酒",
          "1汤匙淀粉",
          "2汤匙植物油"
        ],
        steps: [
          {
            description: "将猪肉丝用料酒和淀粉腌制10分钟。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=marinating%20pork%20strips%20with%20cooking%20wine%20and%20starch&image_size=square_hd"
          },
          {
            description: "在锅中加热植物油，加入姜和大蒜爆香。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sauteing%20ginger%20and%20garlic%20in%20hot%20oil&image_size=square_hd"
          },
          {
            description: "加入腌制好的猪肉丝，炒至变色。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20frying%20marinated%20pork%20strips%20until%20brown&image_size=square_hd"
          },
          {
            description: "加入青椒和胡萝卜丝，翻炒至熟。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20frying%20green%20pepper%20and%20carrot%20strips&image_size=square_hd"
          },
          {
            description: "加入鱼香酱，翻炒均匀即可。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adding%20fish%20fragrant%20sauce%20to%20the%20stir%20fry&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "420",
          protein: "28g",
          carbs: "25g",
          fat: "20g"
        }
      },
      {
        id: 7,
        title: "寿司卷",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20sushi%20rolls%20with%20rice%20and%20various%20fillings&image_size=square_hd",
        time: "40分钟",
        category: "日料",
        calories: "450千卡",
        difficulty: "中等",
        servings: "2人",
        tags: ["健康", "日料", "精致"],
        ingredients: [
          "2杯寿司米",
          "3杯水",
          "4汤匙寿司醋",
          "4张海苔",
          "100克新鲜三文鱼",
          "100克黄瓜，切丝",
          "100克牛油果，切片",
          "适量wasabi和酱油"
        ],
        steps: [
          {
            description: "将寿司米洗净，加水煮至熟透。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20sushi%20rice%20in%20a%20rice%20cooker&image_size=square_hd"
          },
          {
            description: "将煮好的米饭与寿司醋混合，放凉。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixing%20cooked%20rice%20with%20sushi%20vinegar&image_size=square_hd"
          },
          {
            description: "在竹帘上铺上海苔，均匀铺上米饭。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spreading%20rice%20on%20nori%20sheet%20on%20bamboo%20mat&image_size=square_hd"
          },
          {
            description: "在米饭上放三文鱼、黄瓜和牛油果。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placing%20salmon%20cucumber%20and%20avocado%20on%20rice&image_size=square_hd"
          },
          {
            description: "用竹帘将寿司卷紧，切成小段。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rolling%20sushi%20with%20bamboo%20mat&image_size=square_hd"
          },
          {
            description: "搭配wasabi和酱油食用。",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sliced%20sushi%20rolls%20with%20wasabi%20and%20soy%20sauce&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "450",
          protein: "20g",
          carbs: "60g",
          fat: "15g"
        }
      }
    ],
    favorites: []
  },
  
  onLaunch() {
    // 初始化时从本地存储加载收藏数据
    const favorites = wx.getStorageSync('favorites')
    if (favorites) {
      this.globalData.favorites = favorites
    }
  },
  
  // 添加收藏
  addFavorite(recipeId) {
    if (!this.globalData.favorites.includes(recipeId)) {
      this.globalData.favorites.push(recipeId)
      wx.setStorageSync('favorites', this.globalData.favorites)
      return true
    }
    return false
  },
  
  // 移除收藏
  removeFavorite(recipeId) {
    const index = this.globalData.favorites.indexOf(recipeId)
    if (index > -1) {
      this.globalData.favorites.splice(index, 1)
      wx.setStorageSync('favorites', this.globalData.favorites)
      return true
    }
    return false
  },
  
  // 检查是否收藏
  isFavorite(recipeId) {
    return this.globalData.favorites.includes(recipeId)
  },
  
  // 获取收藏的食谱
  getFavoriteRecipes() {
    return this.globalData.recipes.filter(recipe => 
      this.globalData.favorites.includes(recipe.id)
    )
  },
  
  // 随机获取食谱
  getRandomRecipe() {
    const randomIndex = Math.floor(Math.random() * this.globalData.recipes.length)
    return this.globalData.recipes[randomIndex]
  }
})