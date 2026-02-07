/**
 * Business types — the user's own company/business entity
 */

import type { DocumentTemplateId } from './documentTemplate';

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
  /** Selected document template id (defaults to 'classic') */
  document_template?: DocumentTemplateId;
  /** Whether to embed the company logo in generated PDFs */
  show_logo_on_documents?: boolean;
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
  document_template?: DocumentTemplateId;
  show_logo_on_documents?: boolean;
}

export interface UserBusiness {
  id?: number;
  user_id: number;
  business_id: number;
  created_at?: string;
  updated_at?: string;
}
