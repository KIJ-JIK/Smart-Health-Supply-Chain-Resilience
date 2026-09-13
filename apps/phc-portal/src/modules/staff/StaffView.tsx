import React, { useState } from 'react';
import {
  Users,
  Save,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../../components/common/Button';

export const StaffView: React.FC = () => {
  const staffList = useLiveQuery(() => db.staff_registry.toArray()) || [];
  const today = new Date().toISOString().split('T')[0];
  const attendanceRecords = useLiveQuery(() => db.staff_attendance.where('attendance_date').equals(today).toArray()) || [];

  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [selectedDate, setSelectedDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  // Local attendance state for the date
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});

  // Sync attendance records into local state
  React.useEffect(() => {
    const map: Record<string, 'present' | 'absent' | 'leave'> = {};
    staffList.forEach((s) => {
      const rec = attendanceRecords.find((a) => a.staff_id === s.id);
      map[s.id] = rec ? rec.status : 'present';
    });
    setAttendanceMap(map);
  }, [staffList, attendanceRecords]);

  const handleMarkAllPresent = () => {
    const map: Record<string, 'present' | 'absent' | 'leave'> = {};
    staffList.forEach((s) => {
      map[s.id] = 'present';
    });
    setAttendanceMap(map);
    addToast('All staff marked Present (Tap exceptions to toggle Absent/Leave)', 'info');
  };

  const handleToggleStatus = (staffId: string, status: 'present' | 'absent' | 'leave') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      for (const staff of staffList) {
        const status = attendanceMap[staff.id] || 'present';
        await enqueue('staff_attendance', {
          id: `att-${staff.id}-${selectedDate}`,
          staff_id: staff.id,
          attendance_date: selectedDate,
          status,
        });
      }
      addToast(`Attendance for ${selectedDate} saved & enqueued!`, 'success');
    } catch (err) {
      addToast('Failed to save attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const leaveCount = Object.values(attendanceMap).filter((s) => s === 'leave').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Staff Registry & Attendance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rapid bulk attendance marking with exception toggle
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Bulk Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleMarkAllPresent}
          >
            Mark All Present (Bulk)
          </Button>

          <Button
            variant="primary"
            size="md"
            loading={isSaving}
            onClick={handleSaveAttendance}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Clinical Staff</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{staffList.length} Registered</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Doctors, Nurses, Pharmacists, Techs</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Present on Duty</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentCount} Active</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">On active shift</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Absent</span>
          <div className={`text-2xl font-black mt-1 ${absentCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {absentCount} Absent
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Unscheduled absence</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">On Approved Leave</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{leaveCount} Leave</div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Official roster leave</p>
        </div>
      </div>

      {/* Staff Roster & Attendance Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#1e2d3d] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Daily Roster — Date: <span className="font-mono text-primary-700 dark:text-primary-400">{selectedDate}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Tap status button to mark exceptions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#0d1929] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-[#1e2d3d]">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Attendance Status (Fast Toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d] text-slate-700 dark:text-slate-300">
              {staffList.map((s) => {
                const currentStatus = attendanceMap[s.id] || 'present';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0d1929]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: {s.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0d1929] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1e2d3d]">
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {s.phone}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-[#0d1929] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1e2d3d]'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-[#0d1929] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1e2d3d]'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id, 'leave')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            currentStatus === 'leave'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-[#0d1929] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1e2d3d]'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
