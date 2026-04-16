// app.js
App({
  globalData: {
    userInfo: null,
    recipes: [
      {
        id: 1,
        title: "Wood-Fired Margherita",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZTxx21vA3xDm8tDCRr7dHjZbUF1lpFNjw5nG7-trv4cHE2pxpZa4Pxwe1Eu31gv0sNo9mgQDGKgXowO1x-dW9ALyGoMHGW80jMMKMNsTBnsereXTFic4vcIoQ_T_Pfzy0qGqdgrpuJfJ95HqiX9StqETyKLd9UwovmfgCBgLs-C3oMierjxL9iV7-XoiJazp9T3b_bqE27VHpcf17VqLD3mI3W1qv0m26qxC5kUqN3vRJVY23RdCBad0RAYb7FwEYm-fpCOXJEj4",
        time: "15-20 Min",
        category: "Italian",
        calories: "320 kcal",
        difficulty: "Easy",
        servings: "2",
        tags: ["Trending", "Italian", "Quick"],
        ingredients: [
          "1 pizza dough",
          "1/2 cup tomato sauce",
          "8 oz mozzarella cheese",
          "Fresh basil leaves",
          "2 tbsp olive oil",
          "Salt to taste"
        ],
        steps: [
          {
            description: "Preheat oven to 475°F (245°C).",
            image: "https://example.com/step1.jpg"
          },
          {
            description: "Roll out the pizza dough on a floured surface.",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "Spread tomato sauce evenly over the dough.",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "Top with mozzarella cheese and fresh basil.",
            image: "https://example.com/step4.jpg"
          },
          {
            description: "Drizzle with olive oil and sprinkle with salt.",
            image: "https://example.com/step5.jpg"
          },
          {
            description: "Bake for 12-15 minutes until crust is golden.",
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
        title: "Avocado Toast",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avocado%20toast%20with%20sliced%20avocado%20on%20toasted%20bread%20with%20red%20pepper%20flakes%20and%20lemon%20juice&image_size=square_hd",
        time: "5-10 Min",
        category: "Breakfast",
        calories: "280 kcal",
        difficulty: "Easy",
        servings: "1",
        tags: ["Healthy", "Breakfast", "Quick"],
        ingredients: [
          "2 slices of bread",
          "1 ripe avocado",
          "1 tsp lemon juice",
          "Salt and pepper to taste",
          "Red pepper flakes (optional)"
        ],
        steps: [
          {
            description: "Toast the bread slices until golden.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=toasting%20bread%20slices%20in%20a%20toaster&image_size=square_hd"
          },
          {
            description: "Mash the avocado in a bowl with lemon juice.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mashing%20avocado%20in%20a%20bowl%20with%20lemon%20juice&image_size=square_hd"
          },
          {
            description: "Spread the avocado mixture on the toast.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spreading%20mashed%20avocado%20on%20toast&image_size=square_hd"
          },
          {
            description: "Season with salt, pepper, and red pepper flakes.",
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
        title: "Chicken Stir Fry",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken%20stir%20fry%20with%20bell%20peppers%20and%20broccoli%20in%20a%20wok&image_size=square_hd",
        time: "20-25 Min",
        category: "Asian",
        calories: "350 kcal",
        difficulty: "Medium",
        servings: "2",
        tags: ["Protein-rich", "Asian", "Balanced"],
        ingredients: [
          "1 chicken breast, sliced",
          "1 bell pepper, sliced",
          "1 cup broccoli florets",
          "2 cloves garlic, minced",
          "1 tbsp soy sauce",
          "1 tbsp oyster sauce",
          "1 tsp sesame oil",
          "2 tbsp vegetable oil"
        ],
        steps: [
          {
            description: "Heat vegetable oil in a wok or skillet.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=heating%20vegetable%20oil%20in%20a%20wok&image_size=square_hd"
          },
          {
            description: "Add garlic and chicken, cook until browned.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20chicken%20and%20garlic%20in%20a%20wok&image_size=square_hd"
          },
          {
            description: "Add bell pepper and broccoli, stir fry for 3-4 minutes.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20frying%20bell%20peppers%20and%20broccoli%20with%20chicken&image_size=square_hd"
          },
          {
            description: "Add soy sauce, oyster sauce, and sesame oil.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adding%20soy%20sauce%20and%20oyster%20sauce%20to%20stir%20fry&image_size=square_hd"
          },
          {
            description: "Cook for another 2 minutes until everything is well coated.",
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
        title: "Caprese Salad",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=caprese%20salad%20with%20tomato%20slices%20mozzarella%20and%20basil%20leaves%20drizzled%20with%20olive%20oil&image_size=square_hd",
        time: "10-15 Min",
        category: "Salad",
        calories: "220 kcal",
        difficulty: "Easy",
        servings: "2",
        tags: ["Healthy", "Italian", "Refreshing"],
        ingredients: [
          "2 large tomatoes, sliced",
          "8 oz fresh mozzarella, sliced",
          "Fresh basil leaves",
          "3 tbsp olive oil",
          "1 tbsp balsamic vinegar",
          "Salt and pepper to taste"
        ],
        steps: [
          {
            description: "Arrange tomato and mozzarella slices on a plate.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=arranging%20tomato%20and%20mozzarella%20slices%20on%20a%20plate&image_size=square_hd"
          },
          {
            description: "Tuck basil leaves between the slices.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placing%20basil%20leaves%20between%20tomato%20and%20mozzarella%20slices&image_size=square_hd"
          },
          {
            description: "Drizzle with olive oil and balsamic vinegar.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drizzling%20olive%20oil%20and%20balsamic%20vinegar%20over%20caprese%20salad&image_size=square_hd"
          },
          {
            description: "Season with salt and pepper to taste.",
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
        title: "Chocolate Chip Cookies",
        image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=freshly%20baked%20chocolate%20chip%20cookies%20on%20a%20cookie%20sheet&image_size=square_hd",
        time: "30-35 Min",
        category: "Dessert",
        calories: "180 kcal",
        difficulty: "Medium",
        servings: "12",
        tags: ["Dessert", "Sweet", "Comfort"],
        ingredients: [
          "2 1/4 cups all-purpose flour",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 cup unsalted butter, softened",
          "3/4 cup granulated sugar",
          "3/4 cup packed brown sugar",
          "2 large eggs",
          "2 tsp vanilla extract",
          "2 cups chocolate chips"
        ],
        steps: [
          {
            description: "Preheat oven to 375°F (190°C).",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=preheating%20oven%20to%20375%20degrees&image_size=square_hd"
          },
          {
            description: "In a small bowl, mix flour, baking soda, and salt.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixing%20flour%20baking%20soda%20and%20salt%20in%20a%20bowl&image_size=square_hd"
          },
          {
            description: "In a large bowl, cream butter and sugars until light and fluffy.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creaming%20butter%20and%20sugars%20in%20a%20large%20bowl&image_size=square_hd"
          },
          {
            description: "Add eggs one at a time, then stir in vanilla.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adding%20eggs%20to%20butter%20and%20sugar%20mixture&image_size=square_hd"
          },
          {
            description: "Gradually blend in the dry ingredients.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixing%20dry%20ingredients%20into%20wet%20mixture&image_size=square_hd"
          },
          {
            description: "Stir in chocolate chips.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stirring%20chocolate%20chips%20into%20cookie%20dough&image_size=square_hd"
          },
          {
            description: "Drop by rounded tablespoons onto ungreased baking sheets.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dropping%20cookie%20dough%20onto%20baking%20sheet&image_size=square_hd"
          },
          {
            description: "Bake for 9 to 11 minutes or until golden brown.",
            image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baking%20chocolate%20chip%20cookies%20in%20the%20oven&image_size=square_hd"
          }
        ],
        nutrition: {
          calories: "180",
          protein: "2g",
          carbs: "25g",
          fat: "9g"
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