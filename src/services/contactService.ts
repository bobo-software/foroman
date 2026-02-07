/**
 * Contact Service
 * Handles all contact-related API calls (people at client companies)
 */

import { skaftinClient } from '../backend';
import type { Contact, CreateContactDto } from '../types/contact';

const TABLE_NAME = 'contacts';

export class ContactService {
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Contact[]> {
    const response = await skaftinClient.post<{ rows: Contact[]; rowCount: number } | Contact[]>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        limit: params?.limit ?? 5000,
        offset: params?.offset ?? 0,
        ...(params?.where && { where: params.where }),
        ...(params?.orderBy && { orderBy: params.orderBy }),
        ...(params?.orderDirection && { orderDirection: params.orderDirection }),
      }
    );
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.rows || [];
  }

  static async findByCompanyId(companyId: number): Promise<Contact[]> {
    return this.findAll({ where: { company_id: companyId } });
  }

  static async findById(id: number): Promise<Contact | null> {
    const response = await skaftinClient.post<{ rows: Contact[] } | Contact[]>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        where: { id },
        limit: 1,
        offset: 0,
      }
    );
    const data = response.data;
    if (Array.isArray(data)) return data[0] || null;
    return data?.rows?.[0] || null;
  }

  static async create(data: CreateContactDto): Promise<Contact> {
    const response = await skaftinClient.post<Contact>(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  static async update(id: number, data: Partial<CreateContactDto>): Promise<{ rowCount: number }> {
    const response = await skaftinClient.put<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/update`,
      {
        where: { id },
        data,
      }
    );
    return response.data;
  }

  static async delete(id: number): Promise<{ rowCount: number }> {
    const response = await skaftinClient.delete<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/delete`,
      {
        where: { id },
      }
    );
    return response.data;
  }

  static async deleteByCompanyId(companyId: number): Promise<{ rowCount: number }> {
    const response = await skaftinClient.delete<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/delete`,
      {
        where: { company_id: companyId },
      }
    );
    return response.data;
  }

  static async setPrimary(id: number, companyId: number): Promise<void> {
    // First, unset any existing primary contacts for this company
    const existingPrimary = await this.findAll({
      where: { company_id: companyId, is_primary: true }
    });
    
    for (const contact of existingPrimary) {
      if (contact.id && contact.id !== id) {
        await this.update(contact.id, { is_primary: false });
      }
    }
    
    // Set the new primary contact
    await this.update(id, { is_primary: true });
  }
}

export default ContactService;
