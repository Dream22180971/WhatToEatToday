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
        image: "https://example.com/avocado-toast.jpg",
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
            image: "https://example.com/step1.jpg"
          },
          {
            description: "Mash the avocado in a bowl with lemon juice.",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "Spread the avocado mixture on the toast.",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "Season with salt, pepper, and red pepper flakes.",
            image: "https://example.com/step4.jpg"
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
        image: "https://example.com/chicken-stir-fry.jpg",
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
            image: "https://example.com/step1.jpg"
          },
          {
            description: "Add garlic and chicken, cook until browned.",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "Add bell pepper and broccoli, stir fry for 3-4 minutes.",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "Add soy sauce, oyster sauce, and sesame oil.",
            image: "https://example.com/step4.jpg"
          },
          {
            description: "Cook for another 2 minutes until everything is well coated.",
            image: "https://example.com/step5.jpg"
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
        image: "https://example.com/caprese-salad.jpg",
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
            image: "https://example.com/step1.jpg"
          },
          {
            description: "Tuck basil leaves between the slices.",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "Drizzle with olive oil and balsamic vinegar.",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "Season with salt and pepper to taste.",
            image: "https://example.com/step4.jpg"
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
        image: "https://example.com/chocolate-chip-cookies.jpg",
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
            image: "https://example.com/step1.jpg"
          },
          {
            description: "In a small bowl, mix flour, baking soda, and salt.",
            image: "https://example.com/step2.jpg"
          },
          {
            description: "In a large bowl, cream butter and sugars until light and fluffy.",
            image: "https://example.com/step3.jpg"
          },
          {
            description: "Add eggs one at a time, then stir in vanilla.",
            image: "https://example.com/step4.jpg"
          },
          {
            description: "Gradually blend in the dry ingredients.",
            image: "https://example.com/step5.jpg"
          },
          {
            description: "Stir in chocolate chips.",
            image: "https://example.com/step6.jpg"
          },
          {
            description: "Drop by rounded tablespoons onto ungreased baking sheets.",
            image: "https://example.com/step7.jpg"
          },
          {
            description: "Bake for 9 to 11 minutes or until golden brown.",
            image: "https://example.com/step8.jpg"
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