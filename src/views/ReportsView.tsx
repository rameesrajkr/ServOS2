import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import {
  Button,
  MetricCard,
  PageHeader,
  SegmentedTabs,
} from '../components/ui/Primitives';
import { formatINR } from '../lib/utils';

const REPORT_TYPES = [
  'Sales',
  'Orders',
  'Tables',
  'Bookings',
  'Kitchen',
  'Inventory',
  'Finance',
  'Staff',
] as const;

const DATE_RANGES = ['Today (Oct 7)', 'Last 7 Days', 'This Month (Oct)'] as const;

export const ReportsView: React.FC = () => {
  const { addToast } = useOperations();

  const [reportType, setReportType] =
    useState<(typeof REPORT_TYPES)[number]>('Sales');
  const [dateRange, setDateRange] =
    useState<(typeof DATE_RANGES)[number]>('Today (Oct 7)');

  const handleExport = () => {
    addToast(
      `Exported ${reportType} Report (${dateRange})`,
      'CSV and GST-ready summary generated.',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Operational Analytics"
        meta={dateRange}
        subtitle="Practical operational performance reports across sales, kitchen velocity, table turnover, and stock."
        secondaryActions={
          <SegmentedTabs
            options={DATE_RANGES}
            value={dateRange}
            onChange={setDateRange}
          />
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        }
      />

      {/* REPORT CATEGORY SELECTOR (Section 30) */}
      <SegmentedTabs
        options={REPORT_TYPES}
        value={reportType}
        onChange={setReportType}
      />

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={`${reportType} Gross Volume`}
          value="₹2,84,450"
          delta="+12.4%"
          deltaTone="positive"
          subtext={`Period: ${dateRange}`}
        />
        <MetricCard
          label="Average Table Turn Time"
          value="38 min"
          delta="-4 min faster"
          deltaTone="positive"
          subtext="Floor 1 & Floor 2 combined"
        />
        <MetricCard
          label="Top Performing Item"
          value="Chicken Biryani"
          subtext="64 portions sold today (₹19,200)"
        />
      </div>

      {/* DATA BREAKDOWN TABLE */}
      <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {reportType} Detailed Breakdown ({dateRange})
            </h2>
            <p className="text-xs text-zinc-500">
              Audited operational ledger rows ready for export
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Updated live
          </span>
        </div>

        <div className="divide-y divide-zinc-200/70 text-xs">
          {[
            {
              metric: 'Main Course — Chicken Biryani & Mutton Rogan Josh',
              count: '98 orders',
              share: '52.4%',
              value: 148900,
            },
            {
              metric: 'Starters — Malabar Pepper Chicken & Charcoal Paneer',
              count: '64 orders',
              share: '21.8%',
              value: 62100,
            },
            {
              metric: 'Juice & Cold-Press Station — Fresh Juice & Smoothies',
              count: '112 orders',
              share: '15.2%',
              value: 43200,
            },
            {
              metric: 'Desserts — Tender Coconut Elaneer & Tres Leches',
              count: '41 orders',
              share: '10.6%',
              value: 30250,
            },
          ].map((row) => (
            <div
              key={row.metric}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-zinc-900">{row.metric}</div>
                <div className="text-zinc-500 mt-0.5">
                  Volume: {row.count} · Revenue Share: {row.share}
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-zinc-900 tabular-nums">
                {formatINR(row.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
