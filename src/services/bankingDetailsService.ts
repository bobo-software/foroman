/**
 * Banking Details Service
 * Handles all banking details API calls for users and companies
 */

import { skaftinClient } from '../backend';
import type { BankingDetails, CreateBankingDetailsDto } from '../types/bankingDetails';

const TABLE_NAME = 'banking_details';

export class BankingDetailsService {
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<BankingDetails[]> {
    const response = await skaftinClient.post<{ rows: BankingDetails[]; rowCount: number } | BankingDetails[]>(
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

  static async findByCompanyId(companyId: number): Promise<BankingDetails[]> {
    return this.findAll({ where: { company_id: companyId } });
  }

  static async findByUserId(userId: number): Promise<BankingDetails[]> {
    return this.findAll({ where: { user_id: userId } });
  }

  static async findById(id: number): Promise<BankingDetails | null> {
    const response = await skaftinClient.post<{ rows: BankingDetails[] } | BankingDetails[]>(
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

  static async create(data: CreateBankingDetailsDto): Promise<BankingDetails> {
    const response = await skaftinClient.post<BankingDetails>(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  static async update(id: number, data: Partial<CreateBankingDetailsDto>): Promise<{ rowCount: number }> {
    const response = await skaftinClient.put<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/update`,
      {
        where: { id },
        data: {
          ...data,
          updated_at: new Date().toISOString(),
        },
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

  static async deleteByUserId(userId: number): Promise<{ rowCount: number }> {
    const response = await skaftinClient.delete<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/delete`,
      {
        where: { user_id: userId },
      }
    );
    return response.data;
  }

  /**
   * Set a banking detail as primary, unsetting any other primary for the same entity
   */
  static async setPrimary(id: number, entityType: 'company' | 'user', entityId: number): Promise<void> {
    const whereKey = entityType === 'company' ? 'company_id' : 'user_id';
    
    // First, unset any existing primary banking details for this entity
    const existingPrimary = await this.findAll({
      where: { [whereKey]: entityId, is_primary: true }
    });
    
    for (const detail of existingPrimary) {
      if (detail.id && detail.id !== id) {
        await this.update(detail.id, { is_primary: false });
      }
    }
    
    // Set the new primary
    await this.update(id, { is_primary: true });
  }

  /**
   * Get the primary banking details for an entity
   */
  static async getPrimary(entityType: 'company' | 'user', entityId: number): Promise<BankingDetails | null> {
    const whereKey = entityType === 'company' ? 'company_id' : 'user_id';
    const details = await this.findAll({
      where: { [whereKey]: entityId, is_primary: true },
    });
    return details[0] || null;
  }

  /**
   * Get all active banking details for an entity
   */
  static async getActive(entityType: 'company' | 'user', entityId: number): Promise<BankingDetails[]> {
    const whereKey = entityType === 'company' ? 'company_id' : 'user_id';
    return this.findAll({
      where: { [whereKey]: entityId, is_active: true },
    });
  }
}

export default BankingDetailsService;
