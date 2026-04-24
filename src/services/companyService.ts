/**
 * Company Service
 * Handles all company-related API calls (client businesses, formerly "Customer")
 */

import { skaftinClient } from '../backend';
import type { Company, CreateCompanyDto } from '../types/company';

const TABLE_NAME = 'companies';

export class CompanyService {
  private static async listUserCompanyLinks(userId: number): Promise<Array<{ company_id: number }>> {
    const response = await skaftinClient.post<{ rows: Array<{ company_id: number }> } | Array<{ company_id: number }>>(
      '/app-api/database/tables/user_companies/select',
      {
        where: { user_id: userId },
        limit: 500,
        offset: 0,
      }
    );
    const data = response.data;
    return Array.isArray(data) ? data : (data?.rows || []);
  }

  static async findAll(params?: {
    where?: Record<string, unknown>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<Company[]> {
    const response = await skaftinClient.post<{ rows: Company[]; rowCount: number } | Company[]>(
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

  static async findById(id: number): Promise<Company | null> {
    const response = await skaftinClient.post<{ rows: Company[] } | Company[]>(
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

  static async create(data: CreateCompanyDto): Promise<Company> {
    const response = await skaftinClient.post<Company>(
      `/app-api/database/tables/${TABLE_NAME}/insert`,
      { data }
    );
    return response.data;
  }

  static async findOwnerCompanyByUserId(userId: number): Promise<Company | null> {
    const rows = await this.findAll({
      where: { user_id: userId, is_owner_company: true },
      orderBy: 'id',
      orderDirection: 'ASC',
      limit: 1,
    });
    return rows[0] ?? null;
  }

  static async getOwnerCompaniesForUser(userId: number): Promise<Company[]> {
    return this.findAll({
      where: { user_id: userId, is_owner_company: true },
      orderBy: 'id',
      orderDirection: 'ASC',
      limit: 50,
    });
  }

  static async getAccessibleCompaniesForUser(userId: number): Promise<Company[]> {
    const [ownerCompanies, userCompanyLinks] = await Promise.all([
      this.getOwnerCompaniesForUser(userId),
      this.listUserCompanyLinks(userId),
    ]);

    const linkedCompanyIds = new Set(userCompanyLinks.map((row) => row.company_id).filter(Boolean));
    const ownerIds = new Set(ownerCompanies.map((company) => company.id).filter(Boolean) as number[]);
    const missingIds = [...linkedCompanyIds].filter((id) => !ownerIds.has(id));

    if (missingIds.length === 0) {
      return ownerCompanies;
    }

    const linkedCompanies = await Promise.all(missingIds.map((id) => this.findById(id)));
    const validLinkedCompanies = linkedCompanies.filter((company): company is Company => Boolean(company));
    return [...ownerCompanies, ...validLinkedCompanies];
  }

  static async createOwnerCompany(userId: number, data: CreateCompanyDto): Promise<Company> {
    return this.create({
      ...data,
      user_id: userId,
      is_owner_company: true,
    });
  }

  static async updateOwnerCompany(companyId: number, data: Partial<CreateCompanyDto>): Promise<{ rowCount: number }> {
    return this.update(companyId, data);
  }

  static async update(id: number, data: Partial<CreateCompanyDto>): Promise<{ rowCount: number }> {
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
    const response = await skaftinClient.post<{ rows: Company[]; rowCount: number } | Company[]>(
      `/app-api/database/tables/${TABLE_NAME}/select`,
      {
        ...(where && { where }),
        limit: 1,
        offset: 0,
      }
    );
    const data = response.data;
    if (Array.isArray(data)) return data.length;
    return (data as { rowCount?: number })?.rowCount || 0;
  }
}

export default CompanyService;
