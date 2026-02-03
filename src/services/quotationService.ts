/**
 * Quotation Service
 * Handles quotation-related API calls (count for dashboard; full CRUD can be added later)
 */

import { skaftinClient } from '../backend';

const TABLE_NAME = 'quotations';

export class QuotationService {
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

export default QuotationService;
