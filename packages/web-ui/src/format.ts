import type { OrderStatus } from '@busyfrnd/shared';
import type { Tone } from './ui';
export const STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: 'orange', PLACED: 'blue', ACCEPTED: 'blue', PREPARING: 'orange', READY: 'green', OUT_FOR_DELIVERY: 'green', COMPLETED: 'gray', CANCELLED: 'red',
};
export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment', PLACED: 'New', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
export const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtShort = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const shortId = (id: string) => '#' + id.slice(-6).toUpperCase();
