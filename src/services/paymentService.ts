/**
 * Payment Service
 * Handles payment CRUD via Skaftin app-api (payments table)
 */

import { skaftinClient } from '../backend';
import type { Payment, CreatePaymentDto } from '../types/payment';

const TABLE_NAME = 'payments';

function normalizeRows<T>(response: unknown): T[] {
  const r = response as Record<string, unknown>;
  if (Array.isArray(r?.data)) return r.data as T[];
  if (Array.isArray(r?.rows)) return r.rows as T[];
  if (Array.isArray(r)) return r as T[];
  return [];
}

function normalizePayment(raw: Record<string, unknown>): Payment {
  return {
    ...raw,
    id: raw.id != null ? Number(raw.id) : undefined,
    amount: Number(raw.amount) || 0,
    invoice_id: raw.invoice_id != null ? Number(raw.invoice_id) : undefined,
  } as Payment;
}

export class PaymentService {
  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Payment[]> {
    const response = await skaftinClient.post(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        limit: params?.limit ?? 5000,
        offset: params?.offset ?? 0,
        ...(params?.where && { where: params.where }),
        ...(params?.orderBy && { orderBy: params.orderBy }),
        ...(params?.orderDirection && { orderDirection: params.orderDirection }),
      }
    );
    const rows = normalizeRows<Record<string, unknown>>(response);
    return rows.map((p) => normalizePayment(p));
  }

  static async findById(id: number): Promise<Payment | null> {
    const response = await skaftinClient.post(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      { where: { id }, limit: 1, offset: 0 }
    );
    const rows = normalizeRows<Record<string, unknown>>(response);
    const p = rows[0] ?? null;
    return p ? normalizePayment(p) : null;
  }

  static async findByCompany(companyName: string): Promise<Payment[]> {
    return this.findAll({
      where: { customer_name: companyName },
      orderBy: 'date',
      orderDirection: 'DESC',
    });
  }

  static async create(data: CreatePaymentDto): Promise<Payment> {
    const response = await skaftinClient.post(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    const r = response as unknown as Record<string, unknown>;
    const inserted = (Array.isArray(r?.data) ? r?.data?.[0] : r?.data) ?? r;
    return normalizePayment(inserted as Record<string, unknown>);
  }

  static async update(id: number, data: Partial<CreatePaymentDto>): Promise<{ rowCount: number }> {
    const response = await skaftinClient.put(
      `/app-api/database/tables/${TABLE_NAME}/update`,
      { where: { id }, data }
    );
    const r = response as unknown as Record<string, unknown>;
    return { rowCount: (r?.rowCount as number) ?? 0 };
  }

  static async delete(id: number): Promise<{ rowCount: number }> {
    const response = await skaftinClient.delete(
      `/app-api/database/tables/${TABLE_NAME}/delete`,
      { where: { id } }
    );
    const r = response as unknown as Record<string, unknown>;
    return { rowCount: (r?.rowCount as number) ?? 0 };
  }
}

export default PaymentService;
