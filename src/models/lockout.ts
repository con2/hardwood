/** Failed sign-ins tolerated before an invitation is locked. */
export const maxFailedSignIns = 5;
const maxLockoutMinutes = 60;

/**
 * Minutes an invitation stays locked after `failedSignIns` consecutive failures: nothing before
 * the fifth, then 1, 2, 4, 8 … minutes, capped at an hour.
 */
export function lockoutMinutes(failedSignIns: number): number {
  if (failedSignIns < maxFailedSignIns) return 0;
  return Math.min(2 ** (failedSignIns - maxFailedSignIns), maxLockoutMinutes);
}
