import React from 'react';
import { Lock, ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Button } from '../components/ui/Primitives';
import { ServiceId } from '../types/operations';

export const ServiceNotAvailableView: React.FC<{
  serviceName: string;
  serviceId?: ServiceId;
  reason?: 'service_disabled' | 'role_denied';
}> = ({ serviceName, serviceId, reason = 'service_disabled' }) => {
  const {
    activeCompany,
    role,
    setActiveModule,
    setRole,
    getServiceEntitlementSource,
  } = useOperations();

  const entitlementInfo = serviceId
    ? getServiceEntitlementSource(serviceId)
    : null;

  return (
    <div className="max-w-lg mx-auto my-12 bg-white border border-zinc-200/90 rounded-xl p-8 text-center space-y-5 shadow-xs">
      <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5" />
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold">
          {reason === 'role_denied'
            ? 'ROLE PERMISSION RESTRICTED'
            : 'SERVICE NOT AVAILABLE'}
        </div>
        <h1 className="text-xl font-bold text-zinc-900">{serviceName}</h1>
        {reason === 'role_denied' ? (
          <p className="text-sm text-zinc-600 leading-relaxed">
            <strong>{serviceName}</strong> is active for{' '}
            <strong>{activeCompany.name}</strong>, but the{' '}
            <strong>{role}</strong> role does not have permission to access this
            module.
          </p>
        ) : (
          <p className="text-sm text-zinc-600 leading-relaxed">
            This service isn’t enabled for <strong>{activeCompany.name}</strong>.
            Your administrator can enable <strong>{serviceName}</strong> from
            Super Admin Service Management.
          </p>
        )}
      </div>

      {/* Entitlement Context Metadata */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3.5 text-xs text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Active Tenant</span>
          <span className="font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
            {activeCompany.name} ({activeCompany.plan})
          </span>
        </div>
        {entitlementInfo && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Service Entitlement</span>
            <span className="font-mono font-semibold text-zinc-800">
              {entitlementInfo.status} · {entitlementInfo.source}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Data Retention Policy</span>
          <span className="text-emerald-700 font-medium">
            Historical data retained safely
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <Button
          variant="primary"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() =>
            setActiveModule(
              role === 'WAITER' || role === 'HEAD_CHEF' || role === 'JUICER'
                ? 'staff_home'
                : 'overview'
            )
          }
        >
          Go to Overview
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<ShieldCheck className="w-4 h-4 text-teal-700" />}
          onClick={() => {
            setRole('SUPER_ADMIN');
            setActiveModule('sa_companies');
          }}
        >
          Enable in Super Admin
        </Button>
      </div>
    </div>
  );
};
