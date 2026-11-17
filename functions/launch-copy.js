// Owner-supplied launch facts, 17 November 2026. Public business contact only.
// Delivery phrasing and the returns-window starting point await owner review.
export const launchContactPhone = '+256759334383';
export const launchReturnsDays = 10;
export const defaultLaunchCopy = {
  collection: 'Collect from Muyenga, by appointment.',
  delivery: 'Delivery within Kampala by boda, with the fee agreed by phone. Outside Kampala and international delivery by quote.',
  payment: 'Pay by cash or MTN/Airtel Mobile Money on collection or delivery.',
};
const previousDefaults = {
  collection: 'Staff will contact you to arrange collection.',
  delivery: 'Delivery and final total to be confirmed.',
  payment: 'Staff will contact you to confirm the order and arrange payment.',
};

export function resolveLaunchPolicy(policy) {
  const copy = Object.fromEntries(Object.entries(defaultLaunchCopy).map(([key, fallback]) => {
    const saved = policy?.copy?.[key];
    return [key, typeof saved === 'string' && saved.trim()
      && (policy.copyReviewed === true || saved !== previousDefaults[key]) ? saved : fallback];
  }));
  return { copy, copyReviewed: policy?.copyReviewed === true,
    whatsappNumber: /^\+[1-9][0-9]{7,14}$/.test(policy?.whatsappNumber ?? '') ? policy.whatsappNumber : '' };
}
