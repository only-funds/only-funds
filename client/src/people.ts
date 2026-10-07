import type { AcademicType, SubscriptionPlan, User } from './types';

export const ACADEMIC_LABELS: Record<AcademicType, string> = { pi: '导师', postdoc: '博士后', phd: '博士生', masters: '硕士生', undergrad: '本科生' };
const ACADEMIC_RANK: Record<AcademicType, number> = { pi: 0, postdoc: 1, phd: 2, masters: 3, undergrad: 4 };
export const academicRank = (user: User) => ACADEMIC_RANK[user.academicType || (user.role === 'boss' ? 'pi' : 'phd')];
export const DEFAULT_PLANS: SubscriptionPlan[] = [{ id: 'standard', name: '一起做研究', monthlyUsd: 0, description: '追更研究动态，一起交流新点子。' }];
export const plansOf = (user: User) => user.plans?.length ? user.plans : DEFAULT_PLANS;
export const isStudent = (user: User) => ['phd', 'masters', 'undergrad'].includes(user.academicType || (user.role === 'creator' ? 'phd' : 'pi'));
export const priceOf = (user: User) => user.subscription?.plan.monthlyUsd ?? plansOf(user)[0].monthlyUsd;
export function priceLabel(amount: number) { return amount < 0 ? `倒贴 $${Math.abs(amount).toLocaleString('en-US')} / 月` : `$${amount.toLocaleString('en-US')} / 月`; }
export function academicLine(user: User) { return `${user.field || ACADEMIC_LABELS[user.academicType || (user.role === 'boss' ? 'pi' : 'phd')]}${user.year ? ` | Year ${user.year}` : ''}`; }
