/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

import { skaftinClient } from '../backend';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ApiResponse } from '../types/invoice';

export class InvoiceService {
  private static readonly TABLE_NAME = 'invoices';

  /**
   * Get all invoices
   * POST /app-api/database/tables/invoices/select with limit & offset
   */
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]> {
    const response = await skaftinClient.post<{ rows: Invoice[]; rowCount: number }>(
      `/app-api/database/tables/${this.TABLE_NAME}/select`,
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

  /**
   * Get invoice by ID
   * POST /app-api/database/tables/invoices/select with limit & offset
   */
  static async findById(id: number): Promise<Invoice | null> {
    const response = await skaftinClient.post<{ rows: Invoice[] }>(
      `/app-api/database/tables/${this.TABLE_NAME}/select`,
      {
        where: { id },
        limit: 1,
        offset: 0,
      }
    );
    return response.data.rows?.[0] || null;
  }

  /**
   * Create a new invoice
   */
  static async create(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await skaftinClient.post<Invoice>(
      `/app-api/database/tables/${this.TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  /**
   * Update an invoice
   */
  static async update(id: number, data: Partial<CreateInvoiceDto>): Promise<{ rowCount: number }> {
    const response = await skaftinClient.put<{ rowCount: number }>(
      `/app-api/database/tables/${this.TABLE_NAME}/update`,
      {
        where: { id },
        data,
      }
    );
    return response.data;
  }

  /**
   * Delete an invoice
   */
  static async delete(id: number): Promise<{ rowCount: number }> {
    const response = await skaftinClient.delete<{ rowCount: number }>(
      `/app-api/database/tables/${this.TABLE_NAME}/delete`,
      {
        where: { id },
      }
    );
    return response.data;
  }

  /**
   * Get invoices by status
   */
  static async findByStatus(status: string): Promise<Invoice[]> {
    return this.findAll({
      where: { status },
      orderBy: 'issue_date',
      orderDirection: 'DESC',
    });
  }

  /**
   * Count invoices
   * POST /app-api/database/tables/invoices/select with limit & offset
   */
  static async count(where?: Record<string, unknown>): Promise<number> {
    const response = await skaftinClient.post<{ rowCount: number }>(
      `/app-api/database/tables/${this.TABLE_NAME}/select`,
      {
        ...(where && { where }),
        limit: 1,
        offset: 0,
      }
    );
    return response.data.rowCount || 0;
  }
}

export default InvoiceService;
