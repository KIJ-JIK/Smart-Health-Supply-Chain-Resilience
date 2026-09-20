// ─────────────────────────────────────────────────────────────────────────────
// Audit Store — Zustand (Persistent)
// Stores and tracks all governance and administrative actions.
// Allows logging from any module (e.g. config edit, redistribution decisions).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditEntry } from '@/types';
import { INITIAL_AUDIT_LOG } from '@/lib/auditData';

interface AuditState {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, 'auditId' | 'createdAt' | 'timestamp'>) => void;
  resetToDefaults: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: INITIAL_AUDIT_LOG,

      addEntry: (newEntry) => {
        const now = new Date().toISOString();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const auditId = `aud-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomNum}`;

        const entry: AuditEntry = {
          ...newEntry,
          auditId,
          createdAt: now,
          timestamp: now,
          sourceIp: newEntry.sourceIp || '103.24.188.12',
          deviceId: newEntry.deviceId || 'WEB-CONSOLE-SESSION',
          correlationId: newEntry.correlationId || `corr-${Math.random().toString(36).substring(2, 9)}`,
          userId: newEntry.userId || newEntry.actorId || 'usr-system',
          userName: newEntry.userName || 'System Operator',
          userRole: newEntry.userRole || newEntry.actorRole || 'national_admin',
        };

        set((state) => ({
          entries: [entry, ...state.entries],
        }));
      },

      resetToDefaults: () => set({ entries: INITIAL_AUDIT_LOG }),
    }),
    {
      name: 'governance_audit_log_v1',
    }
  )
);
