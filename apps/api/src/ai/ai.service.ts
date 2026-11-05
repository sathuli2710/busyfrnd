import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PLANS, STORE_CATEGORIES, boundingBox, haversineKm, suggestTemplates, type Language } from '@busyfrnd/shared';
import { PrismaService } from '../common/prisma.service';
import { PlanService, effectivePlan } from '../common/plan.service';

const LANG_NAME: Record<Language, string> = { en: 'English', hi: 'Hindi (Devanagari)', ta: 'Tamil' };

export interface OnboardingDraft {
  name: string; category: string; description: string; village?: string; phone?: string;
  offersPickup: boolean; offersDelivery: boolean; deliveryFeePaise?: number;
  items: Array<{ name: string; pricePaise: number; kind: 'PRODUCT' | 'SERVICE' }>;
  templateIds: string[]; reply: string;
}

@Injectable()
export class AiService {
  private log = new Logger('AI');
  private client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  constructor(private prisma: PrismaService, private plans: PlanService) {}

  get live() { return !!this.client; }

  private async guard(userId: string) {
    const v = await this.plans.vendorFor(userId);
    const limit = PLANS[effectivePlan(v)].aiTokensPerPeriod;
    if (v.aiTokensUsed >= limit) throw new ForbiddenException('AI token limit reached for your plan. Upgrade to continue.');
    return v;
  }

  private async record(vendorId: string, kind: string, tokens: number) {
    await this.prisma.$transaction([
      this.prisma.aiUsage.create({ data: { vendorId, kind, tokens } }),
      this.prisma.vendor.update({ where: { id: vendorId }, data: { aiTokensUsed: { increment: tokens } } }),
    ]);
  }

  private async ask(system: string, user: string, maxTokens = 1024) {
    const res = await this.client!.messages.create({ model: process.env.AI_MODEL ?? 'claude-haiku-5-5', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] });
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    return { text, tokens: res.usage.input_tokens + res.usage.output_tokens };
  }

  /** Voice transcript (any of en/hi/ta, mixed ok) → draft store profile. */
  async onboard(userId: string, transcript: string, language: Language): Promise<OnboardingDraft> {
    const v = await this.guard(userId);
    let draft: OnboardingDraft | null = null;
    if (this.client) {
      try {
        const { text, tokens } = await this.ask(
          `You help semi-literate small shop owners in India set up an online store from what they say. They may speak ${LANG_NAME[language]}, English or a mix. ` +
            `Extract a store profile. Reply with ONLY minified JSON: {"name":string,"category":one of ${JSON.stringify(STORE_CATEGORIES)},"description":string (1-2 friendly sentences in ${LANG_NAME[language]}),"village":string|null,"phone":string|null,` +
            `"offersPickup":boolean,"offersDelivery":boolean,"deliveryFeeRupees":number|null,"items":[{"name":string,"priceRupees":number,"kind":"PRODUCT"|"SERVICE"}],"reply":string (short confirmation in ${LANG_NAME[language]} telling the owner what you understood and asking what to fix)}. ` +
            `Keep item names in the language spoken. Never invent items or prices that were not said.`,
          transcript, 1500);
        await this.record(v.id, 'onboarding', tokens);
        const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
        draft = {
          name: String(j.name ?? '').slice(0, 80), category: STORE_CATEGORIES.includes(j.category) ? j.category : 'other', description: String(j.description ?? ''),
          village: j.village ?? undefined, phone: j.phone ?? undefined, offersPickup: j.offersPickup !== false, offersDelivery: !!j.offersDelivery,
          deliveryFeePaise: j.deliveryFeeRupees != null ? Math.round(+j.deliveryFeeRupees * 100) : undefined,
          items: (Array.isArray(j.items) ? j.items : []).slice(0, 50).map((i: any) => ({ name: String(i.name).slice(0, 80), pricePaise: Math.max(0, Math.round(+i.priceRupees * 100) || 0), kind: i.kind === 'SERVICE' ? 'SERVICE' : 'PRODUCT' })),
          templateIds: [], reply: String(j.reply ?? ''),
        };
      } catch (e) {
        this.log.warn(`AI onboarding failed, using fallback: ${e}`);
      }
    }
    draft ??= this.heuristicOnboard(transcript, language);
    draft.templateIds = suggestTemplates(draft.category, 4).map((t) => t.id);
    return draft;
  }

  /** Rule-based fallback so the flow works with no API key. */
  private heuristicOnboard(t: string, lang: Language): OnboardingDraft {
    const lower = t.toLowerCase();
    const cats: Array<[string, RegExp]> = [
      ['mobile', /mobile|phone|மொபைல்|मोबाइल/], ['grocery', /grocer|kirana|provision|மளிகை|किराना/], ['bakery', /bakery|cake|பேக்கரி|बेकरी/],
      ['restaurant', /restaurant|hotel|food|உணவு|होटल|खाना/], ['salon', /salon|beauty|parlou?r|சலூன்|सैलून/], ['pharmacy', /pharmacy|medical|மருந்து|दवा/],
      ['clothing', /cloth|textile|saree|ஜவுளி|कपड़े/], ['repair', /repair|service|பழுது|मरम्मत/], ['electronics', /electronic|electrical|மின்/],
    ];
    const category = cats.find(([, re]) => re.test(lower))?.[0] ?? 'other';
    const nameMatch = t.match(/(?:my (?:shop|store) (?:is )?(?:called|named)|shop name is|store name is|called|named)\s+([^,.\n]+)/i);
    const items = [...t.matchAll(/([\p{L}][\p{L}\s]{1,30}?)\s*(?:for|at|-|:)?\s*(?:rs\.?|₹|rupees?|ரூபாய்|रुपये)?\s*(\d{1,6})\b/giu)]
      .map((m) => ({ name: m[1].trim(), pricePaise: +m[2] * 100, kind: 'PRODUCT' as const })).filter((i) => i.name.length > 1).slice(0, 30);
    const reply: Record<Language, string> = {
      en: 'I created a draft of your store. Please check the name, items and prices.',
      hi: 'मैंने आपकी दुकान का ड्राफ़्ट बना दिया है। कृपया नाम, सामान और दाम जाँच लें।',
      ta: 'உங்கள் கடையின் வரைவை உருவாக்கினேன். பெயர், பொருட்கள், விலைகளைச் சரிபார்க்கவும்.',
    };
    return {
      name: nameMatch?.[1].trim() ?? t.split(/[,.\n]/)[0].trim().slice(0, 60), category, description: t.slice(0, 200),
      offersPickup: true, offersDelivery: /deliver|டெலிவரி|डिलीवरी/i.test(lower), items, templateIds: [], reply: reply[lang],
    };
  }

  /** Customer natural-language search: "birthday cake under 500" → keywords + price cap → nearby items. */
  async shop(text: string, near: { lat: number; lng: number; radius: number }, language: Language) {
    let keywords: string[] = []; let maxPrice: number | null = null; let reply = '';
    if (this.client) {
      try {
        const { text: out } = await this.ask(
          `You turn a shopper's request (English/Hindi/Tamil/mixed) into a search over local shops. Reply ONLY minified JSON: {"keywords":string[] (1-4 short ENGLISH singular nouns/terms that would appear in item names, include synonyms),"maxPriceRupees":number|null,"reply":string (one friendly sentence in ${LANG_NAME[language]} saying what you're looking for)}.`, text, 300);
        const j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
        keywords = (j.keywords ?? []).map((k: unknown) => String(k).toLowerCase()).filter(Boolean).slice(0, 5);
        maxPrice = j.maxPriceRupees != null ? +j.maxPriceRupees : null; reply = String(j.reply ?? '');
      } catch (e) { this.log.warn(`AI shop failed, using fallback: ${e}`); }
    }
    if (!keywords.length) {
      const m = text.match(/(?:under|below|less than|within|upto|up to|₹|rs\.?)\s*(\d{2,6})/i);
      maxPrice = maxPrice ?? (m ? +m[1] : null);
      const stop = new Set(['under', 'below', 'less', 'than', 'within', 'upto', 'near', 'me', 'for', 'the', 'a', 'an', 'in', 'my', 'need', 'want', 'get', 'find', 'buy', 'rs', 'rupees', 'and', 'with', 'of', 'to', 'i']);
      keywords = text.toLowerCase().replace(/[₹\d.,]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)).slice(0, 4);
    }
    const bb = boundingBox(near, near.radius);
    const stores = await this.prisma.store.findMany({ where: { status: 'PUBLISHED', publishApp: true, lat: { gte: bb.minLat, lte: bb.maxLat }, lng: { gte: bb.minLng, lte: bb.maxLng } } });
    const inRange = new Map(stores.map((s) => [s.id, { s, d: haversineKm(near, s) }]).filter(([, v]) => (v as { d: number }).d <= near.radius) as Array<[string, { s: (typeof stores)[number]; d: number }]>);
    const items = keywords.length ? await this.prisma.item.findMany({
      where: { storeId: { in: [...inRange.keys()] }, archived: false, inStock: true, OR: keywords.map((k) => ({ OR: [{ name: { contains: k, mode: 'insensitive' as const } }, { description: { contains: k, mode: 'insensitive' as const } }, { category: { contains: k, mode: 'insensitive' as const } }] })), ...(maxPrice ? { pricePaise: { lte: maxPrice * 100 } } : {}) },
      take: 24,
    }) : [];
    const out = items.map((i) => ({ id: i.id, storeId: i.storeId, name: i.name, kind: i.kind, pricePaise: i.pricePaise, storeName: inRange.get(i.storeId)!.s.name, distanceKm: Math.round(inRange.get(i.storeId)!.d * 10) / 10 })).sort((a, b) => a.distanceKm - b.distanceKm);
    return { reply: reply || (out.length ? `Here's what I found for "${keywords.join(', ')}"${maxPrice ? ` under ₹${maxPrice}` : ''}.` : `I couldn't find "${keywords.join(', ') || text}" nearby yet.`), keywords, maxPrice, items: out, live: !!this.client };
  }

  /** Business assistant: answers questions about the vendor's own sales, in their language. */
  async assistant(userId: string, message: string, language: Language) {
    const v = await this.guard(userId);
    const facts = await this.facts(v.id);
    if (this.client) {
      try {
        const { text, tokens } = await this.ask(
          `You are "AI Buddy", a friendly voice assistant for a small shop owner in India, like a helpful shop employee. Answer ONLY from the JSON business data given; if it isn't there, say you don't have it. ` +
            `Reply in ${LANG_NAME[language]} in 1-4 short, spoken-style sentences (no markdown, no tables). Amounts are in rupees.`,
          `DATA:\n${JSON.stringify(facts)}\n\nOWNER SAID: ${message}`, 600);
        await this.record(v.id, 'assistant', tokens);
        return { reply: text.trim(), facts, live: true };
      } catch (e) {
        this.log.warn(`AI assistant failed, using fallback: ${e}`);
      }
    }
    return { reply: this.summaryText(facts, language), facts, live: false };
  }

  private summaryText(f: Awaited<ReturnType<AiService['facts']>>, l: Language) {
    const top = f.topItemsToday.map((i) => `${i.name} (${i.qty})`).join(', ');
    if (l === 'hi') return `आज ${f.ordersToday} ऑर्डर आए और ₹${f.revenueToday} की बिक्री हुई। ${f.pendingOrders} ऑर्डर अभी बाकी हैं।${top ? ` सबसे ज़्यादा बिके: ${top}।` : ''}`;
    if (l === 'ta') return `இன்று ${f.ordersToday} ஆர்டர்கள், ₹${f.revenueToday} விற்பனை. ${f.pendingOrders} ஆர்டர்கள் நிலுவையில் உள்ளன.${top ? ` அதிகம் விற்றவை: ${top}.` : ''}`;
    return `Today you got ${f.ordersToday} orders worth ₹${f.revenueToday}. ${f.pendingOrders} orders are still pending.${top ? ` Top sellers: ${top}.` : ''}`;
  }

  async facts(vendorId: string) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const storeIds = (await this.prisma.store.findMany({ where: { vendorId }, select: { id: true } })).map((s) => s.id);
    const base = { storeId: { in: storeIds }, status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] as never[] } };
    const [today, week, pending, lines] = await Promise.all([
      this.prisma.order.aggregate({ where: { ...base, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      this.prisma.order.aggregate({ where: { ...base, createdAt: { gte: weekAgo } }, _sum: { total: true }, _count: true }),
      this.prisma.order.count({ where: { storeId: { in: storeIds }, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] } } }),
      this.prisma.orderLine.groupBy({ by: ['name'], where: { order: { ...base, createdAt: { gte: startOfDay } } }, _sum: { qty: true }, orderBy: { _sum: { qty: 'desc' } }, take: 5 }),
    ]);
    return {
      date: new Date().toDateString(), revenueToday: Math.round((today._sum.total ?? 0) / 100), ordersToday: today._count,
      revenueLast7Days: Math.round((week._sum.total ?? 0) / 100), ordersLast7Days: week._count, pendingOrders: pending,
      topItemsToday: lines.map((l) => ({ name: l.name, qty: l._sum.qty ?? 0 })),
    };
  }
}
