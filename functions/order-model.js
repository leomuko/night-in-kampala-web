import { defaultLaunchCopy } from './launch-copy.js';

export const openOrderStates = ['new', 'contacted', 'confirmed'];

export const orderTransitions = {
  new: ['contacted', 'confirmed', 'declined', 'cancelled', 'spam'],
  contacted: ['confirmed', 'declined', 'cancelled', 'spam'],
  confirmed: ['completed', 'cancelled'],
  declined: [], cancelled: [], spam: [], completed: [],
};

export const fulfilmentTransitions = {
  unfulfilled: ['ready_for_collection', 'dispatched'],
  ready_for_collection: ['delivered'],
  dispatched: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
};

export const defaultOrderSettings = {
  revision: 0,
  whatsappNumber: '',
  overdueHours: 24,
  openPerPhone: 3,
  activePerPiece: 1,
  submissionsPerHour: 50,
  copyReviewed: false,
  copy: { ...defaultLaunchCopy },
};

export const maxOrderLines = 12;
export const maxLineQuantity = 20;
export const emulatorOrderCheck = 'demo-order-form';

export function allowedFulfilment(order) {
  if (!['confirmed', 'completed'].includes(order.state) || order.items.some(item => item.state === 'requested')) return [];
  const next = fulfilmentTransitions[order.fulfilment] ?? [];
  return next.filter(state => {
    if (order.state === 'completed') return state === 'returned';
    if (state === 'ready_for_collection') return order.contact.method === 'collection';
    if (state === 'dispatched') return order.contact.method === 'delivery';
    return true;
  });
}

export function canCompleteOrder(order) {
  return order.state === 'confirmed' && order.paymentState === 'paid' && order.fulfilment === 'delivered'
    && order.items.some(item => item.state === 'sold')
    && !order.items.some(item => ['requested', 'reserved'].includes(item.state));
}
