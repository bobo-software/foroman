/**
 * Business Service
 * Handles business (the user's own company) and user_businesses API calls
 */

import { skaftinClient } from '../backend';
import type { Business, CreateBusinessDto, UserBusiness } from '../types/business';

export class BusinessService {
  static async create(data: CreateBusinessDto): Promise<Business> {
    const response = await skaftinClient.post<Business>(
      '/app-api/database/tables/businesses/insert',
      { data }
    );
    return response.data;
  }

  static async linkUserToBusiness(userId: number, businessId: number): Promise<UserBusiness> {
    const response = await skaftinClient.post<UserBusiness>(
      '/app-api/database/tables/user_businesses/insert',
      { data: { user_id: userId, business_id: businessId } }
    );
    return response.data;
  }

  static async getUserBusinessIds(userId: number): Promise<number[]> {
    const response = await skaftinClient.post<
      { rows: UserBusiness[]; rowCount: number } | UserBusiness[]
    >('/app-api/database/tables/user_businesses/select', {
      where: { user_id: userId },
      limit: 100,
      offset: 0,
    });
    const data = response.data;
    const rows = Array.isArray(data) ? data : data?.rows || [];
    return rows.map((r) => r.business_id).filter(Boolean);
  }

  static async getBusinessesForUser(userId: number): Promise<Business[]> {
    const businessIds = await this.getUserBusinessIds(userId);
    if (businessIds.length === 0) return [];

    const businesses: Business[] = [];
    for (const id of businessIds) {
      const business = await this.getById(id);
      if (business) businesses.push(business);
    }
    return businesses;
  }

  static async getById(id: number): Promise<Business | null> {
    const response = await skaftinClient.post<
      { rows: Business[] } | Business[]
    >('/app-api/database/tables/businesses/select', {
      where: { id },
      limit: 1,
      offset: 0,
    });
    const data = response.data;
    if (Array.isArray(data)) return data[0] || null;
    return data?.rows?.[0] || null;
  }

  static async getDefaultBusinessForUser(userId: number): Promise<Business | null> {
    const businesses = await this.getBusinessesForUser(userId);
    return businesses[0] || null;
  }

  static async update(id: number, data: Partial<CreateBusinessDto>): Promise<{ rowCount: number }> {
    const response = await skaftinClient.put<{ rowCount: number }>(
      '/app-api/database/tables/businesses/update',
      {
        where: { id },
        data,
      }
    );
    return response.data;
  }
}

export default BusinessService;
