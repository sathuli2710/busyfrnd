import type { OrderStatus } from '@busyfrnd/shared';
export const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'orange', PLACED: 'blue', ACCEPTED: 'blue', PREPARING: 'orange', READY: 'green', OUT_FOR_DELIVERY: 'green', COMPLETED: 'green', CANCELLED: 'red',
};
export const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const shortId = (id: string) => '#' + id.slice(-6).toUpperCase();
