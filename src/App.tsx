import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, ShoppingBag, User, PlusCircle, ChefHat, LayoutGrid, Utensils, Heart, CheckCircle2, ChevronRight, X, Camera, Upload, Filter, Sparkles, BookOpen, Plus, Share2 } from 'lucide-react';
import { Recipe, UserProfile, ShoppingItem, MealLog, Favorite, Ingredient } from './types';
import { cn } from './lib/utils';
import { parseRecipeFromContent, getRecommendations } from './services/gemini';

// --- Mock Database Service (Fallback for Firebase) ---
const STORAGE_KEY = 'san-can-you-yi-si-db';
const loadDB = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"recipes":[], "logs":[], "shopping":[], "favorites":[]}');
const saveDB = (db: any) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

// --- Components ---

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'discovery', icon: Search, label: '发现' },
    { id: 'shopping', icon: ShoppingBag, label: '清单' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-orange-100/50 px-6 py-2 pb-6 flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-500",
            activeTab === tab.id ? "text-primary scale-110" : "text-espresso/40 hover:text-espresso/60"
          )}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-colors",
            activeTab === tab.id ? "bg-orange-50" : "bg-transparent"
          )}>
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          </div>
          <span className={cn("text-[9px] font-black tracking-widest", activeTab === tab.id ? "text-primary" : "opacity-0")}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const RecipeCard = ({ recipe, onClick }: { recipe: Recipe, onClick: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-white rounded-[2rem] overflow-hidden shadow-card mb-4 border border-orange-50/50 active:shadow-none transition-all hover:translate-y-[-2px]"
  >
    <div className="aspect-[4/3] bg-orange-50/30 relative">
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-orange-200">
          <ChefHat size={40} />
        </div>
      )}
      <div className="absolute top-4 left-4">
         <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-primary text-[9px] font-black rounded-full shadow-sm tracking-wider">
            暖意食谱
         </span>
      </div>
    </div>
    <div className="p-5">
      <h3 className="font-black text-espresso leading-tight mb-2 text-sm">{recipe.title}</h3>
      <p className="text-[10px] text-espresso/40 line-clamp-2 font-medium leading-relaxed">{recipe.description}</p>
    </div>
</motion.div>
);

const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-6 px-1">
    <h2 className="text-2xl font-display italic text-espresso">{title}</h2>
    {action}
  </div>
);

// --- Main Pages ---

const HomePage = ({ recipes, logs, onAddLog, onDeleteLog, onRecipeClick }: { 
  recipes: Recipe[], 
  logs: MealLog[], 
  onAddLog: (log: Partial<MealLog>) => void, 
  onDeleteLog: (id: string) => void,
  onRecipeClick: (r: Recipe) => void 
}) => {
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState<{ type: 'breakfast' | 'lunch' | 'dinner' | 'snack', show: boolean }>({ type: 'lunch', show: false });
  const [customFood, setCustomFood] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    const recs = await getRecommendations({ preferences: { dietaryType: 'none' } }, recipes);
    setRecommendations(recs);
    setLoading(false);
  };

  useEffect(() => {
    if (recipes.length > 0 && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [recipes]);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today);

  const handleLogged = (rId?: string, rTitle?: string) => {
    onAddLog({ recipeId: rId, recipeTitle: rTitle, mealType: showPicker.type });
    setCustomFood('');
  };

  return (
    <div className="space-y-10 pb-24 relative">
      {/* Background Floats Inspiration */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-100/30 blur-[100px] rounded-full -z-10" />
      <div className="absolute top-40 -right-20 w-80 h-80 bg-orange-200/20 blur-[120px] rounded-full -z-10" />

      <header className="pt-10">
        <h1 className="text-[40px] font-display text-espresso leading-[1.1] tracking-tight mb-4">
          好好吃饭<br /><span className="text-primary italic">治愈生活</span>
        </h1>
        <p className="text-espresso/40 font-bold text-sm mb-10 leading-relaxed">让 AI 为你定制每日暖心菜单<br />懂生活，更懂你的胃</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          {[
            { label: '暖心推荐', icon: Sparkles, color: 'text-primary', bg: 'bg-orange-50' },
            { label: '周周新意', icon: LayoutGrid, color: 'text-green-500', bg: 'bg-green-50' },
            { label: '灵感识别', icon: Camera, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: '寻味更多', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-healing shadow-card border border-white/50">
              <div className={cn("flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center", item.bg, item.color)}>
                <item.icon size={22} strokeWidth={2} />
              </div>
              <span className="text-xs font-black text-espresso/70 tracking-tight whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Floating Recommendation Card */}
        {recommendations.length > 0 && !loading && (
           <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="p-8 rounded-healing bg-white shadow-card border border-orange-50 relative overflow-hidden group mb-14"
           >
              <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                <ChefHat size={200} className="text-espresso" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">今日份的小幸运</span>
                </div>
                <h3 className="text-2xl font-display italic text-espresso mb-2">{recommendations[0].title}</h3>
                <p className="text-xs text-espresso/40 font-bold mb-8 italic">“ 简单的食材，藏着生活的仪式感 ”</p>
                <div className="flex gap-3">
                   <button 
                    onClick={() => onRecipeClick(recommendations[0])}
                    className="flex-1 bg-primary text-white py-4.5 rounded-healing font-black text-sm shadow-orange active:scale-95 transition-all"
                   >
                     遇见美味
                   </button>
                   <button 
                    onClick={fetchRecommendations}
                    className="px-8 bg-warm-bg text-espresso/40 py-4.5 rounded-healing font-black text-sm hover:bg-orange-50 active:scale-95 transition-all"
                   >
                     换个心情
                   </button>
                </div>
              </div>
           </motion.div>
        )}
      </header>

      {/* Daily Logs */}
      <section>
        <SectionHeader title="今日饮食记录" />
        <div className="space-y-4">
          {['breakfast', 'lunch', 'dinner'].map((type) => {
            const meals = todayLogs.filter(l => l.mealType === type);
            return (
              <div 
                key={type} 
                className="bg-white rounded-[32px] shadow-card border border-gray-50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                      type === 'breakfast' ? "bg-blue-50 text-blue-500" :
                      type === 'lunch' ? "bg-orange-50 text-orange-500" : "bg-purple-50 text-purple-500"
                    )}>
                      <Utensils size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black text-espresso tracking-tight">
                      {type === 'breakfast' ? '清晨的能量' : type === 'lunch' ? '正午的治愈' : '傍晚的宁静'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowPicker({ type: type as any, show: true })}
                    className="text-orange-500 p-2 glass-panel rounded-xl shadow-sm active:scale-90 transition-transform"
                  >
                    <PlusCircle size={20} strokeWidth={2.5} />
                  </button>
                </div>
                
                <div className="p-4 space-y-2">
                  {meals.length > 0 ? (
                    meals.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 px-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-orange-100 transition-colors"
                      >
                        <span 
                          onClick={() => {
                            if (item.recipeId) {
                              const r = recipes.find(rec => rec.id === item.recipeId);
                              if (r) onRecipeClick(r);
                            }
                          }}
                          className={cn("text-xs font-black text-gray-700", item.recipeId && "hover:text-[#FF6B00] cursor-pointer transition-colors")}
                        >
                          {item.recipeTitle}
                        </span>
                        <button 
                          onClick={() => onDeleteLog(item.id)} 
                          className="text-gray-300 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold p-3 text-center tracking-widest uppercase">还未记录任何食物</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recipe Picker Modal for Logging */}
      <AnimatePresence>
        {showPicker.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-end justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-10">
                <h2 className="text-xl font-black">记录{showPicker.type === 'breakfast' ? '早餐' : showPicker.type === 'lunch' ? '午餐' : '晚餐'}</h2>
                <button onClick={() => setShowPicker({ ...showPicker, show: false })} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
              </div>

              {/* Manual Entry */}
              <div className="mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">手动录入项目 (支持多项)</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="输入食物名称..." 
                    className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
                    value={customFood}
                    onChange={e => setCustomFood(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && customFood.trim() && handleLogged(undefined, customFood)}
                  />
                  <button 
                    disabled={!customFood.trim()}
                    onClick={() => handleLogged(undefined, customFood)}
                    className="bg-orange-500 text-white px-6 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    添加
                  </button>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">从我的菜谱中选择</p>
              <div className="space-y-4">
                {recipes.length > 0 ? (
                  recipes.map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => handleLogged(r.id, r.title)}
                      className="flex items-center gap-4 p-3 border border-gray-100 rounded-2xl active:bg-orange-50 active:border-orange-200 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {r.image && <img src={r.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 group-active:text-orange-600 transition-colors">{r.title}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{r.description}</p>
                      </div>
                      <PlusCircle className="text-gray-200 group-active:text-orange-500" size={20} />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-10">没有可选的菜谱，请先去发现页添加</p>
                )}
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100">
                 <button 
                  onClick={() => setShowPicker({ ...showPicker, show: false })}
                  className="w-full py-4 text-gray-500 font-bold text-sm"
                 >
                   完成
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DiscoveryPage = ({ recipes, onAddRecipe, onRecipeClick }: { recipes: Recipe[], onAddRecipe: (r: Partial<Recipe>) => void, onRecipeClick: (r: Recipe) => void }) => {
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result?.toString().split(',')[1];
      if (base64) {
        try {
          const parsed = await parseRecipeFromContent(base64, true);
          onAddRecipe(parsed);
          setShowUpload(false);
        } catch (e) {
          alert('解析失败，请尝试文字输入');
        }
      }
      setParsing(false);
    };
    reader.readAsDataURL(file);
  };

  const filtered = recipes.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.ingredients.some(i => i.name.includes(search))
  );
  return (
    <div className="space-y-8 pb-24 pt-10">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-3xl font-display italic text-espresso tracking-tight">探索<span className="text-primary italic">新滋味</span></h1>
        <button onClick={() => setShowUpload(true)} className="bg-primary text-white p-4 rounded-healing shadow-orange active:scale-90 transition-transform">
          <PlusCircle size={24} strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-espresso/20 group-focus-within:text-primary transition-colors" size={20} strokeWidth={2.5} />
        <input 
          type="text"
          placeholder="寻找你的下一餐灵感..."
          className="w-full bg-white shadow-card border border-orange-50/50 rounded-healing py-5 pl-16 pr-8 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-100 placeholder:text-espresso/20"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(r => (
          <RecipeCard key={r.id} recipe={r} onClick={() => onRecipeClick(r)} />
        ))}
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 relative"
            >
              <button onClick={() => setShowUpload(false)} className="absolute top-6 right-6 text-gray-400">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black mb-6">添加菜谱</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-orange-500 transition-colors">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">上传图片解析</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={parsing} />
                </label>
                <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer opacity-50 grayscale">
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">上传PDF/文档</span>
                </div>
              </div>
              
              {parsing && (
                <div className="flex items-center gap-3 text-orange-500 font-bold text-sm justify-center py-4">
                  <Sparkles className="animate-spin" size={18} />
                  正在智能解析中...
                </div>
              )}

              <button className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold text-sm">
                手动输入菜谱
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecipeDetail = ({ 
  recipe, 
  onClose, 
  onAddShopping, 
  onAddSingleShopping, 
  onToggleFavorite, 
  isFavorite 
}: { 
  recipe: Recipe, 
  onClose: () => void, 
  onAddShopping: (items: { item: Ingredient, type: 'ingredient' | 'seasoning' }[]) => void,
  onAddSingleShopping: (item: Ingredient, type: 'ingredient' | 'seasoning') => void,
  onToggleFavorite: (id: string) => void,
  isFavorite: boolean
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[200] overflow-y-auto pb-32"
    >
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-b-[48px] shadow-lg">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <ChefHat size={120} strokeWidth={1} />
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="absolute top-10 left-6 w-11 h-11 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => onToggleFavorite(recipe.id)}
          className={cn(
            "absolute top-10 right-20 w-11 h-11 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform",
            isFavorite ? "bg-[#FF6B00] text-white" : "bg-white/50 text-gray-700"
          )}
        >
          <Heart size={20} strokeWidth={2.5} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button 
          onClick={() => {
            const shareText = `【${recipe.title}】\n\n${recipe.description}\n\n[食材清单]\n${recipe.ingredients.map(i => `· ${i.name} ${i.amount}${i.unit}`).join('\n')}\n\n[制作步骤]\n${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n来自「三餐有意思」—— 让生活更有滋味。`;
            
            if (navigator.share) {
              navigator.share({
                title: recipe.title,
                text: shareText,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shareText).then(() => {
                alert('已复制精彩食谱，去分享给好友吧！');
              });
            }
          }}
          className="absolute top-10 right-6 w-11 h-11 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform text-gray-700"
        >
          <Share2 size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-8 py-10">
        <div className="flex gap-2 mb-4">
          {recipe.mealTypes.map(type => (
            <span key={type} className="px-3 py-1 bg-orange-50 text-primary text-[10px] font-black uppercase rounded-full tracking-widest">
              {type === 'breakfast' ? '能量早餐' : type === 'lunch' ? '元气午餐' : type === 'dinner' ? '暖心宵夜' : '馋嘴零食'}
            </span>
          ))}
        </div>
        <h1 className="text-[44px] font-display italic text-espresso mb-4 leading-[1.1] tracking-tight">{recipe.title}</h1>
        <p className="text-espresso/40 mb-10 font-bold text-sm leading-relaxed italic">“ {recipe.description} ”</p>

        {recipe.nutrition && (
          <div className="glass-panel shadow-card rounded-[32px] p-8 mb-12 grid grid-cols-4 gap-2">
            {[
              { label: '热量', value: recipe.nutrition.calories },
              { label: '蛋白质', value: recipe.nutrition.protein },
              { label: '碳水', value: recipe.nutrition.carbs },
              { label: '脂肪', value: recipe.nutrition.fat },
            ].map((n, i) => (
              <div key={i} className="text-center border-r border-gray-100 last:border-0">
                <p className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-tighter">{n.label}</p>
                <p className="text-xs font-black text-[#FF6B00] leading-none">{n.value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">食材清单</h2>
            <button 
              onClick={() => onAddShopping([
                ...recipe.ingredients.map(i => ({ item: i, type: 'ingredient' as const })),
                ...(recipe.seasonings || []).map(s => ({ item: s, type: 'seasoning' as const }))
              ])}
              className="text-[#FF6B00] text-xs font-black flex items-center gap-1 bg-orange-50 px-4 py-2 rounded-xl"
            >
              全部加入 <PlusCircle size={14} strokeWidth={3} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex justify-between items-center py-4 px-4 bg-gray-50/50 rounded-2xl mb-1 group/item">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-700 text-sm">{ing.name}</span>
                  <button 
                    onClick={() => onAddSingleShopping(ing, 'ingredient')}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 bg-orange-100 text-[#FF6B00] rounded-lg"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
                <span className="text-gray-400 font-bold text-xs">{ing.amount}{ing.unit}</span>
              </div>
            ))}
          </div>
        </section>

        {recipe.seasonings && recipe.seasonings.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">烹饪调料</h2>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {recipe.seasonings.map((ing, i) => (
                <div key={i} className="flex justify-between items-center py-4 px-4 bg-gray-50/50 rounded-2xl mb-1 group/item">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-600 text-sm">{ing.name}</span>
                    <button 
                      onClick={() => onAddSingleShopping(ing, 'seasoning')}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 bg-orange-100 text-[#FF6B00] rounded-lg"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                  <span className="text-gray-400 font-bold text-xs">{ing.amount}{ing.unit}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pb-10">
          <SectionHeader title="烹饪步骤" />
          <div className="space-y-8">
            {recipe.instructions.map((step, i) => (
              <div key={i} className="flex gap-5 group items-start">
                <div className="text-3xl font-black text-orange-100 leading-none mt-1 transition-colors group-hover:text-orange-500">{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1 pb-4 border-b border-gray-50">
                  <p className="text-gray-800 font-bold text-sm leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showMyRecipes, setShowMyRecipes] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    uid: 'user',
    displayName: '美食爱好者',
    email: 'user@example.com',
    preferences: { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] },
    tier: 'standard',
    extraSlots: 0,
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    const db = loadDB();
    if (db.profile) setProfile(db.profile);
    let recipesFromDB = db.recipes || [];
    // ... rest of the existing useEffect code ...
    
    const initialRecipes: Recipe[] = [
      {
        id: '1', title: '西红柿炒鸡蛋', description: '经典家常菜，酸甜适口，营养丰富。',
        ingredients: [{ name: '西红柿', amount: '2', unit: '个' }, { name: '鸡蛋', amount: '3', unit: '个' }],
        seasonings: [{ name: '食用油', amount: '适量', unit: '' }, { name: '食盐', amount: '1', unit: '小勺' }, { name: '白糖', amount: '0.5', unit: '小勺' }],
        nutrition: { calories: '245kcal', protein: '15g', carbs: '8g', fat: '18g' },
        instructions: ['鸡蛋打散，加少许盐拌匀', '西红柿洗净切块', '锅中倒油，烧热后放入蛋液炒熟盛出', '锅中留底油，下西红柿炒出汁', '放入鸡蛋块，加盐和少量白糖翻炒均匀即可'],
        categories: ['家常菜', '快手菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '2', title: '全麦牛油果吐司', description: '活力早餐，开启美好一天。',
        ingredients: [{ name: '全麦吐司', amount: '2', unit: '片' }, { name: '牛油果', amount: '0.5', unit: '个' }],
        seasonings: [{ name: '黑胡椒', amount: '少许', unit: '' }, { name: '海盐', amount: '少许', unit: '' }],
        nutrition: { calories: '320kcal', protein: '9g', carbs: '28g', fat: '21g' },
        instructions: ['吐司放入面包机或平底锅烤至微焦', '牛油果去核切片或捣成泥', '将牛油果铺在吐司上', '撒上少许黑胡椒 and 海盐即可'],
        categories: ['早餐', '减脂'], mealTypes: ['breakfast'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '3', title: '鱼香肉丝', description: '川菜经典，酸辣咸甜五味俱全。',
        ingredients: [{ name: '猪里脊', amount: '200', unit: 'g' }, { name: '木耳', amount: '50', unit: 'g' }, { name: '胡萝卜', amount: '50', unit: 'g' }],
        seasonings: [{ name: '豆瓣酱', amount: '1', unit: '勺' }, { name: '泡椒', amount: '适量', unit: '' }],
        instructions: ['肉丝上浆', '配菜切丝', '调鱼香汁', '热油炒肉变色', '下配菜和汁翻炒'],
        categories: ['家常菜', '川菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '4', title: '麻婆豆腐', description: '麻、辣、烫、鲜、嫩、香、酥。',
        ingredients: [{ name: '嫩豆腐', amount: '1', unit: '块' }, { name: '牛肉末', amount: '50', unit: 'g' }],
        seasonings: [{ name: '郫县豆瓣', amount: '1', unit: '勺' }, { name: '花椒粉', amount: '适量', unit: '' }],
        instructions: ['豆腐切块焯水', '牛末炒酥', '下酱炒红油', '加水和豆腐烧制', '勾芡撒花椒粉'],
        categories: ['川菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '5', title: '宫保鸡丁', description: '红而不辣、辣而不猛、香辣味浓。',
        ingredients: [{ name: '鸡胸肉', amount: '250', unit: 'g' }, { name: '花生米', amount: '50', unit: 'g' }],
        seasonings: [{ name: '干辣椒', amount: '适量', unit: '' }],
        instructions: ['鸡丁腌制', '油炸花生', '炒香料', '下鸡丁滑散', '入料汁和花生翻炒'],
        categories: ['家常菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '6', title: '地三鲜', description: '百吃不厌的素食经典。',
        ingredients: [{ name: '土豆', amount: '1', unit: '个' }, { name: '茄子', amount: '1', unit: '个' }, { name: '青椒', amount: '1', unit: '个' }],
        seasonings: [{ name: '生抽', amount: '适量', unit: '' }],
        instructions: ['土豆茄子切块油炸', '炒香蒜末', '下配菜并倒入勾好的欠汁'],
        categories: ['家常菜', '素食'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '7', title: '红烧肉', description: '肥而不腻，瘦而不柴。',
        ingredients: [{ name: '五花肉', amount: '500', unit: 'g' }],
        seasonings: [{ name: '冰糖', amount: '适量', unit: '' }, { name: '八角', amount: '2', unit: '个' }],
        instructions: ['肉块焯水', '炒糖色', '下肉翻炒上色', '加水炖煮1小时'],
        categories: ['经典菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '8', title: '清蒸鱼', description: '保留鱼肉最鲜美的原味。',
        ingredients: [{ name: '鲈鱼', amount: '1', unit: '条' }],
        seasonings: [{ name: '葱姜丝', amount: '适量', unit: '' }, { name: '蒸鱼豉油', amount: '适量', unit: '' }],
        instructions: ['鱼处理干净垫葱姜', '大火蒸8分钟', '倒掉余水淋油和豉油'],
        categories: ['海鲜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '9', title: '土豆丝', description: '人人都会的国民菜。',
        ingredients: [{ name: '土豆', amount: '2', unit: '个' }],
        seasonings: [{ name: '陈醋', amount: '1', unit: '勺' }, { name: '干辣椒', amount: '适量', unit: '' }],
        instructions: ['土豆切丝泡水', '热油炸香辣椒', '下土豆丝大火快炒', '沿锅边泼醋'],
        categories: ['快手菜'], mealTypes: ['lunch', 'dinner'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      },
      {
        id: '10', title: '白灼生菜', description: '清爽健康，5分钟搞定。',
        ingredients: [{ name: '生菜', amount: '200', unit: 'g' }],
        seasonings: [{ name: '生抽', amount: '适量', unit: '' }, { name: '大蒜粉', amount: '适量', unit: '' }],
        instructions: ['生菜烫熟捞出', '淋上酱料和热油'],
        categories: ['快手菜', '健康'], mealTypes: ['lunch', 'dinner', 'breakfast'], creatorId: 'system', isPublic: true, createdAt: new Date().toISOString()
      }
    ];

    // Patch current records if they are system recipes and missing seasonings
    if (recipesFromDB.length > 0) {
      recipesFromDB = recipesFromDB.map((r: Recipe) => {
        const initial = initialRecipes.find(ir => ir.id === r.id);
        if (initial && (!r.seasonings || r.seasonings.length === 0)) {
          return { ...r, seasonings: initial.seasonings };
        }
        return r;
      });
    } else {
      recipesFromDB = initialRecipes;
    }

    setRecipes(recipesFromDB);
    setLogs(db.logs || []);
    setShopping(db.shopping || []);
    setFavorites(db.favorites || []);
    saveDB({ ...db, recipes: recipesFromDB, profile: db.profile || profile });
  }, []);

  const addRecipe = (r: Partial<Recipe>) => {
    const userRecipes = recipes.filter(rec => rec.creatorId === 'user');
    const quota = (profile.tier === 'vip' ? 100 : 30) + profile.extraSlots;
    
    if (userRecipes.length >= quota) {
      alert(`已达到当前菜谱数量上限 (${quota}个)。提升至VIP或使用占位卡增加容量！`);
      return;
    }

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title: r.title || '无题菜谱',
      description: r.description || '',
      ingredients: r.ingredients || [],
      seasonings: r.seasonings || [],
      instructions: r.instructions || [],
      categories: r.categories || [],
      mealTypes: r.mealTypes || ['lunch'],
      creatorId: 'user',
      isPublic: false,
      createdAt: new Date().toISOString(),
      ...r
    };
    const updated = [...recipes, newRecipe];
    setRecipes(updated);
    saveDB({ recipes: updated, logs, shopping, favorites, profile: profile });
  };

  const addLog = (log: Partial<MealLog>) => {
    const newLog: MealLog = {
      id: Date.now().toString(),
      userId: 'user',
      recipeId: log.recipeId,
      recipeTitle: log.recipeTitle,
      date: new Date().toISOString().split('T')[0],
      mealType: log.mealType || 'lunch'
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    saveDB({ recipes, logs: updated, shopping, favorites, profile });
  };

  const addShopping = (items: { item: Ingredient, type: 'ingredient' | 'seasoning' }[]) => {
    const newItems: ShoppingItem[] = items.map(entry => ({
      id: Math.random().toString(36).substr(2, 9),
      userId: 'user',
      name: entry.item.name,
      amount: `${entry.item.amount}${entry.item.unit}`,
      completed: false,
      recipeId: selectedRecipe?.id,
      type: entry.type
    }));
    const updated = [...shopping, ...newItems];
    setShopping(updated);
    saveDB({ recipes, logs, shopping: updated, favorites, profile });
    alert('已加入清单');
  };

  const addSingleShoppingItem = (item: Ingredient, type: 'ingredient' | 'seasoning') => {
    addShopping([{ item, type }]);
  };

  const toggleFavorite = (recipeId: string) => {
    let updated;
    if (favorites.some(f => f.recipeId === recipeId)) {
      updated = favorites.filter(f => f.recipeId !== recipeId);
    } else {
      updated = [...favorites, { id: Date.now().toString(), userId: 'user', recipeId, createdAt: new Date().toISOString() }];
    }
    setFavorites(updated);
    saveDB({ recipes, logs, shopping, favorites: updated, profile });
  };

  const toggleShoppingItem = (id: string) => {
    const updated = shopping.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setShopping(updated);
    saveDB({ recipes, logs, shopping: updated, favorites, profile });
  };

  const deleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    saveDB({ recipes, logs: updated, shopping, favorites, profile });
  };

  const mergedShopping = shopping.reduce((acc: any[], item) => {
    const existing = acc.find(i => i.name === item.name && i.type === item.type && !i.completed === !item.completed);
    if (existing) {
      // Try to merge amounts if they are numbers
      const match1 = item.amount.match(/(\d+\.?\d*)(.*)/);
      const match2 = existing.amount.match(/(\d+\.?\d*)(.*)/);
      
      if (match1 && match2 && match1[2].trim() === match2[2].trim()) {
        const sum = parseFloat(match1[1]) + parseFloat(match2[1]);
        existing.amount = `${sum}${match1[2]}`;
      } else {
        // Fallback: just append if not both numbers or different units
        if (!existing.amount.includes(item.amount)) {
          existing.amount = `${existing.amount}, ${item.amount}`;
        }
      }
      return acc;
    }
    return [...acc, { ...item }];
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg text-espresso font-sans selection:bg-orange-100">
      <div className="max-w-md mx-auto px-6 relative min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <HomePage recipes={recipes} logs={logs} onAddLog={addLog} onDeleteLog={deleteLog} onRecipeClick={setSelectedRecipe} />
            </motion.div>
          )}
          {activeTab === 'discovery' && (
            <motion.div key="discovery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <DiscoveryPage recipes={recipes} onAddRecipe={addRecipe} onRecipeClick={setSelectedRecipe} />
            </motion.div>
          )}
          {activeTab === 'shopping' && (
            <motion.div key="shopping" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pt-8">
              <SectionHeader title="购物清单" />
              <div className="space-y-3 pb-24">
                {mergedShopping.length > 0 ? (
                  <>
                    <button 
                      onClick={() => { setShopping([]); saveDB({recipes, logs, shopping: [], favorites, profile}); }}
                      className="text-xs font-bold text- espresso/40 uppercase tracking-widest mb-6 hover:text-primary transition-colors"
                    >
                      清空清单
                    </button>

                    {['ingredient', 'seasoning'].map(type => {
                      const items = mergedShopping.filter(i => i.type === type);
                      if (items.length === 0) return null;
                      return (
                        <div key={type} className="mb-8">
                          <h3 className="text-[10px] font-black text-espresso/20 uppercase tracking-[0.2em] mb-4">
                            {type === 'ingredient' ? '挑选新鲜食材' : '备好调味魔法'}
                          </h3>
                          {items.sort((a, b) => Number(a.completed) - Number(b.completed)).map(item => (
                            <div 
                              key={item.name + item.type + item.completed} 
                              onClick={() => {
                                const updated = shopping.map(s => (s.name === item.name && s.type === item.type) ? { ...s, completed: !s.completed } : s);
                                setShopping(updated);
                                saveDB({ recipes, logs, shopping: updated, favorites, profile });
                              }}
                              className={cn(
                                "flex items-center gap-4 p-5 rounded-healing cursor-pointer transition-all border shadow-card mb-3",
                                item.completed ? "bg-orange-50/20 border-transparent text-espresso/20 opacity-60" : "bg-white border-orange-50/50"
                              )}
                            >
                              {item.completed ? (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                                  <CheckCircle2 size={16} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-orange-100 rounded-full" />
                              )}
                              <div className="flex-1">
                                <p className={cn("font-black tracking-tight", item.completed && "line-through")}>{item.name}</p>
                                <p className="text-[10px] font-bold text-espresso/30 uppercase">{item.amount}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-24 opacity-20">
                     <ShoppingBag className="mx-auto mb-6 text-espresso" size={100} strokeWidth={1} />
                     <p className="text-espresso font-display italic text-xl">清单空空，生活缓缓</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pt-10 pb-24">
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-display italic text-espresso tracking-tight">个人时光</h1>
                <button className="text-xs font-black text-espresso/40 bg-white/50 px-4 py-2 rounded-full border border-orange-100 shadow-sm active:scale-95 transition-all">设置中心</button>
              </div>

              <div className="flex items-center gap-6 mb-12">
                <div className="w-24 h-24 bg-orange-100 rounded-healing flex items-center justify-center text-primary relative shadow-card border-4 border-white">
                  <User size={40} strokeWidth={2.5} />
                  {profile.tier === 'vip' && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-2 rounded-full border-2 border-white shadow-lg">
                      <Sparkles size={14} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-3xl font-display italic text-espresso tracking-tight">{profile.displayName}</h2>
                    {profile.tier === 'vip' && (
                      <span className="bg-gradient-to-br from-yellow-400 to-amber-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm">Golden</span>
                    )}
                  </div>
                  <p className="text-xs text-espresso/30 font-bold tracking-widest uppercase">用心记录了 {recipes.filter(r => r.creatorId === 'user').length} 次生活</p>
                </div>
              </div>

              {/* VIP Banner Card */}
              <div className="bg-espresso rounded-healing p-10 mb-12 text-white relative overflow-hidden flex justify-between items-center shadow-xl">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                       <Sparkles className="text-yellow-400" size={20} fill="currentColor" />
                       <h3 className="text-xl font-display italic tracking-tight">开启味蕾旅程</h3>
                    </div>
                    <p className="text-xs text-white/40 font-bold leading-relaxed">升级正式会员，解锁更多创意灵感</p>
                 </div>
                 <button className="relative z-10 bg-white text-espresso px-8 py-4 rounded-full font-black text-xs shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                   去看看 <ChevronRight size={16} strokeWidth={3} />
                 </button>
              </div>

              {/* Feature Highlights Group */}
              <div className="grid grid-cols-4 gap-2 mb-12">
                {[
                  { label: '智能推荐', icon: Sparkles, bg: 'bg-orange-50', color: 'text-orange-500', desc: '按口味推荐' },
                  { label: '一周菜单', icon: LayoutGrid, bg: 'bg-green-50', color: 'text-green-500', desc: '早中晚排版' },
                  { label: 'AI 识别', icon: Camera, bg: 'bg-purple-50', color: 'text-purple-500', desc: '拍照识别' },
                  { label: '更多菜谱', icon: BookOpen, bg: 'bg-blue-50', color: 'text-blue-500', desc: '海量资源' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", item.bg, item.color)}>
                      <item.icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-800 leading-tight">{item.label}</p>
                      <p className="text-[8px] text-gray-400 font-bold scale-90 origin-top">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rights Comparison Table */}
              <div className="mb-12">
                <SectionHeader title="会员权益对比" />
                <div className="bg-white rounded-[32px] overflow-hidden shadow-card border border-gray-50">
                   <div className="grid grid-cols-3 bg-gray-50/50 border-b border-gray-50">
                      <div className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">功能</div>
                      <div className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">免费版</div>
                      <div className="p-4 text-[10px] font-black text-white uppercase tracking-widest text-center bg-[#FF6B00]">VIP 会员</div>
                   </div>
                   {[
                     { name: '基础推荐', free: true, vip: true },
                     { name: '智能推荐 (高阶)', free: false, vip: true },
                     { name: '一周不重样菜单', free: false, vip: true },
                     { name: '拍照解析录入', free: false, vip: true },
                     { name: '菜谱上限', free: '30道', vip: '200道+' },
                   ].map((row, i) => (
                     <div key={i} className="grid grid-cols-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="p-4 text-xs font-black text-gray-600">{row.name}</div>
                        <div className="p-4 flex justify-center items-center">
                           {typeof row.free === 'boolean' ? (
                             row.free ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-gray-200" />
                           ) : <span className="text-[10px] font-black text-gray-300">{row.free}</span>}
                        </div>
                        <div className="p-4 flex justify-center items-center bg-orange-50/30">
                           {typeof row.vip === 'boolean' ? (
                             row.vip ? <CheckCircle2 size={16} className="text-[#FF6B00]" strokeWidth={3} /> : <X size={16} />
                           ) : <span className="text-[10px] font-black text-[#FF6B00]">{row.vip}</span>}
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="border-2 border-[#FF6B00] bg-orange-50/30 rounded-3xl p-6 relative overflow-hidden group active:scale-95 transition-transform">
                    <div className="absolute top-0 left-0 bg-[#FF6B00] text-white text-[8px] font-black px-3 py-1 rounded-br-2xl uppercase tracking-tighter">超值推荐</div>
                    <div className="flex justify-end mb-4">
                       <CheckCircle2 size={24} className="text-[#FF6B00]" fill="currentColor" />
                    </div>
                    <p className="text-xs font-black text-gray-600 mb-1">年卡会员</p>
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className="text-sm font-black text-[#FF6B00]">¥</span>
                       <span className="text-3xl font-black text-[#FF6B00]">29</span>
                       <span className="text-[10px] font-bold text-gray-400">/ 年</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mb-4">每天不到1毛钱</p>
                    <div className="bg-orange-100/50 py-1.5 rounded-full text-center">
                       <span className="text-[9px] font-black text-[#FF6B00]">相当于每天 ¥2.4/月</span>
                    </div>
                 </div>
                 <div className="border-2 border-gray-100 bg-white rounded-3xl p-6 active:scale-95 transition-transform">
                    <div className="flex justify-end mb-4">
                       <div className="w-6 h-6 rounded-full border-2 border-gray-100" />
                    </div>
                    <p className="text-xs font-black text-gray-600 mb-1">月卡会员</p>
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className="text-sm font-black text-gray-800">¥</span>
                       <span className="text-3xl font-black text-gray-800">9.9</span>
                       <span className="text-[10px] font-bold text-gray-400">/ 月</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mb-4">灵活开通 随时取消</p>
                 </div>
              </div>

              <button className="w-full bg-[#FF6B00] text-white py-5 rounded-[24px] font-black text-lg shadow-orange active:scale-[0.98] transition-all mb-8">
                 立即开通 VIP
              </button>

              <div className="flex justify-center gap-6 text-[10px] text-gray-400 font-bold tracking-tight mb-12">
                 <div className="flex items-center gap-1"><CheckCircle2 size={12} /> 安全支付</div>
                 <div className="flex items-center gap-1"><CheckCircle2 size={12} /> 随时可取消</div>
                 <div className="flex items-center gap-1"><CheckCircle2 size={12} /> 专属客服服务</div>
              </div>

              <div className="space-y-2">
                <div 
                  onClick={() => setShowMyRecipes(true)}
                  className="flex justify-between items-center p-5 bg-white rounded-3xl shadow-card border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF6B00]">
                       <BookOpen size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-gray-700">我的菜谱</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-300">{recipes.filter(r => r.creatorId === 'user').length}</span>
                    <ChevronRight className="text-gray-200" size={20} strokeWidth={3} />
                  </div>
                </div>
                {['个人偏好', '我的收藏', '饮食历程', '设置'].map(item => (
                  <div key={item} className="flex justify-between items-center p-5 bg-white rounded-3xl shadow-card border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer">
                    <span className="font-black text-gray-700">{item}</span>
                    <ChevronRight className="text-gray-200" size={20} strokeWidth={3} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {selectedRecipe && (
            <RecipeDetail 
              recipe={selectedRecipe} 
              onClose={() => setSelectedRecipe(null)} 
              onAddShopping={addShopping}
              onAddSingleShopping={addSingleShoppingItem}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.some(f => f.recipeId === selectedRecipe.id)}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showMyRecipes && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white z-[200] overflow-y-auto"
            >
              <div className="max-w-md mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">我的菜谱</h2>
                  <button onClick={() => setShowMyRecipes(false)} className="p-2 bg-gray-50 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  {recipes.filter(r => r.creatorId === 'user').length > 0 ? (
                    recipes.filter(r => r.creatorId === 'user').map(r => (
                      <div 
                        key={r.id} 
                        onClick={() => {
                          setSelectedRecipe(r);
                          setShowMyRecipes(false);
                        }}
                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-3xl active:bg-orange-50 transition-colors cursor-pointer"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {r.image ? <img src={r.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <ChefHat size={24} className="m-auto text-gray-300" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">{r.title}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{r.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-300 font-bold mb-4">你还没有创作过菜谱</p>
                      <button 
                        onClick={() => {
                          setShowMyRecipes(false);
                          setActiveTab('discovery');
                        }}
                        className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                      >
                        去发现页添加
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
