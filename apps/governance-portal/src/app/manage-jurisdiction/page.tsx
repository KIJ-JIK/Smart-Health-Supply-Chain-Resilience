'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  MapPin,
  Globe,
  Flag,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react';

// ── GraphQL queries for dropdown population ───────────────────────────────────
const GET_STATES = gql`
  query GetStatesForJurisdiction {
    nationalOverview {
      totalPhcs
    }
  }
`;

// ── Mutation imports ───────────────────────────────────────────────────────────
const CREATE_PHC_FACILITY = gql`
  mutation CreatePhcFacility(
    $name: String!
    $districtId: ID!
    $stateId: ID!
    $latitude: Float
    $longitude: Float
    $totalBeds: Int
    $emergencyBeds: Int
    $oxygenCylinders: Int
  ) {
    createPhcFacility(
      name: $name
      districtId: $districtId
      stateId: $stateId
      latitude: $latitude
      longitude: $longitude
      totalBeds: $totalBeds
      emergencyBeds: $emergencyBeds
      oxygenCylinders: $oxygenCylinders
    ) {
      phcId
      phcName
      districtId
      districtName
      stateId
      stateName
      totalBeds
      occupiedBeds
      oxygenCylinders
      riskLevel
    }
  }
`;

const CREATE_DISTRICT = gql`
  mutation CreateDistrict($name: String!, $stateId: ID!) {
    createDistrict(name: $name, stateId: $stateId) {
      districtId
      districtName
      stateId
      stateName
      totalPhcs
      activePhcs
    }
  }
`;

const CREATE_STATE = gql`
  mutation CreateState($name: String!, $code: String!, $country: String) {
    createState(name: $name, code: $code, country: $country) {
      stateId
      stateName
      totalDistricts
      totalPhcs
    }
  }
`;

const CREATE_NATION = gql`
  mutation CreateNation($code: String!, $name: String!, $status: String) {
    createNation(code: $code, name: $name, status: $status) {
      countryCode
      countryName
      status
      nodeStatus
      activeModelVersion
      coordinatorEndpoint
    }
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'phc' | 'district' | 'state' | 'nation';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

// ── Reusable form components ──────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
    />
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
    />
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      {loading ? 'Saving…' : children}
    </button>
  );
}

// ── CSV Upload helper ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFn = (options: { variables: Record<string, any> }) => Promise<any>;

interface CsvUploadProps {
  tab: TabId;
  onBulkComplete: (count: number) => void;
  createPhc: MutationFn;
  createDistrict: MutationFn;
  createState: MutationFn;
  createNation: MutationFn;
}

function CsvUpload({
  tab,
  onBulkComplete,
  createPhc,
  createDistrict,
  createState,
  createNation,
}: CsvUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const templates: Record<TabId, { cols: string[]; sample: string }> = {
    phc: {
      cols: ['name', 'district_id', 'state_id', 'latitude', 'longitude', 'total_beds', 'emergency_beds', 'oxygen_cylinders'],
      sample: 'name,district_id,state_id,latitude,longitude,total_beds,emergency_beds,oxygen_cylinders\nVillage PHC,dist-001,state-001,18.52,73.85,30,5,20',
    },
    district: {
      cols: ['name', 'state_id'],
      sample: 'name,state_id\nNagpur,state-001',
    },
    state: {
      cols: ['name', 'code', 'country'],
      sample: 'name,code,country\nMaharashtra,MH,India',
    },
    nation: {
      cols: ['code', 'name', 'status'],
      sample: 'code,name,status\nIN,India,active',
    },
  };

  const parseAndUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });

    setProcessing(true);
    setProgress({ done: 0, total: rows.length });

    let done = 0;
    for (const row of rows) {
      try {
        if (tab === 'phc') {
          await createPhc({
            variables: {
              name: row.name,
              districtId: row.district_id,
              stateId: row.state_id,
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
              totalBeds: row.total_beds ? parseInt(row.total_beds) : undefined,
              emergencyBeds: row.emergency_beds ? parseInt(row.emergency_beds) : undefined,
              oxygenCylinders: row.oxygen_cylinders ? parseInt(row.oxygen_cylinders) : undefined,
            },
          });
        } else if (tab === 'district') {
          await createDistrict({ variables: { name: row.name, stateId: row.state_id } });
        } else if (tab === 'state') {
          await createState({ variables: { name: row.name, code: row.code, country: row.country || 'India' } });
        } else if (tab === 'nation') {
          await createNation({ variables: { code: row.code, name: row.name, status: row.status || 'active' } });
        }
      } catch {
        // continue on error per-row
      }
      done++;
      setProgress({ done, total: rows.length });
    }

    setProcessing(false);
    setProgress(null);
    onBulkComplete(done);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) return;
    parseAndUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const { sample } = templates[tab];
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Bulk Upload via CSV
        </h4>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Download Template
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-neutral-900 bg-neutral-50'
            : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {processing && progress ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            <p className="text-sm text-neutral-600">
              Processing {progress.done} / {progress.total} rows…
            </p>
            <div className="w-48 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-600">
              Drag & drop a <span className="font-mono font-semibold">.csv</span> file here, or click to browse
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Columns: {templates[tab].cols.join(', ')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageJurisdictionPage() {
  const { user } = useAuthStore();

  // Determine allowed tabs by role
  const allowedTabs: TabId[] = [];
  if (user.role === 'district_admin') allowedTabs.push('phc');
  if (user.role === 'state_admin' || user.role === 'district_admin') allowedTabs.push('district');
  if (user.role === 'state_admin' || user.role === 'national_admin') allowedTabs.push('state');
  if (user.role === 'national_admin') allowedTabs.push('nation');

  const [activeTab, setActiveTab] = useState<TabId>(allowedTabs[0] ?? 'phc');
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [createPhc, { loading: phcLoading }] = useMutation(CREATE_PHC_FACILITY, {
    onCompleted: () => showToast({ type: 'success', message: 'PHC facility created successfully!' }),
    onError: (e) => showToast({ type: 'error', message: e.message }),
  });
  const [createDistrict, { loading: distLoading }] = useMutation(CREATE_DISTRICT, {
    onCompleted: () => showToast({ type: 'success', message: 'District created successfully!' }),
    onError: (e) => showToast({ type: 'error', message: e.message }),
  });
  const [createState, { loading: stateLoading }] = useMutation(CREATE_STATE, {
    onCompleted: () => showToast({ type: 'success', message: 'State created successfully!' }),
    onError: (e) => showToast({ type: 'error', message: e.message }),
  });
  const [createNation, { loading: nationLoading }] = useMutation(CREATE_NATION, {
    onCompleted: () => showToast({ type: 'success', message: 'Nation node created successfully!' }),
    onError: (e) => showToast({ type: 'error', message: e.message }),
  });

  // ── Form state ─────────────────────────────────────────────────────────────
  const [phcForm, setPhcForm] = useState({
    name: '', districtId: '', stateId: '',
    latitude: '', longitude: '', totalBeds: '', emergencyBeds: '', oxygenCylinders: '',
  });
  const [districtForm, setDistrictForm] = useState({ name: '', stateId: '' });
  const [stateForm, setStateForm] = useState({ name: '', code: '', country: 'India' });
  const [nationForm, setNationForm] = useState({ code: '', name: '', status: 'active' });

  const tabConfig: Record<TabId, { label: string; icon: React.ReactNode; color: string }> = {
    phc: { label: 'PHC Facility', icon: <Building2 className="w-4 h-4" />, color: 'text-emerald-600' },
    district: { label: 'District', icon: <MapPin className="w-4 h-4" />, color: 'text-blue-600' },
    state: { label: 'State', icon: <Globe className="w-4 h-4" />, color: 'text-purple-600' },
    nation: { label: 'Nation', icon: <Flag className="w-4 h-4" />, color: 'text-rose-600' },
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handlePhcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPhc({
      variables: {
        name: phcForm.name,
        districtId: phcForm.districtId,
        stateId: phcForm.stateId,
        latitude: phcForm.latitude ? parseFloat(phcForm.latitude) : undefined,
        longitude: phcForm.longitude ? parseFloat(phcForm.longitude) : undefined,
        totalBeds: phcForm.totalBeds ? parseInt(phcForm.totalBeds) : undefined,
        emergencyBeds: phcForm.emergencyBeds ? parseInt(phcForm.emergencyBeds) : undefined,
        oxygenCylinders: phcForm.oxygenCylinders ? parseInt(phcForm.oxygenCylinders) : undefined,
      },
    });
    setPhcForm({ name: '', districtId: '', stateId: '', latitude: '', longitude: '', totalBeds: '', emergencyBeds: '', oxygenCylinders: '' });
  };

  const handleDistrictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDistrict({ variables: { name: districtForm.name, stateId: districtForm.stateId } });
    setDistrictForm({ name: '', stateId: '' });
  };

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createState({ variables: { name: stateForm.name, code: stateForm.code, country: stateForm.country } });
    setStateForm({ name: '', code: '', country: 'India' });
  };

  const handleNationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNation({ variables: { code: nationForm.code, name: nationForm.name, status: nationForm.status } });
    setNationForm({ code: '', name: '', status: 'active' });
  };

  // ── Tab content ────────────────────────────────────────────────────────────
  const renderForm = () => {
    switch (activeTab) {
      case 'phc':
        return (
          <form onSubmit={handlePhcSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>PHC Facility Name</FieldLabel>
                <TextInput value={phcForm.name} onChange={(v) => setPhcForm((f) => ({ ...f, name: v }))} placeholder="e.g. Village PHC Khed" required />
              </div>
              <div>
                <FieldLabel required>State ID</FieldLabel>
                <TextInput value={phcForm.stateId} onChange={(v) => setPhcForm((f) => ({ ...f, stateId: v }))} placeholder="e.g. a0000001-0000-0000-0000-000000000001" required />
              </div>
              <div>
                <FieldLabel required>District ID</FieldLabel>
                <TextInput value={phcForm.districtId} onChange={(v) => setPhcForm((f) => ({ ...f, districtId: v }))} placeholder="e.g. b0000002-0000-0000-0000-000000000001" required />
              </div>
              <div>
                <FieldLabel>Total Beds</FieldLabel>
                <NumberInput value={phcForm.totalBeds} onChange={(v) => setPhcForm((f) => ({ ...f, totalBeds: v }))} placeholder="e.g. 30" />
              </div>
              <div>
                <FieldLabel>Emergency Beds</FieldLabel>
                <NumberInput value={phcForm.emergencyBeds} onChange={(v) => setPhcForm((f) => ({ ...f, emergencyBeds: v }))} placeholder="e.g. 5" />
              </div>
              <div>
                <FieldLabel>Oxygen Cylinders</FieldLabel>
                <NumberInput value={phcForm.oxygenCylinders} onChange={(v) => setPhcForm((f) => ({ ...f, oxygenCylinders: v }))} placeholder="e.g. 20" />
              </div>
              <div>
                <FieldLabel>Latitude</FieldLabel>
                <NumberInput value={phcForm.latitude} onChange={(v) => setPhcForm((f) => ({ ...f, latitude: v }))} placeholder="e.g. 18.5204" />
              </div>
              <div>
                <FieldLabel>Longitude</FieldLabel>
                <NumberInput value={phcForm.longitude} onChange={(v) => setPhcForm((f) => ({ ...f, longitude: v }))} placeholder="e.g. 73.8567" />
              </div>
            </div>
            <SubmitButton loading={phcLoading}>Create PHC Facility</SubmitButton>
          </form>
        );

      case 'district':
        return (
          <form onSubmit={handleDistrictSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>District Name</FieldLabel>
                <TextInput value={districtForm.name} onChange={(v) => setDistrictForm((f) => ({ ...f, name: v }))} placeholder="e.g. Nagpur" required />
              </div>
              <div>
                <FieldLabel required>State ID</FieldLabel>
                <TextInput value={districtForm.stateId} onChange={(v) => setDistrictForm((f) => ({ ...f, stateId: v }))} placeholder="e.g. a0000001-0000-0000-0000-000000000001" required />
              </div>
            </div>
            <SubmitButton loading={distLoading}>Create District</SubmitButton>
          </form>
        );

      case 'state':
        return (
          <form onSubmit={handleStateSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>State Name</FieldLabel>
                <TextInput value={stateForm.name} onChange={(v) => setStateForm((f) => ({ ...f, name: v }))} placeholder="e.g. Maharashtra" required />
              </div>
              <div>
                <FieldLabel required>State Code</FieldLabel>
                <TextInput value={stateForm.code} onChange={(v) => setStateForm((f) => ({ ...f, code: v.toUpperCase() }))} placeholder="e.g. MH" required />
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <TextInput value={stateForm.country} onChange={(v) => setStateForm((f) => ({ ...f, country: v }))} placeholder="e.g. India" />
              </div>
            </div>
            <SubmitButton loading={stateLoading}>Create State</SubmitButton>
          </form>
        );

      case 'nation':
        return (
          <form onSubmit={handleNationSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Country Code</FieldLabel>
                <TextInput value={nationForm.code} onChange={(v) => setNationForm((f) => ({ ...f, code: v.toUpperCase() }))} placeholder="e.g. IN" required />
              </div>
              <div>
                <FieldLabel required>Country Name</FieldLabel>
                <TextInput value={nationForm.name} onChange={(v) => setNationForm((f) => ({ ...f, name: v }))} placeholder="e.g. India" required />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  value={nationForm.status}
                  onChange={(e) => setNationForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <SubmitButton loading={nationLoading}>Create Nation Node</SubmitButton>
          </form>
        );
    }
  };

  if (allowedTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-neutral-500">
        <AlertCircle className="w-10 h-10 mb-3 text-neutral-300" />
        <p className="text-sm font-medium">You don't have permission to manage jurisdictions.</p>
      </div>
    );
  }

  const currentTab = tabConfig[activeTab];

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-neutral-400 hover:text-neutral-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" /> Governance → Manage Jurisdiction
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Jurisdiction Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Add new PHC facilities, districts, states, or nation nodes. Data syncs in real-time to National, State, and BRICS portals.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Jurisdiction chain:</span> Nation → State → District → PHC.
          Newly added entries are immediately visible in the National Command Center, State Overview, and BRICS Federated Node dashboards based on jurisdiction scope.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-neutral-100 rounded-xl w-fit">
        {allowedTabs.map((tab) => {
          const cfg = tabConfig[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className={activeTab === tab ? cfg.color : ''}>{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
          <div className={`${currentTab.color}`}>{currentTab.icon}</div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Add New {currentTab.label}</h2>
            <p className="text-xs text-neutral-500">Fill manually or upload a CSV dataset below.</p>
          </div>
        </div>

        {/* Manual form */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span className="text-sm font-semibold text-neutral-700">Manual Entry</span>
          </div>
          {renderForm()}
        </div>

        {/* Divider */}
        <div className="relative px-6">
          <hr className="border-neutral-100" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-neutral-400">OR</span>
        </div>

        {/* CSV Upload section */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span className="text-sm font-semibold text-neutral-700">Dataset Upload</span>
          </div>
          <CsvUpload
            tab={activeTab}
            onBulkComplete={(count) =>
              showToast({ type: 'success', message: `Bulk upload complete: ${count} records saved.` })
            }
            createPhc={createPhc as MutationFn}
            createDistrict={createDistrict as MutationFn}
            createState={createState as MutationFn}
            createNation={createNation as MutationFn}
          />
        </div>
      </div>
    </div>
  );
}
