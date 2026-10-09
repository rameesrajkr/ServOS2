import React, { useState } from 'react';
import {
  Clock,
  Coffee,
  LogOut,
  CheckCircle2,
  Utensils,
  ClipboardList,
  Receipt,
  Flame,
  CupSoda,
  Calendar,
  UserCheck,
  ArrowRight,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { LeaveType } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  StatusIndicator,
} from '../components/ui/Primitives';
import { cn } from '../lib/utils';

export const StaffHomeView: React.FC = () => {
  const {
    activeStaffMember,
    clockInStaff,
    startStaffBreak,
    endStaffBreak,
    clockOutStaff,
    resetStaffToNotClockedIn,
    setIsLoginModalOpen,
    setActiveModule,
    tasks,
    toggleTaskStatus,
    leaveRequests,
    submitLeaveRequest,
    tables,
    orders,
  } = useOperations();

  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);
  const [shiftCompletedModalOpen, setShiftCompletedModalOpen] = useState(false);
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);

  // Leave Request Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState('Oct 12');
  const [endDate, setEndDate] = useState('Oct 14');
  const [leaveReason, setLeaveReason] = useState('');

  const myTasks = tasks.filter(
    (t) =>
      t.assignedStaffId === activeStaffMember.id ||
      t.assignedRole.toLowerCase() === activeStaffMember.role.toLowerCase()
  );

  const myLeaves = leaveRequests.filter(
    (l) => l.staffId === activeStaffMember.id
  );

  const pendingMyTasksCount = myTasks.filter(
    (t) => t.status !== 'Completed'
  ).length;

  const isWaiter =
    activeStaffMember.userRoleMapping === 'WAITER' ||
    activeStaffMember.role.includes('Waiter');
  const isChef =
    activeStaffMember.userRoleMapping === 'HEAD_CHEF' ||
    activeStaffMember.role.includes('Chef');
  const isJuicer =
    activeStaffMember.userRoleMapping === 'JUICER' ||
    activeStaffMember.role === 'Juicer';

  const handleConfirmClockOut = () => {
    clockOutStaff(activeStaffMember.id);
    setConfirmClockOutOpen(false);
    setShiftCompletedModalOpen(true);
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate.trim() || !endDate.trim()) return;
    submitLeaveRequest(
      activeStaffMember.id,
      leaveType,
      startDate.trim(),
      endDate.trim(),
      leaveReason.trim() || 'Personal operational leave request'
    );
    setLeaveReason('');
    setLeaveDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* STAFF HOME HEADER (Section 4) — Borderless White Surface */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#3D342E]">
              Good morning, {activeStaffMember.name}
            </h1>
            <span className="text-[#E6DDD5]" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-semibold text-[#F97316]">
              Today: Wednesday, October 7
            </span>
          </div>
          <p className="text-sm text-[#756A62] mt-1">
            {activeStaffMember.role} · Current Shift:{' '}
            <span className="font-bold text-[#3D342E] tabular-nums">
              {activeStaffMember.currentShiftTime}
            </span>
          </p>
        </div>

        {/* Shared Device / Staff Mode Switcher (Section 3) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            icon={<UserCheck className="w-4 h-4 text-[#F97316]" />}
            onClick={() => setIsLoginModalOpen(true)}
          >
            Switch Staff
          </Button>
          {isWaiter && (
            <Button
              variant="primary"
              size="md"
              icon={<Utensils className="w-4 h-4" />}
              onClick={() => setActiveModule('floor')}
            >
              Open Floor
            </Button>
          )}
          {isChef && (
            <Button
              variant="primary"
              size="md"
              icon={<Flame className="w-4 h-4" />}
              onClick={() => setActiveModule('kitchen')}
            >
              Open Kitchen KDS
            </Button>
          )}
          {isJuicer && (
            <Button
              variant="primary"
              size="md"
              icon={<CupSoda className="w-4 h-4" />}
              onClick={() => setActiveModule('juice')}
            >
              Open Juice Queue
            </Button>
          )}
        </div>
      </div>

      {/* IMMEDIATE CLOCK IN / BREAK / CLOCK OUT COCKPIT (Sections 4, 5, 6, 7) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                CURRENT SHIFT
              </span>
              <span className="text-[#E6DDD5]">·</span>
              <span className="text-xs font-bold text-[#3D342E] tabular-nums">
                {activeStaffMember.currentShiftTime}
              </span>
            </div>

            {activeStaffMember.clockStatus === 'Not Clocked In' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusIndicator status="Not Clocked In" />
                </div>
                <p className="text-xs text-[#756A62]">
                  Clock in to start your shift timer, view assigned tables/stations, and log attendance.
                </p>
              </div>
            )}

            {(activeStaffMember.clockStatus === 'Working' ||
              activeStaffMember.clockStatus === 'Late') && (
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#15803D]">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                    You're clocked in ✓
                  </span>
                  <span className="text-sm font-bold text-[#3D342E] tabular-nums">
                    {activeStaffMember.checkInTime || '10:02 AM'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#756A62] tabular-nums">
                  <span>Working: {activeStaffMember.workedDuration || '2h 14m'}</span>
                  <span>·</span>
                  <span>
                    Total break: {activeStaffMember.totalBreakMinutes || 0} min
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => resetStaffToNotClockedIn(activeStaffMember.id)}
                    className="text-[#F97316] hover:text-[#EA580C] underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Not Clocked In
                  </button>
                </div>
              </div>
            )}

            {activeStaffMember.clockStatus === 'On Break' && (
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <StatusIndicator status="On Break" />
                  <span className="text-sm font-bold text-[#B45309] tabular-nums">
                    Started: {activeStaffMember.breakStartedAt || '2:14 PM'} · Duration: 18 min
                  </span>
                </div>
                <p className="text-xs text-[#756A62]">
                  Your shift timer is paused while on break. End break to resume floor/kitchen operations.
                </p>
              </div>
            )}

            {activeStaffMember.clockStatus === 'Completed' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#15803D] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    SHIFT COMPLETED ✓ · Worked {activeStaffMember.workedDuration} · Clocked out{' '}
                    {activeStaffMember.clockOutTime || '6:21 PM'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Primary Clock / Break Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {activeStaffMember.clockStatus === 'Not Clocked In' && (
              <Button
                variant="success"
                size="lg"
                className="min-w-[180px]"
                icon={<Clock className="w-4 h-4" />}
                onClick={() => clockInStaff(activeStaffMember.id)}
              >
                CLOCK IN
              </Button>
            )}

            {(activeStaffMember.clockStatus === 'Working' ||
              activeStaffMember.clockStatus === 'Late') && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Coffee className="w-4 h-4 text-[#F97316]" />}
                  onClick={() => startStaffBreak(activeStaffMember.id)}
                >
                  Start Break
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={() => setConfirmClockOutOpen(true)}
                >
                  Clock Out
                </Button>
              </>
            )}

            {activeStaffMember.clockStatus === 'On Break' && (
              <Button
                variant="primary"
                size="lg"
                className="min-w-[180px]"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => endStaffBreak(activeStaffMember.id)}
              >
                End Break
              </Button>
            )}

            {activeStaffMember.clockStatus === 'Completed' && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => resetStaffToNotClockedIn(activeStaffMember.id)}
              >
                Start New Shift Demo
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* CONNECTED OPERATIONAL WORKLOAD (Section 21 & 22) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#3D342E]">
            Today’s Work & Station Assignment
          </h2>
          <span className="text-xs font-semibold text-[#756A62]">
            Live Operational Context
          </span>
        </div>

        {isWaiter && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() => setActiveModule('floor')}
              className="bg-white rounded-3xl p-5 text-left transition-all shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] hover:shadow-[0_12px_28px_-4px_rgba(61,52,46,0.09)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Assigned Tables</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                {activeStaffMember.assignedTablesCount ?? 4}
              </div>
              <div className="text-xs text-[#F97316] font-bold mt-2 inline-flex items-center gap-1">
                <span>Open Floor</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            <button
              onClick={() => setActiveModule('orders')}
              className="bg-white rounded-3xl p-5 text-left transition-all shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] hover:shadow-[0_12px_28px_-4px_rgba(61,52,46,0.09)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Active Orders</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                {activeStaffMember.activeOrdersCount ?? 6}
              </div>
              <div className="text-xs text-[#F97316] font-bold mt-2 inline-flex items-center gap-1">
                <span>View Orders</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            <button
              onClick={() => setActiveModule('floor')}
              className="bg-white rounded-3xl p-5 text-left transition-all shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] hover:shadow-[0_12px_28px_-4px_rgba(61,52,46,0.09)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Pending Bills</div>
              <div className="text-2xl font-bold text-[#F97316] mt-1 tabular-nums">
                {tables.filter((t) => t.status === 'Waiting for Bill').length}
              </div>
              <div className="text-xs text-[#EA580C] font-bold mt-2 inline-flex items-center gap-1">
                <span>Settle Table 04</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            <div className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
              <div className="text-xs font-medium text-[#756A62]">Pending Tasks</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                {pendingMyTasksCount}
              </div>
              <div className="text-xs text-[#756A62] mt-2">
                Shift: {activeStaffMember.currentShiftTime}
              </div>
            </div>
          </div>
        )}

        {isChef && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() => setActiveModule('kitchen')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Kitchen Orders</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                12
              </div>
              <div className="text-xs text-[#F97316] font-bold mt-2">
                Open Kitchen KDS →
              </div>
            </button>
            <button
              onClick={() => setActiveModule('kitchen')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Preparing Now</div>
              <div className="text-2xl font-bold text-[#F97316] mt-1 tabular-nums">
                {orders.filter((o) => o.status === 'Preparing').length}
              </div>
              <div className="text-xs text-[#756A62] mt-2">On main range</div>
            </button>
            <button
              onClick={() => setActiveModule('kitchen')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Ready for Pickup</div>
              <div className="text-2xl font-bold text-[#15803D] mt-1 tabular-nums">
                {orders.filter((o) => o.status === 'Ready').length}
              </div>
              <div className="text-xs text-[#756A62] mt-2">At kitchen pass</div>
            </button>
            <div className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
              <div className="text-xs font-medium text-[#756A62]">Station Tasks</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                {pendingMyTasksCount}
              </div>
              <div className="text-xs text-[#756A62] mt-2">
                Shift: {activeStaffMember.currentShiftTime}
              </div>
            </div>
          </div>
        )}

        {isJuicer && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() => setActiveModule('juice')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Juice Orders</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                8
              </div>
              <div className="text-xs text-[#F97316] font-bold mt-2">
                Open Juice Queue →
              </div>
            </button>
            <button
              onClick={() => setActiveModule('juice')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Preparing</div>
              <div className="text-2xl font-bold text-[#F97316] mt-1 tabular-nums">
                2
              </div>
              <div className="text-xs text-[#756A62] mt-2">Cold-press station</div>
            </button>
            <button
              onClick={() => setActiveModule('juice')}
              className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] cursor-pointer"
            >
              <div className="text-xs font-medium text-[#756A62]">Ready</div>
              <div className="text-2xl font-bold text-[#15803D] mt-1 tabular-nums">
                1
              </div>
              <div className="text-xs text-[#756A62] mt-2">Awaiting runner</div>
            </button>
            <div className="bg-white rounded-3xl p-5 text-left shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
              <div className="text-xs font-medium text-[#756A62]">Station Tasks</div>
              <div className="text-2xl font-bold text-[#3D342E] mt-1 tabular-nums">
                {pendingMyTasksCount}
              </div>
              <div className="text-xs text-[#756A62] mt-2">
                Shift: {activeStaffMember.currentShiftTime}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* TWO-COLUMN: MY TASKS (Section 18) + MY LEAVE & ACTIVITY (Section 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MY TASKS (7 cols) — Borderless White Surface */}
        <section className="lg:col-span-7 bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] p-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-[#3D342E]">My Tasks</h2>
              <p className="text-xs text-[#756A62] mt-0.5">
                Operational shift checklists assigned to {activeStaffMember.name}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FFF0E2] text-xs font-bold text-[#F97316] tabular-nums">
              {pendingMyTasksCount} pending
            </span>
          </div>

          <div className="space-y-2.5">
            {myTasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-4 rounded-2xl flex items-center justify-between gap-3 transition-colors',
                    isCompleted ? 'bg-[#FFF9F3]/60' : 'bg-[#FFF9F3]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                    ) : task.priority === 'High' ? (
                      <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div
                        className={cn(
                          'text-sm font-bold',
                          isCompleted
                            ? 'line-through text-[#A89D94]'
                            : 'text-[#3D342E]'
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-[#756A62] mt-0.5">
                        {isCompleted ? (
                          <span className="text-[#15803D] font-bold">
                            Completed
                          </span>
                        ) : (
                          <>
                            <span>Due {task.dueTime}</span>
                            <span className="mx-1.5">·</span>
                            <span>{task.priority} Priority</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleTaskStatus(task.id)}
                  >
                    {isCompleted ? 'Undo' : 'Mark Complete'}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* MY LEAVE & TODAY'S SHIFT TIMELINE (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          {/* My Leave Card */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#3D342E]">
                  My Leave
                </h2>
                <p className="text-xs text-[#756A62]">
                  Available leave balance & requests
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Calendar className="w-3.5 h-3.5" />}
                onClick={() => setLeaveDrawerOpen(true)}
              >
                Request Leave
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl">
                <div className="text-xs text-[#756A62]">Annual Leave</div>
                <div className="text-lg font-bold text-[#F97316] mt-0.5 tabular-nums">
                  {activeStaffMember.annualLeaveRemaining} days
                </div>
                <div className="text-[11px] text-[#756A62]">remaining</div>
              </div>
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl">
                <div className="text-xs text-[#756A62]">Sick Leave</div>
                <div className="text-lg font-bold text-[#3D342E] mt-0.5 tabular-nums">
                  {activeStaffMember.sickLeaveRemaining} days
                </div>
                <div className="text-[11px] text-[#756A62]">remaining</div>
              </div>
            </div>

            {myLeaves.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold text-[#756A62]">
                  RECENT LEAVE REQUESTS
                </div>
                {myLeaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="flex items-center justify-between text-xs bg-[#FFF9F3] px-3.5 py-2.5 rounded-2xl"
                  >
                    <div>
                      <span className="font-bold text-[#3D342E]">
                        {lv.startDate} → {lv.endDate}
                      </span>{' '}
                      <span className="text-[#756A62]">· {lv.leaveType}</span>
                    </div>
                    <StatusIndicator status={lv.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shift Activity Log */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] space-y-3">
            <h3 className="text-sm font-bold text-[#3D342E]">
              Today’s Shift Activity
            </h3>
            <div className="space-y-2 text-xs">
              {activeStaffMember.activityTimeline.map((ev, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FFF9F3] flex items-center justify-between gap-2"
                >
                  <span className="text-[#3D342E] font-medium">{ev.action}</span>
                  <span className="text-[#F97316] font-bold tabular-nums">
                    {ev.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* CLOCK OUT CONFIRMATION SHEET (Section 6) */}
      <ContextualDrawer
        open={confirmClockOutOpen}
        onClose={() => setConfirmClockOutOpen(false)}
        title="End your shift?"
        subtitle={`Confirm shift summary for ${activeStaffMember.name} (${activeStaffMember.role})`}
      >
        <div className="space-y-5">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Clock in</span>
              <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                {activeStaffMember.checkInTime || '10:02 AM'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Current time</span>
              <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                18:21 (6:21 PM)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Break</span>
              <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                {activeStaffMember.totalBreakMinutes || 42} min
              </span>
            </div>
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-base font-bold text-zinc-900">
              <span>Total worked</span>
              <span className="font-mono tabular-nums">7h 37m</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setConfirmClockOutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={handleConfirmClockOut}
            >
              Clock Out
            </Button>
          </div>
        </div>
      </ContextualDrawer>

      {/* SHIFT COMPLETED MODAL (Section 6) */}
      {shiftCompletedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-zinc-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                SHIFT COMPLETED ✓
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 font-mono tabular-nums mt-1">
                Worked: 7h 37m
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Clocked out: 6:21 PM
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setShiftCompletedModalOpen(false);
                setIsLoginModalOpen(true);
              }}
            >
              Done (Return to Staff Access)
            </Button>
          </div>
        </div>
      )}

      {/* REQUEST LEAVE DRAWER (Section 17) */}
      <ContextualDrawer
        open={leaveDrawerOpen}
        onClose={() => setLeaveDrawerOpen(false)}
        title="Request Leave"
        subtitle={`Submit time-off request for ${activeStaffMember.name}`}
      >
        <form onSubmit={handleCreateLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value="Annual Leave">
                Annual Leave ({activeStaffMember.annualLeaveRemaining} days left)
              </option>
              <option value="Sick Leave">
                Sick Leave ({activeStaffMember.sickLeaveRemaining} days left)
              </option>
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Oct 12"
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
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Oct 14"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Reason
            </label>
            <textarea
              rows={3}
              required
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason for leave request..."
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLeaveDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </ContextualDrawer>
    </div>
  );
};
