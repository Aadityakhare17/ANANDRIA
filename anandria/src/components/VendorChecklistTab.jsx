import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext, ACTIONS } from '../context/AppContext.jsx';
import { formatCurrency, calcVendorCompletion } from '../utils/budgetCalc.js';
import { debounce } from '../utils/storage.js';
import { VENDOR_STATUS } from '../utils/constants.js';
import { Search, Filter, CheckCircle2, Clock, Phone, Tag } from 'lucide-react';

const STATUS_ICONS = {
  Pending: <Clock size={14} aria-hidden="true" />,
  Contacted: <Phone size={14} aria-hidden="true" />,
  Booked: <CheckCircle2 size={14} aria-hidden="true" />,
};

const PRIORITY_BADGE = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

function VendorCard({ item, currency, onStatusChange }) {
  return (
    <div className={`vendor-card status-${item.status.toLowerCase()}`}>
      <div className="vendor-card-header">
        <div className="vendor-info">
          <h4 className="vendor-name">{item.vendor}</h4>
          <p className="vendor-task">{item.task}</p>
        </div>
        <div className="vendor-badges">
          <span className={`priority-badge ${PRIORITY_BADGE[item.priority]}`} aria-label={`Priority: ${item.priority}`}>
            {item.priority}
          </span>
          {item.category && (
            <span className="category-badge">
              <Tag size={10} aria-hidden="true" /> {item.category}
            </span>
          )}
        </div>
      </div>

      <div className="vendor-card-footer">
        <div className="vendor-meta">
          {item.estimatedCost > 0 && (
            <span className="vendor-cost">
              Est: {formatCurrency(item.estimatedCost, currency)}
            </span>
          )}
          {item.notes && <span className="vendor-note">{item.notes}</span>}
        </div>

        <fieldset className="status-fieldset">
          <legend className="sr-only">Status for {item.vendor}</legend>
          <div className="status-buttons" role="group" aria-label={`Change status for ${item.vendor}`}>
            {Object.values(VENDOR_STATUS).map((status) => (
              <button
                key={status}
                className={`status-btn ${item.status === status ? 'active' : ''}`}
                onClick={() => onStatusChange(item.id, status)}
                aria-pressed={item.status === status}
                aria-label={`Set ${item.vendor} status to ${status}`}
              >
                {STATUS_ICONS[status]}
                {status}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export default function VendorChecklistTab() {
  const { state, dispatch } = useAppContext();
  const { plan, formData, vendorFilter, vendorStatusFilter } = state;
  const { currency } = formData;

  const vendors = plan?.vendorChecklist || [];

  // Debounced search filter
  const [localFilter, setLocalFilter] = useState(vendorFilter);
  const debouncedSetFilter = useCallback(
    debounce((val) => dispatch({ type: ACTIONS.SET_VENDOR_FILTER, payload: val }), 300),
    [dispatch]
  );

  function handleFilterChange(e) {
    setLocalFilter(e.target.value);
    debouncedSetFilter(e.target.value);
  }

  const filtered = useMemo(() => {
    let items = vendors;
    if (vendorFilter) {
      const q = vendorFilter.toLowerCase();
      items = items.filter(
        (v) =>
          v.vendor.toLowerCase().includes(q) ||
          v.task.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q)
      );
    }
    if (vendorStatusFilter !== 'All') {
      items = items.filter((v) => v.status === vendorStatusFilter);
    }
    return items;
  }, [vendors, vendorFilter, vendorStatusFilter]);

  const completion = calcVendorCompletion(vendors);
  const booked = vendors.filter((v) => v.status === 'Booked').length;
  const contacted = vendors.filter((v) => v.status === 'Contacted').length;
  const pending = vendors.filter((v) => v.status === 'Pending').length;

  function handleStatusChange(id, status) {
    dispatch({ type: ACTIONS.SET_VENDOR_STATUS, payload: { id, status } });
  }

  if (!plan) return null;

  return (
    <section aria-labelledby="vendor-tab-heading" className="tab-content">
      <h2 id="vendor-tab-heading" className="sr-only">Vendor Checklist</h2>

      {/* Stats row */}
      <div className="vendor-stats">
        <div className="vendor-stat booked">
          <span className="vstat-num">{booked}</span>
          <span className="vstat-label">Booked</span>
        </div>
        <div className="vendor-stat contacted">
          <span className="vstat-num">{contacted}</span>
          <span className="vstat-label">Contacted</span>
        </div>
        <div className="vendor-stat pending">
          <span className="vstat-num">{pending}</span>
          <span className="vstat-label">Pending</span>
        </div>
        <div className="vendor-stat total">
          <span className="vstat-num">{vendors.length}</span>
          <span className="vstat-label">Total</span>
        </div>
      </div>

      {/* Overall completion bar */}
      <div className="vendor-progress-section">
        <div className="progress-header">
          <span className="progress-label">Vendor Completion</span>
          <span className="progress-pct" aria-live="polite">{completion}% booked</span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Vendor booking progress: ${completion}%`}
        >
          <div className="progress-fill" style={{ width: `${completion}%` }} />
        </div>
      </div>

      {/* Search & filter */}
      <div className="vendor-controls">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search vendors, tasks, categories…"
            value={localFilter}
            onChange={handleFilterChange}
            aria-label="Search vendor checklist"
          />
        </div>

        <div className="status-filter" role="group" aria-label="Filter by status">
          <Filter size={16} aria-hidden="true" />
          {['All', ...Object.values(VENDOR_STATUS)].map((status) => (
            <button
              key={status}
              className={`filter-btn ${vendorStatusFilter === status ? 'active' : ''}`}
              onClick={() => dispatch({ type: ACTIONS.SET_VENDOR_STATUS_FILTER, payload: status })}
              aria-pressed={vendorStatusFilter === status}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor list */}
      <div className="vendor-list" role="list" aria-label="Vendor checklist items" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={40} aria-hidden="true" />
            <p>No vendors match your filter. Try adjusting your search.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} role="listitem">
              <VendorCard
                item={item}
                currency={currency}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))
        )}
      </div>

      {filtered.length < vendors.length && (
        <p className="filter-count" aria-live="polite">
          Showing {filtered.length} of {vendors.length} vendors
        </p>
      )}
    </section>
  );
}
