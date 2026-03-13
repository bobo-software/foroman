/**
 * Quotation line items – stored in quotation_lines table
 */

import { skaftinClient } from '../backend';
import type { QuotationLine } from '../types/quotation';

const TABLE_NAME = 'quotation_lines';

function normalizeRows(response: unknown): QuotationLine[] {
  const r = response as Record<string, unknown>;
  if (Array.isArray(r?.data)) return r.data as QuotationLine[];
  if (Array.isArray(r?.rows)) return r.rows as QuotationLine[];
  if (Array.isArray(r)) return r as QuotationLine[];
  return [];
}

export class QuotationLineService {
  static async findByQuotationId(quotationId: number): Promise<QuotationLine[]> {
    const response = await skaftinClient.post(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        where: { quotation_id: quotationId },
        limit: 500,
        offset: 0,
      }
    );
    return normalizeRows(response);
  }

  static async insertMany(
    quotationId: number,
    items: (Omit<QuotationLine, 'id' | 'quotation_id'> & { item_id?: number })[]
  ): Promise<void> {
    for (const item of items) {
      await skaftinClient.post(
        `/app-api/database/tables/${TABLE_NAME}/insert`,
        {
          data: {
            quotation_id: quotationId,
            ...(item.item_id != null && { item_id: item.item_id }),
            description: item.description,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            discount_percent: Number(item.discount_percent ?? 0),
            total: Number(item.total),
          },
        }
      );
    }
  }

  static async deleteByQuotationId(quotationId: number): Promise<void> {
    await skaftinClient.delete(
      `/app-api/database/tables/${TABLE_NAME}/delete`,
      { where: { quotation_id: quotationId } }
    );
  }
}

export default QuotationLineService;
