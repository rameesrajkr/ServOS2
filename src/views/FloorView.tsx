import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Users,
  Clock,
  Receipt,
  ArrowLeftRight,
  MessageSquarePlus,
  Flame,
  Check,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { FloorZone, TableStatus } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { FastOrderSheet } from '../components/floor/FastOrderSheet';
import { BillingDrawer } from '../components/floor/BillingDrawer';
import { cn, formatINR } from '../lib/utils';

const ZONE_OPTIONS = [
  'All Zones',
  'Floor 1 — Main Dining',
  'Floor 2 — Terrace & Lounge',
  'Private Dining',
] as const;

const STATUS_FILTERS: readonly ('All' | TableStatus)[] = [
  'All',
  'Available',
  'Occupied',
  'Preparing',
  'Ready',
  'Waiting for Bill',
  'Reserved',
  'Cleaning',
];

export const FloorView: React.FC = () => {
  const {
    tables,
    orders,
    selectedTableId,
    setSelectedTableId,
    orderingTableId,
    setOrderingTableId,
    billingTableId,
    setBillingTableId,
    seatTable,
    updateTableStatus,
    transferTable,
    addTableNote,
    updateOrderItemQuantity,
    advanceOrderStatus,
    requestBillForTable,
    setActiveModule,
  } = useOperations();

  const [selectedZone, setSelectedZone] =
    useState<(typeof ZONE_OPTIONS)[number]>('All Zones');
  const [statusFilter, setStatusFilter] = useState<'All' | TableStatus>('All');

  // Contextual Drawer sub-actions state
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [showTransferSelect, setShowTransferSelect] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [seatGuestsCount, setSeatGuestsCount] = useState(2);

  const filteredTables = tables.filter((t) => {
    const matchesZone = selectedZone === 'All Zones' || t.zone === selectedZone;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesZone && matchesStatus;
  });

  const selectedTable = selectedTableId
    ? tables.find((t) => t.id === selectedTableId)
    : null;
  const selectedTableOrder = selectedTable?.currentOrderId
    ? orders.find((o) => o.id === selectedTable.currentOrderId)
    : null;

  const availableTablesForTransfer = tables.filter(
    (t) => t.status === 'Available' && t.id !== selectedTableId
  );

  // Group filtered tables by Floor Zone for structured visual floor layout
  const zonesToRender: FloorZone[] =
    selectedZone === 'All Zones'
      ? ['Floor 1 — Main Dining', 'Floor 2 — Terrace & Lounge', 'Private Dining']
      : [selectedZone as FloorZone];

  const statusCounts = STATUS_FILTERS.reduce((acc, st) => {
    acc[st] =
      st === 'All'
        ? tables.length
        : tables.filter((t) => t.status === st).length;
    return acc;
  }, {} as Record<'All' | TableStatus, number>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Floor Management"
        meta={`${tables.filter((t) => t.status !== 'Available').length} / ${tables.length} Active`}
        subtitle="Select any table to inspect orders, fire items to kitchen, transfer guests, or settle bills in-context."
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            icon={<Flame className="w-4 h-4 text-amber-600" />}
            onClick={() => setActiveModule('kitchen')}
          >
            Kitchen Display
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setOrderingTableId(selectedTableId || 't-04')}
          >
            New Order
          </Button>
        }
      />

      {/* FILTER BAR: ZONES + STATUSES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <SegmentedTabs
          options={ZONE_OPTIONS}
          value={selectedZone}
          onChange={setSelectedZone}
        />
        <SegmentedTabs
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />
      </div>

      {/* FLOOR SECTIONS */}
      <div className="space-y-8">
        {zonesToRender.map((zone) => {
          const zoneTables = filteredTables.filter((t) => t.zone === zone);
          if (zoneTables.length === 0) return null;

          return (
            <section key={zone} className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-[#3D342E]">{zone}</h2>
                <span className="text-xs font-semibold text-[#F97316] tabular-nums">
                  {zoneTables.filter((t) => t.status !== 'Available').length} /{' '}
                  {zoneTables.length} occupied
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {zoneTables.map((table) => {
                  const tableOrder = table.currentOrderId
                    ? orders.find((o) => o.id === table.currentOrderId)
                    : undefined;
                  const isSelected = selectedTableId === table.id;

                  const surfaceTone =
                    table.status === 'Waiting for Bill'
                      ? 'bg-[#FFF0E2]'
                      : table.status === 'Ready'
                      ? 'bg-[#F0FDFA]'
                      : 'bg-white';

                  return (
                    <div
                      key={table.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedTableId(table.id);
                        setShowNoteInput(false);
                        setShowTransferSelect(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedTableId(table.id);
                        }
                      }}
                      className={cn(
                        'rounded-3xl p-5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[156px] shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]',
                        surfaceTone,
                        isSelected
                          ? 'ring-2 ring-[#F97316] shadow-[0_12px_28px_-4px_rgba(249,115,22,0.16)]'
                          : 'hover:shadow-[0_12px_28px_-4px_rgba(249,115,22,0.10)]'
                      )}
                    >
                      {/* Top Row: Table Badge + Status Indicator */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tabular-nums',
                                table.status === 'Available'
                                  ? 'bg-[#FFF9F3] text-[#3D342E]'
                                  : 'bg-[#FFEDD5] text-[#EA580C]'
                              )}
                            >
                              T{table.number}
                            </span>
                            <span className="text-base font-bold tracking-tight text-[#3D342E]">
                              {table.name}
                            </span>
                          </div>
                          <StatusIndicator status={table.status} />
                        </div>

                        {/* Guest count or Reservation info */}
                        <div className="mt-3 flex items-center gap-2 text-xs text-[#756A62]">
                          {table.status === 'Available' ? (
                            <span>Capacity {table.capacity} Guests · Ready to seat</span>
                          ) : table.status === 'Reserved' ? (
                            <span>
                              {table.reservationName} · {table.guestCount} Guests ·{' '}
                              {table.reservationTime}
                            </span>
                          ) : table.status === 'Cleaning' ? (
                            <span>Bussing in progress · {table.durationMinutes} min</span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-[#3D342E] font-semibold">
                                <Users className="w-3.5 h-3.5 text-[#F97316]" />
                                {table.guestCount} Guests
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="w-3 h-3 text-[#756A62]" />
                                {table.durationMinutes} min
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Order State & Amount */}
                      <div className="mt-4 pt-3 px-3.5 py-2 rounded-2xl bg-[#FFF9F3] flex items-center justify-between gap-2">
                        {tableOrder ? (
                          <>
                            <div className="text-xs text-[#756A62]">
                              <span className="text-[#3D342E] font-bold">
                                {tableOrder.orderNumber}
                              </span>{' '}
                              · {tableOrder.status}
                            </div>
                            <div className="text-base font-bold text-[#F97316] tabular-nums">
                              {formatINR(tableOrder.subtotal)}
                            </div>
                          </>
                        ) : table.status === 'Available' ? (
                          <span className="text-xs text-[#F97316] font-semibold">
                            Tap to seat or add order →
                          </span>
                        ) : table.status === 'Cleaning' ? (
                          <span className="text-xs text-[#756A62]">
                            Tap to mark Available →
                          </span>
                        ) : (
                          <span className="text-xs text-[#756A62]">
                            Tap to open table actions →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* CONTEXTUAL TABLE DETAIL DRAWER (Section 15) */}
      <ContextualDrawer
        open={Boolean(selectedTable)}
        onClose={() => setSelectedTableId(null)}
        title={selectedTable ? selectedTable.name : 'Table Detail'}
        subtitle={
          selectedTable
            ? `${selectedTable.zone} · Capacity ${selectedTable.capacity} Seats`
            : undefined
        }
      >
        {selectedTable && (
          <div className="space-y-5">
            {/* Top Status Strip — Borderless Warm Surface */}
            <div className="bg-[#FFF9F3] rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <StatusIndicator status={selectedTable.status} />
                <div className="text-xs text-[#756A62]">
                  {selectedTable.guestCount > 0
                    ? `${selectedTable.guestCount} Guests · ${selectedTable.durationMinutes} min`
                    : `Currently ${selectedTable.status}`}
                  {selectedTable.waiterName
                    ? ` · Server: ${selectedTable.waiterName}`
                    : ''}
                </div>
              </div>

              {selectedTableOrder && (
                <div className="text-right">
                  <div className="text-xs text-[#756A62]">
                    {selectedTableOrder.orderNumber}
                  </div>
                  <div className="text-lg font-bold text-[#F97316] tabular-nums">
                    {formatINR(selectedTableOrder.subtotal)}
                  </div>
                </div>
              )}
            </div>

            {/* If Table is Available or Reserved or Cleaning, provide immediate primary setup */}
            {(selectedTable.status === 'Available' ||
              selectedTable.status === 'Reserved') &&
              !selectedTableOrder && (
                <div className="bg-[#FFF9F3] rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-[#3D342E]">
                    Seat Guests or Start Fast Order
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#756A62]">Guest Count:</label>
                    <div className="inline-flex items-center gap-1 bg-[#FFF0E2] rounded-full p-1">
                      {[1, 2, 3, 4, 6, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSeatGuestsCount(num)}
                          className={cn(
                            'w-7 h-7 rounded-full text-xs font-bold tabular-nums cursor-pointer transition-colors',
                            seatGuestsCount === num
                              ? 'bg-[#F97316] text-white shadow-xs'
                              : 'text-[#3D342E] hover:bg-white'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      icon={<Utensils className="w-4 h-4" />}
                      onClick={() => seatTable(selectedTable.id, seatGuestsCount)}
                    >
                      Seat {seatGuestsCount} Guests
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setOrderingTableId(selectedTable.id)}
                    >
                      Add Order Now
                    </Button>
                  </div>
                </div>
              )}

            {selectedTable.status === 'Cleaning' && (
              <div className="bg-[#FFF9F3] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#3D342E]">
                    Table Sanitization Complete?
                  </div>
                  <div className="text-xs text-[#756A62]">
                    Release {selectedTable.name} back to Available floor inventory.
                  </div>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => updateTableStatus(selectedTable.id, 'Available')}
                >
                  Mark Available
                </Button>
              </div>
            )}

            {/* ORDER ITEMS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[#756A62]">
                  Active Table Order
                </span>
                <button
                  onClick={() => setOrderingTableId(selectedTable.id)}
                  className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              {selectedTableOrder && selectedTableOrder.items.length > 0 ? (
                <div className="space-y-2">
                  {selectedTableOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#FFF9F3] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#3D342E] flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="text-[#F97316] tabular-nums">
                            × {item.quantity}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#756A62] mt-0.5">
                          {item.station} · {item.status}
                          {item.spice ? ` · ${item.spice}` : ''}
                        </div>
                      </div>

                      {/* Immediate Quantity Control */}
                      <div className="flex items-center gap-2.5">
                        <div className="inline-flex items-center gap-1 bg-white rounded-full p-0.5 shadow-2xs">
                          <button
                            onClick={() =>
                              updateOrderItemQuantity(
                                selectedTableOrder.id,
                                item.id,
                                -1
                              )
                            }
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#756A62] hover:bg-[#FFF0E2] hover:text-[#3D342E] cursor-pointer"
                            aria-label="Decrease item quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[#3D342E] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateOrderItemQuantity(
                                selectedTableOrder.id,
                                item.id,
                                1
                              )
                            }
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#756A62] hover:bg-[#FFF0E2] hover:text-[#3D342E] cursor-pointer"
                            aria-label="Increase item quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="w-16 text-right text-xs font-bold text-[#F97316] tabular-nums">
                          {formatINR(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FFF9F3] rounded-2xl p-6 text-center">
                  <p className="text-xs text-[#756A62]">
                    No active order items on {selectedTable.name}.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setOrderingTableId(selectedTable.id)}
                  >
                    Add First Item
                  </Button>
                </div>
              )}

              {selectedTableOrder?.notes && (
                <div className="mt-2.5 px-3.5 py-2.5 bg-[#FFF0E2] rounded-xl text-xs text-[#9A3412]">
                  <span className="font-bold">Kitchen Note:</span>{' '}
                  {selectedTableOrder.notes}
                </div>
              )}
            </div>

            {/* KITCHEN STATUS PROGRESSION (Section 15) */}
            {selectedTableOrder && (
              <div className="bg-[#FFF9F3] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#756A62]">
                    Kitchen Status
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTableId(null);
                      setActiveModule('kitchen');
                    }}
                    className="text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
                  >
                    Open Kitchen Board →
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { status: 'Preparing', label: 'Preparing' },
                      { status: 'Ready', label: 'Ready' },
                      { status: 'Served', label: 'Served' },
                    ] as const
                  ).map((step) => {
                    const orderStepRank =
                      selectedTableOrder.status === 'New'
                        ? 0
                        : selectedTableOrder.status === 'Preparing'
                        ? 1
                        : selectedTableOrder.status === 'Ready'
                        ? 2
                        : 3;
                    const thisRank =
                      step.status === 'Preparing'
                        ? 1
                        : step.status === 'Ready'
                        ? 2
                        : 3;
                    const reached = orderStepRank >= thisRank;

                    return (
                      <button
                        key={step.status}
                        type="button"
                        onClick={() =>
                          advanceOrderStatus(selectedTableOrder.id, step.status)
                        }
                        className={cn(
                          'py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer',
                          reached
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-white text-[#756A62] hover:bg-[#FFF0E2] hover:text-[#3D342E]'
                        )}
                      >
                        <Check
                          className={cn(
                            'w-3.5 h-3.5',
                            reached ? 'text-[#15803D]' : 'text-[#A89D94]'
                          )}
                        />
                        <span>{step.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TOTAL SUMMARY */}
            {selectedTableOrder && (
              <div className="flex items-center justify-between px-4 py-3 bg-[#FFF0E2] rounded-2xl">
                <span className="text-xs font-bold text-[#9A3412]">Total Bill</span>
                <span className="text-xl font-bold text-[#F97316] tabular-nums">
                  {formatINR(selectedTableOrder.subtotal)}
                </span>
              </div>
            )}

            {/* INLINE PROGRESSIVE DISCLOSURE: ADD NOTE */}
            {showNoteInput && (
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#3D342E]">
                  Kitchen / Server Note for {selectedTable.name}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="e.g., Guest allergic to peanuts, rush starters"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#E6DDD5] rounded-xl"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (noteDraft.trim()) {
                        addTableNote(selectedTable.id, noteDraft.trim());
                        setShowNoteInput(false);
                        setNoteDraft('');
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* INLINE PROGRESSIVE DISCLOSURE: TRANSFER TABLE */}
            {showTransferSelect && (
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#3D342E]">
                  Transfer {selectedTable.name} to Available Table:
                </label>
                <div className="flex gap-2">
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#E6DDD5] rounded-xl"
                  >
                    <option value="">Select destination table...</option>
                    {availableTablesForTransfer.map((avail) => (
                      <option key={avail.id} value={avail.id}>
                        {avail.name} ({avail.zone} · {avail.capacity} seats)
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!transferTargetId}
                    onClick={() => {
                      if (transferTargetId) {
                        transferTable(selectedTable.id, transferTargetId);
                        setShowTransferSelect(false);
                        setTransferTargetId('');
                      }
                    }}
                  >
                    Move
                  </Button>
                </div>
              </div>
            )}

            {/* REQUIRED CONTEXTUAL ACTIONS (Section 15) */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setOrderingTableId(selectedTable.id)}
                >
                  Add Item
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={<Receipt className="w-4 h-4" />}
                  onClick={() => requestBillForTable(selectedTable.id)}
                >
                  Request Bill
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setShowNoteInput(!showNoteInput);
                    setShowTransferSelect(false);
                  }}
                >
                  Add Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setShowTransferSelect(!showTransferSelect);
                    setShowNoteInput(false);
                  }}
                >
                  Transfer Table
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateTableStatus(selectedTable.id, 'Available');
                    setSelectedTableId(null);
                  }}
                >
                  Close Table
                </Button>
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* FAST ORDER CREATION POS OVERLAY (Section 16) */}
      {orderingTableId && (
        <FastOrderSheet
          tableId={orderingTableId === 'takeaway' ? null : orderingTableId}
          onClose={() => setOrderingTableId(null)}
          onSentToKitchen={() => {
            const tblId = orderingTableId;
            setOrderingTableId(null);
            if (tblId && tblId !== 'takeaway') {
              setSelectedTableId(tblId);
            }
          }}
        />
      )}

      {/* STREAMLINED BILLING & PAYMENT DRAWER (Section 22) */}
      {billingTableId && (
        <BillingDrawer
          tableId={billingTableId}
          onClose={() => setBillingTableId(null)}
        />
      )}
    </div>
  );
};
