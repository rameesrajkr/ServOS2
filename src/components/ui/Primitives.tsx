import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Loader2,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  AttendanceStatus,
  BookingStatus,
  MenuItem,
  OrderStatus,
  StockHealth,
  TableStatus,
} from '../../types/operations';
import { getMenuItemPhoto } from '../../lib/visualAssets';

// 1. Button Component — Solid Orange (#F97316) Primary, Soft Peach (#FFEDD5) Secondary, Borderless Clean Surfaces
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 whitespace-nowrap shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.99]';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#F97316] text-white hover:bg-[#EA580C] active:bg-[#C2410C] shadow-[0_4px_12px_rgba(249,115,22,0.22)]',
    secondary:
      'bg-[#FFEDD5] text-[#3D342E] hover:bg-[#FED7AA] active:bg-[#FDBA74] font-semibold',
    outline:
      'bg-[#FFF0E2] text-[#3D342E] hover:bg-[#FFEDD5] font-medium',
    ghost:
      'bg-transparent text-[#756A62] hover:text-[#3D342E] hover:bg-[#FFF0E2]/80',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
    success: 'bg-[#16A34A] text-white hover:bg-[#15803D]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-[38px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[42px] px-4 py-2 text-sm',
    lg: 'min-h-[46px] px-5 py-2.5 text-sm font-semibold',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
};

// 2. Semantic Status Indicator (Pairs explicit icon + readable text label, zero border noise)
export const StatusIndicator: React.FC<{
  status:
    | TableStatus
    | OrderStatus
    | BookingStatus
    | StockHealth
    | AttendanceStatus
    | 'Working'
    | 'On Break'
    | 'Not Clocked In'
    | 'Approved'
    | 'Rejected'
    | 'In Progress'
    | 'Busy'
    | 'Kitchen'
    | 'Unavailable'
    | 'Active'
    | 'Pending'
    | 'Suspended'
    | 'Payment Due'
    | 'Paid'
    | 'Draft'
    | 'Pending Activation'
    | 'Past Due'
    | 'Expired'
    | 'Issued'
    | 'Partially Paid'
    | 'Overdue'
    | 'Void'
    | 'Verified'
    | 'Manually Recorded'
    | 'Partial'
    | 'Failed'
    | 'Refunded'
    | 'Applied'
    | 'Enabled'
    | 'Disabled'
    | 'Archived'
    | 'Planned V2';
  className?: string;
}> = ({ status, className }) => {
  const getConfig = () => {
    switch (status) {
      case 'Available':
      case 'Healthy':
      case 'Completed':
      case 'Active':
      case 'Paid':
      case 'Present':
      case 'Working':
      case 'Approved':
      case 'Verified':
      case 'Enabled':
      case 'Applied':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />,
          textClass: 'text-[#15803D] font-semibold',
          label: status,
        };
      case 'Ready':
      case 'Confirmed':
      case 'Seated':
      case 'Issued':
      case 'Manually Recorded':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />,
          textClass: 'text-[#0F766E] font-semibold',
          label: status,
        };
      case 'Preparing':
      case 'Arriving':
      case 'Arrived':
      case 'In Progress':
      case 'Kitchen':
        return {
          icon: <Flame className="w-4 h-4 text-[#EA580C] shrink-0" />,
          textClass: 'text-[#C2410C] font-semibold',
          label: status,
        };
      case 'Waiting for Bill':
      case 'Low':
      case 'Pending':
      case 'Pending Activation':
      case 'Payment Due':
      case 'Partially Paid':
      case 'Partial':
      case 'Late':
      case 'On Break':
      case 'Busy':
        return {
          icon: <Clock className="w-4 h-4 text-[#D97706] shrink-0" />,
          textClass: 'text-[#B45309] font-semibold',
          label: status,
        };
      case 'Critical':
      case 'Cancelled':
      case 'No-show':
      case 'Suspended':
      case 'Absent':
      case 'Rejected':
      case 'Past Due':
      case 'Expired':
      case 'Overdue':
      case 'Failed':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />,
          textClass: 'text-[#B91C1C] font-semibold',
          label: status,
        };
      case 'Occupied':
      case 'Served':
        return {
          icon: <Utensils className="w-4 h-4 text-[#F97316] shrink-0" />,
          textClass: 'text-[#3D342E] font-semibold',
          label: status,
        };
      case 'Reserved':
      case 'On Leave':
      case 'Refunded':
        return {
          icon: <Info className="w-4 h-4 text-[#0284C7] shrink-0" />,
          textClass: 'text-[#0369A1] font-semibold',
          label: status,
        };
      case 'Not Clocked In':
      case 'Unavailable':
      case 'Cleaning':
      case 'Draft':
      case 'Void':
      case 'Disabled':
      case 'Archived':
      case 'Planned V2':
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-[#756A62] shrink-0" />,
          textClass: 'text-[#756A62] font-medium',
          label: status,
        };
    }
  };

  const cfg = getConfig();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
        cfg.textClass,
        className
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};

// 3. PageHeader Component — Clean Noto Sans hierarchy, generous whitespace, no divider stroke
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  meta?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}> = ({ title, subtitle, meta, primaryAction, secondaryActions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-[#3D342E]">
            {title}
          </h1>
          {meta && (
            <>
              <span className="text-[#756A62]/50" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-[#F97316] tabular-nums">
                {meta}
              </span>
            </>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-[#756A62] mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
};

// 4. MetricCard Component — Completely borderless white surface with soft warm elevation
export const MetricCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'positive' | 'warning' | 'neutral';
  subtext?: string;
  onClick?: () => void;
}> = ({ label, value, delta, deltaTone = 'neutral', subtext, onClick }) => {
  const toneColor =
    deltaTone === 'positive'
      ? 'text-[#15803D]'
      : deltaTone === 'warning'
      ? 'text-[#EA580C]'
      : 'text-[#756A62]';

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] transition-all',
        onClick &&
          'cursor-pointer hover:bg-[#FFFDFB] hover:shadow-[0_12px_28px_-4px_rgba(249,115,22,0.10)]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#756A62]">{label}</span>
        {delta && (
          <span
            className={cn(
              'text-xs font-semibold tabular-nums',
              toneColor
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#3D342E] tabular-nums">
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-[#756A62] tabular-nums truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

// 5. Contextual Drawer / Mobile Bottom Sheet Component — Borderless with soft elevation
export const ContextualDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'sm:max-w-md lg:max-w-lg',
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Warm Charcoal Backdrop */}
      <div
        className="fixed inset-0 bg-[#3D342E]/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer / Sheet Container */}
      <div
        className={cn(
          'relative z-10 w-full bg-white flex flex-col max-h-[90vh] sm:max-h-none sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl transition-transform duration-200',
          widthClass
        )}
      >
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-[#FFF0E2] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#FFF9F3] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#3D342E] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#756A62] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-xl text-[#756A62] hover:text-[#3D342E] hover:bg-[#FFF0E2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-[#FFF9F3] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// 6. EmptyState Component — Borderless warm card
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto my-6 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#F97316] flex items-center justify-center mx-auto mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[#3D342E]">{title}</h3>
      <p className="text-sm text-[#756A62] mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

// 7. ErrorState Component (Actionable operational error with clear recovery actions)
export const ErrorState: React.FC<{
  title: string;
  reason: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  title,
  reason,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-[#FFF0E2] rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#3D342E]">{title}</h4>
          <p className="text-xs text-[#756A62] mt-1">
            <span className="font-semibold text-[#3D342E]">Reason:</span> {reason}
          </p>
          <div className="flex items-center gap-2.5 mt-3.5">
            <Button variant="danger" size="sm" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="outline" size="sm" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 8. Segmented Filter Tabs — Warm soft orange highlight for selected tab (matching POS reference)
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  counts,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1.5 bg-white rounded-2xl shadow-[0_4px_14px_rgba(61,52,46,0.04)] overflow-x-auto max-w-full"
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt;
        const count = counts?.[opt];
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={cn(
              'min-h-[38px] px-4 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5',
              active
                ? 'bg-[#FFEDD5] text-[#3D342E] font-semibold'
                : 'text-[#756A62] hover:text-[#3D342E] hover:bg-[#FFF9F3]'
            )}
          >
            <span>{opt}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  active ? 'text-[#EA580C] font-bold' : 'text-[#756A62]'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 9. Reusable Authentic Dish Photo Component with Graceful Fallback
export const DishPhoto: React.FC<{
  item: Pick<MenuItem, 'id' | 'name' | 'category' | 'imageUrl'>;
  className?: string;
}> = ({ item, className }) => {
  const [failed, setFailed] = useState(false);
  const photo = getMenuItemPhoto(item);

  if (failed) {
    return (
      <div
        className={cn(
          'bg-[#FFF0E2] flex flex-col items-center justify-center text-[#756A62] p-4 text-center',
          className
        )}
      >
        <Utensils className="w-6 h-6 text-[#F97316] mb-1" />
        <span className="text-[11px] font-medium text-[#3D342E] line-clamp-1">
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={photo.url}
      alt={item.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ objectPosition: photo.objectPosition }}
      className={cn('w-full h-full object-cover', className)}
    />
  );
};
