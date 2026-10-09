import React, { useState } from 'react';
import {
  Plus,
  CalendarPlus,
  Receipt,
  AlertTriangle,
  Clock,
  ArrowRight,
  Utensils,
  Flame,
  ShoppingBag,
  Wallet,
  Users,
  UserCheck,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import {
  Button,
  MetricCard,
  ContextualDrawer,
  DishPhoto,
} from '../components/ui/Primitives';
import { formatINR } from '../lib/utils';
import { PaymentMethod } from '../types/operations';
import { KNOCKOUT_PHOTOS } from '../lib/visualAssets';

const HOURLY_PERFORMANCE = [
  { hour: '12 PM', revenue: 24500, orders: 19 },
  { hour: '1 PM', revenue: 42800, orders: 34 },
  { hour: '2 PM', revenue: 38200, orders: 29 },
  { hour: '3 PM', revenue: 16400, orders: 14 },
  { hour: '4 PM', revenue: 12900, orders: 11 },
  { hour: '5 PM', revenue: 19600, orders: 16 },
  { hour: '6 PM', revenue: 31400, orders: 24 },
  { hour: '7 PM', revenue: 54200, orders: 39 },
  { hour: '8 PM', revenue: 44000, orders: 31 },
];

export const OverviewView: React.FC = () => {
  const {
    activeCompany,
    hasService,
    setRole,
    tables,
    orders,
    menuItems,
    bookings,
    inventory,
    staff,
    activities,
    setActiveModule,
    setSelectedTableId,
    setOrderingTableId,
    setIsLoginModalOpen,
    addExpenseTransaction,
    createBooking,
  } = useOperations();

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Quick Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('UPI');

  // Quick Booking Form State
  const [bkGuest, setBkGuest] = useState('');
  const [bkPhone, setBkPhone] = useState('');
  const [bkTime, setBkTime] = useState('8:30 PM');
  const [bkGuests, setBkGuests] = useState(4);
  const [bkTableId, setBkTableId] = useState('t-01');

  const activeTablesCount = tables.filter((t) => t.status !== 'Available').length;
  const waitingBillTables = tables.filter((t) => t.status === 'Waiting for Bill');
  const preparingOrders = orders.filter(
    (o) => o.status === 'New' || o.status === 'Preparing'
  );
  const takeawayReady = orders.filter(
    (o) => o.type === 'Takeaway' && o.status === 'Ready'
  );
  const lowStockItems = inventory.filter((i) => i.status !== 'Healthy');
  const arrivingBookings = bookings.filter(
    (b) => b.status === 'Arriving' || b.status === 'Arrived'
  );
  const pendingBillsTotal = orders
    .filter((o) => !o.isPaid && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const hasFloor = hasService('floor');
  const hasOrders = hasService('orders');
  const hasKitchen = hasService('kitchen');
  const hasBookings = hasService('bookings');
  const hasTakeaway = hasService('takeaway');
  const hasBilling = hasService('billing');
  const hasInventory = hasService('inventory');
  const hasFinance = hasService('finance');
  const hasExpenses = hasService('expenses');
  const hasResourceMgmt = hasService('resource_management');
  const hasClockIn = hasService('clock_in_out') || hasService('attendance');

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(expAmount);
    if (!expTitle.trim() || !num) return;
    addExpenseTransaction(expTitle.trim(), num, 'Utility Expense', expMethod);
    setExpTitle('');
    setExpAmount('');
    setExpenseModalOpen(false);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bkGuest.trim()) return;
    const tbl = tables.find((t) => t.id === bkTableId) || tables[0];
    createBooking({
      guestName: bkGuest.trim(),
      phone: bkPhone.trim() || '+91 98450 11223',
      date: '2026-10-07',
      time: bkTime,
      durationMinutes: 90,
      tableId: tbl.id,
      tableName: `Table ${tbl.number}`,
      guests: bkGuests,
      status: 'Confirmed',
    });
    setBkGuest('');
    setBkPhone('');
    setBookingModalOpen(false);
  };

  const maxHourlyRevenue = Math.max(...HOURLY_PERFORMANCE.map((h) => h.revenue));

  const activeAlertsCount = [
    hasKitchen,
    hasInventory,
    hasFloor && hasBilling,
    hasBookings,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* HOSPITALITY WELCOME & LIVE OUTLET BANNER — Borderless White Surface */}
      <section className="bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F97316]">
                <span>{activeCompany.name}</span>
                <span aria-hidden="true">·</span>
                <span>{activeCompany.location}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#EA580C]">{activeCompany.plan}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3D342E] mt-1.5">
                Good morning, {activeCompany.owner.split(' ')[0]}.
              </h1>
              <p className="text-sm text-[#756A62] mt-1.5 max-w-xl leading-relaxed">
                Dinner &amp; all-day service is running smoothly.{' '}
                {hasFloor && (
                  <span>
                    <strong className="text-[#3D342E]">
                      {activeTablesCount} of {tables.length} tables
                    </strong>{' '}
                    are currently seated
                  </span>
                )}
                {hasKitchen && (
                  <span>
                    {' '}
                    with{' '}
                    <strong className="text-[#3D342E]">
                      {preparingOrders.length} active orders
                    </strong>{' '}
                    on the kitchen pass.
                  </span>
                )}
              </p>
            </div>

            {/* Primary Actions — Service-Aware */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {hasOrders && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    if (hasFloor) {
                      setActiveModule('floor');
                      setOrderingTableId('t-04');
                    } else {
                      setActiveModule('orders');
                    }
                  }}
                >
                  New Order
                </Button>
              )}
              {hasBookings && (
                <Button
                  variant="secondary"
                  size="md"
                  icon={<CalendarPlus className="w-4 h-4 text-[#F97316]" />}
                  onClick={() => setBookingModalOpen(true)}
                >
                  New Booking
                </Button>
              )}
              {hasClockIn && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<UserCheck className="w-4 h-4 text-[#F97316]" />}
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Staff Access (PIN)
                </Button>
              )}
              {hasFinance && hasExpenses && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<Receipt className="w-4 h-4 text-[#F97316]" />}
                  onClick={() => setExpenseModalOpen(true)}
                >
                  Add Expense
                </Button>
              )}
            </div>
          </div>

          {/* Authentic Open-Kitchen Pass Photography */}
          <div className="lg:col-span-5 relative min-h-[200px] sm:min-h-[220px] bg-[#FFF0E2]">
            <img
              src={KNOCKOUT_PHOTOS.restaurantHero}
              alt="Chefs plating fresh dishes at the KnockOUT open kitchen pass"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3D342E]/70 via-[#3D342E]/15 to-transparent flex items-end p-5">
              <div className="text-white">
                <div className="text-xs font-medium text-[#FFEDD5]">
                  Live Service Snapshot · Kitchen &amp; Dining Pass
                </div>
                <div className="text-sm font-bold mt-0.5">
                  {staff.filter((s) => s.clockStatus === 'Working').length} Team Members Clocked In · Avg Prep 11m
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP METRICS — Dynamically Composed from Enabled Services (Section 14 & 27) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(hasBilling || hasFinance) && (
          <MetricCard
            label={hasFinance ? 'Revenue & Ledger' : 'Today’s Sales'}
            value="₹2.84L"
            delta="+12.4%"
            deltaTone="positive"
            subtext="vs. yesterday"
            onClick={() =>
              setActiveModule(hasFinance ? 'finance' : 'orders')
            }
          />
        )}
        {hasOrders && (
          <MetricCard
            label="Orders"
            value={String(173 + orders.length)}
            delta="+8.2%"
            deltaTone="positive"
            subtext={`${preparingOrders.length} active in queue`}
            onClick={() => setActiveModule('orders')}
          />
        )}
        {hasFloor ? (
          <MetricCard
            label="Active Tables"
            value={`${activeTablesCount} / ${tables.length}`}
            delta={`${Math.round((activeTablesCount / tables.length) * 100)}%`}
            deltaTone="neutral"
            subtext={`${tables.length - activeTablesCount} available now`}
            onClick={() => setActiveModule('floor')}
          />
        ) : (
          hasTakeaway && (
            <MetricCard
              label="Takeaway / Parcel Queue"
              value={String(orders.filter((o) => o.type === 'Takeaway').length)}
              delta="Cloud Kitchen"
              deltaTone="positive"
              subtext={`${takeawayReady.length} ready for pickup`}
              onClick={() => setActiveModule('takeaway')}
            />
          )
        )}
        {hasBookings ? (
          <MetricCard
            label="Bookings"
            value={String(12 + bookings.length)}
            delta="Today"
            deltaTone="neutral"
            subtext={`${arrivingBookings.length} arriving shortly`}
            onClick={() => setActiveModule('bookings')}
          />
        ) : (
          hasKitchen && (
            <MetricCard
              label="Kitchen Queue (KDS)"
              value={`${preparingOrders.length} active`}
              delta="Avg 11m"
              deltaTone="positive"
              subtext="4-column station board"
              onClick={() => setActiveModule('kitchen')}
            />
          )
        )}
      </div>

      {/* NEEDS ATTENTION & LIVE OPERATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NEEDS ATTENTION (7 cols) */}
        <section className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Needs Attention</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Prioritized exceptions for enabled services on {activeCompany.name}
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              {activeAlertsCount} active
            </span>
          </div>

          <div className="divide-y divide-zinc-200/70">
            {/* Item 1: Kitchen delayed (Only if Kitchen service is enabled) */}
            {hasKitchen && (
              <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {preparingOrders.length} orders in kitchen preparation
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs font-mono text-red-700 tabular-nums">
                        #104 at 12 min
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Table 12 (Chicken Biryani ×2, Ghee Rice ×1) approaching 15-minute SLA.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModule('kitchen')}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Open Kitchen
                </Button>
              </div>
            )}

            {/* Item 2: Low Stock (Only if Inventory service is enabled — Section 27) */}
            {hasInventory && (
              <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {lowStockItems.length} ingredients low in stock
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs font-mono text-amber-700">
                        Chicken 8 kg / 15 kg
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Free-Range Chicken, Cooking Oil, and Valencia Oranges below threshold.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModule('inventory')}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Create Purchase
                </Button>
              </div>
            )}

            {/* Item 3: Tables waiting for payment (Only if Floor & Billing are enabled) */}
            {hasFloor && hasBilling && (
              <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {waitingBillTables.length > 0
                          ? `${waitingBillTables.length} tables waiting for payment`
                          : 'All table bills settled'}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs font-mono text-zinc-600 tabular-nums">
                        Table 04 (₹1,100)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Guests at Table 04 and Table 09 have requested their final bill.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveModule('floor');
                    setSelectedTableId('t-04');
                  }}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Settle Table 04
                </Button>
              </div>
            )}

            {/* Item 4: Bookings arriving soon (Only if Bookings service is enabled) */}
            {hasBookings && (
              <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {arrivingBookings.length} bookings arriving soon
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs font-mono text-zinc-600">8:00 PM – 8:15 PM</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Dr. Kavita Rao (2 guests) and Siddharth & Family (6 guests).
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModule('bookings')}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Seat Guests
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* LIVE OPERATIONS SNAPSHOT (5 cols — Filtered by Enabled Services) */}
        <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-lg overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-zinc-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Live Operations</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Active modules provisioned for {activeCompany.name}
              </p>
            </div>
            <button
              onClick={() => {
                setRole('SUPER_ADMIN');
                setActiveModule('sa_companies');
              }}
              className="text-[11px] font-medium text-teal-700 hover:underline cursor-pointer"
            >
              Configure Services →
            </button>
          </div>

          <div className="divide-y divide-zinc-200/70 flex-1">
            {hasFloor && (
              <button
                onClick={() => setActiveModule('floor')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Utensils className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Restaurant Floor</div>
                    <div className="text-sm font-semibold text-zinc-900 mt-0.5">
                      {activeTablesCount} / {tables.length} tables active
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-teal-700 font-medium">
                  Open Floor →
                </span>
              </button>
            )}

            {hasKitchen && (
              <button
                onClick={() => setActiveModule('kitchen')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Kitchen Display</div>
                    <div className="text-sm font-semibold text-zinc-900 mt-0.5">
                      {preparingOrders.length} orders preparing
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-600">View Board →</span>
              </button>
            )}

            {hasTakeaway && (
              <button
                onClick={() => setActiveModule('takeaway')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Takeaway / Parcel</div>
                    <div className="text-sm font-semibold text-zinc-900 mt-0.5">
                      {takeawayReady.length} orders ready for pickup
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-600">Parcel Desk →</span>
              </button>
            )}

            {hasBilling && (
              <button
                onClick={() => setActiveModule('orders')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-zinc-700" />
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Unsettled Bills</div>
                    <div className="text-sm font-semibold text-zinc-900 font-mono tabular-nums mt-0.5">
                      {formatINR(pendingBillsTotal)} pending
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-600">Review Bills →</span>
              </button>
            )}

            {hasResourceMgmt && (
              <button
                onClick={() => setActiveModule('rm_dashboard')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-teal-700" />
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Resource Management</div>
                    <div className="text-sm font-semibold text-zinc-900 mt-0.5">
                      14 / 18 staff working · 2 on break · 1 late
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-teal-700 font-medium">
                  Manage Staff →
                </span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* BESTSELLING DISHES & KITCHEN SPECIALS SHOWCASE — Borderless Cards */}
      {hasService('menu') && (
        <section className="bg-white rounded-3xl p-6 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#3D342E]">
                Today&apos;s Kitchen Favorites &amp; Fresh Beverages
              </h2>
              <p className="text-xs text-[#756A62] mt-0.5">
                Most ordered dishes across dining rooms and parcel counter today
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveModule('menu')}
              icon={<ArrowRight className="w-3.5 h-3.5 text-[#F97316]" />}
            >
              Open Menu Catalogue
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {menuItems
              .filter((m) => m.popular && m.available)
              .slice(0, 4)
              .map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => {
                    if (hasFloor) {
                      setActiveModule('floor');
                      setOrderingTableId('t-04');
                    } else {
                      setActiveModule('menu');
                    }
                  }}
                  className="group rounded-2xl p-3 bg-[#FFF9F3] hover:bg-[#FFF0E2]/70 transition-all cursor-pointer flex flex-col"
                >
                  <div className="h-36 w-full rounded-xl overflow-hidden bg-[#FFF0E2] relative">
                    <DishPhoto
                      item={dish}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="pt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#3D342E] group-hover:text-[#F97316] transition-colors line-clamp-1">
                          {dish.name}
                        </h3>
                        <span className="text-sm font-bold text-[#F97316] tabular-nums shrink-0">
                          {formatINR(dish.price)}
                        </span>
                      </div>
                      <p className="text-xs text-[#756A62] mt-1 line-clamp-1">
                        {dish.category} · {dish.station} · {dish.prepTimeMinutes}m prep
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* BOTTOM ROW: ONE USEFUL REVENUE/OPERATIONS CHART + TODAY'S ACTIVITY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ONE Useful Revenue & Service Velocity Chart (7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#3D342E]">
                Today’s Service Velocity &amp; Hourly Revenue
              </h2>
              <p className="text-xs text-[#756A62] mt-0.5">
                Dine-in + Takeaway throughput across lunch and dinner shifts
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#756A62] tabular-nums">
              <span className="text-[#F97316] font-bold">Peak: 7 PM (₹54.2k)</span>
              <span>·</span>
              <span>Avg Ticket: ₹1,540</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-9 gap-2 sm:gap-3 items-end h-48 pt-4">
            {HOURLY_PERFORMANCE.map((slot) => {
              const heightPct = Math.max(15, Math.round((slot.revenue / maxHourlyRevenue) * 100));
              const isPeak = slot.hour === '7 PM';
              return (
                <div
                  key={slot.hour}
                  className="flex flex-col items-center justify-end h-full group"
                >
                  <div className="text-[10px] text-[#756A62] mb-1.5 opacity-80 group-hover:opacity-100 tabular-nums">
                    ₹{Math.round(slot.revenue / 1000)}k
                  </div>
                  <div className="w-full bg-[#FFF0E2] rounded-xl h-32 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-xl transition-all duration-200 ${
                        isPeak
                          ? 'bg-[#F97316]'
                          : 'bg-[#FDBA74] group-hover:bg-[#F97316]'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-[#3D342E] font-semibold mt-2 whitespace-nowrap">
                    {slot.hour}
                  </div>
                  <div className="text-[10px] text-[#756A62] tabular-nums">
                    {slot.orders} ord
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TODAY'S ACTIVITY TIMELINE (5 cols) */}
        <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Today’s Activity</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Live operational audit stream
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700">Live</span>
          </div>

          <div className="mt-4 space-y-3.5 overflow-y-auto max-h-56 pr-1">
            {activities.slice(0, 7).map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 text-xs border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-zinc-900">{act.title}</div>
                  <div className="text-zinc-500 mt-0.5">{act.detail}</div>
                </div>
                <span className="font-mono text-[11px] text-zinc-400 shrink-0 tabular-nums">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ADD EXPENSE DRAWER */}
      <ContextualDrawer
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Log Operational Expense"
        subtitle="Record petty cash, utility, or direct vendor payout"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Expense Description
            </label>
            <input
              type="text"
              required
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="e.g., Fresh Curry Leaves & Coriander Local Market"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Amount (INR ₹)
            </label>
            <input
              type="number"
              required
              min={1}
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="1250"
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setExpMethod(m)}
                  className={`py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                    expMethod === m
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Expense
            </Button>
          </div>
        </form>
      </ContextualDrawer>

      {/* NEW BOOKING DRAWER */}
      <ContextualDrawer
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="New Table Reservation"
        subtitle="Reserve a dining table for today’s service"
      >
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Guest Full Name
            </label>
            <input
              type="text"
              required
              value={bkGuest}
              onChange={(e) => setBkGuest(e.target.value)}
              placeholder="e.g., Rohan Nambiar"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={bkPhone}
              onChange={(e) => setBkPhone(e.target.value)}
              placeholder="+91 98450 00000"
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Time Slot
              </label>
              <select
                value={bkTime}
                onChange={(e) => setBkTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option>7:30 PM</option>
                <option>8:00 PM</option>
                <option>8:30 PM</option>
                <option>9:00 PM</option>
                <option>9:30 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Party Size (Guests)
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={bkGuests}
                onChange={(e) => setBkGuests(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Assign Table
            </label>
            <select
              value={bkTableId}
              onChange={(e) => setBkTableId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status} · {t.capacity} seats)
                </option>
              ))}
            </select>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Booking
            </Button>
          </div>
        </form>
      </ContextualDrawer>
    </div>
  );
};
