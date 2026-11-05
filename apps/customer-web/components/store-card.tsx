'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Bike, MapPin, Store } from 'lucide-react';
import type { StoreSummary } from '@busyfrnd/shared';
import { categoryMeta } from '@busyfrnd/shared';
import { Badge, StoreCover } from '@busyfrnd/web-ui';

export function StoreCard({ s, kmLabel }: { s: StoreSummary; kmLabel: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
      <Link href={`/store/${s.id}`} className="group block overflow-hidden rounded-[28px] border border-line bg-white shadow-soft transition-shadow hover:shadow-lift">
        <StoreCover category={s.category} name={s.name} className="h-36">
          {s.distanceKm != null && <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold shadow">{s.distanceKm} {kmLabel}</span>}
        </StoreCover>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-extrabold leading-tight tracking-tight">{s.name}</h3></div>
          <div className="flex items-center gap-1.5 text-sm text-muted"><span>{categoryMeta(s.category).emoji}</span><span className="font-medium capitalize">{categoryMeta(s.category).label}</span>{s.village && <><span>·</span><MapPin size={13} /><span className="truncate">{s.village}</span></>}</div>
          <div className="flex gap-2">{s.offersPickup && <Badge tone="green"><Store size={12} />Pickup</Badge>}{s.offersDelivery && <Badge tone="blue"><Bike size={12} />Delivery</Badge>}</div>
        </div>
      </Link>
    </motion.div>
  );
}
