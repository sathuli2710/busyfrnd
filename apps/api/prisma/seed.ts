import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo area: Chennai outskirts. Change to your own town for local testing.
const CENTER = { lat: 13.0827, lng: 80.2707 };

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@busyfrnd.app').toLowerCase();
  await prisma.user.upsert({
    where: { email_role: { email, role: 'ADMIN' } }, update: {},
    create: { role: 'ADMIN', email, emailVerified: true, name: 'Admin', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin12345', 10) },
  });

  const vendorUser = await prisma.user.upsert({
    where: { phone_role: { phone: '+919999900001', role: 'VENDOR' } }, update: {},
    create: { role: 'VENDOR', phone: '+919999900001', phoneVerified: true, email: 'demo.vendor@busyfrnd.app', emailVerified: true, name: 'Demo Vendor' },
  });
  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id }, update: {},
    create: { userId: vendorUser.id, plan: 'PRO', periodEndsAt: new Date(Date.now() + 365 * 86_400_000), trialEndsAt: new Date(Date.now() + 60 * 86_400_000) },
  });
  await prisma.user.upsert({
    where: { phone_role: { phone: '+919999900002', role: 'CUSTOMER' } }, update: {},
    create: { role: 'CUSTOMER', phone: '+919999900002', phoneVerified: true, name: 'Demo Customer', lat: CENTER.lat, lng: CENTER.lng },
  });

  if ((await prisma.store.count({ where: { vendorId: vendor.id } })) > 0) return console.log('Seed: demo stores already exist');

  const stores = [
    { name: 'Murugan Mobiles', nameLocal: 'முருகன் மொபைல்ஸ்', category: 'mobile', templateId: 'catalog-saffron', dLat: 0.01, dLng: 0.01, village: 'Ambattur', offersDelivery: true, deliveryFee: 3000, lowOrderThreshold: 19900, lowOrderDeliveryFee: 5000,
      items: [['Phone cover', 199, 'PRODUCT'], ['Tempered glass', 149, 'PRODUCT'], ['Fast charger 25W', 599, 'PRODUCT'], ['Screen replacement', 1800, 'SERVICE']] },
    { name: 'Annapoorna Provisions', nameLocal: 'அன்னபூர்ணா மளிகை', category: 'grocery', templateId: 'classic-forest', dLat: -0.02, dLng: 0.005, village: 'Anna Nagar', offersDelivery: true, deliveryFee: 2000, freeDeliveryAbove: 99900,
      items: [['Rice 5kg', 340, 'PRODUCT'], ['Toor dal 1kg', 160, 'PRODUCT'], ['Sunflower oil 1L', 150, 'PRODUCT'], ['Tea powder 250g', 120, 'PRODUCT']] },
    { name: 'Raj Hair Studio', category: 'salon', templateId: 'service-berry', dLat: 0.03, dLng: -0.02, village: 'Villivakkam', offersDelivery: false, visitingFee: 5000, partialPaymentEnabled: true,
      items: [['Haircut', 150, 'SERVICE'], ['Beard trim', 80, 'SERVICE'], ['Facial', 500, 'SERVICE']] },
  ];
  for (const s of stores) {
    const store = await prisma.store.create({
      data: {
        vendorId: vendor.id, name: s.name, nameLocal: s.nameLocal, category: s.category, templateId: s.templateId, village: s.village,
        description: `Welcome to ${s.name} — your friendly neighbourhood shop.`, hours: '9:00 AM – 9:00 PM', phone: '+919999900001', address: `${s.village}, Chennai`,
        lat: CENTER.lat + s.dLat, lng: CENTER.lng + s.dLng, status: 'PUBLISHED', publishWeb: true, publishApp: true, publishedAt: new Date(),
        offersPickup: true, offersDelivery: s.offersDelivery, deliveryFee: s.deliveryFee ?? 0, lowOrderThreshold: s.lowOrderThreshold, lowOrderDeliveryFee: s.lowOrderDeliveryFee,
        freeDeliveryAbove: s.freeDeliveryAbove, platformFee: 500, handlingFee: s.category === 'grocery' ? 1000 : 0, visitingFee: s.visitingFee ?? 0, partialPaymentEnabled: !!s.partialPaymentEnabled,
      },
    });
    await prisma.item.createMany({ data: s.items.map(([name, price, kind]) => ({ storeId: store.id, name: name as string, pricePaise: (price as number) * 100, kind: kind as 'PRODUCT' | 'SERVICE' })) });
  }
  console.log('Seed complete. Admin:', email, '| demo vendor +919999900001 | demo customer +919999900002 | OTP 123456');
}
main().finally(() => prisma.$disconnect());
