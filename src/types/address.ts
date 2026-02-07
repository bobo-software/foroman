/**
 * Address types — physical and postal addresses for users and companies
 */

export type AddressType = 'physical' | 'postal' | 'billing' | 'shipping';

export interface Address {
  id?: number;
  /** Reference to authenticated user (optional) */
  user_id?: number;
  /** Reference to company (optional) */
  company_id?: number;
  /** Label for this address (e.g., "Head Office", "Warehouse", "Home") */
  label?: string;
  /** Street address line 1 */
  street_address?: string;
  /** Street address line 2 (unit, suite, etc.) */
  street_address_2?: string;
  /** Suburb / neighborhood */
  suburb?: string;
  /** Town (smaller than city) */
  town?: string;
  /** City */
  city?: string;
  /** Province / State */
  province?: string;
  /** Country (defaults to South Africa) */
  country?: string;
  /** Postal / ZIP code */
  postal_code?: string;
  /** Whether this is the primary address */
  is_primary?: boolean;
  /** Type of address: physical, postal, billing, shipping */
  address_type?: AddressType;
  /** Additional notes */
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressDto {
  user_id?: number;
  company_id?: number;
  label?: string;
  street_address?: string;
  street_address_2?: string;
  suburb?: string;
  town?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  is_primary?: boolean;
  address_type?: AddressType;
  notes?: string;
}

/**
 * Helper to format an address as a single string
 */
export function formatAddress(address: Address, includeCountry = true): string {
  const parts: string[] = [];
  
  if (address.street_address) parts.push(address.street_address);
  if (address.street_address_2) parts.push(address.street_address_2);
  if (address.suburb) parts.push(address.suburb);
  if (address.town) parts.push(address.town);
  if (address.city) parts.push(address.city);
  if (address.province) parts.push(address.province);
  if (address.postal_code) parts.push(address.postal_code);
  if (includeCountry && address.country) parts.push(address.country);
  
  return parts.join(', ');
}

/**
 * Helper to format address as multiple lines
 */
export function formatAddressLines(address: Address, includeCountry = true): string[] {
  const lines: string[] = [];
  
  if (address.street_address) lines.push(address.street_address);
  if (address.street_address_2) lines.push(address.street_address_2);
  
  const locality: string[] = [];
  if (address.suburb) locality.push(address.suburb);
  if (address.town) locality.push(address.town);
  if (locality.length) lines.push(locality.join(', '));
  
  const region: string[] = [];
  if (address.city) region.push(address.city);
  if (address.province) region.push(address.province);
  if (address.postal_code) region.push(address.postal_code);
  if (region.length) lines.push(region.join(', '));
  
  if (includeCountry && address.country) lines.push(address.country);
  
  return lines;
}
