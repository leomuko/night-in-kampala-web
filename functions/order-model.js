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
  submissionsPerHour: 5,
  copyReviewed: false,
  copy: {
    collection: 'Staff will contact you to arrange collection.',
    delivery: 'Delivery and final total to be confirmed.',
    payment: 'Staff will contact you to confirm the order and arrange payment.',
  },
};

export const maxOrderLines = 12;
export const maxLineQuantity = 20;
export const emulatorOrderCheck = 'demo-order-form';
