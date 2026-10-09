import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Utensils,
  Flame,
  CupSoda,
  Wallet,
  Building2,
  Check,
  X,
  RotateCcw,
  ArrowLeft,
  Delete,
  Lock,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { StaffMember, UserRole } from '../../types/operations';
import { Button, SegmentedTabs, StatusIndicator } from '../ui/Primitives';
import { cn } from '../../lib/utils';
import { KNOCKOUT_PHOTOS } from '../../lib/visualAssets';

const ADMIN_ROLE_CARDS: {
  id: UserRole;
  title: string;
  person: string;
  description: string;
  primaryScreens: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'COMPANY_ADMIN',
    title: 'Company Admin / Manager',
    person: 'Alex Varghese',
    description:
      'Full operational command center across floor, kitchen, resource management, inventory, and finance.',
    primaryScreens:
      'Overview · Resource Management · Operations · Finance · Reports',
    icon: <ShieldCheck className="w-5 h-5 text-[#F97316]" />,
  },
  {
    id: 'FINANCE',
    title: 'Finance & Procurement',
    person: 'Nandini K.',
    description:
      'Settlements, daily cash/UPI reconciliation, supplier invoices, and expense tracking.',
    primaryScreens: 'Finance · Suppliers · Inventory · Reports',
    icon: <Wallet className="w-5 h-5 text-[#0D9488]" />,
  },
  {
    id: 'SUPER_ADMIN',
    title: 'Super Admin (Multi-Company SaaS)',
    person: 'KnockOUT Platform Ops',
    description:
      'Platform-wide tenant management, SaaS subscriptions, MRR, and module provisioning.',
    primaryScreens: 'Companies · Subscriptions · System & Modules',
    icon: <Building2 className="w-5 h-5 text-[#EA580C]" />,
  },
];

export const RoleLoginModal: React.FC = () => {
  const {
    role,
    setRole,
    staff,
    activeStaffId,
    loginAsStaffWithPin,
    isLoginModalOpen,
    setIsLoginModalOpen,
    companies,
    activeCompanyId,
    setActiveCompanyId,
    resetDemoState,
  } = useOperations();

  const [accessMode, setAccessMode] = useState<'Staff Access' | 'Manager / Admin'>(
    'Staff Access'
  );
  const [selectedStaffForPin, setSelectedStaffForPin] =
    useState<StaffMember | null>(null);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [startUnclockedDemo, setStartUnclockedDemo] = useState<boolean>(true);
  const [showOtherStaff, setShowOtherStaff] = useState<boolean>(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      setSelectedStaffForPin(null);
      setPinDigits('');
      setPinError('');
    }
  }, [isLoginModalOpen]);

  // Keyboard support for PIN entry
  useEffect(() => {
    if (!isLoginModalOpen || !selectedStaffForPin) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPinError('');
        setPinDigits((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setPinDigits((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && pinDigits.length === 4) {
        const ok = loginAsStaffWithPin(
          selectedStaffForPin.id,
          pinDigits,
          startUnclockedDemo
        );
        if (ok) {
          setIsLoginModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isLoginModalOpen,
    selectedStaffForPin,
    pinDigits,
    startUnclockedDemo,
    loginAsStaffWithPin,
    setIsLoginModalOpen,
  ]);

  if (!isLoginModalOpen) return null;

  // Primary operational staff shown on "Who's working?" (Arun, Rahul, Anu, Vishnu) + Other Staff
  const primaryStaffIds = ['st-arun', 'st-rahul', 'st-anu', 'st-vishnu'];
  const primaryStaff = staff.filter((s) => primaryStaffIds.includes(s.id));
  const otherStaff = staff.filter(
    (s) => !primaryStaffIds.includes(s.id) && s.role !== 'Manager'
  );
  const displayedStaff = showOtherStaff
    ? [...primaryStaff, ...otherStaff]
    : primaryStaff;

  const handleDigitPress = (digit: string) => {
    setPinError('');
    if (pinDigits.length < 4) {
      setPinDigits((prev) => prev + digit);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaffForPin) return;
    // Allow instant 1-tap Continue on prototype even if <4 digits entered by padding with mock token,
    // or verify 4 digits if entered.
    const effectivePin = pinDigits.length === 4 ? pinDigits : '1234';
    const success = loginAsStaffWithPin(
      selectedStaffForPin.id,
      effectivePin,
      startUnclockedDemo
    );
    if (success) {
      setIsLoginModalOpen(false);
    } else {
      setPinError('Invalid PIN format. Please enter a 4-digit PIN.');
    }
  };

  const getRoleIcon = (roleName: StaffMember['role']) => {
    if (roleName.includes('Chef'))
      return <Flame className="w-5 h-5 text-amber-600" />;
    if (roleName === 'Juicer')
      return <CupSoda className="w-5 h-5 text-emerald-700" />;
    return <Utensils className="w-5 h-5 text-teal-700" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Staff Access & Role Switcher"
    >
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[1px]"
        onClick={() => setIsLoginModalOpen(false)}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_48px_-12px_rgba(61,52,46,0.2)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header — Borderless Warm Surface */}
        <div className="px-6 py-4 bg-[#FFF9F3] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
              KO
            </div>
            <div>
              <div className="text-xs font-bold text-[#F97316]">
                KnockOUT · Shared Terminal &amp; Staff Access
              </div>
              <h2 className="text-base font-bold text-[#3D342E]">
                {selectedStaffForPin
                  ? `Verify PIN for ${selectedStaffForPin.name}`
                  : accessMode === 'Staff Access'
                  ? "Who's working?"
                  : 'Manager & Platform Access'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!selectedStaffForPin && (
              <SegmentedTabs
                options={['Staff Access', 'Manager / Admin'] as const}
                value={accessMode}
                onChange={setAccessMode}
              />
            )}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-2xl text-[#756A62] hover:text-[#3D342E] hover:bg-[#FFF0E2] cursor-pointer"
              aria-label="Close staff access"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          {accessMode === 'Staff Access' ? (
            !selectedStaffForPin ? (
              /* STEP 1: "WHO'S WORKING?" FAST STAFF PICKER (Section 2 & 23) */
              <div className="space-y-5">
                {/* Warm Hospitality Brigade Visual Context */}
                <div className="relative h-32 rounded-2xl overflow-hidden bg-[#FFF0E2]">
                  <img
                    src={KNOCKOUT_PHOTOS.chefKitchenBrigade}
                    alt="KnockOUT restaurant and kitchen hospitality team"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3D342E]/75 via-[#3D342E]/35 to-transparent flex items-center px-5">
                    <div className="text-white max-w-sm">
                      <div className="text-xs font-bold text-[#FFEDD5]">
                        Fast Tablet Sign-In
                      </div>
                      <div className="text-sm font-bold mt-0.5">
                        Select your profile and enter your 4-digit PIN to clock in or open your station.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displayedStaff.map((member) => {
                    const isCurrent = activeStaffId === member.id && role !== 'COMPANY_ADMIN';
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          setSelectedStaffForPin(member);
                          setPinDigits('');
                          setPinError('');
                          // Default Arun to start unclocked when testing Journey 1
                          setStartUnclockedDemo(member.id === 'st-arun');
                        }}
                        className={cn(
                          'p-4 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group',
                          isCurrent
                            ? 'bg-[#FFF0E2] ring-2 ring-[#F97316]'
                            : 'bg-[#FFF9F3] hover:bg-[#FFF0E2]'
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                            {getRoleIcon(member.role)}
                          </div>
                          <div>
                            <div className="text-base font-bold text-[#3D342E]">
                              {member.name}
                            </div>
                            <div className="text-xs text-[#756A62] mt-0.5">
                              {member.role} ·{' '}
                              <span className="tabular-nums">
                                {member.currentShiftTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <StatusIndicator status={member.clockStatus} />
                          {isCurrent && (
                            <div className="text-[11px] font-bold text-[#F97316] mt-1">
                              Active Session
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtherStaff(!showOtherStaff)}
                    className="text-xs font-bold text-[#756A62] hover:text-[#3D342E] underline cursor-pointer"
                  >
                    {showOtherStaff
                      ? 'Show Primary Shift Team Only'
                      : `Other Staff (+${otherStaff.length} team members)`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessMode('Manager / Admin')}
                    className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] cursor-pointer"
                  >
                    Manager / Admin Login →
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: SECURE PIN ENTRY FOR SELECTED STAFF (Section 2, 23, 24) */
              <form
                onSubmit={handlePinSubmit}
                className="max-w-sm mx-auto text-center space-y-5 py-2"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffForPin(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#756A62] hover:text-[#3D342E] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Switch Staff</span>
                  </button>
                  <span className="text-[11px] text-[#756A62] inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hash-Verified Session
                  </span>
                </div>

                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#F97316] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-xs">
                    {selectedStaffForPin.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-[#3D342E] tracking-tight mt-2.5">
                    {selectedStaffForPin.name}
                  </h3>
                  <p className="text-xs text-[#756A62]">
                    {selectedStaffForPin.role} · Shift{' '}
                    <span className="tabular-nums">
                      {selectedStaffForPin.currentShiftTime}
                    </span>
                  </p>
                </div>

                {/* Enter PIN Dots (● ● ● ●) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#756A62]">
                    Enter 4-Digit Operator PIN
                  </div>
                  <div
                    className="flex items-center justify-center gap-4 py-2"
                    aria-label="PIN progress"
                  >
                    {[0, 1, 2, 3].map((idx) => {
                      const filled = pinDigits.length > idx;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'w-4 h-4 rounded-full transition-all duration-150',
                            filled
                              ? 'bg-[#F97316] scale-110'
                              : 'bg-[#FFF0E2]'
                          )}
                        />
                      );
                    })}
                  </div>
                  {pinError && (
                    <p className="text-xs text-red-600">{pinError}</p>
                  )}
                </div>

                {/* Touch-Friendly Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[272px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitPress(num)}
                      className="h-13 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF0E2] active:bg-[#FFEDD5] text-base font-bold text-[#3D342E] tabular-nums cursor-pointer transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPinDigits('1234')}
                    className="h-13 rounded-2xl bg-[#FFF0E2] hover:bg-[#FFEDD5] text-xs font-bold text-[#EA580C] cursor-pointer transition-colors"
                    title="Auto-fill 4-digit demo PIN"
                  >
                    Demo PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitPress('0')}
                    className="h-13 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF0E2] active:bg-[#FFEDD5] text-base font-bold text-[#3D342E] tabular-nums cursor-pointer transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinDigits((p) => p.slice(0, -1))}
                    className="h-13 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF0E2] flex items-center justify-center text-[#756A62] cursor-pointer transition-colors"
                    aria-label="Backspace"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                {/* Optional toggle so user can test Journey 1 (NOT CLOCKED IN -> CLOCK IN) */}
                <label className="flex items-center justify-center gap-2 text-xs text-[#756A62] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={startUnclockedDemo}
                    onChange={(e) => setStartUnclockedDemo(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#F97316]"
                  />
                  <span>
                    Start as <strong className="text-[#3D342E]">Not Clocked In</strong> (to test Clock-In flow)
                  </span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Continue
                </Button>
              </form>
            )
          ) : (
            /* MANAGER & PLATFORM ADMIN ACCESS */
            <div className="space-y-3.5">
              {ADMIN_ROLE_CARDS.map((card) => {
                const active = role === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      setRole(card.id);
                      setIsLoginModalOpen(false);
                    }}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-4',
                      active
                        ? 'bg-[#FFF0E2] ring-2 ring-[#F97316]'
                        : 'bg-[#FFF9F3] hover:bg-[#FFF0E2]'
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                        {card.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#3D342E]">
                          {card.title}
                        </div>
                        <div className="text-xs text-[#756A62]">
                          {card.person} · Authenticated Manager Session
                        </div>
                        <p className="text-xs text-[#756A62] mt-2 leading-relaxed">
                          {card.description}
                        </p>
                        <div className="text-[11px] font-semibold text-[#F97316] mt-2">
                          {card.primaryScreens}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F97316] shrink-0">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Switch Company + Reset Demo State */}
        <div className="px-6 py-3.5 bg-[#FFF9F3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="modal-company-switch"
              className="text-xs font-bold text-[#756A62]"
            >
              Switch Company:
            </label>
            <select
              id="modal-company-switch"
              value={activeCompanyId}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="text-xs bg-white border border-[#E6DDD5] rounded-xl px-3 py-1.5 text-[#3D342E] font-bold"
            >
              {companies
                .filter((c) => c.status === 'Active')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                resetDemoState();
                setIsLoginModalOpen(false);
              }}
            >
              Reset Demo Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
