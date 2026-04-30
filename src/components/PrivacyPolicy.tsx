import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-souq-ink/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-souq-accent rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-souq-ink" />
            </div>
            <h2 className="text-xl font-black text-souq-ink">سياسة الخصوصية - سوق باتنة</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-right space-y-8 font-medium text-slate-600 leading-relaxed" dir="rtl">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-souq-ink font-black text-lg">
              <Eye className="w-5 h-5 text-souq-accent" />
              <h3>مقدمة</h3>
            </div>
            <p>
              نحن في "سوق باتنة" نولي أهمية قصوى لخصوصيتك. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية معلوماتك عند استخدام منصتنا، سواء كنت زائراً أو مستخدماً مسجلاً.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-souq-ink font-black text-lg">
              <FileText className="w-5 h-5 text-souq-accent" />
              <h3>المعلومات التي نجمعها</h3>
            </div>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li><span className="font-bold">المستخدمون المسجلون:</span> نجمع معلومات الملف الشخصي (الاسم، البريد الإلكتروني، الصورة) عبر Google لضمان تجربة موثوقة.</li>
              <li><span className="font-bold">الزوار (النشر بدون حساب):</span> عند نشر إعلان كزائر، نجمع معلومات الإعلان فقط (العنوان، السعر، الموقع). قد نقوم بتخزين معرفات تقنية مؤقتة لضمان أمان المنصة ومنع البريد المزعج.</li>
              <li><span className="font-bold">بيانات الإعلانات:</span> الصور والنصوص التي ترفعها تصبح عامة ليراها المستخدمون الآخرون.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-souq-ink font-black text-lg">
              <Lock className="w-5 h-5 text-souq-accent" />
              <h3>حماية البيانات</h3>
            </div>
            <p>
              نستخدم تقنيات متطورة (Firebase Security) لتأمين قواعد بياناتنا. لا نقوم ببيع معلوماتك الشخصية لأي طرف ثالث. معلومات الاتصال (مثل رقم الهاتف إذا تمت إضافته في الوصف) تظهر فقط بناءً على رغبتك لتسهيل عملية الشراء والبيع.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-souq-ink font-black text-lg">
              <ShieldCheck className="w-5 h-5 text-souq-accent" />
              <h3>مسؤوليتك</h3>
            </div>
            <p>
              بصفتك مستخدماً للمنصة، أنت مسؤول عن صحة البيانات التي تنشرها. نوصي بعدم مشاركة معلومات حساسة جداً في وصف الإعلان العام. "سوق باتنة" هو وسيط تقني ولا نتحمل مسؤولية التعاملات التجارية بين المستخدمين.
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-sm">
            تم تحديث هذه السياسة بتاريخ: {new Date().toLocaleDateString('ar-DZ')}
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 text-center">
          <button 
            onClick={onClose}
            className="bg-souq-ink text-white px-8 py-3 rounded-xl font-black hover:bg-slate-800 transition-colors"
          >
            فهمت ذلك
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
