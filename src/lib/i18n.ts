export type Lang = 'en' | 'zh';

const dict = {
  // Auth page
  'auth.title': { en: 'Product Image Generator', zh: '产品图生成工具' },
  'auth.subtitle': { en: 'AI-powered product photography for e-commerce', zh: 'AI 驱动的电商产品摄影' },
  'auth.signIn': { en: 'Sign In', zh: '登录' },
  'auth.signUp': { en: 'Sign Up', zh: '注册' },
  'auth.email': { en: 'Email', zh: '邮箱' },
  'auth.password': { en: 'Password', zh: '密码' },
  'auth.emailPlaceholder': { en: 'you@example.com', zh: '请输入邮箱' },
  'auth.passwordPlaceholder': { en: 'At least 6 characters', zh: '至少6位字符' },
  'auth.noAccount': { en: "Don't have an account?", zh: '还没有账号？' },
  'auth.hasAccount': { en: 'Already have an account?', zh: '已有账号？' },
  'auth.signUpSuccess': { en: 'Registration successful! Please check your email to confirm.', zh: '注册成功！请查看邮箱确认。' },

  // Generator page
  'gen.title': { en: 'Generate images', zh: '生成图片' },
  'gen.productImage': { en: 'Product Image', zh: '产品图片' },
  'gen.urlPlaceholder': { en: 'Or paste an image URL here...', zh: '或粘贴图片链接...' },
  'gen.uploadClick': { en: 'Click or drag to upload', zh: '点击或拖拽上传' },
  'gen.uploadHint': { en: 'PNG, JPG up to 5MB', zh: 'PNG、JPG，最大 5MB' },
  'gen.category': { en: 'Product Category', zh: '产品类目' },
  'gen.scene': { en: 'Extra Requirements (Optional)', zh: '额外要求（选填）' },
  'gen.scenePlaceholder': { en: 'Any extra details for the shoot...', zh: '补充拍摄要求，如特定姿势、配饰等...' },
  'gen.aspectRatio': { en: 'Aspect Ratio', zh: '画面比例' },
  'gen.numImages': { en: 'Number of Images', zh: '生成数量' },
  'gen.models': { en: 'Human Models', zh: '人物模特' },
  'gen.background': { en: 'Outdoor Background', zh: '户外场景背景' },
  'gen.generate': { en: 'Generate', zh: '生成' },
  'gen.generating': { en: 'Generating...', zh: '生成中...' },
  'gen.improve': { en: 'Improve Result', zh: '优化结果' },
  'gen.download': { en: 'Download', zh: '下载' },
  'gen.placeholder': { en: 'Upload a product and click Generate', zh: '上传产品图片并点击生成' },
  'gen.history': { en: 'History', zh: '历史记录' },
  'gen.signOut': { en: 'Sign Out', zh: '退出登录' },
  'gen.noImage': { en: 'Please upload a product image or provide an image URL first.', zh: '请先上传产品图片或提供图片链接。' },
  'gen.urlError': { en: 'Failed to load image from URL', zh: '无法加载图片链接' },
  'gen.newTask': { en: 'New', zh: '新建' },
  'gen.startNew': { en: 'Start New', zh: '开始新任务' },

  // History
  'history.title': { en: 'Generation History', zh: '生成历史' },
  'history.empty': { en: 'No generation history yet', zh: '暂无生成记录' },
  'history.deleteConfirm': { en: 'Delete this record?', zh: '确定删除这条记录？' },

  // Categories
  'cat.clothing': { en: 'Clothing', zh: '服装' },
  'cat.electronics': { en: 'Electronics', zh: '电子产品' },
  'cat.furniture': { en: 'Furniture', zh: '家具' },
  'cat.cosmetics': { en: 'Cosmetics', zh: '美妆护肤' },
  'cat.food': { en: 'Food & Beverage', zh: '食品饮料' },
  'cat.jewelry': { en: 'Jewelry', zh: '珠宝饰品' },
  'cat.toys': { en: 'Toys', zh: '玩具' },
  'cat.bags': { en: 'Bags', zh: '箱包' },
  'cat.shoes': { en: 'Shoes', zh: '鞋靴' },
  'cat.other': { en: 'Other', zh: '其他' },

  // Models
  'model.None': { en: 'None', zh: '无' },
  'model.Woman (Casual)': { en: 'Woman (Casual)', zh: '女性（休闲）' },
  'model.Man (Casual)': { en: 'Man (Casual)', zh: '男性（休闲）' },
  'model.Woman (Pro)': { en: 'Woman (Pro)', zh: '女性（商务）' },
  'model.Man (Pro)': { en: 'Man (Pro)', zh: '男性（商务）' },

  // Backgrounds (for outdoor scene)
  'bg.Mediterranean': { en: 'Mediterranean', zh: '地中海' },
  'bg.Urban Street': { en: 'Urban Street', zh: '都市街道' },
  'bg.Nature Park': { en: 'Nature Park', zh: '自然公园' },
  'bg.Café': { en: 'Café', zh: '咖啡厅' },
  'bg.Beach': { en: 'Beach', zh: '海滩' },
  'bg.Minimal': { en: 'Minimal', zh: '简约' },
} as const;

type Key = keyof typeof dict;

export function t(key: Key, lang: Lang): string {
  return dict[key]?.[lang] ?? key;
}
