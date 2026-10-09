import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  Edit3,
  Copy,
  Power,
  ArrowRight,
  Users,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import {
  DayOfWeek,
  LeaveType,
  ModuleId,
  ShiftDefinition,
  StaffMember,
  TaskPriority,
} from '../types/operations';
import {
  Button,
  ContextualDrawer,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { cn } from '../lib/utils';
import { KNOCKOUT_PHOTOS } from '../lib/visualAssets';

const RM_NAV_TABS: { id: ModuleId; label: string }[] = [
  { id: 'rm_dashboard', label: 'Overview' },
  { id: 'staff', label: 'Staff' },
  { id: 'rm_attendance', label: 'Attendance' },
  { id: 'rm_shifts', label: 'Shifts' },
  { id: 'rm_schedule', label: 'Schedule' },
  { id: 'rm_leave', label: 'Leave' },
  { id: 'rm_tasks', label: 'Tasks' },
  { id: 'rm_planning', label: 'Resource Planning' },
];

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];

const ATTENDANCE_DATES = [
  'Today',
  'Yesterday',
  'This Week',
  'Custom Range',
] as const;

export const StaffView: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    canAccessModule,
    hasService,
    staff,
    shifts,
    weeklySchedule,
    leaveRequests,
    tasks,
    clockInStaff,
    startStaffBreak,
    endStaffBreak,
    updateStaffProfile,
    saveShiftDefinition,
    duplicateShiftDefinition,
    toggleShiftDefinitionActive,
    cycleScheduleSlot,
    updateStaffAvailabilityPreference,
    submitLeaveRequest,
    updateLeaveRequestStatus,
    assignOperationalTask,
    toggleTaskStatus,
  } = useOperations();

  const visibleRmTabs = RM_NAV_TABS.filter((t) => canAccessModule(t.id).allowed);

  // Determine active sub-view from sidebar module (defaults to first allowed tab)
  const currentTab: ModuleId = visibleRmTabs.some((t) => t.id === activeModule)
    ? activeModule
    : visibleRmTabs[0]?.id || 'rm_dashboard';

  // Selected Staff for Detail Drawer (Section 11)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Attendance Filters (Section 12 & 13)
  const [attendanceDateRange, setAttendanceDateRange] =
    useState<(typeof ATTENDANCE_DATES)[number]>('Today');
  const [attRoleFilter, setAttRoleFilter] = useState<string>('All');
  const [attStatusFilter, setAttStatusFilter] = useState<string>('All');
  const [attShiftFilter, setAttShiftFilter] = useState<string>('All');

  // Shift Creation / Edit Drawer (Section 14)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(
    null
  );

  // Availability Editor Drawer (Section 16)
  const [availabilityStaff, setAvailabilityStaff] =
    useState<StaffMember | null>(null);
  const [prefShiftDraft, setPrefShiftDraft] =
    useState<StaffMember['preferredShift']>('Morning');
  const [unavailDaysDraft, setUnavailDaysDraft] = useState<string>('Sunday');

  // Leave Request Drawer (Section 17)
  const [requestLeaveOpen, setRequestLeaveOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState('st-arun');
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [leaveStart, setLeaveStart] = useState('Oct 12');
  const [leaveEnd, setLeaveEnd] = useState('Oct 14');
  const [leaveReason, setLeaveReason] = useState('');

  // Task Assignment Drawer (Section 19)
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('Check inventory');
  const [taskStaffId, setTaskStaffId] = useState('st-arun');
  const [taskDueTime, setTaskDueTime] = useState('12:00 PM');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('High');

  const completedTasksCount = tasks.filter(
    (t) => t.status === 'Completed'
  ).length;
  const pendingTasksCount = tasks.length - completedTasksCount;

  // Filtered Attendance List
  const filteredAttendanceStaff = staff.filter((member) => {
    if (attRoleFilter !== 'All' && member.role !== attRoleFilter) return false;
    if (attStatusFilter !== 'All' && member.clockStatus !== attStatusFilter)
      return false;
    if (
      attShiftFilter !== 'All' &&
      !member.shift.toLowerCase().includes(attShiftFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    assignOperationalTask(
      taskTitle.trim(),
      taskStaffId,
      taskPriority,
      taskDueTime
    );
    setAssignTaskOpen(false);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart.trim() || !leaveEnd.trim()) return;
    submitLeaveRequest(
      leaveStaffId,
      leaveType,
      leaveStart.trim(),
      leaveEnd.trim(),
      leaveReason.trim() || 'Requested time off'
    );
    setLeaveReason('');
    setRequestLeaveOpen(false);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift || !editingShift.name.trim()) return;
    saveShiftDefinition(editingShift);
    setEditingShift(null);
  };

  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name.trim()) return;
    updateStaffProfile(editingStaff);
    setSelectedStaff(editingStaff);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Resource Management"
        meta="Today · October 7, 2026"
        subtitle="People · Shifts · Attendance · Tasks · Operations · Resource Planning"
        secondaryActions={
          hasService('leave') ? (
            <Button
              variant="outline"
              size="md"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => setRequestLeaveOpen(true)}
            >
              Request Leave
            </Button>
          ) : undefined
        }
        primaryAction={
          currentTab === 'rm_shifts' && hasService('shifts') ? (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() =>
                setEditingShift({
                  id: `sh-${Date.now()}`,
                  name: 'Late Dinner Shift',
                  code: 'E',
                  startTime: '06:00 PM',
                  endTime: '01:00 AM',
                  breakDurationMinutes: 30,
                  requiredStaff: 6,
                  assignedStaffCount: 5,
                  active: true,
                })
              }
            >
              Create Shift
            </Button>
          ) : hasService('tasks') ? (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setAssignTaskOpen(true)}
            >
              Assign Task
            </Button>
          ) : undefined
        }
      />

      {/* SUB-NAVIGATION BAR FOR RESOURCE MANAGEMENT — Soft Orange Container with Orange Active Pill */}
      <div className="flex items-center gap-1 p-1 bg-[#FFF0E2] rounded-full overflow-x-auto">
        {visibleRmTabs.map((tab) => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={cn(
                'min-h-[38px] px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer',
                active
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'text-[#756A62] hover:text-[#3D342E]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          TAB 1: RESOURCE MANAGEMENT DASHBOARD (Sections 8 & 25)
         ============================================================ */}
      {currentTab === 'rm_dashboard' && (
        <div className="space-y-6">
          {/* Hospitality Brigade Snapshot Banner — Borderless White Surface */}
          <div className="bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#F97316]">
                  Live Brigade &amp; Shift Coverage
                </div>
                <h2 className="text-xl font-bold text-[#3D342E] mt-1">
                  14 of 18 scheduled team members are active on the floor and kitchen pass
                </h2>
                <p className="text-sm text-[#756A62] mt-1.5 leading-relaxed">
                  Morning &amp; afternoon service coverage is at 94%. Evening dinner peak (7:00 PM – 10:00 PM) requires 1 additional waiter on Floor 1.
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveModule('rm_schedule')}
                >
                  Open Weekly Roster
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModule('rm_attendance')}
                >
                  Inspect Attendance Logs
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5 relative min-h-[160px] bg-[#FFF0E2]">
              <img
                src={KNOCKOUT_PHOTOS.chefKitchenBrigade}
                alt="Restaurant kitchen brigade and dining service team"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Top Metrics: 18 Scheduled, 14 Working, 2 On Break, 1 Late, 1 Absent */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <MetricCard
              label="Staff Scheduled"
              value="18"
              subtext="Morning & Evening"
              onClick={() => setActiveModule('rm_schedule')}
            />
            <MetricCard
              label="Currently Working"
              value="14"
              delta="Active"
              deltaTone="positive"
              onClick={() => setActiveModule('staff')}
            />
            <MetricCard
              label="On Break"
              value="2"
              subtext="Avg 24m duration"
              onClick={() => setActiveModule('rm_attendance')}
            />
            <MetricCard
              label="Late"
              value="1"
              delta="Vishnu (+27m)"
              deltaTone="warning"
              onClick={() => setActiveModule('rm_attendance')}
            />
            <MetricCard
              label="Absent"
              value="1"
              delta="Meera"
              deltaTone="warning"
              onClick={() => setActiveModule('rm_attendance')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* TODAY'S STAFF STATUS (7 cols — Section 8) — Borderless White Surface */}
            <section className="lg:col-span-7 bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] p-5 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-bold text-[#3D342E]">
                    Today’s Staff
                  </h2>
                  <p className="text-xs text-[#756A62] mt-0.5">
                    Click any operator to inspect attendance, active shift, and tasks
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModule('staff')}
                >
                  View All Staff →
                </Button>
              </div>

              <div className="space-y-2.5">
                {staff.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className="p-4 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF0E2]/70 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#3D342E]">
                        {member.name}
                      </div>
                      <div className="text-xs text-[#756A62]">
                        {member.role} · Shift {member.currentShiftTime}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-zinc-600 tabular-nums">
                        {member.checkInTime || 'Not Clocked In'}
                      </span>
                      <StatusIndicator status={member.clockStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* RIGHT COLUMN: SHIFT COVERAGE + ATTENDANCE ALERTS + TASKS + INSIGHTS (5 cols — Section 25) */}
            <div className="lg:col-span-5 space-y-4">
              {/* SHIFT COVERAGE */}
              <section className="bg-white border border-zinc-200/90 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Shift Coverage
                  </h3>
                  <button
                    onClick={() => setActiveModule('rm_schedule')}
                    className="text-xs text-teal-700 font-medium hover:underline cursor-pointer"
                  >
                    Manage Schedule →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">Morning</div>
                      <div className="text-zinc-500 mt-0.5">8 / 8 staff</div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Good
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">Evening</div>
                      <div className="text-zinc-500 mt-0.5">9 / 10 staff</div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> 1 waiter needed
                    </span>
                  </div>
                </div>
              </section>

              {/* ATTENDANCE ALERTS */}
              <section className="bg-white border border-zinc-200/90 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Attendance Alerts
                </h3>
                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900">Vishnu</span>{' '}
                      <span className="text-zinc-500">(Juicer)</span>
                    </div>
                    <span className="font-mono text-amber-700 font-medium">
                      27 minutes late
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900">Meera</span>{' '}
                      <span className="text-zinc-500">(Waiter)</span>
                    </div>
                    <span className="font-mono text-red-600 font-medium">
                      Not clocked in
                    </span>
                  </div>
                </div>
              </section>

              {/* TASKS SUMMARY & RESOURCE INSIGHTS */}
              <section className="bg-white border border-zinc-200/90 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Operational Tasks
                  </h3>
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">
                    12 assigned · {8 + completedTasksCount - 3} completed ·{' '}
                    {pendingTasksCount} pending
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="text-xs font-semibold text-zinc-900">
                    Resource Insights
                  </div>
                  <p className="text-xs text-zinc-600">
                    “Evening shift is expected to be busy (42 bookings, 186 guests). Consider adding one waiter.”
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModule('rm_planning')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open Resource Planning
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: STAFF DIRECTORY (Section 10)
          Columns: Name, Role, Status, Current Shift, Attendance, Availability, Actions
         ============================================================ */}
      {currentTab === 'staff' && (
        <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Current Shift</div>
            <div className="col-span-2">Attendance</div>
            <div className="col-span-1">Availability</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-zinc-200/70">
            {staff.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedStaff(member)}
                className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-zinc-50/70 transition-colors cursor-pointer"
              >
                <div className="md:col-span-2">
                  <div className="text-sm font-semibold text-zinc-900">
                    {member.name}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {member.phone}
                  </div>
                </div>

                <div className="md:col-span-2 text-xs font-medium text-zinc-800">
                  {member.role}
                </div>

                <div className="md:col-span-2">
                  <StatusIndicator status={member.clockStatus} />
                </div>

                <div className="md:col-span-2 text-xs font-mono text-zinc-700 tabular-nums">
                  {member.currentShiftTime}
                </div>

                <div className="md:col-span-2">
                  <StatusIndicator status={member.attendance} />
                </div>

                <div className="md:col-span-1">
                  <StatusIndicator status={member.availability} />
                </div>

                <div
                  className="md:col-span-1 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStaff(member)}
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: ATTENDANCE & HISTORY (Sections 12 & 13)
         ============================================================ */}
      {currentTab === 'rm_attendance' && (
        <div className="space-y-5">
          {/* Date Selector + Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <SegmentedTabs
              options={ATTENDANCE_DATES}
              value={attendanceDateRange}
              onChange={setAttendanceDateRange}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={attRoleFilter}
                onChange={(e) => setAttRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                aria-label="Filter by Role"
              >
                <option value="All">All Roles</option>
                <option value="Waiter">Waiter</option>
                <option value="Chef">Chef</option>
                <option value="Head Chef">Head Chef</option>
                <option value="Juicer">Juicer</option>
              </select>

              <select
                value={attStatusFilter}
                onChange={(e) => setAttStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                aria-label="Filter by Status"
              >
                <option value="All">All Statuses</option>
                <option value="Working">Working</option>
                <option value="On Break">On Break</option>
                <option value="Late">Late</option>
                <option value="Not Clocked In">Not Clocked In</option>
              </select>

              <select
                value={attShiftFilter}
                onChange={(e) => setAttShiftFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
                aria-label="Filter by Shift"
              >
                <option value="All">All Shifts</option>
                <option value="Morning">Morning Shift</option>
                <option value="Day">Day Shift</option>
                <option value="Evening">Evening Shift</option>
              </select>
            </div>
          </div>

          {/* Summary Cards: Present 14, Late 1, Absent 1, On Leave 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Present"
              value="14"
              delta={attendanceDateRange}
              deltaTone="positive"
            />
            <MetricCard
              label="Late"
              value="1"
              delta="Vishnu (16:27)"
              deltaTone="warning"
            />
            <MetricCard label="Absent" value="1" delta="Meera" deltaTone="warning" />
            <MetricCard label="On Leave" value="2" subtext="Approved leave" />
          </div>

          {/* Attendance Table: Staff, Role, Scheduled, Clock In, Break, Clock Out, Worked, Status */}
          <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
              <div className="col-span-2">Staff</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">Scheduled</div>
              <div className="col-span-2">Clock In</div>
              <div className="col-span-1">Break</div>
              <div className="col-span-1">Clock Out</div>
              <div className="col-span-1">Worked</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {filteredAttendanceStaff.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedStaff(member)}
                  className="px-5 py-3.5 grid grid-cols-2 md:grid-cols-12 gap-2 items-center hover:bg-zinc-50/70 transition-colors cursor-pointer text-xs"
                >
                  <div className="md:col-span-2 font-semibold text-zinc-900 text-sm">
                    {member.name}
                  </div>
                  <div className="md:col-span-2 text-zinc-600">{member.role}</div>
                  <div className="md:col-span-1 font-mono text-zinc-600 tabular-nums">
                    {member.scheduledStart}
                  </div>
                  <div className="md:col-span-2 font-mono text-zinc-900 font-medium tabular-nums">
                    {member.checkInTime || '—'}
                  </div>
                  <div className="md:col-span-1 font-mono text-zinc-600 tabular-nums">
                    {member.totalBreakMinutes > 0
                      ? `${member.totalBreakMinutes}m`
                      : '—'}
                  </div>
                  <div className="md:col-span-1 font-mono text-zinc-600 tabular-nums">
                    {member.clockOutTime || '—'}
                  </div>
                  <div className="md:col-span-1 font-mono font-semibold text-zinc-900 tabular-nums">
                    {member.workedDuration}
                  </div>
                  <div className="md:col-span-2 flex md:justify-end">
                    <StatusIndicator status={member.clockStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: SHIFTS MANAGEMENT (Section 14)
         ============================================================ */}
      {currentTab === 'rm_shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white border border-zinc-200/90 rounded-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                      Code: {shift.code}
                    </span>
                    <h3 className="text-base font-semibold text-zinc-900 mt-2">
                      {shift.name}
                    </h3>
                  </div>
                  <StatusIndicator
                    status={shift.active ? 'Active' : 'Suspended'}
                  />
                </div>

                <div className="mt-3 text-lg font-bold font-mono text-zinc-900 tabular-nums">
                  {shift.startTime} – {shift.endTime}
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Break Allowance</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {shift.breakDurationMinutes} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required Staff</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {shift.assignedStaffCount} / {shift.requiredStaff} assigned
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Edit, Duplicate, Deactivate */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-zinc-200"
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setEditingShift(shift)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-zinc-200"
                  icon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => duplicateShiftDefinition(shift.id)}
                >
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-zinc-200"
                  icon={<Power className="w-3.5 h-3.5" />}
                  onClick={() => toggleShiftDefinitionActive(shift.id)}
                >
                  {shift.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          TAB 5: WEEKLY SCHEDULE & STAFF AVAILABILITY (Sections 15 & 16)
         ============================================================ */}
      {currentTab === 'rm_schedule' && (
        <div className="space-y-5">
          {/* Legend Bar */}
          <div className="bg-white border border-zinc-200/90 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-zinc-900">
                Click any cell to cycle shift assignment:
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold">
                  M
                </span>{' '}
                Morning (08:00–16:00)
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <span className="px-2 py-0.5 rounded bg-teal-700 text-white font-bold">
                  E
                </span>{' '}
                Evening (16:00–00:00)
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">
                  OFF
                </span>{' '}
                Weekly Off
              </span>
            </div>
            <span className="text-zinc-500">
              Week of Oct 5 – Oct 11, 2026
            </span>
          </div>

          {/* DESKTOP WEEKLY MATRIX (Hidden on mobile so mobile never horizontally scrolls!) */}
          <div className="hidden md:block bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-mono font-semibold text-zinc-500">
              <div className="col-span-3 font-sans">Staff & Availability</div>
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="col-span-1 text-center">
                  {d}
                </div>
              ))}
              <div className="col-span-2 text-right font-sans">Availability</div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {weeklySchedule.map((row) => {
                const memberObj = staff.find((s) => s.id === row.staffId);
                return (
                  <div
                    key={row.staffId}
                    className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-zinc-50/60"
                  >
                    <div className="col-span-3">
                      <div className="text-sm font-semibold text-zinc-900">
                        {row.staffName}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {row.role} · Prefers {row.preferredShift}
                      </div>
                    </div>

                    {DAYS_OF_WEEK.map((day) => {
                      const code = row.days[day];
                      const isUnavail = row.unavailableDays.includes(day);
                      return (
                        <div key={day} className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => cycleScheduleSlot(row.staffId, day)}
                            title={
                              isUnavail
                                ? `${row.staffName} marked ${day} as unavailable`
                                : `Click to change ${day} shift`
                            }
                            className={cn(
                              'w-12 h-9 rounded-md font-mono text-xs font-bold transition-all cursor-pointer border',
                              code === 'M'
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : code === 'E'
                                ? 'bg-teal-700 text-white border-teal-700'
                                : code === 'LEAVE'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200',
                              isUnavail && code !== 'OFF' && 'ring-2 ring-red-500'
                            )}
                          >
                            {code}
                          </button>
                        </div>
                      );
                    })}

                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (memberObj) {
                            setAvailabilityStaff(memberObj);
                            setPrefShiftDraft(memberObj.preferredShift);
                            setUnavailDaysDraft(
                              memberObj.unavailableDays.join(', ') || 'None'
                            );
                          }
                        }}
                        className="text-xs text-zinc-600 hover:text-zinc-900 underline cursor-pointer"
                      >
                        Unavail: {row.unavailableDays.join(', ') || 'None'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE SCHEDULE CARDS (Section 15 & 27: No horizontal table scrolling on mobile!) */}
          <div className="md:hidden space-y-3">
            {weeklySchedule.map((row) => (
              <div
                key={row.staffId}
                className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {row.staffName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {row.role} · Preferred: {row.preferredShift}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Unavail: {row.unavailableDays.join(', ') || 'None'}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const code = row.days[day];
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => cycleScheduleSlot(row.staffId, day)}
                        className={cn(
                          'min-h-[44px] rounded-md flex flex-col items-center justify-center border font-mono cursor-pointer',
                          code === 'M'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : code === 'E'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        )}
                      >
                        <span className="text-[9px] opacity-75">{day}</span>
                        <span className="text-xs font-bold mt-0.5">{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 6: LEAVE MANAGEMENT (Section 17)
         ============================================================ */}
      {currentTab === 'rm_leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MANAGER LEAVE REQUESTS QUEUE (7 cols) */}
          <section className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Leave Requests
                </h2>
                <p className="text-xs text-zinc-500">
                  Approved leaves automatically update weekly shift scheduling
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {req.staffName}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-500">
                        {req.staffRole}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-zinc-800 mt-1">
                      {req.startDate} → {req.endDate} · {req.leaveType}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{req.reason}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIndicator status={req.status} />
                    {req.status === 'Pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            updateLeaveRequestStatus(req.id, 'Approved')
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateLeaveRequestStatus(req.id, 'Rejected')
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* STAFF LEAVE BALANCES & SUBMIT REQUEST (5 cols) */}
          <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Staff Leave Entitlements
                </h2>
                <p className="text-xs text-zinc-500">
                  Annual and Sick Leave balances
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRequestLeaveOpen(true)}
              >
                Request Leave
              </Button>
            </div>

            <div className="divide-y divide-zinc-100 text-xs">
              {staff.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-zinc-900">
                      {member.name}
                    </div>
                    <div className="text-zinc-500">{member.role}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums text-zinc-700">
                    <div>Annual: {member.annualLeaveRemaining}d left</div>
                    <div className="text-zinc-400">
                      Sick: {member.sickLeaveRemaining}d left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 7: OPERATIONAL TASKS (Sections 18 & 19)
         ============================================================ */}
      {currentTab === 'rm_tasks' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
              <div className="col-span-4">Task Title</div>
              <div className="col-span-2">Assigned Staff</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Due Time</div>
              <div className="col-span-2 text-right">Status & Action</div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {tasks.map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <div
                    key={task.id}
                    className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-zinc-50/70"
                  >
                    <div className="md:col-span-4">
                      <div
                        className={cn(
                          'text-sm font-semibold',
                          isDone
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-900'
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Station: {task.station}
                      </div>
                    </div>

                    <div className="md:col-span-2 text-xs font-medium text-zinc-800">
                      {task.assignedStaffName}{' '}
                      <span className="text-zinc-400">({task.assignedRole})</span>
                    </div>

                    <div className="md:col-span-2">
                      <span
                        className={cn(
                          'text-xs font-mono font-semibold',
                          task.priority === 'High'
                            ? 'text-red-600'
                            : task.priority === 'Medium'
                            ? 'text-amber-700'
                            : 'text-zinc-600'
                        )}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    <div className="md:col-span-2 font-mono text-xs text-zinc-700 tabular-nums">
                      Due {task.dueTime}
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <StatusIndicator status={task.status} />
                      <Button
                        variant={isDone ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => toggleTaskStatus(task.id)}
                      >
                        {isDone ? 'Reopen' : 'Mark Complete'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 8: RESOURCE PLANNING (Section 20 — Journey 8)
         ============================================================ */}
      {currentTab === 'rm_planning' && (
        <div className="space-y-6">
          {/* Demand vs Staffing Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <MetricCard label="Expected Orders" value="240" subtext="Forecast today" />
            <MetricCard label="Bookings" value="42" subtext="Confirmed covers" />
            <MetricCard label="Expected Guests" value="186" subtext="Peak 7:30 PM" />
            <MetricCard label="Staff Scheduled" value="18" subtext="Across shifts" />
            <MetricCard label="Currently Working" value="16" delta="Active" deltaTone="positive" />
            <MetricCard
              label="Recommended Staff"
              value="19"
              delta="+1 Waiter"
              deltaTone="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Role Resource Status (7 cols) */}
            <section className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Station & Role Capacity Status
                </h2>
                <p className="text-xs text-zinc-500">
                  Rule-based operational ratio matching expected covers to floor & kitchen stations
                </p>
              </div>

              <div className="divide-y divide-zinc-200/70">
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      Waiters (Floor Service)
                    </div>
                    <div className="text-xs text-zinc-500">
                      6 scheduled vs 7 recommended for 186 dinner guests (Meera not clocked in)
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Slightly Understaffed
                  </span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      Kitchen (Main Range & Tandoor)
                    </div>
                    <div className="text-xs text-zinc-500">
                      8 chefs active · Prep SLA holding at 11m 20s
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Good
                  </span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      Juice / Production Station
                    </div>
                    <div className="text-xs text-zinc-500">
                      2 operators active · Cold-press queue under 6 mins
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Good
                  </span>
                </div>
              </div>
            </section>

            {/* Operational Recommendation Card (5 cols) */}
            <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-700">
                  <Sparkles className="w-4 h-4" /> MANAGEMENT INSIGHT
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  “Tonight's dinner shift may need 1 additional waiter.”
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Floor 1 and Terrace bookings peak between 7:30 PM and 9:30 PM with 42 reserved tables. Assigning Arun or Rahul to cover the evening slot will balance waiter-to-table ratios.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => setActiveModule('rm_schedule')}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  View Schedule
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveModule('staff')}
                >
                  Inspect Staff
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ============================================================
          STAFF DETAIL DRAWER (Section 11 — Journey 3)
         ============================================================ */}
      <ContextualDrawer
        open={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        title={selectedStaff ? selectedStaff.name.toUpperCase() : 'Staff Detail'}
        subtitle={
          selectedStaff
            ? `${selectedStaff.role} · ${selectedStaff.phone}`
            : undefined
        }
      >
        {selectedStaff && (
          <div className="space-y-5">
            {/* Status & Current Shift */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Status</div>
                <div className="mt-1">
                  <StatusIndicator status={selectedStaff.clockStatus} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Current Shift</div>
                <div className="text-sm font-mono font-semibold text-zinc-900 mt-0.5">
                  {selectedStaff.currentShiftTime}
                </div>
              </div>
            </div>

            {/* Today's Attendance: Clock In, Break, Worked */}
            <div>
              <div className="text-xs font-semibold text-zinc-500 mb-2">
                TODAY’S ATTENDANCE
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] text-zinc-500">Clock In</div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1 tabular-nums">
                    {selectedStaff.checkInTime || '—'}
                  </div>
                </div>
                <div className="p-3 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] text-zinc-500">Break</div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1 tabular-nums">
                    {selectedStaff.totalBreakMinutes} min
                  </div>
                </div>
                <div className="p-3 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] text-zinc-500">Worked</div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1 tabular-nums">
                    {selectedStaff.workedDuration}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Clock / Break Control for Manager */}
            <div className="flex items-center gap-2">
              {selectedStaff.clockStatus === 'Not Clocked In' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    clockInStaff(selectedStaff.id);
                    setSelectedStaff({
                      ...selectedStaff,
                      clockStatus: 'Working',
                      checkInTime: '10:02 AM',
                      workedDuration: '2h 14m',
                    });
                  }}
                >
                  Clock In Now
                </Button>
              )}
              {selectedStaff.clockStatus === 'Working' && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Coffee className="w-3.5 h-3.5" />}
                  onClick={() => {
                    startStaffBreak(selectedStaff.id);
                    setSelectedStaff({
                      ...selectedStaff,
                      clockStatus: 'On Break',
                    });
                  }}
                >
                  Start Break
                </Button>
              )}
              {selectedStaff.clockStatus === 'On Break' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    endStaffBreak(selectedStaff.id);
                    setSelectedStaff({
                      ...selectedStaff,
                      clockStatus: 'Working',
                    });
                  }}
                >
                  End Break
                </Button>
              )}
            </div>

            {/* Connected Operations Workload (Section 21) */}
            {selectedStaff.assignedTablesCount !== undefined && (
              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2">
                  LIVE FLOOR WORKLOAD
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <div>
                    <div className="text-zinc-500">Assigned Tables</div>
                    <div className="font-mono font-bold text-zinc-900 text-sm mt-0.5">
                      {selectedStaff.assignedTablesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Active Orders</div>
                    <div className="font-mono font-bold text-zinc-900 text-sm mt-0.5">
                      {selectedStaff.activeOrdersCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Pending Bills</div>
                    <div className="font-mono font-bold text-amber-700 text-sm mt-0.5">
                      {selectedStaff.pendingBillsCount}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions (Section 11: View Schedule, View Attendance, Assign Task, Edit Staff) */}
            <div>
              <div className="text-xs font-semibold text-zinc-500 mb-2">
                QUICK ACTIONS
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStaff(null);
                    setActiveModule('rm_schedule');
                  }}
                >
                  View Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStaff(null);
                    setActiveModule('rm_attendance');
                  }}
                >
                  View Attendance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const stId = selectedStaff.id;
                    setSelectedStaff(null);
                    setTaskStaffId(stId);
                    setAssignTaskOpen(true);
                  }}
                >
                  Assign Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStaff(selectedStaff)}
                >
                  Edit Staff
                </Button>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div>
              <div className="text-xs font-semibold text-zinc-500 mb-2">
                RECENT ACTIVITY
              </div>
              <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 text-xs">
                {selectedStaff.activityTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between"
                  >
                    <span className="font-medium text-zinc-900">
                      {item.action}
                    </span>
                    <span className="font-mono text-zinc-500 tabular-nums">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* ASSIGN TASK DRAWER (Section 19) */}
      <ContextualDrawer
        open={assignTaskOpen}
        onClose={() => setAssignTaskOpen(false)}
        title="Assign Operational Task"
        subtitle="Dispatch checklist item to floor, kitchen, or juice staff"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Check inventory, Restock drinks"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Assigned To
            </label>
            <select
              value={taskStaffId}
              onChange={(e) => setTaskStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Due Time
              </label>
              <input
                type="text"
                value={taskDueTime}
                onChange={(e) => setTaskDueTime(e.target.value)}
                placeholder="12:00 PM"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignTaskOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Task
            </Button>
          </div>
        </form>
      </ContextualDrawer>

      {/* REQUEST LEAVE DRAWER (Section 17) */}
      <ContextualDrawer
        open={requestLeaveOpen}
        onClose={() => setRequestLeaveOpen(false)}
        title="Request Staff Leave"
        subtitle="Log annual or sick leave request"
      >
        <form onSubmit={handleSaveLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Staff Member
            </label>
            <select
              value={leaveStaffId}
              onChange={(e) => setLeaveStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Start Date
              </label>
              <input
                type="text"
                required
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                End Date
              </label>
              <input
                type="text"
                required
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Reason
            </label>
            <textarea
              rows={2}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason for leave..."
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequestLeaveOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </ContextualDrawer>

      {/* CREATE / EDIT SHIFT DRAWER (Section 14) */}
      <ContextualDrawer
        open={Boolean(editingShift)}
        onClose={() => setEditingShift(null)}
        title={editingShift ? `Configure ${editingShift.name}` : 'Create Shift'}
        subtitle="Set shift timing, break duration, and required staff count"
      >
        {editingShift && (
          <form onSubmit={handleSaveShift} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Shift Name
              </label>
              <input
                type="text"
                required
                value={editingShift.name}
                onChange={(e) =>
                  setEditingShift({ ...editingShift, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={editingShift.startTime}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={editingShift.endTime}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Break Duration (min)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingShift.breakDurationMinutes}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      breakDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Required Staff
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingShift.requiredStaff}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      requiredStaff: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingShift(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Shift
              </Button>
            </div>
          </form>
        )}
      </ContextualDrawer>

      {/* EDIT STAFF DRAWER */}
      <ContextualDrawer
        open={Boolean(editingStaff)}
        onClose={() => setEditingStaff(null)}
        title={editingStaff ? `Edit Staff · ${editingStaff.name}` : 'Edit Staff'}
        subtitle="Update role, shift assignment, and availability"
      >
        {editingStaff && (
          <form onSubmit={handleSaveStaffEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editingStaff.name}
                onChange={(e) =>
                  setEditingStaff({ ...editingStaff, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Current Shift Hours
              </label>
              <input
                type="text"
                value={editingStaff.currentShiftTime}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    currentShiftTime: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingStaff(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </ContextualDrawer>

      {/* STAFF AVAILABILITY DRAWER (Section 16) */}
      <ContextualDrawer
        open={Boolean(availabilityStaff)}
        onClose={() => setAvailabilityStaff(null)}
        title={
          availabilityStaff
            ? `Availability · ${availabilityStaff.name}`
            : 'Availability'
        }
        subtitle="Configure preferred shift and unavailable days"
      >
        {availabilityStaff && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Preferred Shift
              </label>
              <select
                value={prefShiftDraft}
                onChange={(e) =>
                  setPrefShiftDraft(
                    e.target.value as StaffMember['preferredShift']
                  )
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Unavailable Days (comma separated)
              </label>
              <input
                type="text"
                value={unavailDaysDraft}
                onChange={(e) => setUnavailDaysDraft(e.target.value)}
                placeholder="Sunday"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setAvailabilityStaff(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  updateStaffAvailabilityPreference(
                    availabilityStaff.id,
                    prefShiftDraft,
                    unavailDaysDraft
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  );
                  setAvailabilityStaff(null);
                }}
              >
                Save Availability
              </Button>
            </div>
          </div>
        )}
      </ContextualDrawer>
    </div>
  );
};
