/**
 * Business types — the user's own company/business entity
 */

export interface Business {
  id?: number;
  user_id?: number;
  name: string;
  address?: string;
  phone?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  banking_details?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBusinessDto {
  name: string;
  address?: string;
  phone?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  banking_details?: string;
  logo_url?: string;
}

export interface UserBusiness {
  id?: number;
  user_id: number;
  business_id: number;
  created_at?: string;
  updated_at?: string;
}
