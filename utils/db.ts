
import { Listing, Office } from '../types';

const DB_NAME = 'Road80DB';
const STORE_LISTINGS = 'listings';
const DB_VERSION = 1;

export const DEMO_ADS: Listing[] = [
  { 
    id: 1, 
    listingType: 'للإيجار',
    propertyType: 'شقة',
    price: '450 د.ك', 
    area: 'الجابرية',
    governorate: 'حولي',
    title: 'للإيجار شقة راقية في الجابرية',
    rooms: 3,
    bathrooms: 2,
    size: 150,
    balcony: 'نعم',
    parking: '2',
    parkingSystems: ['سرداب'],
    electricity: 'على المالك',
    water: 'على المالك',
    ac: 'على المالك',
    description: 'شقة مميزة في موقع هادئ، تشطيب سوبر ديلوكس، قريبة من الخدمات. تتكون من 3 غرف نوم (واحدة ماستر)، صالة كبيرة، مطبخ مجهز، غرفة خادمة مع حمام.',
    images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop'
    ],
    video: null,
    views: 120,
    publisherId: 'off_1',
    publisherName: 'مكتب الدانة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop'
  },
  { 
    id: 2, 
    listingType: 'للبيع',
    propertyType: 'شقة',
    price: '720 د.ك', 
    area: 'السالمية', 
    governorate: 'حولي',
    title: 'للبيع شقة اطلالة بحرية',
    rooms: 4,
    bathrooms: 3,
    size: 200,
    balcony: 'نعم',
    parking: '2',
    parkingSystems: ['مظلات'],
    electricity: 'على المالك',
    water: 'على المالك',
    ac: 'على المالك',
    description: 'شقة فاخرة للبيع في السالمية، اطلالة مباشرة على البحر، مجمع سكني متكامل الخدمات (مسبح، جيم، حراسة).',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop'
    ],
    video: null,
    views: 340,
    publisherId: 'off_2',
    publisherName: 'مكتب أبراج الكويت العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop'
  },
  { 
    id: 3, 
    listingType: 'للإيجار',
    propertyType: 'دور',
    price: '1,250 د.ك', 
    area: 'صباح السالم', 
    governorate: 'مبارك الكبير',
    title: 'للإيجار دور كامل تشطيب جديد',
    rooms: 5,
    bathrooms: 4,
    size: 400,
    balcony: 'نعم',
    parking: '3',
    parkingSystems: ['مظلات'],
    electricity: 'على المستأجر',
    water: 'على المالك',
    ac: 'على المالك',
    description: 'دور أول مصعد، تشطيب مودرن، مساحات واسعة، بلكونة كبيرة، مواقف مظللة.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop'
    ],
    video: null,
    views: 85,
    publisherId: 'off_1',
    publisherName: 'مكتب الدانة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop'
  },
  { 
    id: 4, 
    listingType: 'للإيجار',
    propertyType: 'فيلا',
    price: '850 د.ك', 
    area: 'مشرف', 
    governorate: 'حولي',
    title: 'للإيجار فيلا دورين',
    rooms: 6,
    bathrooms: 5,
    size: 500,
    balcony: 'لا',
    parking: '4',
    parkingSystems: ['مظلات', 'اخرى'],
    electricity: 'على المستأجر',
    water: 'على المستأجر',
    ac: 'على المستأجر',
    description: 'فيلا زاوية، حديقة كبيرة، ديوانية منعزلة.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-40b5104d57ea?q=80&w=600&auto=format&fit=crop'
    ],
    video: null,
    views: 210,
    publisherId: 'off_3',
    publisherName: 'مكتب الصفوة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop'
  },
];

// Explore Video Ads (200 series IDs)
// Using sample videos. In production, these would be real hosted video URLs.
// For prototype, we use a placeholder mp4 link that works in browsers.
const SAMPLE_VIDEO_URL = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-with-a-view-of-the-city-at-night-1763-large.mp4';
const SAMPLE_VIDEO_2 = 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-fireplace-and-christmas-decoration-2699-large.mp4';

export const DEMO_EXPLORE_ADS: Listing[] = [
  {
    id: 201,
    listingType: 'للبيع',
    propertyType: 'فيلا',
    price: '450,000 د.ك',
    area: 'الخيران',
    governorate: 'الأحمدي',
    title: 'فيلا مودرن في الخيران السكني',
    rooms: 6, bathrooms: 7, size: 600,
    description: 'فيلا تصميم حديث مع مسبح وإطلالة بحرية.',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_URL,
    views: 1540,
    publisherId: 'off_4',
    publisherName: 'مكتب المروج للوساطة',
    publisherAvatar: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 202,
    listingType: 'للإيجار',
    propertyType: 'شقة',
    price: '550 د.ك',
    area: 'الصديق',
    governorate: 'حولي',
    title: 'شقة فاخرة تشطيب VIP',
    rooms: 3, bathrooms: 3, size: 180,
    description: 'شقة في الصديق تشطيب راقي جداً.',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_2,
    views: 890,
    publisherId: 'off_1',
    publisherName: 'مكتب الدانة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 203,
    listingType: 'للإيجار',
    propertyType: 'دور',
    price: '900 د.ك',
    area: 'الزهراء',
    governorate: 'حولي',
    title: 'دور ارضي مدخل خاص',
    rooms: 4, bathrooms: 4, size: 350,
    description: 'دور ارضي مرتفع مع حوش ساقط.',
    images: ['https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_URL,
    views: 2100,
    publisherId: 'off_1',
    publisherName: 'مكتب الدانة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 204,
    listingType: 'للبيع',
    propertyType: 'بيت',
    price: '380,000 د.ك',
    area: 'سعد العبدالله',
    governorate: 'الجهراء',
    title: 'بيت حكومي بطن وظهر',
    rooms: 5, bathrooms: 4, size: 400,
    description: 'موقع ممتاز قريب من المسجد والخدمات.',
    images: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_2,
    views: 3200,
    publisherId: 'off_6',
    publisherName: 'مكتب ركائز العقار',
    publisherAvatar: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 205,
    listingType: 'للإيجار',
    propertyType: 'شقة',
    price: '350 د.ك',
    area: 'المهبولة',
    governorate: 'الأحمدي',
    title: 'شقة اطلالة بحرية',
    rooms: 2, bathrooms: 2, size: 90,
    description: 'شقة مفروشة بالكامل.',
    images: ['https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_URL,
    views: 450,
    publisherId: 'off_9',
    publisherName: 'مكتب مسارات السكن',
    publisherAvatar: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 206,
    listingType: 'للبيع',
    propertyType: 'شاليه',
    price: '280,000 د.ك',
    area: 'صباح الأحمد البحرية',
    governorate: 'الأحمدي',
    title: 'شاليه صف ثاني',
    rooms: 5, bathrooms: 5, size: 450,
    description: 'شاليه جديد لم يسكن.',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_2,
    views: 5600,
    publisherId: 'off_4',
    publisherName: 'مكتب المروج للوساطة',
    publisherAvatar: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 207,
    listingType: 'للإيجار',
    propertyType: 'مكتب',
    price: '1,500 د.ك',
    area: 'شرق',
    governorate: 'العاصمة',
    title: 'مكتب تجاري اطلالة كاملة',
    rooms: 4, bathrooms: 2, size: 200,
    description: 'موقع مميز في قلب العاصمة.',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_URL,
    views: 120,
    publisherId: 'off_12',
    publisherName: 'مكتب أفق الاستثمار',
    publisherAvatar: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 208,
    listingType: 'للبيع',
    propertyType: 'أرض',
    price: '290,000 د.ك',
    area: 'أبو فطيرة',
    governorate: 'مبارك الكبير',
    title: 'أرض فضاء 400م',
    rooms: 0, bathrooms: 0, size: 400,
    description: 'شارع واحد، واجهة عريضة.',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_2,
    views: 2200,
    publisherId: 'off_5',
    publisherName: 'مكتب السهل الذهبي',
    publisherAvatar: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 209,
    listingType: 'للإيجار',
    propertyType: 'فيلا',
    price: '1,800 د.ك',
    area: 'اليرموك',
    governorate: 'العاصمة',
    title: 'فيلا ديلوكس قطعة 2',
    rooms: 7, bathrooms: 6, size: 750,
    description: 'فيلا زاوية حديقة كبيرة.',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_URL,
    views: 310,
    publisherId: 'off_8',
    publisherName: 'مكتب النخبة الدولية',
    publisherAvatar: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 210,
    listingType: 'للبيع',
    propertyType: 'مجمع',
    price: '2,500,000 د.ك',
    area: 'الفروانية',
    governorate: 'الفروانية',
    title: 'مجمع تجاري للبيع',
    rooms: 20, bathrooms: 20, size: 1000,
    description: 'دخل ممتاز، موقع حيوي.',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop'],
    video: SAMPLE_VIDEO_2,
    views: 9000,
    publisherId: 'off_3',
    publisherName: 'مكتب الصفوة العقاري',
    publisherAvatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop'
  }
];

export const DEMO_OFFICES: Office[] = [
  {
    id: 'off_1',
    officeName: 'مكتب الدانة العقاري',
    username: 'aldana_realestate',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop',
    bio: 'نحن في مكتب الدانة العقاري نسعى لتوفير أفضل الفرص السكنية والاستثمارية لعملائنا الكرام في جميع مناطق الكويت.',
    governorate: 'محافظة حولي',
    yearsExperience: 15,
    activeListingsCount: 42,
    soldOrRentedCount: 150,
    totalViews: 12500,
    rating: 4.8,
    responseTime: 'خلال 15 دقيقة',
    phone: '99991111',
    whatsapp: '99991111',
    verified: true,
    specialties: ['بيع', 'إيجار', 'تجاري'],
    sampleListings: [DEMO_ADS[0], DEMO_ADS[2], {...DEMO_ADS[1], id: 101, title: 'شقة بالجابرية'}]
  },
  {
    id: 'off_2',
    officeName: 'مكتب أبراج الكويت العقاري',
    username: 'kuwait_towers_re',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop',
    bio: 'خبرة عريقة في مجال الوساطة العقارية. متخصصون في بيع وشراء الأراضي والفلل في المناطق الداخلية والخارجية.',
    governorate: 'محافظة العاصمة',
    yearsExperience: 20,
    activeListingsCount: 35,
    soldOrRentedCount: 300,
    totalViews: 18200,
    rating: 4.9,
    responseTime: 'خلال ساعة',
    phone: '99992222',
    whatsapp: '99992222',
    verified: true,
    specialties: ['أراضي', 'فلل', 'استثماري'],
    sampleListings: [DEMO_ADS[1], {...DEMO_ADS[3], id: 102, title: 'فيلا بالروضة'}]
  },
  {
    id: 'off_3',
    officeName: 'مكتب الصفوة العقاري',
    username: 'alsafwa_re',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop',
    bio: 'شريكك الموثوق في عالم العقار. نقدم خدمات التقييم العقاري وإدارة الأملاك بأعلى معايير الجودة.',
    governorate: 'محافظة الفروانية',
    yearsExperience: 8,
    activeListingsCount: 28,
    soldOrRentedCount: 80,
    totalViews: 5600,
    rating: 4.5,
    responseTime: 'خلال 30 دقيقة',
    phone: '99993333',
    whatsapp: '99993333',
    verified: false,
    specialties: ['إدارة أملاك', 'إيجار'],
    sampleListings: [DEMO_ADS[3], {...DEMO_ADS[0], id: 103, title: 'شقة بالفروانية'}]
  },
  {
    id: 'off_4',
    officeName: 'مكتب المروج للوساطة',
    username: 'almurouj_brokerage',
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&auto=format&fit=crop',
    bio: 'متخصصون في تسويق المشاريع العقارية الكبرى وتوفير الفرص الاستثمارية للشركات والأفراد.',
    governorate: 'محافظة الأحمدي',
    yearsExperience: 12,
    activeListingsCount: 55,
    soldOrRentedCount: 210,
    totalViews: 14000,
    rating: 4.7,
    responseTime: 'خلال ساعتين',
    phone: '99994444',
    whatsapp: '99994444',
    verified: true,
    specialties: ['مشاريع', 'تجاري', 'شاليهات'],
    sampleListings: [{...DEMO_ADS[1], id: 104, title: 'شاليه بالخيران'}, {...DEMO_ADS[2], id: 105}]
  },
  {
    id: 'off_5',
    officeName: 'مكتب السهل الذهبي',
    username: 'golden_plain',
    logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=300&auto=format&fit=crop',
    bio: 'نجعل عملية بيع وشراء عقارك سهلة وسريعة. فريق محترف جاهز لخدمتكم على مدار الساعة.',
    governorate: 'محافظة مبارك الكبير',
    yearsExperience: 5,
    activeListingsCount: 18,
    soldOrRentedCount: 45,
    totalViews: 3200,
    rating: 4.2,
    responseTime: 'خلال 10 دقائق',
    phone: '99995555',
    whatsapp: '99995555',
    verified: false,
    specialties: ['سكني', 'إيجار'],
    sampleListings: [{...DEMO_ADS[2], id: 106, title: 'دور في صباح السالم'}]
  },
  {
    id: 'off_6',
    officeName: 'مكتب ركائز العقار',
    username: 'rakaez_realestate',
    logo: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=300&auto=format&fit=crop',
    bio: 'الركيزة الأساسية لاستثمارك الناجح. نقدم استشارات عقارية مجانية وتحليلات دقيقة للسوق.',
    governorate: 'محافظة الجهراء',
    yearsExperience: 10,
    activeListingsCount: 60,
    soldOrRentedCount: 120,
    totalViews: 9800,
    rating: 4.6,
    responseTime: 'خلال يوم',
    phone: '99996666',
    whatsapp: '99996666',
    verified: true,
    specialties: ['بيوت حكومي', 'قسائم', 'المطلاع'],
    sampleListings: [{...DEMO_ADS[0], id: 107, title: 'قسيمة بالمطلاع'}]
  },
  {
    id: 'off_7',
    officeName: 'مكتب بوابة حولي العقاري',
    username: 'hawally_gate',
    logo: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=300&auto=format&fit=crop',
    bio: 'بوابتكم للعقارات المميزة في محافظة حولي وضواحيها. شقق تمليك وإيجار بأسعار تنافسية.',
    governorate: 'محافظة حولي',
    yearsExperience: 7,
    activeListingsCount: 90,
    soldOrRentedCount: 400,
    totalViews: 25000,
    rating: 4.8,
    responseTime: 'فوري',
    phone: '99997777',
    whatsapp: '99997777',
    verified: true,
    specialties: ['شقق تمليك', 'إيجار'],
    sampleListings: [{...DEMO_ADS[0], id: 108}, {...DEMO_ADS[1], id: 109}]
  },
  {
    id: 'off_8',
    officeName: 'مكتب النخبة الدولية',
    username: 'elite_intl_re',
    logo: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=300&auto=format&fit=crop',
    bio: 'عقارات محلية ودولية. نساعدك في تملك عقارك في الكويت وخارجها.',
    governorate: 'محافظة العاصمة',
    yearsExperience: 25,
    activeListingsCount: 120,
    soldOrRentedCount: 1000,
    totalViews: 50000,
    rating: 5.0,
    responseTime: 'خلال ساعة',
    phone: '99998888',
    whatsapp: '99998888',
    verified: true,
    specialties: ['دولي', 'محلي', 'فخامة'],
    sampleListings: [{...DEMO_ADS[3], id: 110, title: 'فيلا vip'}]
  },
  {
    id: 'off_9',
    officeName: 'مكتب مسارات السكن',
    username: 'masarat_housing',
    logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=300&auto=format&fit=crop',
    bio: 'نحدد لك المسار الصحيح نحو منزلك الجديد. خيارات متنوعة تناسب جميع الميزانيات.',
    governorate: 'محافظة الأحمدي',
    yearsExperience: 4,
    activeListingsCount: 22,
    soldOrRentedCount: 30,
    totalViews: 2100,
    rating: 4.1,
    responseTime: 'خلال 4 ساعات',
    phone: '99990001',
    whatsapp: '99990001',
    verified: false,
    specialties: ['إيجار', 'بدل'],
    sampleListings: [{...DEMO_ADS[2], id: 111}]
  },
  {
    id: 'off_10',
    officeName: 'مكتب السكن الراقي',
    username: 'luxury_living_kw',
    logo: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=300&auto=format&fit=crop',
    bio: 'الرفاهية عنواننا. نوفر أفخم الشقق والفلل في أرقى مناطق الكويت.',
    governorate: 'محافظة حولي',
    yearsExperience: 14,
    activeListingsCount: 15,
    soldOrRentedCount: 60,
    totalViews: 8000,
    rating: 4.9,
    responseTime: 'خلال 30 دقيقة',
    phone: '99990002',
    whatsapp: '99990002',
    verified: true,
    specialties: ['فخامة', 'دبلوماسي'],
    sampleListings: [{...DEMO_ADS[1], id: 112, title: 'بنتهاوس السالمية'}]
  },
  {
    id: 'off_11',
    officeName: 'مكتب القمة العقارية',
    username: 'alqimma_re',
    logo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=300&auto=format&fit=crop',
    bio: 'نسعى للقمة في خدمة عملائنا. مصداقية، شفافية، وسرعة في الإنجاز.',
    governorate: 'محافظة الفروانية',
    yearsExperience: 9,
    activeListingsCount: 40,
    soldOrRentedCount: 110,
    totalViews: 7500,
    rating: 4.4,
    responseTime: 'خلال ساعة',
    phone: '99990003',
    whatsapp: '99990003',
    verified: true,
    specialties: ['تجاري', 'مخازن', 'صناعي'],
    sampleListings: [{...DEMO_ADS[0], id: 113, title: 'مخزن بالعارضية'}]
  },
  {
    id: 'off_12',
    officeName: 'مكتب أفق الاستثمار',
    username: 'horizon_invest',
    logo: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=300&auto=format&fit=crop',
    bio: 'آفاق جديدة للاستثمار العقاري. عوائد مضمونة وفرص لا تعوض.',
    governorate: 'محافظة العاصمة',
    yearsExperience: 18,
    activeListingsCount: 75,
    soldOrRentedCount: 500,
    totalViews: 30000,
    rating: 4.7,
    responseTime: 'خلال ساعتين',
    phone: '99990004',
    whatsapp: '99990004',
    verified: true,
    specialties: ['عمارات', 'أراضي استثماري'],
    sampleListings: [{...DEMO_ADS[2], id: 114, title: 'عمارة للبيع'}]
  }
];

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LISTINGS)) {
        db.createObjectStore(STORE_LISTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveListing = async (listing: any) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LISTINGS, 'readwrite');
    const store = tx.objectStore(STORE_LISTINGS);
    store.put(listing);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getListings = async () => {
  const db = await initDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(STORE_LISTINGS, 'readonly');
    const store = tx.objectStore(STORE_LISTINGS);
    const request = store.getAll();
    request.onsuccess = () => {
        // Sort by ID descending (newest first)
        const results = request.result;
        results.sort((a, b) => b.id - a.id);
        resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getExploreListings = async (): Promise<Listing[]> => {
    // 1. Get stored listings that have video
    let storedListings: Listing[] = [];
    try {
        const allStored = await getListings();
        storedListings = allStored.filter(l => l.video);
    } catch (e) {
        // Silently fail or handle error appropriately
    }

    // 2. Combine with Demo Explore Ads
    // Put stored first (newest)
    const combined = [...storedListings, ...DEMO_EXPLORE_ADS];
    return combined;
};

export const getListingById = async (id: number): Promise<Listing | null> => {
  // Check demo ads first
  let demo = DEMO_ADS.find(l => l.id === id);
  if (demo) return demo;

  // Check explore demo ads
  demo = DEMO_EXPLORE_ADS.find(l => l.id === id);
  if (demo) return demo;

  // Check DB
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LISTINGS, 'readonly');
    const store = tx.objectStore(STORE_LISTINGS);
    const request = store.get(id);
    request.onsuccess = () => {
        if (request.result) resolve(request.result);
        else resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};
