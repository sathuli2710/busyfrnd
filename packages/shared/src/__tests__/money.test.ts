import test from 'node:test';
import assert from 'node:assert/strict';
import { computePrice, deliveryFeeFor, type FeePolicy } from '../money';
import { haversineKm } from '../geo';
import { LAYOUT_TEMPLATES } from '../layouts';

const policy: FeePolicy = {
  offersPickup: true, offersDelivery: true, deliveryFee: 2000, lowOrderThreshold: 19900, lowOrderDeliveryFee: 5000,
  freeDeliveryAbove: 99900, platformFee: 500, handlingFee: 1000, visitingFee: 3000, partialPaymentEnabled: false, partialPercent: 30,
};

test('pickup never pays delivery', () => {
  const p = computePrice({ subtotal: 10000, hasService: false, fulfillment: 'PICKUP', paymentMode: 'FULL', policy });
  assert.equal(p.lines.some((l) => l.key === 'delivery'), false);
  assert.equal(p.total, 10000 + 500 + 1000);
});
test('low order delivery fee tier and free threshold', () => {
  assert.equal(deliveryFeeFor(policy, 15000), 5000);
  assert.equal(deliveryFeeFor(policy, 25000), 2000);
  assert.equal(deliveryFeeFor(policy, 100000), 0);
});
test('visiting charge only for services', () => {
  const a = computePrice({ subtotal: 50000, hasService: true, fulfillment: 'PICKUP', paymentMode: 'FULL', policy });
  assert.ok(a.lines.some((l) => l.key === 'visiting'));
});
test('partial payment requires opt-in', () => {
  assert.throws(() => computePrice({ subtotal: 50000, hasService: false, fulfillment: 'PICKUP', paymentMode: 'PARTIAL', policy }));
  const p = computePrice({ subtotal: 100000, hasService: false, fulfillment: 'PICKUP', paymentMode: 'PARTIAL', policy: { ...policy, partialPaymentEnabled: true } });
  assert.equal(p.payNow + p.payLater, p.total);
  assert.equal(p.payNow, Math.round(p.total * 0.3));
});
test('haversine ~ known distance', () => {
  const d = haversineKm({ lat: 13.0827, lng: 80.2707 }, { lat: 12.9716, lng: 77.5946 }); // Chennai-Bengaluru
  assert.ok(d > 280 && d < 300);
});
test('templates: tiers and uniqueness', () => {
  assert.equal(new Set(LAYOUT_TEMPLATES.map((t) => t.id)).size, LAYOUT_TEMPLATES.length);
  assert.equal(LAYOUT_TEMPLATES.filter((t) => t.tier === 'BASIC').length, 3);
  assert.ok(LAYOUT_TEMPLATES.length >= 60);
});
