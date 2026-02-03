/**
 * Item / Stock Service
 * Handles items (products/stock) API calls
 */

import { skaftinClient } from '../backend';
import type { Item, CreateItemDto } from '../types/item';

const TABLE_NAME = 'items';

export class ItemService {
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Item[]> {
    const response = await skaftinClient.post<{ rows: Item[]; rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        limit: params?.limit ?? 5000,
        offset: params?.offset ?? 0,
        ...(params?.where && { where: params.where }),
        ...(params?.orderBy && { orderBy: params.orderBy }),
        ...(params?.orderDirection && { orderDirection: params.orderDirection }),
      }
    );
    return response.data.rows || [];
  }

  static async findById(id: number): Promise<Item | null> {
    const response = await skaftinClient.post<{ rows: Item[] }>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        where: { id },
        limit: 1,
        offset: 0,
      }
    );
    return response.data.rows?.[0] || null;
  }

  static async create(data: CreateItemDto): Promise<Item> {
    const response = await skaftinClient.post<Item>(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  static async update(id: number, data: Partial<CreateItemDto>): Promise<{ rowCount: number }> {
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

  static async count(where?: Record<string, unknown>): Promise<number> {
    const response = await skaftinClient.post<{ rowCount: number }>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        ...(where && { where }),
        limit: 1,
        offset: 0,
      }
    );
    return response.data.rowCount || 0;
  }
}

export default ItemService;
