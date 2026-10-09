/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OperationsProvider, useOperations } from './context/OperationsContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewView } from './views/OverviewView';
import { FloorView } from './views/FloorView';
import { OrdersView } from './views/OrdersView';
import { KitchenDisplayView } from './views/KitchenDisplayView';
import { BookingsView } from './views/BookingsView';
import { TakeawayView } from './views/TakeawayView';
import { MenuManagementView } from './views/MenuManagementView';
import { InventoryView } from './views/InventoryView';
import { SuppliersView } from './views/SuppliersView';
import { StaffView } from './views/StaffView';
import { StaffHomeView } from './views/StaffHomeView';
import { FinanceView } from './views/FinanceView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { SuperAdminView } from './views/SuperAdminView';
import { ServiceNotAvailableView } from './views/ServiceNotAvailableView';

const WorkspaceRouter: React.FC = () => {
  const { activeModule, canAccessModule } = useOperations();

  const accessCheck = canAccessModule(activeModule);
  if (!accessCheck.allowed) {
    return (
      <ServiceNotAvailableView
        serviceName={accessCheck.serviceName || 'Module'}
        serviceId={accessCheck.serviceId}
        reason={accessCheck.reason}
      />
    );
  }

  if (activeModule.startsWith('sa_')) {
    return <SuperAdminView />;
  }

  switch (activeModule) {
    case 'overview':
      return <OverviewView />;
    case 'floor':
      return <FloorView />;
    case 'orders':
      return <OrdersView />;
    case 'kitchen':
      return <KitchenDisplayView defaultStation="All Stations" />;
    case 'juice':
      return <KitchenDisplayView defaultStation="Juice" />;
    case 'bookings':
      return <BookingsView />;
    case 'takeaway':
      return <TakeawayView />;
    case 'staff_home':
      return <StaffHomeView />;
    case 'rm_dashboard':
    case 'staff':
    case 'rm_attendance':
    case 'rm_shifts':
    case 'rm_schedule':
    case 'rm_leave':
    case 'rm_tasks':
    case 'rm_planning':
      return <StaffView />;
    case 'menu':
      return <MenuManagementView />;
    case 'inventory':
      return <InventoryView />;
    case 'suppliers':
      return <SuppliersView />;
    case 'finance':
      return <FinanceView />;
    case 'reports':
      return <ReportsView />;
    case 'settings':
      return <SettingsView />;
    case 'sa_overview':
    case 'sa_companies':
    case 'sa_subscriptions':
    case 'sa_system':
      return <SuperAdminView />;
    default:
      return <OverviewView />;
  }
};

export default function App() {
  return (
    <OperationsProvider>
      <AppShell>
        <WorkspaceRouter />
      </AppShell>
    </OperationsProvider>
  );
}

