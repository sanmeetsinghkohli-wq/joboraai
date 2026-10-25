'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StitchShell } from '@/components/StitchShell';
import { useAppData, type LiveApplication } from '@/context/AppDataContext';

export default function ApplicationsPage() {
  const router = useRouter();
  const {
    profile,
    applications,
    addApplication,
    updateApplicationStatus,
    updateApplicationDetails,
    deleteApplication,
    setSelectedJob,
    jobs,
  } = useAppData();

  const [statusFilter, setStatusFilter] = useState<'all' | 'applied' | 'interview' | 'screen' | 'offer' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState('applied');

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!`${app.title} ${app.company} ${app.location}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeApp: LiveApplication | null =
    filteredApps.find((a) => a.id === selectedAppId) ||
    (filteredApps.length > 0 ? filteredApps[0] : null);

  const countByStatus = (st: string) =>
    applications.filter((a) => a.status.toLowerCase() === st).length;

  const handleExportCSV = () => {
    const header = 'Title,Company,Location,Date Applied,Status,Match Score,Sync\n';
    const rows = applications
      .map(
        (a) =>
          `"${a.title}","${a.company}","${a.location}","${a.appliedAt}","${a.status}","${a.matchScore}%","${a.syncChannel}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Jobora_Applications_Export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCompany) return;
    const created = await addApplication({
      title: newTitle,
      company: newCompany,
      location: newLocation || 'Remote',
      status: newStatus,
      matchScore: 92,
      syncChannel: profile.emailProvider !== 'none' ? profile.emailProvider : 'Direct',
    });
    if (created) setSelectedAppId(created.id);
    setShowAddModal(false);
    setNewTitle('');
    setNewCompany('');
    setNewLocation('');
  };

  const getStatusBadge = (status: string) => {
    const st = status.toLowerCase();
    if (st === 'interview') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-[#FDECEC] text-[#D84F48] font-bold border border-[#E76F72]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E76F72]"></span> Interview
        </span>
      );
    }
    if (st === 'screen') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Passed Screen
        </span>
      );
    }
    if (st === 'offer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-[#351B32] text-white font-bold shadow-xs">
          <span className="material-symbols-outlined text-[14px] text-[#E76F72]">star</span> Offer
        </span>
      );
    }
    if (st === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-[#F3EBE3] text-on-surface-variant font-medium border border-[#EDE5E1]">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-[#F8F5F0] text-primary font-medium border border-[#EDE5E1]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#351B32]"></span> Applied
      </span>
    );
  };

  return (
    <StitchShell activeNav="applications">
      <div className="flex flex-col w-full">
        <div className="relative w-full">
          {/* Header & Quick Metrics Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-caption-caps text-caption-caps text-secondary uppercase tracking-widest bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full">
                  Pipeline Intelligence
                </span>
                <span className="font-caption-caps text-caption-caps text-on-surface-variant flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live sync active
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Applications Tracker</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 max-w-xl">
                Coordinate your outreach, inspect recruiter interactions, and tailor next actions with AI follow-up prompts.
              </p>
            </div>
            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md border border-[#EDE5E1] shadow-xs hover:bg-[#F8F5F0] transition-all focus-ring"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-[#2A1528] transition-all focus-ring"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Add Application</span>
              </button>
            </div>
          </div>

          {/* Metrics Cards Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
            <div className="p-4 rounded-xl editorial-card border border-[#EDE5E1] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Active Pipelines
                </span>
                <span className="font-headline-md text-headline-md text-primary mt-0.5">
                  {applications.length}
                </span>
                <span className="font-body-sm text-body-sm text-on-tertiary-container flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> Real-time synced
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">send</span>
              </div>
            </div>
            <div className="p-4 rounded-xl editorial-card border border-[#EDE5E1] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Interviews Secured
                </span>
                <span className="font-headline-md text-headline-md text-primary mt-0.5">
                  {countByStatus('interview')}
                </span>
                <span className="font-body-sm text-body-sm text-secondary flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">event_available</span> Active rounds
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/40 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">psychology</span>
              </div>
            </div>
            <div className="p-4 rounded-xl editorial-card border border-[#EDE5E1] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Passed Screen
                </span>
                <span className="font-headline-md text-headline-md text-primary mt-0.5">
                  {countByStatus('screen')}
                </span>
                <span className="font-body-sm text-body-sm text-on-tertiary-container flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Shortlisted
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/30 flex items-center justify-center text-on-tertiary-container">
                <span className="material-symbols-outlined text-[22px]">insights</span>
              </div>
            </div>
            <div className="p-4 rounded-xl editorial-card border border-[#EDE5E1] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                  Offers Received
                </span>
                <span className="font-headline-md text-headline-md text-primary mt-0.5">
                  {countByStatus('offer')}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Verified offers
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">military_tech</span>
              </div>
            </div>
          </div>

          {/* Filter & View Controls Card */}
          <div className="editorial-card border border-[#EDE5E1] p-3.5 mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {(
                [
                  { id: 'all', label: 'All', count: applications.length },
                  { id: 'applied', label: 'Applied', count: countByStatus('applied') },
                  { id: 'interview', label: 'Interviewing', count: countByStatus('interview') },
                  { id: 'screen', label: 'Passed Screen', count: countByStatus('screen') },
                  { id: 'offer', label: 'Offer', count: countByStatus('offer') },
                  { id: 'rejected', label: 'Rejected', count: countByStatus('rejected') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={
                    statusFilter === tab.id
                      ? 'px-3 py-1.5 rounded-lg font-label-md text-label-md bg-primary text-on-primary transition-all whitespace-nowrap shadow-xs'
                      : 'px-3 py-1.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-all whitespace-nowrap'
                  }
                  type="button"
                >
                  {tab.label} <span className="ml-1 opacity-80 text-[11px] font-mono">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center bg-[#F8F5F0] border border-[#EDE5E1] rounded-lg px-2.5 py-1.5 w-full sm:w-64 focus-within:border-[#351B32]">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-1.5">
                  filter_list
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none"
                  placeholder="Filter company, role..."
                  type="text"
                />
              </div>
              <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-[#EDE5E1]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md ${
                    viewMode === 'table'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Table View"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md ${
                    viewMode === 'kanban'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Kanban Board"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Workspace Split: Table + Detail Inspector */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Table Master Canvas (8 cols on XL) */}
            <div
              className={`xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                mobileInspectorOpen ? 'hidden xl:block' : 'block'
              }`}
            >
              {filteredApps.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[26px]">send</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">No applications logged yet</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                    Apply to a live job in Job Search or click &ldquo;+ Add Application&rdquo; above to track your real pipeline here.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => router.push('/jobs')}
                      className="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md font-bold"
                      type="button"
                    >
                      Browse Live Jobs
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md font-bold"
                      type="button"
                    >
                      + Add Application
                    </button>
                  </div>
                </div>
              ) : viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-caption-caps text-caption-caps uppercase tracking-wider">
                        <th className="py-3 px-4">Job Title &amp; Company</th>
                        <th className="py-3 px-3">Date Applied</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Fit Match</th>
                        <th className="py-3 px-3">Sync</th>
                        <th className="py-3 px-3">Next Action</th>
                        <th className="py-3 px-4 text-right">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm divide-y-0">
                      {filteredApps.map((app) => {
                        const isSelected = activeApp?.id === app.id;
                        return (
                          <tr
                            key={app.id}
                            onClick={() => {
                              setSelectedAppId(app.id);
                              setMobileInspectorOpen(true);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#FAF6F2] font-medium'
                                : 'hover:bg-surface-container-low'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-label-md text-primary font-bold shadow-xs">
                                  {app.company.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-label-md text-label-md text-primary truncate font-bold">
                                    {app.title}
                                  </span>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                    {app.company} • {app.location}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-on-surface-variant font-mono text-[12px] whitespace-nowrap">
                              {app.appliedAt}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed/40 px-2 py-0.5 rounded-full font-bold">
                                {app.matchScore}% match
                              </span>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[12px] font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600">
                                  mail
                                </span>{' '}
                                {app.syncChannel}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-semibold">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                <span className="truncate">{app.nextAction}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={app.status}
                                onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                className="bg-surface-container rounded-lg px-2 py-1 font-label-sm text-label-sm text-primary font-medium"
                              >
                                <option value="applied">Applied</option>
                                <option value="screen">Passed Screen</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['applied', 'interview', 'offer'] as const).map((col) => (
                    <div key={col} className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2.5">
                      <span className="font-caption-caps text-caption-caps uppercase text-primary font-bold">
                        {col} ({countByStatus(col)})
                      </span>
                      {applications
                        .filter((a) => a.status.toLowerCase() === col)
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedAppId(item.id);
                              setMobileInspectorOpen(true);
                            }}
                            className="p-3 rounded-xl bg-surface-container-lowest shadow-xs cursor-pointer hover:shadow-md"
                          >
                            <div className="font-label-md text-label-md text-primary font-bold">{item.title}</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant">
                              {item.company} • {item.location}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Table Pagination & Bulk Status Bar */}
              <div className="px-4 py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                    Showing {filteredApps.length} of {applications.length} applications
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Peek Slide-over / Inspector Panel (4 cols on XL) */}
            <div
              className={`xl:col-span-4 bg-surface-container-lowest rounded-xl shadow-md p-5 flex-col gap-5 sticky top-20 ${
                mobileInspectorOpen ? 'flex' : 'hidden xl:flex'
              }`}
            >
              {/* Mobile Back Button */}
              <div className="xl:hidden flex items-center justify-between pb-3 mb-1 border-b border-[#EDE5E1]">
                <button
                  type="button"
                  onClick={() => setMobileInspectorOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EDE5E1] text-primary font-bold text-sm shadow-xs hover:bg-[#F3EBE3] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back to applications table</span>
                </button>
              </div>

              {activeApp ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center font-headline-sm text-headline-sm text-primary font-bold shadow-xs">
                        {activeApp.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm text-primary leading-tight font-bold">
                            {activeApp.company}
                          </h3>
                          <span className="material-symbols-outlined text-[16px] text-blue-600">verified</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {activeApp.title} • {activeApp.location}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(activeApp.status)}
                  </div>

                  {/* AI Match Diagnostics Card */}
                  <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md text-primary">Role Compatibility</span>
                        <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                          auto_awesome
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        High alignment with your profile competencies and target experience.
                      </p>
                    </div>
                    <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-container-highest"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        ></path>
                        <path
                          className="text-secondary"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${activeApp.matchScore}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3"
                        ></path>
                      </svg>
                      <span className="absolute font-caption-caps text-caption-caps font-bold text-primary">
                        {activeApp.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider block mb-3">
                      Communication Timeline
                    </span>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                      {(activeApp.timeline || []).map((step, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-surface-container-lowest"></div>
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-primary font-semibold">
                              {step.title}
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant">
                              {step.timestamp}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attached Documents */}
                  <div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider block mb-2.5">
                      Attached Documents
                    </span>
                    <div className="space-y-2">
                      <div
                        onClick={() => router.push('/cv-studio')}
                        className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            picture_as_pdf
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-sm text-label-sm text-primary truncate">
                              {profile.resumeFileName || 'Tailored_CV.pdf'}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                              {activeApp.matchScore}/100 ATS Score • Tailored
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                          visibility
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Triggers */}
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <label className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Update Stage:
                      </label>
                      <select
                        value={activeApp.status}
                        onChange={(e) => updateApplicationStatus(activeApp.id, e.target.value)}
                        aria-label="Update application stage"
                        className="bg-surface-container-low px-3 py-1.5 rounded-lg font-label-sm text-label-sm text-primary font-bold"
                      >
                        <option value="Discovered">Discovered</option>
                        <option value="Saved">Saved</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready to Apply">Ready to Apply</option>
                        <option value="applied">Applied</option>
                        <option value="Assessment">Assessment</option>
                        <option value="screen">Passed Screen</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <button
                      onClick={() => router.push('/applications/prepare')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-white font-label-md text-label-md shadow hover:opacity-95 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      <span>Application Preparation Copilot</span>
                    </button>
                    <button
                      onClick={() => router.push('/email-composer')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow hover:bg-primary-container transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      <span>Open Email Composer</span>
                    </button>
                    <button
                      onClick={() => router.push('/interview')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      <span>Schedule Interview Prep</span>
                    </button>
                    {confirmDeleteId === activeApp.id ? (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-2">
                        <span className="font-label-sm text-label-sm text-rose-800">Confirm delete?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteApplication(activeApp.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-rose-600 text-white font-label-sm text-label-sm"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded bg-white text-on-surface font-label-sm text-label-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(activeApp.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-rose-700 hover:bg-rose-50 font-label-sm text-label-sm transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete Application</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-on-surface-variant font-body-sm">
                  Select an application row on the left to inspect its communication timeline and attached documents.
                </div>
              )}
            </div>
          </div>

          {/* AI Follow-up Recommendation Banner */}
          <div className="mt-6 p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-primary">AI Copilot Follow-up Suggestion</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sending a polite, value-driven inquiry 3 days after applying boosts recruiter reply rates by 34%.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/email-composer')}
                className="px-3.5 py-1.5 rounded-lg bg-secondary text-white font-label-sm text-label-sm shadow-sm hover:bg-secondary-container transition-colors"
                type="button"
              >
                Generate Follow-up Draft
              </button>
            </div>
          </div>
        </div>

        {/* Add Application Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
            <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Log Application</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-on-surface-variant hover:text-primary"
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Role Title (e.g. AI Engineering Intern)"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Company Name"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                />
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-body-sm text-on-surface"
                >
                  <option value="applied">Applied</option>
                  <option value="screen">Passed Screen</option>
                  <option value="interview">Interviewing</option>
                  <option value="offer">Offer Received</option>
                </select>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md font-bold"
                  >
                    Save Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StitchShell>
  );
}
