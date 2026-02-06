/**
 * Item / Stock types (products)
 */

export interface Item {
  id?: number;
  business_id?: number;
  name: string;
  sku?: string;
  description?: string;
  /** Selling price per unit */
  unit_price: number;
  /** Cost price per unit (optional, for margin calculation) */
  cost_price?: number;
  quantity?: number;
  tax_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemDto {
  business_id?: number;
  name: string;
  sku?: string;
  description?: string;
  unit_price: number;
  cost_price?: number;
  quantity?: number;
  tax_rate?: number;
}
