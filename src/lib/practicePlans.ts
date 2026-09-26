/** Professional plans. Prices must match the app (FamilyBridge src/types.ts PLAN_PRICES) and the backend (_shared/square.ts). */
export type PlanId = 'solo' | 'practice' | 'organization';
export type Period = 'monthly' | 'quarterly' | 'annual';

export const PLANS: { id: PlanId; name: string; price: Record<Period, number>; families: string; who: string; featured?: boolean }[] = [
  { id: 'solo', name: 'Solo', price: { monthly: 149, quarterly: 424.99, annual: 1520 }, families: 'Up to 15 families', who: 'Interventionists, recovery coaches and therapists' },
  { id: 'practice', name: 'Practice', price: { monthly: 399, quarterly: 1137, annual: 4070 }, families: 'Up to 50 families', who: 'Group practices, sober living and outpatient programs', featured: true },
  { id: 'organization', name: 'Organization', price: { monthly: 1499, quarterly: 4272, annual: 15290 }, families: 'Unlimited families', who: 'Treatment centers and multi-site programs' },
];

export const PERIODS: { id: Period; label: string; unit: string; billed: string; months: number; save?: string }[] = [
  { id: 'monthly', label: 'Monthly', unit: '/month', billed: 'Billed monthly', months: 1 },
  { id: 'quarterly', label: 'Quarterly', unit: '/quarter', billed: 'billed every 3 months', months: 3, save: 'Save 5%' },
  { id: 'annual', label: 'Annual', unit: '/year', billed: 'billed once a year', months: 12, save: 'Save 15%' },
];

export const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const isPlan = (v: unknown): v is PlanId => PLANS.some((p) => p.id === v);
export const isPeriod = (v: unknown): v is Period => PERIODS.some((p) => p.id === v);
