import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Utensils,
  Receipt,
  Calendar,
  BookOpen,
  Truck,
  Users,
  ArrowRight,
  X,
  Command,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { formatINR } from '../../lib/utils';
import { StatusIndicator } from '../ui/Primitives';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    hasAccess,
    tables,
    orders,
    bookings,
    menuItems,
    suppliers,
    staff,
    setActiveModule,
    setSelectedTableId,
    setBillingTableId,
  } = useOperations();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedTables = hasAccess('floor')
    ? tables
        .filter(
          (t) =>
            !q ||
            t.name.toLowerCase().includes(q) ||
            `table ${t.number}`.includes(q) ||
            t.status.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedOrders = hasAccess('orders')
    ? orders
        .filter(
          (o) =>
            !q ||
            o.orderNumber.toLowerCase().includes(q) ||
            o.tableName?.toLowerCase().includes(q) ||
            o.customerName?.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedBookings = hasAccess('bookings')
    ? bookings
        .filter(
          (b) =>
            q &&
            (b.guestName.toLowerCase().includes(q) ||
              b.tableName.toLowerCase().includes(q) ||
              b.phone.includes(q))
        )
        .slice(0, 3)
    : [];

  const matchedMenu = hasAccess('menu')
    ? menuItems
        .filter(
          (m) =>
            q &&
            (m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
        )
        .slice(0, 3)
    : [];

  const matchedSuppliers = hasAccess('suppliers')
    ? suppliers.filter((s) => q && s.name.toLowerCase().includes(q)).slice(0, 2)
    : [];

  const matchedStaff = hasAccess('staff')
    ? staff
        .filter(
          (s) =>
            q && (s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
        )
        .slice(0, 2)
    : [];

  const getTableOrderTotal = (currentOrderId?: string) => {
    if (!currentOrderId) return null;
    const ord = orders.find((o) => o.id === currentOrderId);
    return ord ? ord.total : null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[1px]"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Table 04, Order #104, John Mathew, Chicken Biryani, Suppliers..."
            className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-400 hover:text-zinc-700 px-1.5 py-0.5 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto p-2 divide-y divide-zinc-100">
          {/* TABLES */}
          {matchedTables.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium text-zinc-400">
                Tables
              </div>
              {matchedTables.map((t) => {
                const amount = getTableOrderTotal(t.currentOrderId);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveModule('floor');
                      setSelectedTableId(t.id);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Utensils className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                      <div>
                        <div className="text-sm font-medium text-zinc-900">
                          Table {t.number}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {t.zone} · {t.guestCount > 0 ? `${t.guestCount} Guests` : `Capacity ${t.capacity}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={t.status} />
                      {amount !== null && (
                        <span className="text-sm font-mono font-semibold text-zinc-900 tabular-nums">
                          {formatINR(amount)}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-700" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ORDERS & BILLS */}
          {matchedOrders.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium text-zinc-400">
                Orders & Bills
              </div>
              {matchedOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    if (o.tableId && o.status === 'Served') {
                      setActiveModule('floor');
                      setSelectedTableId(o.tableId);
                      setBillingTableId(o.tableId);
                    } else if (o.type === 'Takeaway') {
                      setActiveModule('takeaway');
                    } else {
                      setActiveModule('orders');
                    }
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900 font-mono">
                        {o.orderNumber}{' '}
                        <span className="font-sans font-normal text-zinc-600">
                          · {o.tableName || o.customerName}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {o.items.length} items · {o.elapsedMinutes} min ago
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIndicator status={o.status} />
                    <span className="text-sm font-mono font-semibold text-zinc-900 tabular-nums">
                      {formatINR(o.total)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* BOOKINGS */}
          {matchedBookings.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium text-zinc-400">
                Bookings
              </div>
              {matchedBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveModule('bookings');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{b.guestName}</div>
                      <div className="text-xs text-zinc-500">
                        {b.time} · {b.tableName} · {b.guests} guests
                      </div>
                    </div>
                  </div>
                  <StatusIndicator status={b.status} />
                </button>
              ))}
            </div>
          )}

          {/* MENU ITEMS */}
          {matchedMenu.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium text-zinc-400">
                Menu Items
              </div>
              {matchedMenu.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveModule('menu');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{m.name}</div>
                      <div className="text-xs text-zinc-500">
                        {m.category} · {m.station}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-semibold text-zinc-900 tabular-nums">
                    {formatINR(m.price)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* SUPPLIERS & STAFF */}
          {(matchedSuppliers.length > 0 || matchedStaff.length > 0) && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium text-zinc-400">
                Suppliers & Team
              </div>
              {matchedSuppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveModule('suppliers');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-zinc-400" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{s.name}</div>
                      <div className="text-xs text-zinc-500">{s.category}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-700 tabular-nums">
                    Due: {formatINR(s.outstandingAmount)}
                  </span>
                </button>
              ))}
              {matchedStaff.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveModule('staff');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-100/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{st.name}</div>
                      <div className="text-xs text-zinc-500">
                        {st.role} · Shift {st.currentShiftTime}
                      </div>
                    </div>
                  </div>
                  <StatusIndicator status={st.clockStatus} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            <span>Try searching "Table 04", "#104", "Biryani", or "John"</span>
          </div>
          <span className="font-mono text-[11px]">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
