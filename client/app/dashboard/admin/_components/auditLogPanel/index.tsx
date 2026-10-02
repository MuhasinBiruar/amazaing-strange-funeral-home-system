'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AuditLog } from 'shared';
import type { ReactNode } from 'react';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getAuditLogs } from '@/services/auditLogService';

function formatActionDate(value: Date) {
  return value.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderAction(action: string): ReactNode {
  const match = action.match(
    /^(.+?)\s+(created|updated|deleted|added|uploaded|recorded|removed|deactivated|activated)\b(.*)$/i,
  );

  if (!match) return action;

  const verb = match[2].toLowerCase();
  const actorClassName =
    verb === 'updated'
      ? 'text-blue-700'
      : ['deleted', 'removed'].includes(verb)
        ? 'text-red-700'
        : verb === 'deactivated'
          ? 'text-orange-700'
          : ['created', 'added', 'uploaded', 'recorded'].includes(verb)
            ? 'text-green-700'
            : 'text-gray-800';

  return (
    <>
      <span className={`font-bold ${actorClassName}`}>{match[1]}</span>{' '}
      <span>{match[2]}</span>
      {match[3]}
    </>
  );
}

export default function AuditLogPanel({ onClose }: { onClose: () => void }) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAuditLogs() {
      try {
        const logs = await getAuditLogs(controller.signal);
        if (!controller.signal.aborted) setAuditLogs(logs);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to load audit log:', error);
          setLoadError('Could not load audit log. Try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadAuditLogs();
    return () => controller.abort();
  }, []);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Audit log"
      badge="ADMIN"
      badgeClassName="bg-orange-100 text-orange-800"
      title="Audit Log"
      subtitle="Staff activity, newest first"
      widthClassName="sm:w-lg"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading audit log...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="py-10 text-sm text-red-500">{loadError}</p>
        )}

        {!isLoading && !loadError && auditLogs.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No audit activity found.
          </p>
        )}

        {!isLoading && !loadError && auditLogs.length > 0 && (
          <div className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <article key={log.auditlogid} className="py-4 first:pt-0">
                <p className="text-sm text-gray-800">
                  {renderAction(log.action)}
                </p>
                <div className="mt-1 text-xs text-gray-500">
                  <time dateTime={log.actiondate.toISOString()}>
                    {formatActionDate(log.actiondate)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SidePanel>
  );
}
