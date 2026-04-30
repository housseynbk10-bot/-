import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove,
  onCheckout 
}) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-souq-ink/60 backdrop-blur-sm z-[150]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[160] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-souq-accent rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-souq-ink" />
                </div>
                <h2 className="text-xl font-black text-souq-ink">سلة المشتريات</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                id="close-cart-btn"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold">سلتك فارغة حالياً</p>
                  <button 
                    onClick={onClose}
                    className="text-souq-secondary font-black hover:underline"
                  >
                    ابدأ التسوق الآن
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-souq-accent/30 transition-colors bg-white shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between" dir="rtl">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-souq-ink text-sm line-clamp-1">{item.title}</h3>
                        <button 
                          onClick={() => onRemove(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-souq-secondary font-black text-lg">
                          {item.price.toLocaleString()} <span className="text-[10px]">دج</span>
                        </div>
                        
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white rounded shadow-sm text-souq-ink transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-black text-souq-ink">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white rounded shadow-sm text-souq-ink transition-all"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between mb-2" dir="rtl">
                  <span className="text-slate-500 font-bold">المجموع الإجمالي</span>
                  <span className="text-2xl font-black text-souq-ink">{total.toLocaleString()} دج</span>
                </div>
                
                <button 
                  onClick={onCheckout}
                  className="w-full bg-souq-ink text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-souq-ink/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <CreditCard className="w-6 h-6 text-souq-accent" />
                  إتمام الشراء
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  الدفع عند الاستلام متاح حالياً
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
