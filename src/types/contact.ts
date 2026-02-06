/**
 * Contact types — people who work at client companies
 */

export interface Contact {
  id?: number;
  company_id?: number;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  is_primary?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContactDto {
  company_id?: number;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  is_primary?: boolean;
  notes?: string;
}
