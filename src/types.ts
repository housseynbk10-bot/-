export type Category = 'سيارات' | 'شاحنات' | 'عقار' | 'آلات' | 'قطع غيار' | 'هواتف و إكسسوارات' | 'أجهزة إلكترونية و كهرومنزلية' | 'اثاث منزل' | 'ملابس' | 'خدمات' | 'طلبات عمل' | 'غير ذلك';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  images?: string[];
  location: string;
  createdAt: number;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  phone?: string;
  isPromoted?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
