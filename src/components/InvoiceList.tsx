import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Invoice } from '../types/invoice';
import InvoiceService from '../services/invoiceService';
import './InvoiceList.css';

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = filterStatus === 'all'
        ? await InvoiceService.findAll({ orderBy: 'issue_date', orderDirection: 'DESC' })
        : await InvoiceService.findByStatus(filterStatus);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await InvoiceService.delete(id);
      loadInvoices();
    } catch (err: any) {
      alert('Failed to delete invoice: ' + err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'status-draft',
      sent: 'status-sent',
      paid: 'status-paid',
      overdue: 'status-overdue',
      cancelled: 'status-cancelled',
    };
    return statusMap[status] || '';
  };

  if (loading) {
    return (
      <div className="invoice-list-container">
        <div className="loading">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h1>Invoices</h1>
        <div className="invoice-list-actions">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="invoice-table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="invoice-number">{invoice.invoice_number}</td>
                  <td>{invoice.customer_name}</td>
                  <td>{formatDate(invoice.issue_date)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="invoice-total">{formatCurrency(invoice.total)}</td>
                  <td className="invoice-actions">
                    <Link
                      to={`${invoice.id}`}
                      className="btn-view"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(invoice.id!)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
