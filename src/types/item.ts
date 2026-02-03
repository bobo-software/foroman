/**
 * Item / Stock types (products)
 */

export interface Item {
  id?: number;
  name: string;
  sku?: string;
  description?: string;
  unit_price: number;
  tax_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemDto {
  name: string;
  sku?: string;
  description?: string;
  unit_price: number;
  tax_rate?: number;
}
