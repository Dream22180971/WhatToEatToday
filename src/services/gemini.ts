import { GoogleGenAI } from "@google/genai";
import { Recipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseRecipeFromContent(content: string, isImage: boolean = false): Promise<Partial<Recipe>> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional chef and data analyst. 
    Parse the provided content (text or image) into a structured recipe JSON.
    
    CRITICAL: 
    1. Be extremely thorough. Look for ingredients mentioned both in the main list AND within the cooking steps (e.g., if the steps say "add minced garlic", but it's not in the list, include it).
    2. Categorize items: 'ingredients' are main components (meat, veg, etc.); 'seasonings' are flavorings (salt, oil, soy sauce, ginger, garlic, spring onion, etc.).
    3. If an amount is missing, use "适量".
    
    The output must strictly follow this JSON schema:
    {
      "title": "Recipe Name",
      "description": "Short description",
      "ingredients": [
        { "name": "ingredient name", "amount": "number or text", "unit": "unit like g, ml, etc" }
      ],
      "seasonings": [
        { "name": "seasoning name", "amount": "number or text", "unit": "unit like g, ml, etc" }
      ],
      "instructions": ["step 1", "step 2"],
      "categories": ["category1"],
      "nutrition": {
        "calories": "Estimated total calories",
        "protein": "g",
        "carbs": "g",
        "fat": "g"
      },
      "mealTypes": ["breakfast", "lunch", "dinner", "snack"]
    }
    Translate everything to Simplified Chinese.
  `;

  const parameters = {
    model,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
    contents: isImage 
      ? [{ parts: [{ inlineData: { data: content, mimeType: "image/jpeg" } }, { text: "Parse this recipe." }] }]
      : content
  };

  try {
    const response = await ai.models.generateContent(parameters);
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
}

export async function getRecommendations(userProfile: any, recipes: Recipe[]): Promise<Recipe[]> {
  // Simple recommendation logic using Gemini
  const model = "gemini-3-flash-preview";
  const prompt = `
    Based on user preferences: ${JSON.stringify(userProfile.preferences)}
    And selected recipes: ${JSON.stringify(recipes.map(r => ({ id: r.id, title: r.title, categories: r.categories })))}
    Recommend 3 recipes for today's meals (Breakfast, Lunch, Dinner).
    Return only the IDs of the recommended recipes as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const recommendedIds = JSON.parse(response.text || '[]');
    return recipes.filter(r => recommendedIds.includes(r.id));
  } catch (error) {
    console.error("Recommendation Error:", error);
    return recipes.slice(0, 3); // Fallback
  }
}
