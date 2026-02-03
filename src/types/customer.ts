/**
 * Customer types (CRM) — business customers
 */

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  /** Business / company legal name */
  company_name?: string;
  /** Tax identification number */
  tax_id?: string;
  /** e.g. LLC, Corporation, Sole Proprietorship, Partnership */
  business_type?: string;
  /** Official business/company registration number */
  registration_number?: string;
  /** VAT registration number */
  vat_number?: string;
  /** Industry or sector */
  industry?: string;
  /** Company website */
  website?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  tax_id?: string;
  business_type?: string;
  registration_number?: string;
  vat_number?: string;
  industry?: string;
  website?: string;
  notes?: string;
}
