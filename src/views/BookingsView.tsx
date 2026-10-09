import React, { useState } from 'react';
import {
  CalendarPlus,
  Users,
  Clock,
  Phone,
  Check,
  XCircle,
  UserCheck,
  Utensils,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Booking, BookingStatus } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  EmptyState,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';

const CALENDAR_VIEWS = ['Day', 'Week'] as const;
const STATUS_TABS: readonly ('All' | BookingStatus)[] = [
  'All',
  'Pending',
  'Confirmed',
  'Arriving',
  'Arrived',
  'Seated',
  'Completed',
  'Cancelled',
  'No-show',
];

const WEEK_DAYS = [
  { date: '2026-10-05', label: 'Mon 05', count: 14 },
  { date: '2026-10-06', label: 'Tue 06', count: 16 },
  { date: '2026-10-07', label: 'Wed 07 (Today)', count: 18 },
  { date: '2026-10-08', label: 'Thu 08', count: 15 },
  { date: '2026-10-09', label: 'Fri 09', count: 29 },
  { date: '2026-10-10', label: 'Sat 10', count: 34 },
  { date: '2026-10-11', label: 'Sun 11', count: 31 },
];

export const BookingsView: React.FC = () => {
  const { bookings, tables, updateBookingStatus, createBooking } = useOperations();

  const [calendarView, setCalendarView] =
    useState<(typeof CALENDAR_VIEWS)[number]>('Day');
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Create Booking Form State
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('7:30 PM');
  const [guests, setGuests] = useState(4);
  const [tableId, setTableId] = useState('t-04');
  const [notes, setNotes] = useState('');

  const filteredBookings = bookings.filter((b) =>
    statusFilter === 'All' ? true : b.status === statusFilter
  );

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    const tbl = tables.find((t) => t.id === tableId) || tables[0];
    createBooking({
      guestName: guestName.trim(),
      phone: phone.trim() || '+91 98450 77210',
      date: '2026-10-07',
      time,
      durationMinutes: 90,
      tableId: tbl.id,
      tableName: `Table ${tbl.number}`,
      guests,
      status: 'Confirmed',
      notes: notes.trim() || undefined,
    });
    setGuestName('');
    setPhone('');
    setNotes('');
    setCreateDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Bookings"
        meta="October 7, 2026"
        subtitle="Manage dining table reservations, guest arrivals, and floor seating assignments."
        secondaryActions={
          <SegmentedTabs
            options={CALENDAR_VIEWS}
            value={calendarView}
            onChange={setCalendarView}
          />
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<CalendarPlus className="w-4 h-4" />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            New Booking
          </Button>
        }
      />

      {/* WEEK VIEW BAR (When Week View selected) */}
      {calendarView === 'Week' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {WEEK_DAYS.map((day) => {
            const isToday = day.date === '2026-10-07';
            return (
              <div
                key={day.date}
                className={`p-3 rounded-lg border ${
                  isToday
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-800 border-zinc-200'
                }`}
              >
                <div className="text-xs font-medium">{day.label}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono tabular-nums">
                    {day.count}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isToday ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    bookings
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STATUS FILTER TABS */}
      <SegmentedTabs
        options={STATUS_TABS}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      {/* BOOKING CARDS GRID */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings today."
          description="Reservations for dining tables will appear here."
          actionLabel="Create Booking"
          onAction={() => setCreateDrawerOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => {
                setSelectedBooking(booking);
                setIsEditingBooking(false);
              }}
              className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-lg p-4 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums">
                      {booking.time}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {booking.tableName}
                    </span>
                  </div>
                  <StatusIndicator status={booking.status} />
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-semibold text-zinc-900">
                    {booking.guestName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {booking.guests} guests
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {booking.durationMinutes} min
                    </span>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-zinc-500 mt-2.5 bg-zinc-50 p-2 rounded border border-zinc-100 line-clamp-2">
                    {booking.notes}
                  </p>
                )}
              </div>

              <div
                className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-mono text-zinc-500">
                  {booking.phone}
                </span>
                <div className="flex items-center gap-1.5">
                  {booking.status === 'Pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBookingStatus(booking.id, 'Confirmed')}
                    >
                      Confirm
                    </Button>
                  )}
                  {(booking.status === 'Confirmed' ||
                    booking.status === 'Arriving') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBookingStatus(booking.id, 'Arrived')}
                    >
                      Mark Arrived
                    </Button>
                  )}
                  {booking.status !== 'Seated' &&
                    booking.status !== 'Completed' &&
                    booking.status !== 'Cancelled' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'Seated')}
                      >
                        Seat Guest
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING DETAIL DRAWER (Section 20) */}
      <ContextualDrawer
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking ? selectedBooking.guestName : 'Booking Detail'}
        subtitle={
          selectedBooking
            ? `${selectedBooking.date} at ${selectedBooking.time} · ${selectedBooking.tableName}`
            : undefined
        }
      >
        {selectedBooking && (
          <div className="space-y-5">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 flex items-center justify-between">
              <StatusIndicator status={selectedBooking.status} />
              <span className="text-xs font-mono text-zinc-600">
                {selectedBooking.tableName} · {selectedBooking.guests} Guests
              </span>
            </div>

            {/* Required Fields: Guest, Phone, Date, Time, Duration, Table, Guests, Notes, Status */}
            <div className="grid grid-cols-2 gap-3 text-xs border border-zinc-200 rounded-lg p-4">
              <div>
                <div className="text-zinc-400">Guest</div>
                <div className="font-semibold text-zinc-900 mt-0.5">
                  {selectedBooking.guestName}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Phone</div>
                <div className="font-mono text-zinc-900 mt-0.5 inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  {selectedBooking.phone}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Date & Time</div>
                <div className="font-mono text-zinc-900 mt-0.5">
                  {selectedBooking.date} · {selectedBooking.time}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Duration</div>
                <div className="font-mono text-zinc-900 mt-0.5">
                  {selectedBooking.durationMinutes} mins
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Table Assigned</div>
                <div className="font-semibold text-zinc-900 mt-0.5">
                  {selectedBooking.tableName}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Guests</div>
                <div className="font-mono text-zinc-900 mt-0.5">
                  {selectedBooking.guests} Persons
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-100">
                <div className="text-zinc-400">Special Notes</div>
                <div className="text-zinc-700 mt-0.5">
                  {selectedBooking.notes || 'No special dietary or seating notes.'}
                </div>
              </div>
            </div>

            {isEditingBooking && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-zinc-800">
                  Modify Reservation Time / Guests
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedBooking.time}
                    onChange={(e) =>
                      setSelectedBooking({
                        ...selectedBooking,
                        time: e.target.value,
                      })
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded"
                  >
                    <option>7:00 PM</option>
                    <option>7:30 PM</option>
                    <option>8:00 PM</option>
                    <option>8:30 PM</option>
                    <option>9:00 PM</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={selectedBooking.guests}
                    onChange={(e) =>
                      setSelectedBooking({
                        ...selectedBooking,
                        guests: Number(e.target.value),
                      })
                    }
                    className="px-2.5 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditingBooking(false)}
                >
                  Save Changes
                </Button>
              </div>
            )}

            {/* Required Actions: Confirm, Cancel, Modify, Mark Arrived, Seat Guest */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-500">
                RESERVATION ACTIONS
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Utensils className="w-4 h-4" />}
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'Seated');
                    setSelectedBooking({ ...selectedBooking, status: 'Seated' });
                  }}
                >
                  Seat Guest
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<UserCheck className="w-4 h-4" />}
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'Arrived');
                    setSelectedBooking({ ...selectedBooking, status: 'Arrived' });
                  }}
                >
                  Mark Arrived
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'Confirmed');
                    setSelectedBooking({ ...selectedBooking, status: 'Confirmed' });
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBooking(!isEditingBooking)}
                >
                  Modify
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-2 border border-red-200 text-red-600 hover:bg-red-50"
                  icon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'Cancelled');
                    setSelectedBooking(null);
                  }}
                >
                  Cancel Reservation
                </Button>
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* CREATE NEW BOOKING DRAWER */}
      <ContextualDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="New Restaurant Booking"
        subtitle="Assign table, guest count, and arrival time"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g., John Mathew"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98452 77109"
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option>7:00 PM</option>
                <option>7:30 PM</option>
                <option>8:00 PM</option>
                <option>8:30 PM</option>
                <option>9:00 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Guests
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Table
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.zone} · {t.capacity} seats)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dietary requests, occasion..."
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Booking
            </Button>
          </div>
        </form>
      </ContextualDrawer>
    </div>
  );
};
