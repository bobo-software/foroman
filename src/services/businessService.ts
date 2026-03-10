/**
 * Business Service
 * Compatibility layer over owner-company records in companies table.
 */

import type { Business, CreateBusinessDto, UserBusiness } from '../types/business';
import CompanyService from './companyService';

export class BusinessService {
  static async create(data: CreateBusinessDto): Promise<Business> {
    return CompanyService.create({
      ...data,
      is_owner_company: true,
    }) as Promise<Business>;
  }

  static async linkUserToBusiness(userId: number, businessId: number): Promise<UserBusiness> {
    await CompanyService.update(businessId, {
      user_id: userId,
      is_owner_company: true,
    });
    return { user_id: userId, business_id: businessId };
  }

  static async getUserBusinessIds(userId: number): Promise<number[]> {
    const rows = await CompanyService.getOwnerCompaniesForUser(userId);
    return rows.map((r) => Number(r.id)).filter(Boolean);
  }

  static async getBusinessesForUser(userId: number): Promise<Business[]> {
    return CompanyService.getOwnerCompaniesForUser(userId) as Promise<Business[]>;
  }

  static async getById(id: number): Promise<Business | null> {
    return CompanyService.findById(id) as Promise<Business | null>;
  }

  static async getDefaultBusinessForUser(userId: number): Promise<Business | null> {
    const businesses = await this.getBusinessesForUser(userId);
    return businesses[0] || null;
  }

  static async update(id: number, data: Partial<CreateBusinessDto>): Promise<{ rowCount: number }> {
    return CompanyService.update(id, data);
  }
}

export default BusinessService;
