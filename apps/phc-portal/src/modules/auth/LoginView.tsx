import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Lock,
  User,
  Building,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  MapPin,
  Bed,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { usePhcAuthStore, PhcStaffPersona } from '../../stores/authStore';
import { PhcBackendService, PhcFacilityBackendItem } from '../../services/phcBackendService';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = usePhcAuthStore();

  const [facilities, setFacilities] = useState<PhcFacilityBackendItem[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<'medical_officer' | 'pharmacist' | 'staff_nurse'>('medical_officer');
  const [staffId, setStaffId] = useState<string>('');
  const [pin, setPin] = useState<string>('clinic@2026');
  const [showPin, setShowPin] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Fetch live facilities list from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      setIsLoadingFacilities(true);
      try {
        const facs = await PhcBackendService.fetchFacilities();
        if (isMounted && facs.length > 0) {
          setFacilities(facs);
          // Default to first facility if not set
          setSelectedFacilityId((prev) => prev || facs[0].id);
        }
      } catch (err) {
        console.error('Failed to load facilities:', err);
      } finally {
        if (isMounted) setIsLoadingFacilities(false);
      }
    }
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch staff list whenever selected facility changes
  useEffect(() => {
    if (!selectedFacilityId) return;
    let isMounted = true;
    async function loadStaff() {
      const staff = await PhcBackendService.fetchStaffList(selectedFacilityId);
      if (isMounted) {
        setStaffList(staff);
        // Auto-fill staffId based on role
        updateStaffIdForRole(selectedRole, staff);
      }
    }
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [selectedFacilityId]);

  // Update staffId when role changes
  const updateStaffIdForRole = (role: string, currentStaffList = staffList) => {
    const roleTerm =
      role === 'medical_officer'
        ? 'Medical Officer'
        : role === 'pharmacist'
        ? 'Pharmacist'
        : 'Nurse';

    const matchingStaff = currentStaffList.find(
      (s) => s.role.toLowerCase().includes(roleTerm.toLowerCase())
    );

    const fac = facilities.find((f) => f.id === selectedFacilityId);
    const slug = fac ? fac.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'staff';

    if (matchingStaff) {
      setStaffId(
        `${role === 'medical_officer' ? 'dr.' : ''}${slug}@phc.gov.in`
      );
    } else {
      setStaffId(
        `${role === 'medical_officer' ? 'dr.' : ''}${slug}@phc.gov.in`
      );
    }
  };

  const handleRoleChange = (role: 'medical_officer' | 'pharmacist' | 'staff_nurse') => {
    setSelectedRole(role);
    setErrorMsg('');
    updateStaffIdForRole(role);
  };

  // Filter facilities by state and search query
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesState =
        selectedStateFilter === 'all' ||
        f.state.toLowerCase() === selectedStateFilter.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [facilities, selectedStateFilter, searchQuery]);

  // Distinct states available
  const availableStates = useMemo(() => {
    const states = Array.from(new Set(facilities.map((f) => f.state))).filter(Boolean);
    return states.sort();
  }, [facilities]);

  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  }, [facilities, selectedFacilityId]);

  // Form submission and backend credential verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFacilityId) {
      setErrorMsg('Please select a Primary Healthcare Centre facility.');
      return;
    }

    if (!staffId.trim()) {
      setErrorMsg('Please enter your official Staff ID or Email address.');
      return;
    }

    if (!pin || pin.trim().length < 4) {
      setErrorMsg('Please enter a valid Security PIN / Password (minimum 4 characters).');
      return;
    }

    setIsLoading(true);
    setStatusText('Verifying credentials with central health registry…');

    try {
      // 1. Verify credentials with the backend
      const result = await PhcBackendService.verifyLogin({
        phcId: selectedFacilityId,
        staffId: staffId.trim(),
        role:
          selectedRole === 'medical_officer'
            ? 'Medical Officer'
            : selectedRole === 'pharmacist'
            ? 'Pharmacist'
            : 'Staff Nurse',
        pin: pin.trim(),
      });

      setStatusText(`Syncing live ground-truth data for ${result.facility.name}…`);

      // 2. Hydrate local Dexie database with live PostgreSQL data for that PHC
      await PhcBackendService.hydratePhcDatabase(result.facility.id);

      // 3. Update auth store
      const persona: PhcStaffPersona = {
        id: result.staff.id,
        name: result.staff.name,
        role: selectedRole,
        roleLabel:
          selectedRole === 'medical_officer'
            ? 'Medical Officer (In-Charge)'
            : selectedRole === 'pharmacist'
            ? 'Lead Pharmacist'
            : 'Staff Nurse',
        facilityId: result.facility.id,
        facilityName: result.facility.name,
        district: result.facility.district,
        state: result.facility.state,
      };

      if (typeof window !== 'undefined' && result.tokens?.accessToken) {
        localStorage.setItem('phc_auth_token', result.tokens.accessToken);
      }

      login(persona, result.facility, result.tokens?.accessToken);

      setIsLoading(false);
      setStatusText('');

      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/login' || window.location.hash === '#login') {
          window.history.pushState({}, '', '/');
        }
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login verification error:', err);
      setIsLoading(false);
      setStatusText('');
      setErrorMsg(
        err.message || 'Authentication failed. Please verify that your credentials and facility match.'
      );
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="min-h-screen w-full text-neutral-900 flex flex-col justify-between font-sans select-none"
    >
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-neutral-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLATFORM HUB</span>
        </a>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>NODE 5173 · PRIMARY HEALTHCARE WORKBENCH</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="my-auto py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-neutral-200/90 rounded-2xl p-7 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                NATIONAL HEALTH MISSION · CLINIC ACCESS
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                PHC Operations Portal
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Facility Selector Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider font-semibold">
                  Select Healthcare Centre ({filteredFacilities.length} Available)
                </label>
                {isLoadingFacilities && (
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching registry…
                  </span>
                )}
              </div>

              {/* State Filter & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                >
                  <option value="all">All States ({availableStates.length})</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search PHC name or district…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* PHC Dropdown Selection */}
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  setSelectedFacilityId(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              >
                {filteredFacilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.district}, {f.state} ({f.occupied_beds}/{f.total_beds} Beds occupied)
                  </option>
                ))}
              </select>

              {/* Active Facility Metadata Pill */}
              {selectedFacility && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    <span className="font-semibold text-neutral-900">{selectedFacility.name}</span>
                    <span className="text-neutral-400">·</span>
                    <span>{selectedFacility.district}, {selectedFacility.state}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-600">
                    <span className="px-2 py-0.5 rounded bg-white border border-neutral-200">
                      {selectedFacility.total_beds} Beds ({selectedFacility.occupied_beds} Occupied)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {selectedFacility.operational_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Role Selector (Segmented buttons) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider font-semibold">
                Staff Role & Responsibility
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => handleRoleChange('medical_officer')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'medical_officer'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Medical Officer</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Physician</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacist')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'pharmacist'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Pharmacist</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Dispensary</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('staff_nurse')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedRole === 'staff_nurse'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>Ward Nurse</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Triage</span>
                </button>
              </div>
            </div>

            {/* 3. Credentials (ID & PIN) */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Staff ID / Official Health Email / Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. Dr. Anjali Sharma or dr.kothrud@phc.gov.in"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>
                {staffList.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] text-neutral-500 font-mono block mb-1">
                      Active Staff Roster ({selectedFacility?.name || 'Selected Facility'}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {staffList.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setStaffId(s.name);
                            if (s.role.toLowerCase().includes('officer') || s.role.toLowerCase().includes('doctor')) {
                              setSelectedRole('medical_officer');
                            } else if (s.role.toLowerCase().includes('pharm')) {
                              setSelectedRole('pharmacist');
                            } else {
                              setSelectedRole('staff_nurse');
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                            staffId === s.name
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                        >
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-neutral-400 ml-1">({s.role})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 uppercase tracking-wider mb-1 font-semibold">
                  Facility Security PIN / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter security PIN / password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-1">
                  Default Staff Access PIN: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 font-semibold">clinic@2026</code>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Loading / Status Message */}
            {isLoading && statusText && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-fadeIn font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-600" />
                <span>{statusText}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials…</span>
                </>
              ) : (
                <>
                  <span>Verify & Enter Clinic Workbench</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Roster Preview for Selected Facility */}
          {staffList.length > 0 && (
            <div className="mt-6 pt-5 border-t border-neutral-200">
              <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                <span>Registered Staff Roster at {selectedFacility?.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {staffList.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      const r = st.role.toLowerCase().includes('officer')
                        ? 'medical_officer'
                        : st.role.toLowerCase().includes('pharmacist')
                        ? 'pharmacist'
                        : 'staff_nurse';
                      setSelectedRole(r);
                      setStaffId(`${r === 'medical_officer' ? 'dr.' : ''}${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@phc.gov.in`);
                      setPin('clinic@2026');
                      setErrorMsg('');
                    }}
                    className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-neutral-900 truncate">{st.name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">{st.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-neutral-200 text-center text-xs font-mono text-neutral-500 bg-white/60">
        NIC / NHM ENCRYPTED FACILITY WORKBENCH · REAL-TIME POSTGRESQL LEDGER SYNC ACTIVE
      </footer>
    </div>
  );
};
