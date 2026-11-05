import type { Language } from './constants';

type Dict = Record<string, string>;
const en: Dict = {
  'app.welcome': 'Welcome', 'auth.phone': 'Mobile number', 'auth.sendOtp': 'Send OTP', 'auth.otp': 'Enter OTP', 'auth.verify': 'Verify',
  'auth.email': 'Email', 'auth.emailOptional': 'Email (optional)', 'auth.emailOtp': 'Email OTP',
  'nav.home': 'Home', 'nav.cart': 'Cart', 'nav.orders': 'Orders', 'nav.settings': 'Settings', 'nav.dashboard': 'Dashboard', 'nav.products': 'Products', 'nav.assistant': 'AI Buddy', 'nav.store': 'My Store', 'nav.plans': 'Plans',
  'store.nearby': 'Stores near you', 'store.search': 'Search stores or products', 'store.open': 'Open', 'store.km': 'km away',
  'cart.empty': 'Your cart is empty', 'cart.checkout': 'Checkout', 'cart.add': 'Add', 'cart.pickup': 'Pickup', 'cart.delivery': 'Delivery',
  'cart.fullPay': 'Pay in full', 'cart.partPay': 'Pay part now', 'cart.total': 'Total', 'cart.payNow': 'Pay now', 'cart.payLater': 'Pay at store',
  'fee.subtotal': 'Subtotal', 'fee.delivery': 'Delivery fee', 'fee.platform': 'Platform fee', 'fee.handling': 'Handling charge', 'fee.visiting': 'Visiting charge',
  'order.placed': 'Order placed', 'order.ready': 'Ready for pickup', 'order.status': 'Status',
  'settings.radius': 'Search radius (km)', 'settings.language': 'Language', 'settings.logout': 'Log out',
  'vendor.speak': 'Tap and speak', 'vendor.listening': 'Listening…', 'vendor.publish': 'Submit for review', 'vendor.trialLeft': 'days of free trial left',
  'common.save': 'Save', 'common.next': 'Next', 'common.back': 'Back', 'common.loading': 'Loading…', 'common.retry': 'Retry',
};
const hi: Dict = {
  'app.welcome': 'स्वागत है', 'auth.phone': 'मोबाइल नंबर', 'auth.sendOtp': 'OTP भेजें', 'auth.otp': 'OTP दर्ज करें', 'auth.verify': 'सत्यापित करें',
  'auth.email': 'ईमेल', 'auth.emailOptional': 'ईमेल (वैकल्पिक)', 'auth.emailOtp': 'ईमेल OTP',
  'nav.home': 'होम', 'nav.cart': 'कार्ट', 'nav.orders': 'ऑर्डर', 'nav.settings': 'सेटिंग्स', 'nav.dashboard': 'डैशबोर्ड', 'nav.products': 'उत्पाद', 'nav.assistant': 'AI साथी', 'nav.store': 'मेरी दुकान', 'nav.plans': 'प्लान',
  'store.nearby': 'आपके पास की दुकानें', 'store.search': 'दुकान या सामान खोजें', 'store.open': 'खुला', 'store.km': 'किमी दूर',
  'cart.empty': 'आपका कार्ट खाली है', 'cart.checkout': 'चेकआउट', 'cart.add': 'जोड़ें', 'cart.pickup': 'पिकअप', 'cart.delivery': 'डिलीवरी',
  'cart.fullPay': 'पूरा भुगतान', 'cart.partPay': 'अभी कुछ भुगतान', 'cart.total': 'कुल', 'cart.payNow': 'अभी भुगतान', 'cart.payLater': 'दुकान पर भुगतान',
  'fee.subtotal': 'उप-योग', 'fee.delivery': 'डिलीवरी शुल्क', 'fee.platform': 'प्लेटफ़ॉर्म शुल्क', 'fee.handling': 'हैंडलिंग शुल्क', 'fee.visiting': 'विज़िटिंग शुल्क',
  'order.placed': 'ऑर्डर हो गया', 'order.ready': 'पिकअप के लिए तैयार', 'order.status': 'स्थिति',
  'settings.radius': 'खोज दायरा (किमी)', 'settings.language': 'भाषा', 'settings.logout': 'लॉग आउट',
  'vendor.speak': 'दबाएँ और बोलें', 'vendor.listening': 'सुन रहा हूँ…', 'vendor.publish': 'समीक्षा के लिए भेजें', 'vendor.trialLeft': 'दिन का मुफ़्त ट्रायल बाकी',
  'common.save': 'सेव करें', 'common.next': 'आगे', 'common.back': 'पीछे', 'common.loading': 'लोड हो रहा है…', 'common.retry': 'फिर कोशिश करें',
};
const ta: Dict = {
  'app.welcome': 'வரவேற்கிறோம்', 'auth.phone': 'மொபைல் எண்', 'auth.sendOtp': 'OTP அனுப்பு', 'auth.otp': 'OTP உள்ளிடவும்', 'auth.verify': 'சரிபார்',
  'auth.email': 'மின்னஞ்சல்', 'auth.emailOptional': 'மின்னஞ்சல் (விருப்பம்)', 'auth.emailOtp': 'மின்னஞ்சல் OTP',
  'nav.home': 'முகப்பு', 'nav.cart': 'கூடை', 'nav.orders': 'ஆர்டர்கள்', 'nav.settings': 'அமைப்புகள்', 'nav.dashboard': 'டாஷ்போர்டு', 'nav.products': 'பொருட்கள்', 'nav.assistant': 'AI நண்பன்', 'nav.store': 'என் கடை', 'nav.plans': 'திட்டங்கள்',
  'store.nearby': 'உங்களுக்கு அருகிலுள்ள கடைகள்', 'store.search': 'கடை அல்லது பொருளைத் தேடுங்கள்', 'store.open': 'திறந்துள்ளது', 'store.km': 'கிமீ தொலைவு',
  'cart.empty': 'உங்கள் கூடை காலியாக உள்ளது', 'cart.checkout': 'செக்அவுட்', 'cart.add': 'சேர்', 'cart.pickup': 'நேரில் எடுத்தல்', 'cart.delivery': 'டெலிவரி',
  'cart.fullPay': 'முழு தொகை', 'cart.partPay': 'பகுதி தொகை இப்போது', 'cart.total': 'மொத்தம்', 'cart.payNow': 'இப்போது செலுத்த', 'cart.payLater': 'கடையில் செலுத்த',
  'fee.subtotal': 'துணை மொத்தம்', 'fee.delivery': 'டெலிவரி கட்டணம்', 'fee.platform': 'தளக் கட்டணம்', 'fee.handling': 'கையாளும் கட்டணம்', 'fee.visiting': 'வருகைக் கட்டணம்',
  'order.placed': 'ஆர்டர் செய்யப்பட்டது', 'order.ready': 'எடுத்துக்கொள்ள தயார்', 'order.status': 'நிலை',
  'settings.radius': 'தேடல் தூரம் (கிமீ)', 'settings.language': 'மொழி', 'settings.logout': 'வெளியேறு',
  'vendor.speak': 'அழுத்திப் பேசுங்கள்', 'vendor.listening': 'கேட்கிறேன்…', 'vendor.publish': 'மதிப்பாய்வுக்கு அனுப்பு', 'vendor.trialLeft': 'நாட்கள் இலவச சோதனை மீதம்',
  'common.save': 'சேமி', 'common.next': 'அடுத்து', 'common.back': 'பின்', 'common.loading': 'ஏற்றுகிறது…', 'common.retry': 'மீண்டும் முயற்சி',
};
export const DICTIONARIES: Record<Language, Dict> = { en, hi, ta };
export const translate = (lang: Language, key: string): string => DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
export const makeT = (lang: Language) => (key: string) => translate(lang, key);
