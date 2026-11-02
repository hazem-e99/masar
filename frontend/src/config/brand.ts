/** Public name for the Masar demo. Backend copy lives in backend/src/config/brand.ts. */
export const brand = {
  nameEn: 'Masar',
  nameAr: 'مسار',
  logo: '/logo.png',
  payment: {
    noticeEn: 'Fictional demo details. Nothing here receives money.',
    noticeAr: 'بيانات تجريبية وهمية. لا يُستخدم أي رقم منها للتحويل الحقيقي.',
    wallets: ['01010000001', '01010000002'],
    accountNumber: '1002003004005006',
    accountNameEn: 'Masar Transport (fictional demo account)',
    accountNameAr: 'مسار للنقل (حساب تجريبي وهمي)',
  },
} as const;
