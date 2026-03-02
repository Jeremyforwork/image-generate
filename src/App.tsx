import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Download, RefreshCw, Loader2, LogOut, Clock, Plus } from 'lucide-react';
import { supabase } from './lib/supabase';
import { apiGenerate, saveHistory } from './lib/api';
import { t, type Lang } from './lib/i18n';
import AuthPage from './components/AuthPage';
import HistoryPanel from './components/HistoryPanel';
import LangSwitch from './components/LangSwitch';
import type { Session } from '@supabase/supabase-js';

const CATEGORIES = [
  { id: 'clothing', label: 'Clothing' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'cosmetics', label: 'Cosmetics' },
  { id: 'food', label: 'Food & Beverage' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'toys', label: 'Toys' },
  { id: 'bags', label: 'Bags' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'other', label: 'Other' },
];
const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

const MODELS = [
  { id: 'none', label: 'None', prompt: '', color: 'bg-gray-800' },
  { id: 'woman_casual', label: 'Woman (Casual)', prompt: '一位阳光的年轻女模特', color: 'bg-blue-900/50' },
  { id: 'man_casual', label: 'Man (Casual)', prompt: '一位阳光的年轻男模特', color: 'bg-green-900/50' },
  { id: 'woman_pro', label: 'Woman (Pro)', prompt: '一位气质优雅的职业女模特', color: 'bg-purple-900/50' },
  { id: 'man_pro', label: 'Man (Pro)', prompt: '一位成熟稳重的职业男模特', color: 'bg-slate-800' },
];

const BACKGROUNDS = [
  { id: 'mediterranean', label: 'Mediterranean', prompt: '背景是一座简约的地中海风格别墅，白色灰泥墙，多个圆拱，阳台栏杆沐浴在明亮的阳光下，前景是郁郁葱葱的绿草', color: 'bg-amber-900/30' },
  { id: 'urban', label: 'Urban Street', prompt: '背景是现代都市街道，玻璃幕墙建筑，阳光洒落，街道干净整洁', color: 'bg-indigo-900/30' },
  { id: 'nature', label: 'Nature Park', prompt: '背景是绿意盎然的公园，大树成荫，阳光透过树叶洒下斑驳光影', color: 'bg-emerald-900/30' },
  { id: 'cafe', label: 'Café', prompt: '背景是一家精致的户外咖啡厅，暖色调装饰，氛围轻松惬意', color: 'bg-orange-900/30' },
  { id: 'beach', label: 'Beach', prompt: '背景是阳光明媚的海滩，蓝天白云，远处是碧蓝的海水', color: 'bg-cyan-900/30' },
  { id: 'minimal', label: 'Minimal', prompt: '背景是简约的浅灰色纯色背景，柔和的自然光', color: 'bg-gray-800' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });
  const [showHistory, setShowHistory] = useState(false);

  const [productImage, setProductImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [category, setCategory] = useState('clothing');
  const [sceneDescription, setSceneDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [selectedModel, setSelectedModel] = useState('man_casual');
  const [selectedBackground, setSelectedBackground] = useState('mediterranean');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#84cc16]" />
      </div>
    );
  }

  // Not logged in → show auth page
  if (!session) {
    return <AuthPage lang={lang} onLangChange={handleLangChange} />;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
        setImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const buildPrompt = () => {
    const model = MODELS.find(m => m.id === selectedModel);
    const bg = BACKGROUNDS.find(b => b.id === selectedBackground);
    const modelDesc = model?.prompt || '一位阳光的年轻模特';
    const bgDesc = bg?.prompt || '背景是户外自然场景，阳光明媚';

    // Category-specific prompt templates
    const categoryPrompts: Record<string, { front: string; back: string; outdoor: string }> = {
      clothing: {
        front: `一张高分辨率的棚拍商品图，${modelDesc}，上身穿提供的图片中的衣服，下身黑色亚麻长裤，正面中景拍摄。双手插兜，白色背景干净整洁，采用影棚灯光，适用于电商产品摄影，细节丰富`,
        back: `一张高分辨率的棚拍商品图，${modelDesc}，上身穿提供的图片中的衣服，下身黑色亚麻长裤，背面中景拍摄。白色背景干净整洁，采用影棚灯光，适用于电商产品摄影，细节丰富`,
        outdoor: `一张专业的电商摄影照片，中景镜头，${modelDesc}站在户外，上身穿提供的图片中的衣服，下身黑色亚麻长裤，双手自然放松。${bgDesc}。面料纹理细节丰富，模特清晰对焦`,
      },
      shoes: {
        front: `一张高分辨率的棚拍商品图，${modelDesc}，脚穿提供的图片中的鞋子，搭配深色休闲裤，正面全身拍摄。白色背景干净整洁，采用影棚灯光，鞋子细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，${modelDesc}，脚穿提供的图片中的鞋子，搭配深色休闲裤，背面全身拍摄。白色背景干净整洁，采用影棚灯光，鞋底和鞋跟细节清晰`,
        outdoor: `一张专业的电商摄影照片，全身镜头，${modelDesc}站在户外，脚穿提供的图片中的鞋子，搭配深色休闲裤，自然站姿。${bgDesc}。鞋子细节丰富，模特清晰对焦`,
      },
      bags: {
        front: `一张高分辨率的棚拍商品图，${modelDesc}，手提/肩背提供的图片中的包包，正面中景拍摄。白色背景干净整洁，采用影棚灯光，包包正面细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，${modelDesc}，手提/肩背提供的图片中的包包，背面中景拍摄。白色背景干净整洁，采用影棚灯光，包包背面细节清晰`,
        outdoor: `一张专业的电商摄影照片，中景镜头，${modelDesc}站在户外，手提/肩背提供的图片中的包包，姿态自然优雅。${bgDesc}。包包细节丰富，模特清晰对焦`,
      },
      jewelry: {
        front: `一张高分辨率的棚拍商品图，${modelDesc}，佩戴提供的图片中的饰品，正面特写拍摄。白色背景干净整洁，采用影棚灯光，饰品细节清晰闪亮，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，${modelDesc}，佩戴提供的图片中的饰品，侧面特写拍摄。白色背景干净整洁，采用影棚灯光，饰品不同角度细节清晰`,
        outdoor: `一张专业的电商摄影照片，中近景镜头，${modelDesc}站在户外，佩戴提供的图片中的饰品，姿态优雅。${bgDesc}。饰品细节丰富闪亮，模特清晰对焦`,
      },
      cosmetics: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的化妆品/护肤品放置在大理石台面上，正面拍摄。白色背景干净整洁，采用影棚灯光，产品标签和包装细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的化妆品/护肤品放置在大理石台面上，背面拍摄展示成分表。白色背景干净整洁，采用影棚灯光，文字细节清晰`,
        outdoor: `一张专业的电商摄影照片，提供的图片中的化妆品/护肤品放置在户外场景中，周围点缀鲜花和绿叶。${bgDesc}。产品细节丰富，光影自然柔和`,
      },
      electronics: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的电子产品放置在简约展台上，正面45度角拍摄。白色背景干净整洁，采用影棚灯光，产品外观和屏幕细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的电子产品放置在简约展台上，背面拍摄展示接口和细节。白色背景干净整洁，采用影棚灯光，细节清晰`,
        outdoor: `一张专业的电商摄影照片，提供的图片中的电子产品在使用场景中展示，${modelDesc}正在使用该产品。${bgDesc}。产品细节丰富，场景自然真实`,
      },
      furniture: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的家具放置在简约空间中，正面拍摄。白色背景干净整洁，采用影棚灯光，家具材质和工艺细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的家具放置在简约空间中，背面/侧面拍摄。白色背景干净整洁，采用影棚灯光，结构和材质细节清晰`,
        outdoor: `一张专业的家居场景摄影照片，提供的图片中的家具放置在精心布置的房间中，搭配协调的装饰品。温暖的自然光从窗户洒入，营造舒适的居家氛围。家具细节丰富，场景真实自然`,
      },
      food: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的食品/饮料放置在精致的餐具上，正面俯拍45度角。白色背景干净整洁，采用影棚灯光，食品色泽诱人，包装细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的食品/饮料包装背面展示，营养成分表清晰可见。白色背景干净整洁，采用影棚灯光，文字细节清晰`,
        outdoor: `一张专业的美食摄影照片，提供的图片中的食品/饮料放置在户外餐桌上，搭配精致餐具和装饰。${bgDesc}。食品色泽诱人，光影自然`,
      },
      toys: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的玩具放置在彩色展台上，正面拍摄。白色背景干净整洁，采用影棚灯光，玩具色彩鲜艳，细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的玩具放置在彩色展台上，背面/侧面拍摄。白色背景干净整洁，采用影棚灯光，展示不同角度的细节`,
        outdoor: `一张专业的电商摄影照片，一个可爱的小朋友正在开心地玩耍提供的图片中的玩具。${bgDesc}。玩具细节丰富，色彩鲜艳，场景温馨自然`,
      },
      other: {
        front: `一张高分辨率的棚拍商品图，提供的图片中的产品放置在简约展台上，正面拍摄。白色背景干净整洁，采用影棚灯光，产品细节清晰，适用于电商产品摄影`,
        back: `一张高分辨率的棚拍商品图，提供的图片中的产品放置在简约展台上，背面/侧面拍摄。白色背景干净整洁，采用影棚灯光，展示不同角度的细节`,
        outdoor: `一张专业的电商摄影照片，提供的图片中的产品在实际使用场景中展示。${bgDesc}。产品细节丰富，场景自然真实`,
      },
    };

    const templates = categoryPrompts[category] || categoryPrompts.other;
    let extra = '';
    if (sceneDescription) extra = `。额外要求：${sceneDescription}`;

    const prompt = `生成一套3张亚马逊商品图，使用同一模特和统一风格：
1. 正面展示：${templates.front}${extra}
2. 背面展示：${templates.back}${extra}
3. 户外场景：${templates.outdoor}${extra}`;

    return prompt;
  };

  const cancelGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsGenerating(false);
  };

  const clearImage = () => {
    cancelGeneration();
    setProductImage(null);
    setImageUrl('');
    setError(null);
    setGeneratedImages([]);
    setSelectedResult(null);
  };

  const resetAll = () => {
    clearImage();
    setCategory('clothing');
    setSceneDescription('');
    setAspectRatio('3:4');
    setSelectedModel('man_casual');
    setSelectedBackground('mediterranean');
  };

  const handleGenerate = async () => {
    if (!productImage && !imageUrl) {
      setError(t('gen.noImage', lang));
      return;
    }

    // Cancel any in-flight request
    cancelGeneration();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setSelectedResult(null);

    try {
      const prompt = buildPrompt();
      // API accepts URL or full data URI (data:image/png;base64,xxx)
      const imagePayload = imageUrl || productImage || '';

      const data = await apiGenerate({ prompt, image: imagePayload, numImages: 3, aspectRatio }, controller.signal);

      // If aborted while awaiting, don't update state
      if (controller.signal.aborted) return;

      const urls: string[] = data.data?.map((item: any) => item.url).filter(Boolean) || [];
      if (urls.length === 0) throw new Error('No images generated');

      setGeneratedImages(urls);
      setSelectedResult(urls[0]);

      try {
        await saveHistory({
          image_urls: urls,
          prompt,
          options: { category, sceneDescription, aspectRatio, model: selectedModel, background: selectedBackground },
        });
      } catch { /* non-critical */ }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      console.error(err);
      setError(err.message || 'Failed to generate images.');
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans overflow-hidden">
      {showHistory && (
        <HistoryPanel
          lang={lang}
          onClose={() => setShowHistory(false)}
          onSelect={(images) => {
            setGeneratedImages(images);
            setSelectedResult(images[0]);
            setShowHistory(false);
          }}
        />
      )}

      {/* Sidebar */}
      <div className="w-[420px] flex flex-col bg-[#141414] border-r border-white/10 h-full z-10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={resetAll} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title={t('gen.newTask', lang)}>
              <Plus className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">{t('gen.title', lang)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitch lang={lang} onChange={handleLangChange} />
            <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title={t('gen.history', lang)}>
              <Clock className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={handleSignOut} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title={t('gen.signOut', lang)}>
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500 max-w-[100px] truncate">{session.user.email}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {/* Product Image Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.productImage', lang)}</label>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder={t('gen.urlPlaceholder', lang)} value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); if (e.target.value) setProductImage(null); }} className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-white/30 transition-colors" />
            </div>
            {productImage || imageUrl ? (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 group">
                <img src={productImage || imageUrl} alt="Product" className="w-full h-full object-contain" onError={() => { if (imageUrl) setError(t('gen.urlError', lang)); }} />
                <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-gray-500 mb-2" />
                <span className="text-sm text-gray-400">{t('gen.uploadClick', lang)}</span>
                <span className="text-xs text-gray-600 mt-1">{t('gen.uploadHint', lang)}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.category', lang)}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t(`cat.${c.id}` as any, lang)}</option>)}
            </select>
          </div>

          {/* Scene Description */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.scene', lang)}</label>
            <textarea value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)} placeholder={t('gen.scenePlaceholder', lang)} className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm h-24 resize-none focus:outline-none focus:border-white/30 transition-colors custom-scrollbar" />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.aspectRatio', lang)}</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none">
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Models */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.models', lang)}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {MODELS.map(model => (
                <button key={model.id} onClick={() => setSelectedModel(model.id)} className={`flex-shrink-0 w-20 h-24 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${model.color} ${selectedModel === model.id ? 'border-[#84cc16]' : 'border-white/5 hover:border-white/20'}`}>
                  <span className="text-xs text-center px-1 text-gray-300 leading-tight">{t(`model.${model.label}` as any, lang)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Backgrounds */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">{t('gen.background', lang)}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {BACKGROUNDS.map(bg => (
                <button key={bg.id} onClick={() => setSelectedBackground(bg.id)} className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${bg.color} ${selectedBackground === bg.id ? 'border-[#84cc16]' : 'border-white/5 hover:border-white/20'}`}>
                  <span className="text-xs text-center px-1 text-gray-300 leading-tight">{t(`bg.${bg.label}` as any, lang)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-5 border-t border-white/10 bg-[#141414]">
          {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
          <button onClick={handleGenerate} disabled={isGenerating || (!productImage && !imageUrl)} className="w-full bg-[#84cc16] hover:bg-[#65a30d] disabled:bg-[#84cc16]/50 disabled:cursor-not-allowed text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" />{t('gen.generating', lang)}</>) : t('gen.generate', lang)}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-[#0a0a0a]">
        {selectedResult ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            <div className="relative max-w-full max-h-[75vh] rounded-2xl overflow-hidden bg-black/50 shadow-2xl flex items-center justify-center border border-white/5">
              <img src={selectedResult} alt="Generated" className="max-w-full max-h-[75vh] object-contain" />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={resetAll} className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/10">
                  <Plus className="w-4 h-4" />{t('gen.startNew', lang)}
                </button>
                <button onClick={handleGenerate} className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/10">
                  <RefreshCw className="w-4 h-4" />{t('gen.improve', lang)}
                </button>
                <button onClick={() => { const a = document.createElement('a'); a.href = selectedResult; a.download = `product-shot-${Date.now()}.png`; a.click(); }} className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" />{t('gen.download', lang)}
                </button>
              </div>
            </div>
            {generatedImages.length > 1 && (
              <div className="flex gap-3 mt-4">
                {generatedImages.map((img, idx) => {
                  const labels = lang === 'zh' ? ['正面', '背面', '户外'] : ['Front', 'Back', 'Outdoor'];
                  return (
                    <button key={idx} onClick={() => setSelectedResult(img)} className={`relative flex flex-col items-center gap-1.5 transition-all`}>
                      <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedResult === img ? 'border-[#84cc16] scale-105 shadow-lg shadow-[#84cc16]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs text-gray-500">{labels[idx] || `#${idx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4 opacity-40">
            <ImageIcon className="w-16 h-16 mx-auto" />
            <p className="text-lg">{t('gen.placeholder', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
