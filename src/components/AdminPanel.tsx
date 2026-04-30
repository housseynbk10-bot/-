import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Trash2, 
  Zap, 
  BarChart3, 
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [ads, setAds] = useState<Product[]>([]);
  const [stats, setStats] = useState({ totalAds: 0, promotedAds: 0 });
  const [adSpaceText, setAdSpaceText] = useState('مساحة مخصصة لإعلاناتكم المميزة هنا');
  const [adSpaceLink, setAdSpaceLink] = useState('');
  const [adSpaceImage, setAdSpaceImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'ads' | 'settings'>('stats');

  useEffect(() => {
    if (!isOpen) return;

    // Fetch Ads for Management
    const unsubscribeAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setAds(adsData);
      setStats({
        totalAds: adsData.length,
        promotedAds: adsData.filter(a => a.isPromoted).length
      });
    });

    // Fetch Site Settings
    const fetchSettings = async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.adSpaceText) setAdSpaceText(data.adSpaceText);
        if (data.adSpaceLink) setAdSpaceLink(data.adSpaceLink);
        if (data.adSpaceImage) setAdSpaceImage(data.adSpaceImage);
      }
    };
    fetchSettings();

    return () => unsubscribeAds();
  }, [isOpen]);

  const handleDeleteAd = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ads/${id}`);
    }
  };

  const handleTogglePromote = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', id), { isPromoted: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ads/${id}`);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), { 
        adSpaceText,
        adSpaceLink,
        adSpaceImage
      }, { merge: true });
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/site');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-souq-ink/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-souq-ink text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-souq-accent rounded-xl flex items-center justify-center text-souq-ink">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">لوحة تحكم المدير</h2>
                  <p className="text-[10px] text-souq-accent uppercase font-bold tracking-widest">Admin Control Panel</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 bg-slate-50 border-l border-slate-100 p-4 space-y-2">
                {[
                  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
                  { id: 'ads', label: 'إدارة الإعلانات', icon: LayoutDashboard },
                  { id: 'settings', label: 'التوصيات', icon: ThumbsUp },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-souq-ink text-white shadow-lg' 
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'stats' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                        <Users className="w-8 h-8 text-emerald-600 mb-4" />
                        <div className="text-3xl font-black text-emerald-700">{stats.totalAds}</div>
                        <div className="text-sm font-bold text-emerald-600/70">إجمالي الإعلانات النشطة</div>
                      </div>
                      <div className="bg-souq-accent/10 border border-souq-accent/20 p-6 rounded-2xl">
                        <Zap className="w-8 h-8 text-souq-ink mb-4" />
                        <div className="text-3xl font-black text-souq-ink">{stats.promotedAds}</div>
                        <div className="text-sm font-bold text-souq-ink/60">إعلانات مميزة (VIP)</div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">المزيد من الإحصائيات قريباً...</p>
                    </div>
                  </div>
                )}

                {activeTab === 'ads' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-souq-ink">قائمة الإعلانات المنشورة</h3>
                      <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">{ads.length} إعلان</span>
                    </div>
                    
                    <div className="space-y-3">
                      {ads.map(ad => (
                        <div key={ad.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-souq-accent/30 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                              {ad.imageUrl && <img src={ad.imageUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-souq-ink leading-tight">{ad.title}</h4>
                              <p className="text-[10px] text-slate-400 font-bold">{ad.ownerName} • {ad.location}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleTogglePromote(ad.id, ad.isPromoted || false)}
                              className={`p-2 rounded-lg transition-all ${ad.isPromoted ? 'bg-souq-accent text-souq-ink' : 'bg-slate-100 text-slate-400 hover:bg-souq-accent/10'}`}
                              title={ad.isPromoted ? "إلغاء التمييز" : "تمييز الإعلان"}
                            >
                              <Zap className="w-4 h-4 fill-current" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAd(ad.id)}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="حذف الإعلان"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="max-w-2xl space-y-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-black text-souq-ink">نص المساحة الإعلانية (Banner)</label>
                      <textarea 
                        value={adSpaceText}
                        onChange={(e) => setAdSpaceText(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-souq-accent outline-none font-bold text-sm h-32"
                        placeholder="اكتب هنا النص الذي سيظهر في البانر العلوي..."
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-black text-souq-ink">رابط الإعلان (اختياري)</label>
                      <input 
                        type="url"
                        value={adSpaceLink}
                        onChange={(e) => setAdSpaceLink(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-souq-accent outline-none font-bold text-sm text-left"
                        placeholder="https://example.com"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-black text-souq-ink">رابط صورة الإعلان (اختياري)</label>
                      <input 
                        type="url"
                        value={adSpaceImage}
                        onChange={(e) => setAdSpaceImage(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-souq-accent outline-none font-bold text-sm text-left"
                        placeholder="https://example.com/image.jpg"
                        dir="ltr"
                      />
                    </div>
                    
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="flex items-center gap-3 bg-souq-ink text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5 text-souq-accent" />
                      )}
                      حفظ التغييرات
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
