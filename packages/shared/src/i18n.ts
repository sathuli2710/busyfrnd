import type { Language } from './constants';

type Dict = Record<string, string>;
const en: Dict = {
  'hello.morning': 'Good morning', 'hello.afternoon': 'Good afternoon', 'hello.evening': 'Good evening',
  'ai.askPlaceholder': 'Ask AI: “birthday cake under ₹500”', 'ai.thinking': 'Thinking…', 'ai.suggestions': 'Try asking', 'ai.title': 'Ask BusyFrnd AI',
  'home.categories': 'What are you looking for?', 'home.nearYou': 'Near you', 'home.noStores': 'No stores in range yet', 'home.widen': 'Try widening your search radius in Settings.',
  'cart.view': 'View cart', 'cart.items': 'items', 'cart.addMore': 'Add more', 'order.track': 'Track order',
  'insight.title': 'Smart insights', 'insight.up': 'Sales are up {n}% vs yesterday 🎉', 'insight.down': 'Sales are down {n}% vs yesterday — try sharing your store link.',
  'insight.pending': '{n} order(s) need your attention', 'insight.top': 'Top seller today: {name}', 'insight.trial': '{n} days of free trial left', 'insight.none': 'Add products to start getting orders',
  'vendor.askBuddy': 'Ask AI Buddy', 'vendor.tapSpeak': 'Tap to speak', 'vendor.quick1': 'How much did I sell today?', 'vendor.quick2': 'Which item sells the most?', 'vendor.quick3': 'Any pending orders?',
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
  'hello.morning': 'सुप्रभात', 'hello.afternoon': 'नमस्कार', 'hello.evening': 'शुभ संध्या',
  'ai.askPlaceholder': 'AI से पूछें: “₹500 के अंदर बर्थडे केक”', 'ai.thinking': 'सोच रहा हूँ…', 'ai.suggestions': 'पूछकर देखें', 'ai.title': 'BusyFrnd AI से पूछें',
  'home.categories': 'आप क्या ढूँढ रहे हैं?', 'home.nearYou': 'आपके पास', 'home.noStores': 'अभी दायरे में कोई दुकान नहीं', 'home.widen': 'सेटिंग्स में दायरा बढ़ाकर देखें।',
  'cart.view': 'कार्ट देखें', 'cart.items': 'आइटम', 'cart.addMore': 'और जोड़ें', 'order.track': 'ऑर्डर ट्रैक करें',
  'insight.title': 'स्मार्ट सुझाव', 'insight.up': 'कल से बिक्री {n}% बढ़ी 🎉', 'insight.down': 'कल से बिक्री {n}% घटी — अपनी दुकान का लिंक शेयर करें।',
  'insight.pending': '{n} ऑर्डर पर ध्यान चाहिए', 'insight.top': 'आज सबसे ज़्यादा बिका: {name}', 'insight.trial': 'मुफ़्त ट्रायल के {n} दिन बाकी', 'insight.none': 'ऑर्डर पाने के लिए सामान जोड़ें',
  'vendor.askBuddy': 'AI साथी से पूछें', 'vendor.tapSpeak': 'बोलने के लिए दबाएँ', 'vendor.quick1': 'आज कितनी बिक्री हुई?', 'vendor.quick2': 'सबसे ज़्यादा क्या बिकता है?', 'vendor.quick3': 'कोई ऑर्डर बाकी है?',
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
  'hello.morning': 'காலை வணக்கம்', 'hello.afternoon': 'வணக்கம்', 'hello.evening': 'மாலை வணக்கம்',
  'ai.askPlaceholder': 'AI-யிடம் கேளுங்கள்: “₹500-க்குள் பிறந்தநாள் கேக்”', 'ai.thinking': 'யோசிக்கிறேன்…', 'ai.suggestions': 'இப்படி கேட்டுப் பாருங்கள்', 'ai.title': 'BusyFrnd AI-யிடம் கேளுங்கள்',
  'home.categories': 'என்ன தேடுகிறீர்கள்?', 'home.nearYou': 'உங்களுக்கு அருகில்', 'home.noStores': 'தூரத்திற்குள் கடைகள் இல்லை', 'home.widen': 'அமைப்புகளில் தேடல் தூரத்தை அதிகரிக்கவும்.',
  'cart.view': 'கூடையைப் பார்', 'cart.items': 'பொருட்கள்', 'cart.addMore': 'மேலும் சேர்', 'order.track': 'ஆர்டரைக் கண்காணி',
  'insight.title': 'ஸ்மார்ட் தகவல்கள்', 'insight.up': 'நேற்றை விட விற்பனை {n}% அதிகம் 🎉', 'insight.down': 'நேற்றை விட விற்பனை {n}% குறைவு — உங்கள் கடை இணைப்பைப் பகிருங்கள்.',
  'insight.pending': '{n} ஆர்டர்களுக்கு கவனம் தேவை', 'insight.top': 'இன்று அதிகம் விற்றது: {name}', 'insight.trial': 'இலவச சோதனையில் {n} நாட்கள் மீதம்', 'insight.none': 'ஆர்டர்கள் பெற பொருட்களைச் சேர்க்கவும்',
  'vendor.askBuddy': 'AI நண்பனிடம் கேள்', 'vendor.tapSpeak': 'பேச அழுத்தவும்', 'vendor.quick1': 'இன்று எவ்வளவு விற்பனை?', 'vendor.quick2': 'எது அதிகம் விற்கிறது?', 'vendor.quick3': 'நிலுவை ஆர்டர்கள் உள்ளதா?',
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

/** Replace {placeholders} in a translated string. */
export const fill = (str: string, vars: Record<string, string | number>) => str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
