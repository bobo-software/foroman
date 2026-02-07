/**
 * Template renderer orchestrator.
 *
 * Resolves the correct template module based on config.id
 * and delegates rendering calls to it.
 */

import type { jsPDF } from 'jspdf';
import type { DocumentTemplateConfig, DocumentTemplateId } from '../../types/documentTemplate';
import { getTemplateConfig } from '../../types/documentTemplate';
import type {
  PdfTemplateFunctions,
  HeaderData, CustomerData, DatesData, LineItem, TotalsData,
} from './types';
import { classicTemplate } from './classicTemplate';
import { modernTemplate } from './modernTemplate';
import { minimalTemplate } from './minimalTemplate';

const templateMap: Record<DocumentTemplateId, PdfTemplateFunctions> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
};

function getTemplate(config: DocumentTemplateConfig): PdfTemplateFunctions {
  return templateMap[config.id] ?? classicTemplate;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function renderHeader(doc: jsPDF, data: HeaderData, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderHeader(doc, data, config);
}

export function renderCustomerSection(doc: jsPDF, data: CustomerData, y: number, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderCustomerSection(doc, data, y, config);
}

export function renderDatesRow(doc: jsPDF, data: DatesData, y: number, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderDatesRow(doc, data, y, config);
}

export function renderLineItemsTable(doc: jsPDF, items: LineItem[], y: number, currency: string, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderLineItemsTable(doc, items, y, currency, config);
}

export function renderTotalsSection(doc: jsPDF, data: TotalsData, y: number, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderTotalsSection(doc, data, y, config);
}

export function renderNotesSection(doc: jsPDF, notes: string, y: number, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderNotesSection(doc, notes, y, config);
}

export function renderSignatureSection(doc: jsPDF, y: number, config: DocumentTemplateConfig): number {
  return getTemplate(config).renderSignatureSection(doc, y, config);
}

export function renderFooter(doc: jsPDF, config: DocumentTemplateConfig): void {
  return getTemplate(config).renderFooter(doc, config);
}

export { getTemplateConfig };
export type { HeaderData, CustomerData, DatesData, LineItem, TotalsData };
