/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent, ChangeEvent, useEffect } from 'react';
import { 
  Car, 
  Truck, 
  Home, 
  Wrench, 
  Smartphone,
  Tv,
  Sofa,
  Shirt,
  ConciergeBell,
  Briefcase,
  Settings,
  Megaphone,
  MoreHorizontal, 
  Search, 
  PlusCircle, 
  MapPin, 
  Clock, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  User as UserIcon,
  ShoppingBag,
  Zap,
  TrendingUp,
  Mail,
  Shield,
  Eye,
  HandCoins,
  Bell,
  Send,
  Facebook,
  Instagram,
  Heart,
  Bookmark,
  LogOut,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, CartItem } from './types';
import { auth, signInWithGoogle, logout, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, getDocFromServer, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/AdminPanel';

const CATEGORIES: { name: Category; icon: any }[] = [
  { name: 'سيارات', icon: Car },
  { name: 'شاحنات', icon: Truck },
  { name: 'عقار', icon: Home },
  { name: 'آلات', icon: Wrench },
  { name: 'قطع غيار', icon: Settings },
  { name: 'هواتف و إكسسوارات', icon: Smartphone },
  { name: 'أجهزة إلكترونية و كهرومنزلية', icon: Tv },
  { name: 'اثاث منزل', icon: Sofa },
  { name: 'ملابس', icon: Shirt },
  { name: 'خدمات', icon: ConciergeBell },
  { name: 'طلبات عمل', icon: Briefcase },
  { name: 'غير ذلك', icon: MoreHorizontal },
];

const LOCATIONS = [
  'باتنة',
  'آريس',
  'إشمول',
  'أمدوكال',
  'أولاد سلام',
  'أولاد سي سليمان',
  'أولاد عمار',
  'أولاد عوف',
  'أولاد فاضل',
  'إينوغيسن',
  'بريكة',
  'بني فضالة الحقانية',
  'بوزينة',
  'بولهيلات',
  'بومقر',
  'بومية',
  'بيطام',
  'تازولت',
  'تاكسلانت',
  'تالخمت',
  'تغرغار',
  'تكوت',
  'تيغانمين',
  'تيلاطو',
  'تيمقاد',
  'ثنية العابد',
  'الحاسي',
  'حيدوسة',
  'رأس العيون',
  'الرحبات',
  'زانة البيضاء',
  'سريانة',
  'سفيان',
  'سقانة',
  'الشمرة',
  'شير',
  'عزيل عبد القادر',
  'عين التوتة',
  'عين جاسر',
  'عين ياقوت',
  'عيون العصافير',
  'غسيرة',
  'فسديس',
  'فم الطوب',
  'القصبات',
  'قصر بلزمة',
  'القيقبة',
  'كيمل',
  'لارباع',
  'لازرو',
  'لمسان',
  'مروانة',
  'معافة',
  'المعذر',
  'منعة',
  'نقاوس',
  'وادي الشعبة',
  'وادي الطاقة',
  'وادي الماء'
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'تويوتا كامري 2023 - حالة ممتازة',
    description: 'سيارة تويوتا كامري للبيع، عداد 10,000 كم، صيانة دورية بالوكالة.',
    price: 85000,
    category: 'سيارات',
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop',
    location: 'باتنة',
    createdAt: Date.now() - 3600000 * 2,
    ownerId: 'system',
    ownerName: 'أحمد علي',
    isPromoted: true,
  },
  {
    id: '2',
    title: 'شاحنة مرسيدس اكتروس 2018',
    description: 'شاحنة للبيع بحالة جيدة جداً، جاهزة للعمل.',
    price: 250000,
    category: 'شاحنات',
    imageUrl: 'https://images.unsplash.com/photo-1591768793355-74d7c514c39e?q=80&w=800&auto=format&fit=crop',
    location: 'بريكة',
    createdAt: Date.now() - 3600000 * 48,
    ownerId: 'system',
    ownerName: 'مؤسسة النقل',
  },
  {
    id: '3',
    title: 'شقة فاخرة في وسط المدينة',
    description: 'شقة 4 غرف وصالة، تشطيب سوبر لوكس، مساحة 150 متر.',
    price: 1200000,
    category: 'عقار',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
    location: 'باتنة',
    createdAt: Date.now() - 3600000 * 24,
    ownerId: 'system',
    ownerName: 'شركة العقارات العالمية',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [adSpaceText, setAdSpaceText] = useState('مساحة مخصصة لإعلاناتكم المميزة هنا');
  const [adSpaceImage, setAdSpaceImage] = useState('');
  const [adSpaceLink, setAdSpaceLink] = useState('');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const isAdmin = currentUser?.email === 'housseynbk10@gmail.com';

  // Form State
  const [newAd, setNewAd] = useState({
    title: '',
    category: 'سيارات' as Category,
    price: '',
    description: '',
    location: 'باتنة',
    imageUrl: '',
    images: [] as string[],
    phone: '',
    ownerName: '',
    email: '',
    isPromoted: false,
  });

  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Site Settings (Ad Space)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.adSpaceText) setAdSpaceText(data.adSpaceText);
        if (data.adSpaceImage) setAdSpaceImage(data.adSpaceImage);
        if (data.adSpaceLink) setAdSpaceLink(data.adSpaceLink);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cart Persistence & Sync
  useEffect(() => {
    // Load from local storage initially
    const savedCart = localStorage.getItem('souq_batna_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Sync with Firestore if logged in
    const cartPath = `users/${currentUser.uid}/cart`;
    const unsubscribe = onSnapshot(collection(db, cartPath), (snapshot) => {
      const remoteCart = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];
      
      if (remoteCart.length > 0) {
        setCartItems(remoteCart);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Save to local storage whenever cart changes
    localStorage.setItem('souq_batna_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (product: Product) => {
    const existing = cartItems.find(item => item.id === product.id);
    let newCart: CartItem[];

    if (existing) {
      newCart = cartItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cartItems, { ...product, quantity: 1 }];
    }

    setCartItems(newCart);
    setShowCart(true);

    // Sync to Firestore if logged in
    if (currentUser) {
      const itemRef = doc(db, `users/${currentUser.uid}/cart`, product.id);
      try {
        await setDoc(itemRef, {
          ...product,
          quantity: (existing?.quantity || 0) + 1
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}/cart/${product.id}`);
      }
    }
  };

  const handleDeleteAd = async (productId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteDoc(doc(db, 'ads', productId));
      setSelectedProduct(null);
      setNotification({ message: 'تم حذف الإعلان بنجاح.', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ads/${productId}`);
      setNotification({ message: 'حدث خطأ أثناء الحذف.', type: 'error' });
    }
  };

  const updateCartQuantity = async (id: string, delta: number) => {
    const newCart = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(newCart);

    if (currentUser) {
      const itemRef = doc(db, `users/${currentUser.uid}/cart`, id);
      try {
        const item = newCart.find(i => i.id === id);
        if (item) {
          await updateDoc(itemRef, { quantity: item.quantity });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}/cart/${id}`);
      }
    }
  };

  const removeFromCart = async (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));

    if (currentUser) {
      const itemRef = doc(db, `users/${currentUser.uid}/cart`, id);
      try {
        await deleteDoc(itemRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${currentUser.uid}/cart/${id}`);
      }
    }
  };

  const handleCheckout = () => {
    alert("سيتم نقلك إلى صفحة الدفع قريباً. شكراً لتسوقك من سوق باتنة!");
    setShowCart(false);
  };

  useEffect(() => {
    // Real-time ads from Firestore
    const adsPath = 'ads';
    const q = query(collection(db, adsPath), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || Date.now()
      })) as Product[];
      
      // Always merge with MOCK_PRODUCTS to keep initial data visible
      setProducts([...adsData, ...MOCK_PRODUCTS]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, adsPath);
      setProducts(MOCK_PRODUCTS); // Fallback
    });

    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_WIDTH = 800;
             const MAX_HEIGHT = 800;
             let width = img.width;
             let height = img.height;

             if (width > height) {
                if (width > MAX_WIDTH) {
                   height *= MAX_WIDTH / width;
                   width = MAX_WIDTH;
                }
             } else {
                if (height > MAX_HEIGHT) {
                   width *= MAX_HEIGHT / height;
                   height = MAX_HEIGHT;
                }
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
               ctx.drawImage(img, 0, 0, width, height);
               const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress heavily to avoid 1MB limit
               setNewAd(prev => {
                  const newImages = [...prev.images, dataUrl];
                  return { 
                    ...prev, 
                    images: newImages,
                    imageUrl: newImages[0] || dataUrl
                  };
               });
             }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setNewAd(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || ""
      };
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  const handlePostAd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.price || isPublishing) return;

    setIsPublishing(true);
    const adsPath = 'ads';
    try {
      const adData = {
        title: newAd.title,
        category: newAd.category,
        price: Number(newAd.price),
        description: newAd.description,
        location: newAd.location,
        imageUrl: newAd.images[0] || "",
        images: newAd.images,
        phone: newAd.phone,
        ownerEmail: newAd.email || currentUser?.email || 'guest',
        createdAt: serverTimestamp(),
        ownerId: currentUser ? currentUser.uid : 'guest',
        ownerName: newAd.ownerName || (currentUser ? (currentUser.displayName || 'مستخدم') : 'زائر'),
        isPromoted: newAd.isPromoted,
      };

      await addDoc(collection(db, adsPath), adData);

      // Do not show success notification as requested by user
      setShowPostForm(false);
      setNewAd({
        title: '',
        category: 'سيارات',
        price: '',
        description: '',
        location: 'باتنة',
        imageUrl: '',
        images: [],
        phone: '',
        ownerName: '',
        email: '',
        isPromoted: false,
      });
    } catch (error) {
      const errStr = String(error);
      setNotification({ message: `فشل النشر: ${errStr.length > 50 ? errStr.substring(0, 50) + '...' : errStr}`, type: 'error' });
      handleFirestoreError(error, OperationType.WRITE, adsPath);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-souq-bg font-sans" dir="rtl">
      {/* Global Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
          >
            <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md ${
              notification.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
            } text-white`}>
              <div className="bg-white/20 p-2 rounded-xl">
                {notification.type === 'success' ? <Zap className="w-5 h-5 fill-white" /> : <Shield className="w-5 h-5" />}
              </div>
              <span className="font-black text-sm">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="mr-auto opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Batna Market Header */}
      <header className="bg-souq-ink border-b border-white/10 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div 
              className="flex items-center gap-3 cursor-pointer group bg-white/5 hover:bg-white/10 p-2 pr-1 rounded-2xl border border-white/10 transition-all duration-300"
              onClick={() => setSelectedCategory('الكل')}
            >
               <div className="bg-souq-accent p-2 rounded-xl text-souq-ink flex items-center justify-center transform -skew-x-6 group-hover:skew-x-0 transition-all duration-500 shadow-lg shadow-souq-accent/20">
                  <ShoppingBag className="w-5 h-5 stroke-[3]" />
               </div>
               <div className="flex flex-col leading-tight pl-1">
                  <div className="flex items-center gap-1.5">
                     <span className="text-souq-accent font-black text-lg italic tracking-tighter drop-shadow-[0_2px_4px_rgba(255,210,0,0.3)]">HB</span>
                     <span className="h-4 w-[1.5px] bg-white/20"></span>
                     <span className="font-black text-base tracking-tight text-white group-hover:text-souq-accent transition-colors">سوق باتنة</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="text-[7px] font-black text-souq-accent tracking-[0.25em] uppercase">Batna Market</span>
                    <div className="h-0.5 w-0.5 rounded-full bg-souq-accent" />
                    <span className="text-[7px] font-black text-white/50 tracking-[0.1em]">2024</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-1 max-w-lg group relative">
            <div className="flex bg-white/10 hover:bg-white/15 focus-within:bg-white rounded-2xl overflow-hidden h-11 transition-all duration-300 border border-white/10 focus-within:border-souq-accent focus-within:shadow-lg focus-within:shadow-souq-accent/20 group-hover:border-white/20">
               <div className="flex items-center justify-center pr-4 pointer-events-none group-focus-within:text-souq-ink text-white/40">
                  <Search className="w-4 h-4 stroke-[2.5]" />
               </div>
               <input 
                 type="text" 
                 placeholder="ابحث..."
                 className="flex-1 px-3 text-white focus:text-souq-ink text-sm font-bold outline-none placeholder:text-white/30 focus:placeholder:text-slate-400"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <button className="bg-souq-accent px-5 text-souq-ink flex items-center justify-center hover:brightness-110 active:scale-95 transition-all font-black text-xs hidden sm:flex">
                  <span>بحث</span>
               </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowCart(true)}
               className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors group"
             >
                <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-souq-accent text-souq-ink text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-souq-ink">
                    {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                  </span>
                )}
             </button>

             <button 
              onClick={() => setShowPostForm(true)}
              className="relative group bg-souq-accent text-souq-ink px-8 py-2.5 rounded-lg font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-souq-accent/30 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <PlusCircle className="w-5 h-5 animate-bounce" />
              أضف إعلاناً مجانياً
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end leading-none">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{currentUser.displayName}</span>
                    {isAdmin && (
                      <button 
                        onClick={() => setShowAdminPanel(true)}
                        className="bg-souq-accent text-souq-ink text-[10px] px-2 py-0.5 rounded font-black hover:scale-105 transition-all"
                      >
                        لوحة المدير
                      </button>
                    )}
                  </div>
                  <button onClick={logout} className="text-[10px] text-souq-accent font-bold hover:underline">خروج</button>
                </div>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} className="w-9 h-9 rounded-full border-2 border-souq-accent shadow-lg" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-souq-accent flex items-center justify-center text-souq-ink font-black">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-sm font-bold hover:bg-white/5 transition-all"
              >
                <UserIcon className="w-4 h-4" />
                دخول
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-souq-secondary text-white overflow-x-auto no-scrollbar">
           <div className="max-w-7xl mx-auto px-4 flex">
              <button 
                onClick={() => setSelectedCategory('الكل')}
                className={`flex-shrink-0 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                  selectedCategory === 'الكل' ? 'border-souq-accent text-souq-accent' : 'border-transparent hover:text-souq-accent/80'
                }`}
              >
                الكل
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.name ? 'border-souq-accent text-souq-accent' : 'border-transparent hover:text-souq-accent/80'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* Active Paid Ad Banner - Homestyle */}
      <div className="bg-slate-100 border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border border-amber-300 group"
          >
            {/* Left Content */}
            <div className="w-full md:w-2/5 p-8 relative flex flex-col justify-center items-center text-center">
              <div className="absolute inset-0 bg-yellow-900/10 mix-blend-multiply" />
              <div className="relative z-10 w-full flex flex-col items-center">
                <span className="font-black text-amber-900 text-3xl sm:text-5xl tracking-tighter mb-1 drop-shadow-sm font-serif italic">
                  Homestyle
                </span>
                
                <h2 className="text-white font-black text-xl sm:text-2xl mb-8 drop-shadow-md text-shadow-sm px-2">
                  Le style qui fait la Difference
                </h2>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-red-700 to-red-900 text-white px-6 py-3 rounded-full mb-8 shadow-xl shadow-red-900/40 border-2 border-red-500/50">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                  <span className="font-black text-xl tracking-wider">0560 04 27 25</span>
                </div>

                <div className="flex flex-col gap-1 items-center mb-6">
                   <div className="bg-amber-900/80 backdrop-blur-sm text-yellow-300 font-black px-6 py-2 rounded-xl text-lg uppercase tracking-widest shadow-inner border border-amber-700/50">
                      Design
                   </div>
                   <div className="bg-amber-900/80 backdrop-blur-sm text-yellow-300 font-black px-6 py-2 rounded-xl text-lg uppercase tracking-widest shadow-inner border border-amber-700/50">
                      Qualité, prix
                   </div>
                </div>

                <a href="#" className="bg-amber-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-amber-900/30 flex items-center gap-2 group-hover:scale-105 active:scale-95">
                  ACHETER MAINTENANT
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </a>
              </div>
            </div>

            {/* Right Images */}
            <div className="w-full md:w-3/5 bg-white relative p-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-pattern opacity-5" />
              <div className="relative grid grid-cols-2 gap-4 w-full h-full p-4">
                 {/* Main Large Image */}
                 <div className="col-span-2 md:col-span-1 md:row-span-2 rounded-2xl overflow-hidden shadow-lg border-4 border-amber-100 group-hover:shadow-xl group-hover:border-amber-200 transition-all">
                    <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Sofa" />
                 </div>
                 {/* Secondary Images */}
                 <div className="col-span-1 rounded-2xl overflow-hidden shadow-lg border-4 border-slate-100 group-hover:border-amber-100 transition-all h-32 md:h-auto">
                    <img src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover" alt="Bedroom" />
                 </div>
                 <div className="col-span-1 rounded-2xl overflow-hidden shadow-lg border-4 border-slate-100 group-hover:border-amber-100 transition-all h-32 md:h-auto">
                    <img src="https://images.unsplash.com/photo-1604578762246-41134e37f9cc?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover" alt="Dining" />
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
         {/* Hero CTA for Visitors */}
         {!currentUser && (
           <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-souq-accent" />
              <div className="space-y-2 text-center md:text-right">
                 <h2 className="text-2xl font-black text-souq-ink">هل تريد بيع شيء ما؟</h2>
                 <p className="text-slate-500 font-medium tracking-tight">انشر إعلانك الآن مجاناً وبسرعة دون الحاجة لإنشاء حساب!</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                   onClick={() => setShowPostForm(true)}
                   className="bg-souq-secondary text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-souq-ink transition-colors shadow-lg shadow-souq-secondary/20 flex items-center gap-3 active:scale-95"
                >
                   <PlusCircle className="w-6 h-6" />
                   ابدأ البيع الآن
                </button>
                <button 
                   onClick={signInWithGoogle}
                   className="bg-white text-souq-ink border-2 border-slate-200 px-8 py-4 rounded-xl font-black text-lg hover:border-souq-accent transition-all flex items-center gap-3 active:scale-95"
                >
                   <UserIcon className="w-6 h-6" />
                   تسجيل الدخول
                </button>
              </div>
           </motion.div>
         )}

         {currentUser && (
           <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-emerald-500" />
              <div className="space-y-2 text-center md:text-right">
                 <h2 className="text-2xl font-black text-souq-ink">مرحباً بك مجدداً، {currentUser.displayName}!</h2>
                 <p className="text-slate-500 font-medium tracking-tight">لديك إعلانات نشطة. هل تريد إضافة المزيد؟</p>
              </div>
              <button 
                 onClick={() => setShowPostForm(true)}
                 className="bg-souq-secondary text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-souq-ink transition-colors shadow-lg shadow-souq-secondary/20 flex items-center gap-3 active:scale-95"
              >
                 <PlusCircle className="w-6 h-6" />
                 أنشر إعلاناً الآن
              </button>
           </motion.div>
         )}

         {/* Promotion Banner */}
         {isAdmin && (
           <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-souq-ink rounded-2xl overflow-hidden relative group border border-souq-accent/20"
           >
              <div className="absolute top-0 right-0 w-64 h-64 bg-souq-accent/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-souq-accent/20 transition-colors duration-700"></div>
              <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex-1 text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                       <div className="inline-flex items-center gap-2 bg-souq-accent/20 text-souq-accent px-3 py-1 rounded-full text-xs font-black">
                          <Zap className="w-3 h-3 fill-souq-accent" />
                          لوحة المدير فقط
                       </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">انشر <span className="text-souq-accent underline decoration-souq-accent/30">إعلاناً مميزاً</span> الان</h2>
                    <p className="text-slate-400 font-bold max-w-xl">
                       هذا القسم مخصص للمشرف فقط. يمكنك إضافة إعلانات مميزة تظهر في مقدمة النتائج وبشارة ذهبية ملفتة للنظر <span className="text-white italic">لمدة 30 يوماً كاملة</span>.
                    </p>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                    <motion.button 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => setShowPostForm(true)}
                       className="w-full bg-souq-accent text-souq-ink px-8 py-3 rounded-xl font-black text-sm shadow-xl shadow-souq-accent/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                       <Zap className="w-4 h-4 fill-souq-ink" />
                       إضافة إعلان مميز للعملاء
                    </motion.button>
                 </div>
              </div>
           </motion.div>
         )}

         <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
               <div className="h-6 w-1.5 bg-souq-accent rounded-full"></div>
               <h2 className="text-xl font-black text-souq-ink">
                  {selectedCategory === 'الكل' ? 'آخر الإعلانات' : `إعلانات الـ ${selectedCategory}`}
               </h2>
            </div>
            {isAdmin && (
               <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPostForm(true)}
                  className="hidden sm:flex items-center gap-2 bg-white border border-souq-accent/30 px-3 py-1.5 rounded-lg shadow-sm hover:border-souq-accent transition-colors"
               >
                  <Zap className="w-4 h-4 text-souq-accent fill-souq-accent" />
                  <span className="text-xs font-black text-souq-ink">نشر إعلان مميز (مدير)</span>
               </motion.button>
            )}
         </div>

         {/* Products Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
               {filteredProducts.map((product) => (
                  <motion.div 
                    layout
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentImageIndex(0);
                    }}
                    className={`bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all group relative flex flex-col cursor-pointer ${
                      product.isPromoted 
                        ? 'border-souq-accent ring-2 ring-souq-accent/20 ring-inset shadow-lg shadow-souq-accent/5' 
                        : 'border-slate-200 hover:border-souq-accent/30'
                    }`}
                  >
                     {product.isPromoted && (
                        <div className="absolute top-3 left-3 z-10">
                           <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-black px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-full animate-pulse ring-2 ring-white/50">
                              <Zap className="w-3.5 h-3.5 fill-white" />
                              إعلان مميز
                           </div>
                        </div>
                     )}
                     <div className="relative aspect-video bg-slate-50 flex items-center justify-center overflow-hidden">
                        {product.imageUrl || (product.images && product.images.length > 0) ? (
                           <>
                             <img 
                               src={product.imageUrl || (product.images && product.images[0])} 
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                               referrerPolicy="no-referrer"
                             />
                             {product.images && product.images.length > 1 && (
                               <div className="absolute bottom-2 left-2 bg-souq-ink/70 backdrop-blur text-white text-[8px] px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                                 <MoreHorizontal className="w-2 h-2" />
                                 +{product.images.length - 1}
                               </div>
                             )}
                           </>
                        ) : (
                           <div className="flex flex-col items-center gap-2 text-slate-300">
                             <ImagePlus className="w-12 h-12 stroke-[1.5]" />
                             <span className="text-[10px] font-bold">بدون صورة</span>
                           </div>
                        )}
                        <div className="absolute top-2 right-2 bg-souq-ink/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                           {product.category}
                        </div>
                     </div>

                     <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-sm font-bold mb-3 line-clamp-2 leading-snug group-hover:text-souq-secondary transition-colors">
                           {product.title}
                        </h3>
                        
                        <div className="mt-auto">
                           <div className="flex items-center justify-between mb-4">
                              <div className="text-emerald-600 text-xl font-black">
                                 {product.price.toLocaleString()} <span className="text-[10px] font-bold">DA</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="bg-souq-ink text-white p-2 rounded-lg hover:bg-souq-secondary transition-all hover:scale-110 shadow-lg"
                                title="إضافة للسلة"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-2 mb-4">
                              <a 
                                href={`tel:${product.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                              >
                                 <Smartphone className="w-3 h-3" />
                                 إتصال
                              </a>
                              <a 
                                href={`mailto:${product.ownerEmail || 'housseynbk10@gmail.com'}?subject=استفسار عن: ${product.title}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-2 py-2 bg-souq-secondary text-white rounded-lg text-xs font-black hover:bg-souq-ink transition-colors shadow-lg shadow-souq-secondary/20 active:scale-95"
                              >
                                 <Mail className="w-3 h-3" />
                                 رسالة
                              </a>
                           </div>

                           {/* Interaction & Social Share Buttons */}
                           <div className="flex items-center flex-row-reverse gap-2 mb-4 pt-4 border-t border-slate-50">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-auto">تفاعل و مشاركة:</span>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Local toggle logic for demo
                                  const target = e.currentTarget;
                                  target.classList.toggle('text-red-500');
                                  target.classList.toggle('bg-red-50');
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all duration-300 hover:scale-110 active:scale-90"
                                title="إعجاب"
                              >
                                 <Heart className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Local toggle logic for demo
                                  const target = e.currentTarget;
                                  target.classList.toggle('text-souq-secondary');
                                  target.classList.toggle('bg-blue-50');
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-blue-50 hover:text-souq-secondary transition-all duration-300 hover:scale-110 active:scale-90"
                                title="حفظ"
                              >
                                 <Bookmark className="w-3.5 h-3.5" />
                              </button>

                              <div className="w-[1px] h-6 bg-slate-100 mx-1" />

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`, '_blank');
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-[#1877F2] rounded-full hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
                                title="فيسبوك"
                              >
                                 <Facebook className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(window.location.origin);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-[#E4405F] rounded-full hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
                                title="انستغرام"
                              >
                                 <Instagram className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(product.title)}`, '_blank');
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-sky-50 text-[#0088cc] rounded-full hover:bg-[#0088cc] hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
                                title="تلغرام"
                              >
                                 <Send className="w-3.5 h-3.5 -rotate-45" />
                              </button>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                                 <MapPin className="w-3 h-3 text-red-500" />
                                 {product.location}
                              </div>
                              <div className="text-slate-400 text-[10px] font-bold">
                                 منذ {Math.floor((Date.now() - product.createdAt) / 3600000)} ساعة
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {filteredProducts.length === 0 && (
            <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-100 mt-8">
               <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <h3 className="text-xl font-black text-slate-400">لا يوجد إعلانات تطابق بحثك</h3>
            </div>
         )}
      </main>

      {/* Newsletter Section */}
      <section className="py-24 px-4 bg-souq-ink relative overflow-hidden border-t border-white/5">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <Bell className="absolute -top-10 -left-10 w-96 h-96 rotate-12 text-souq-accent" />
          <Send className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] -rotate-12 text-souq-secondary" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-souq-accent mb-8 shadow-2xl shadow-souq-accent/20 rotate-3"
          >
            <Bell className="w-10 h-10 text-souq-ink" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            لا تفوت أي صفقة رابحة!
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto font-medium"
          >
            اشترك في نشرتنا الإخبارية لتصلك أحدث الإعلانات وأفضل الأسعار مباشرة إلى بريدك الإلكتروني في ولاية باتنة.
          </motion.p>

          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-md"
              >
                <div className="relative flex-1">
                  <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="بريدك الإلكتروني"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full h-16 bg-transparent border-none rounded-2xl px-16 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 font-bold text-lg"
                  />
                </div>
                <button 
                  type="submit"
                  className="h-16 px-12 bg-souq-accent text-souq-ink font-black rounded-[1.8rem] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-souq-accent/20 flex items-center justify-center gap-3 group"
                >
                  <span className="text-lg">اشتراك</span>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 bg-emerald-500 rounded-[2.5rem] text-souq-ink font-black text-2xl flex flex-col items-center justify-center gap-4 shadow-2xl shadow-emerald-500/20"
              >
                <div className="w-16 h-16 rounded-full bg-white text-emerald-500 flex items-center justify-center mb-2">
                  <Send className="w-8 h-8" />
                </div>
                <div>تم الاشتراك بنجاح! شكراً لثقتك.</div>
                <p className="text-souq-ink/60 text-sm font-bold">ستصلك أول رسالة منا قريباً جداً.</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-xs font-black uppercase tracking-[0.2em] opacity-50">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> خصوصية آمنة</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full" />
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-souq-accent" /> عروض حصرية</span>
          </div>
        </div>
      </section>

      {/* Traditional Footer */}
      <footer className="bg-souq-ink text-white py-16 mt-20 border-t-4 border-souq-accent">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
               <div className="flex items-center gap-3 mb-8 group bg-white/5 p-2 pr-1 rounded-2xl border border-white/10 w-fit">
                  <div className="bg-souq-accent p-2 rounded-xl text-souq-ink flex items-center justify-center transform -skew-x-6 group-hover:skew-x-0 transition-all duration-500 shadow-lg shadow-souq-accent/10">
                     <ShoppingBag className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div className="flex flex-col leading-tight pl-1">
                     <div className="flex items-center gap-1.5">
                        <span className="text-souq-accent font-black text-lg italic tracking-tighter">HB</span>
                        <span className="h-4 w-[1.5px] bg-white/20"></span>
                        <span className="font-black text-base tracking-tight text-white">سوق باتنة</span>
                     </div>
                     <span className="text-[7px] font-black text-souq-accent/40 tracking-[0.25em] uppercase">Batna Market</span>
                  </div>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  سوقك المفتوح في باتنة والجزائر. بيع، شراء، وكراء كل ما يخطر ببالك في بضع ثوانٍ.
               </p>
               <a 
                  href="mailto:housseynbk10@gmail.com" 
                  className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-souq-accent hover:border-souq-accent transition-all duration-300 group shadow-sm"
                  title="housseynbk10@gmail.com"
               >
                  <Mail className="w-4 h-4" />
               </a>
            </div>
            <div>
               <h4 className="font-black text-souq-accent mb-6 uppercase tracking-widest text-xs">روابط هامة</h4>
               <ul className="space-y-4 text-sm text-slate-300">
                  <li><button onClick={() => setShowAbout(true)} className="hover:text-souq-accent transition-colors cursor-pointer">من نحن</button></li>
                  <li><button onClick={() => setShowSafety(true)} className="hover:text-souq-accent transition-colors cursor-pointer">قواعد الأمان</button></li>
                  <li><a href="mailto:housseynbk10@gmail.com" className="hover:text-souq-accent transition-colors">اتصل بنا</a></li>
                  <li><a href="#" className="hover:text-souq-accent transition-colors">الإعلانات المميزة</a></li>
               </ul>
            </div>
            <div>
               <h4 className="font-black text-souq-accent mb-6 uppercase tracking-widest text-xs">التصنيفات</h4>
               <ul className="space-y-4 text-sm text-slate-300 grid grid-cols-2 gap-x-4">
                  {CATEGORIES.map(c => <li key={c.name}><a href="#" className="hover:text-souq-accent transition-colors">{c.name}</a></li>)}
               </ul>
            </div>
            <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-right">
               <h4 className="font-black text-souq-accent mb-6 uppercase tracking-widest text-xs">تواصل مع المطور</h4>
               <p className="text-xs text-slate-400 mb-4 font-bold">لديك اقتراح أو استفسار؟ لا تتردد في مراسلتنا.</p>
               <a 
                  href="mailto:housseynbk10@gmail.com" 
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-souq-accent hover:border-souq-accent transition-all duration-300 group shadow-sm font-black text-xs"
               >
                  <Mail className="w-4 h-4" />
                  <span>راسلنا الآن</span>
               </a>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 mt-16 pt-10 border-t border-white/10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <div className="flex justify-center gap-6 mb-4">
               <button onClick={() => setShowPrivacy(true)} className="hover:text-souq-accent transition-colors">سياسة الخصوصية</button>
            </div>

            &copy; {new Date().getFullYear()} سوق باتنة. كل العلامات المسجلة المعروضة على منصتنا هي ملكية حصرية لأصحابها.
         </div>
      </footer>

      <AnimatePresence>
        {showCart && (
          <CartDrawer 
            isOpen={showCart} 
            onClose={() => setShowCart(false)} 
            items={cartItems}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <AdminPanel 
            isOpen={showAdminPanel} 
            onClose={() => setShowAdminPanel(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacy && (
          <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        )}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-souq-ink/60 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image Gallery */}
              <div className="md:w-3/5 bg-slate-100 relative h-80 md:h-auto group">
                {(selectedProduct.images && selectedProduct.images.length > 0) || selectedProduct.imageUrl ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[currentImageIndex] : selectedProduct.imageUrl} 
                      className="w-full h-full object-contain md:object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + selectedProduct.images!.length) % selectedProduct.images!.length); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 p-2 rounded-full backdrop-blur transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-6 h-6 text-souq-ink" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.images!.length); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 p-2 rounded-full backdrop-blur transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-6 h-6 text-souq-ink" />
                        </button>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                          {selectedProduct.images.map((_, idx) => (
                            <button 
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                              className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-souq-accent w-6' : 'bg-white/40 hover:bg-white/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImagePlus className="w-20 h-20" />
                    <span className="font-bold">لا توجد صور</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="md:w-2/5 p-8 flex flex-col overflow-y-auto">
                <div className="mb-6">
                  <span className="bg-souq-accent/10 text-souq-ink text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl font-black text-souq-ink leading-tight mb-2">
                    {selectedProduct.title}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {selectedProduct.location}
                    <span className="mx-1 opacity-20">|</span>
                    <Clock className="w-4 h-4" />
                    {Math.floor((Date.now() - selectedProduct.createdAt) / 3600000)} ساعة
                  </div>
                </div>

                <div className="text-emerald-600 text-3xl font-black mb-8">
                   {selectedProduct.price.toLocaleString()} <span className="text-sm">DA</span>
                </div>

                <div className="space-y-4 mb-8">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">تفاصيل الإعلان</h4>
                   <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedProduct.description}
                   </p>
                </div>

                <div className="mt-auto space-y-4 pt-6 border-t font-sans">
                   {(isAdmin || currentUser?.uid === selectedProduct.ownerId) && (
                     <button
                       onClick={() => handleDeleteAd(selectedProduct.id)}
                       className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100 mb-4"
                     >
                        <Trash2 className="w-4 h-4" />
                        حذف الإعلان
                     </button>
                   )}
                   <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-souq-secondary">
                         <UserIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-[10px] font-black text-slate-400 uppercase">المعلن</div>
                         <div className="font-black text-souq-ink truncate">{selectedProduct.ownerName}</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={`tel:${selectedProduct.phone}`}
                        className="flex flex-col items-center justify-center py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                      >
                         <Smartphone className="w-5 h-5 mb-1" />
                         <span className="text-xs font-black">إتصال هاتف</span>
                      </a>
                      <a 
                        href={`mailto:${selectedProduct.ownerEmail || 'housseynbk10@gmail.com'}?subject=استفسار عن: ${selectedProduct.title}`}
                        className="flex flex-col items-center justify-center py-4 bg-souq-secondary text-white rounded-2xl hover:bg-souq-ink transition-all shadow-xl shadow-souq-secondary/20 active:scale-95"
                      >
                         <Mail className="w-5 h-5 mb-1" />
                         <span className="text-xs font-black">إرسال رسالة</span>
                      </a>
                   </div>
                   
                   <button 
                     onClick={() => addToCart(selectedProduct)}
                     className="w-full py-4 bg-souq-accent text-souq-ink rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-xl shadow-souq-accent/20"
                   >
                      <ShoppingBag className="w-5 h-5 fill-souq-ink" />
                      إضافة إلى السلة
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Modal (Ouedkniss Styled) */}
      <AnimatePresence>
        {showPostForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostForm(false)}
              className="absolute inset-0 bg-souq-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl w-full max-w-xl relative flex flex-col overflow-hidden max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.3)]"
            >
               <header className="bg-souq-secondary text-white p-6 flex items-center justify-between">
                  <h2 className="text-xl font-black">أضف إعلاناً جديداً</h2>
                  <button onClick={() => setShowPostForm(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </header>

               <form onSubmit={handlePostAd} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">صور المنتج (يمكنك رفع عدة صور)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       <div className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden hover:border-souq-accent transition-colors group">
                          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="text-center group-hover:scale-110 transition-transform">
                             <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                             <span className="text-[10px] font-bold text-slate-400">إضافة صور</span>
                          </div>
                       </div>
                       {newAd.images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-xl overflow-hidden group/img">
                             <img src={img} className="w-full h-full object-cover" />
                             <button 
                               type="button"
                               onClick={() => removeImage(index)}
                               className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                             >
                                <X className="w-3 h-3" />
                             </button>
                             {index === 0 && (
                                <div className="absolute bottom-0 inset-x-0 bg-souq-accent text-souq-ink text-[8px] font-black py-1 text-center">
                                   الصورة الرئيسية
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">عنوان الإعلان</label>
                        <input 
                           type="text" required value={newAd.title}
                           onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold" 
                           placeholder="مثال: لاب توب أبل ماك بوك برو..."
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">التصنيف</label>
                           <select 
                             value={newAd.category}
                             onChange={(e) => setNewAd({...newAd, category: e.target.value as Category})}
                             className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold appearance-none"
                           >
                              {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">السعر (DA)</label>
                           <input 
                              type="number" required value={newAd.price}
                              onChange={(e) => setNewAd({...newAd, price: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold" 
                              placeholder="0.00"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الموقع (بلدية باتنة)</label>
                           <select 
                             value={newAd.location}
                             onChange={(e) => setNewAd({...newAd, location: e.target.value})}
                             className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold appearance-none"
                           >
                              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الإسم الكامل</label>
                           <input 
                              type="text" required value={newAd.ownerName}
                              onChange={(e) => setNewAd({...newAd, ownerName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold" 
                              placeholder={currentUser?.displayName || "إسمك الكريم"}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">رقم الهاتف (اختياري)</label>
                           <input 
                              type="tel" value={newAd.phone}
                              onChange={(e) => setNewAd({...newAd, phone: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold" 
                              placeholder="06XX XX XX XX"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">البريد الإلكتروني (اختياري)</label>
                           <input 
                              type="email" value={newAd.email}
                              onChange={(e) => setNewAd({...newAd, email: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold" 
                              placeholder={currentUser?.email || "email@example.com"}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الوصف</label>
                        <textarea 
                           rows={4} value={newAd.description}
                           onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-4 outline-none focus:border-souq-accent font-bold resize-none" 
                           placeholder="تفاصيل الإعلان..."
                        />
                     </div>
 
                     {isAdmin && (
                        <div className="bg-souq-accent/5 border border-souq-accent/30 rounded-xl p-4 flex items-start gap-4">
                           <div className="bg-souq-accent p-2 rounded-lg text-souq-ink">
                              <TrendingUp className="w-4 h-4 font-black" />
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                    <h4 className="font-black text-souq-ink text-sm">تفعيل الإعلان المميز (خاص بالمدير)</h4>
                                 </div>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mb-3">هذا الخيار يظهر للمشرف فقط لتفعيل الإعلان المميز.</p>
                              <label className="flex items-center gap-2 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    checked={newAd.isPromoted}
                                    onChange={(e) => setNewAd({...newAd, isPromoted: e.target.checked})}
                                    className="w-4 h-4"
                                 />
                                 <span className="text-xs font-bold text-souq-ink">نشر كإعلان مميز</span>
                              </label>
                           </div>
                        </div>
                     )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isPublishing}
                    className={`w-full py-4 text-white font-black text-lg rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                      isPublishing 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-souq-secondary shadow-souq-secondary/20 hover:brightness-105 active:scale-[0.98]'
                    }`}
                  >
                     {isPublishing ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         جاري النشر...
                       </>
                     ) : (
                       newAd.isPromoted && isAdmin ? 'نشر الإعلان المميز' : 'نشر الإعلان مجاناً'
                     )}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fixed Mobile FAB */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
         <button 
            onClick={() => setShowPostForm(true)}
            className="w-16 h-16 bg-souq-accent text-souq-ink rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform pulse-animation"
         >
            <PlusCircle className="w-8 h-8 font-black" />
         </button>
      </div>

      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-souq-ink/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-8 left-8 p-3 bg-slate-100/50 backdrop-blur-sm rounded-2xl hover:bg-slate-200 transition-all duration-300 z-10 hover:rotate-90 active:scale-90"
              >
                <X className="w-5 h-5 text-souq-ink" />
              </button>

              <div className="bg-souq-accent p-10 text-souq-ink relative overflow-hidden">
                <div className="relative z-10">
                   <motion.h2 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-black mb-2"
                   >
                    من نحن؟
                   </motion.h2>
                   <motion.p 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-souq-ink/70 font-bold text-base"
                   >
                    تعرف على منصة سوق باتنة
                   </motion.p>
                </div>
                <ShoppingBag className="absolute -bottom-10 -right-10 w-48 h-48 text-souq-ink/5 rotate-12" />
              </div>

              <div className="p-8 space-y-6">
                <motion.section
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-black text-souq-ink text-lg mb-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-souq-accent/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-souq-accent fill-souq-accent" />
                    </div>
                    رؤيتنا
                  </h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    سوق باتنة هو منصة إعلانية رائدة تهدف إلى تسهيل عملية البيع والشراء في ولاية باتنة والجزائر ككل. نحن نؤمن بأن التجارة الإلكترونية يجب أن تكون بسيطة، سريعة، ومتاحة للجميع مجاناً.
                  </p>
                </motion.section>

                <motion.section
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-black text-souq-ink text-lg mb-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-souq-secondary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-souq-secondary" />
                    </div>
                    ماذا نقدم؟
                  </h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    سواء كنت تبحث عن سيارة أحلامك، شقة للسكن، أو ترغب في بيع هاتفك القديم، نحن نوفر لك المساحة المثالية لعرض منتجاتك والوصول إلى آلاف المشترين المهتمين في المنطقة.
                  </p>
                </motion.section>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="pt-6 border-t border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">تواصل معنا</p>
                    <a 
                      href="mailto:housseynbk10@gmail.com" 
                      className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-souq-accent hover:border-souq-accent transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1"
                      title="housseynbk10@gmail.com"
                    >
                      <Mail className="w-6 h-6" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowAbout(false)}
                      className="px-6 py-3 bg-slate-100 text-souq-ink font-black rounded-2xl hover:bg-slate-200 active:scale-95 transition-all"
                    >
                      رجوع
                    </button>
                    <button 
                      onClick={() => setShowAbout(false)}
                      className="px-8 py-3 bg-souq-ink text-white font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-souq-ink/20"
                    >
                      فهمت ذلك
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSafety && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-souq-ink/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSafety(false)}
                className="absolute top-8 left-8 p-3 bg-slate-100/50 backdrop-blur-sm rounded-2xl hover:bg-slate-200 transition-all duration-300 z-10 hover:rotate-90 active:scale-90"
              >
                <X className="w-5 h-5 text-souq-ink" />
              </button>

              <div className="bg-emerald-500 p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                   <motion.h2 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-black mb-2"
                   >
                    قواعد الأمان
                   </motion.h2>
                   <motion.p 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/80 font-bold text-base"
                   >
                    تسوق بذكاء وكن محمياً دائماً
                   </motion.p>
                </div>
                <Shield className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" />
              </div>

              <div className="p-8 space-y-6">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-souq-ink mb-1">عاين المنتج بنفسك</h4>
                    <p className="text-sm text-slate-500 font-medium">لا تشترِ أبداً دون رؤية المنتج ومعاينته شخصياً للتأكد من جودته ومطابقته للوصف.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <HandCoins className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-souq-ink mb-1">لا ترسل أموالاً مسبقاً</h4>
                    <p className="text-sm text-slate-500 font-medium">تجنب دفع أي مبالغ أو عمولات قبل استلام السلعة. الدفع يكون عند الاستلام فقط.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-souq-ink mb-1">قابل البائع في مكان عام</h4>
                    <p className="text-sm text-slate-500 font-medium">اختر دائماً أماكن عامة ومزدحمة (مثل المقاهي أو الساحات الكبرى) لإتمام عملية البيع.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-6 border-t border-slate-100 flex items-center justify-center"
                >
                  <button 
                    onClick={() => setShowSafety(false)}
                    className="w-full py-4 bg-souq-ink text-white font-black rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-souq-ink/20"
                  >
                    حسناً، أتعهد بالإلتزام
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 210, 0, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255, 210, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 210, 0, 0); }
        }
        .pulse-animation {
          animation: pulse-gold 2s infinite;
        }
      `}</style>
    </div>
  );
}
