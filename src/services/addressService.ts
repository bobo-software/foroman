/**
 * Address Service
 * Handles all address-related API calls for users and companies
 */

import { skaftinClient } from '../backend';
import type { Address, CreateAddressDto } from '../types/address';

const TABLE_NAME = 'addresses';

export class AddressService {
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Address[]> {
    const response = await skaftinClient.post<{ rows: Address[]; rowCount: number } | Address[]>(
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

  static async findByCompanyId(companyId: number): Promise<Address[]> {
    return this.findAll({ where: { company_id: companyId } });
  }

  static async findByUserId(userId: number): Promise<Address[]> {
    return this.findAll({ where: { user_id: userId } });
  }

  static async findById(id: number): Promise<Address | null> {
    const response = await skaftinClient.post<{ rows: Address[] } | Address[]>(
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

  static async create(data: CreateAddressDto): Promise<Address> {
    const response = await skaftinClient.post<Address>(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  static async update(id: number, data: Partial<CreateAddressDto>): Promise<{ rowCount: number }> {
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
   * Set an address as primary, unsetting any other primary addresses for the same entity
   */
  static async setPrimary(id: number, entityType: 'company' | 'user', entityId: number): Promise<void> {
    const whereKey = entityType === 'company' ? 'company_id' : 'user_id';
    
    // First, unset any existing primary addresses for this entity
    const existingPrimary = await this.findAll({
      where: { [whereKey]: entityId, is_primary: true }
    });
    
    for (const address of existingPrimary) {
      if (address.id && address.id !== id) {
        await this.update(address.id, { is_primary: false });
      }
    }
    
    // Set the new primary address
    await this.update(id, { is_primary: true });
  }

  /**
   * Get the primary address for an entity
   */
  static async getPrimary(entityType: 'company' | 'user', entityId: number): Promise<Address | null> {
    const whereKey = entityType === 'company' ? 'company_id' : 'user_id';
    const addresses = await this.findAll({
      where: { [whereKey]: entityId, is_primary: true },
    });
    return addresses[0] || null;
  }
}

export default AddressService;
