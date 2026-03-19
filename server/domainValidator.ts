import { ENV } from './_core/env';

/**
 * Validates that an email address belongs to an allowed domain.
 * Allowed domains: @leasingtim.mx, @bpads.mx
 * The ADMIN_EMAIL can also bypass domain restrictions.
 */

const ALLOWED_DOMAINS = ['leasingtim.mx', 'bpads.mx', 'niumedia.mx'];

export function isEmailDomainAllowed(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1];
  
  if (!domain) return false;

  // Check if it's the admin email (bypasses domain restriction)
  if (ENV.adminEmail && normalizedEmail === ENV.adminEmail.toLowerCase()) {
    return true;
  }

  return ALLOWED_DOMAINS.includes(domain);
}

export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS];
}
