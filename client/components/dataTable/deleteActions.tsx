'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  DELETION_ENTITY_LABELS,
  DELETION_RETENTION_DAYS,
  type DeletionEntityType,
  type DeletionResult,
} from 'shared';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import { deleteAllRecords, deleteRecords } from '@/services/deletionService';
import DeleteAllModal from './deleteAllModal';
import type { DeleteTarget } from './types';

/** The most ids one Delete all request may carry. */
const DELETE_ALL_MAX = 10000;
/** How many failure reasons the result modal lists before "and N more". */
const MAX_LISTED_FAILURES = 5;

/** What else happens when a record of this type is deleted. */
const DELETE_NOTES: Partial<Record<DeletionEntityType, string>> = {
  case: "Each case's contract, payments, receipts, documents, burial record, and LGU or life plan record go with it, and so does its representative if they have no other case. Stock isn't changed.",
  casketdelivery: 'The delivered caskets are taken back out of stock.',
  formalindelivery: 'The delivered formalin is taken back out of stock.',
  formalinusage: 'The used formalin is put back into stock.',
  inventoryaudit:
    'Any stock and delivery-history corrections made while resolving the audit stay unchanged.',
};

/** Names a group of targets, falling back to "records" for mixed types. */
function nounFor(types: DeletionEntityType[]) {
  const unique = new Set(types);
  return unique.size === 1
    ? DELETION_ENTITY_LABELS[types[0]]
    : { singular: 'record', plural: 'records' };
}

function noteFor(types: DeletionEntityType[]) {
  return [...new Set(types)]
    .map((type) => DELETE_NOTES[type])
    .filter(Boolean)
    .join(' ');
}

/** Sends one request per entity type, merging the results. */
async function deleteGrouped(
  targets: DeleteTarget[],
  send: (
    entitytype: DeletionEntityType,
    ids: number[],
  ) => Promise<DeletionResult>,
): Promise<DeletionResult> {
  const groups = new Map<DeletionEntityType, number[]>();
  for (const { entitytype, id } of targets) {
    groups.set(entitytype, [...(groups.get(entitytype) ?? []), id]);
  }

  const merged: DeletionResult = { succeeded: [], failed: [] };
  for (const [entitytype, ids] of groups) {
    const result = await send(entitytype, ids);
    merged.succeeded.push(...result.succeeded);
    merged.failed.push(...result.failed);
  }
  return merged;
}

/**
 * The Delete (selected rows, admins) and Delete all (superadmins) buttons of
 * a table. Deleted records go to Deleted items, where an admin can restore
 * them for {@link DELETION_RETENTION_DAYS} days.
 *
 * @param pageTypes Entity types of the rows on screen, to name Delete all's
 * rows before they're loaded.
 * @param loadAllRows Every row matching the table's search and filters.
 * @param onDone Called after any deletion so the table can clear its
 * selection and refetch.
 */
export default function DeleteActions<T>({
  title,
  selected,
  total,
  pageTypes,
  deletable,
  canDeleteAll,
  loadAllRows,
  onDone,
}: {
  title: string;
  selected: T[];
  total: number;
  pageTypes: DeletionEntityType[];
  deletable: (row: T) => DeleteTarget;
  canDeleteAll: boolean;
  loadAllRows: () => Promise<T[]>;
  onDone: () => void;
}) {
  const { infoModal, showInfo } = useInfoModal();
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  async function showResult(
    result: DeletionResult,
    types: DeletionEntityType[],
  ) {
    const noun = nounFor(types);
    const done = result.succeeded.length;
    const doneText = `${done} ${done === 1 ? noun.singular : noun.plural}`;

    if (result.failed.length === 0) {
      await showInfo({
        title: 'Moved to Deleted items',
        message: `${doneText} ${done === 1 ? 'was' : 'were'} deleted. An admin can restore ${done === 1 ? 'it' : 'them'} from Deleted items within ${DELETION_RETENTION_DAYS} days.`,
        severity: 'success',
      });
      return;
    }

    const failed = result.failed.length;
    const reasons = result.failed
      .slice(0, MAX_LISTED_FAILURES)
      .map((failure) => failure.message);
    if (failed > MAX_LISTED_FAILURES) {
      reasons.push(`...and ${failed - MAX_LISTED_FAILURES} more`);
    }

    await showInfo({
      title:
        done === 0
          ? `Couldn't delete ${failed === 1 ? noun.singular : noun.plural}`
          : `${failed} couldn't be deleted`,
      message:
        done === 0
          ? 'Nothing was deleted:'
          : `${doneText} moved to Deleted items, but these couldn't be deleted:`,
      items: reasons,
      itemIcon: Trash2,
      severity: done === 0 ? 'error' : 'warning',
    });
  }

  async function confirmDeleteSelected() {
    const targets = selected.map(deletable);
    const types = targets.map((t) => t.entitytype);
    const noun = nounFor(types);
    const count = targets.length;
    let result: DeletionResult | null = null;
    let failure: string | null = null;

    await showInfo({
      title: `Delete ${count === 1 ? `this ${noun.singular}` : `${count} ${noun.plural}`}?`,
      message: [
        `${count === 1 ? 'It moves' : 'They move'} to Deleted items, where an admin can restore ${count === 1 ? 'it' : 'them'} for ${DELETION_RETENTION_DAYS} days before ${count === 1 ? "it's" : "they're"} permanently deleted.`,
        noteFor(types),
      ]
        .filter(Boolean)
        .join(' '),
      closeLabel: 'Cancel',
      confirmLabel: 'Delete',
      severity: 'error',
      // Caught here so the outcome can be shown in its own modal.
      onConfirmAction: async () => {
        try {
          result = await deleteGrouped(targets, deleteRecords);
        } catch (err) {
          failure = err instanceof Error ? err.message : 'Could not delete.';
        }
      },
    });

    if (failure) {
      onDone();
      await showInfo({
        title: "Couldn't Delete",
        message: failure,
        severity: 'error',
      });
    } else if (result) {
      onDone();
      await showResult(result, types);
    }
  }

  async function deleteAll(confirmation: string) {
    const rows = await loadAllRows();
    const targets = rows.slice(0, DELETE_ALL_MAX).map(deletable);
    if (targets.length === 0) throw new Error('There is nothing to delete.');

    const result = await deleteGrouped(targets, (entitytype, ids) =>
      deleteAllRecords(entitytype, ids, confirmation),
    );
    setIsDeleteAllOpen(false);
    onDone();
    await showResult(
      result,
      targets.map((t) => t.entitytype),
    );
  }

  const allNoun = nounFor(pageTypes);

  return (
    <>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => void confirmDeleteSelected()}
          className="flex items-center gap-1.5 text-sm border border-red-200 bg-white text-red-600 rounded-md px-3 py-1.5 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 size={14} />
          Delete ({selected.length})
        </button>
      )}

      {canDeleteAll && (
        <button
          type="button"
          onClick={() => setIsDeleteAllOpen(true)}
          disabled={total === 0}
          title="Superadmins only"
          className="flex items-center gap-1.5 text-sm border border-red-200 bg-white text-red-600 rounded-md px-3 py-1.5 hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          Delete all
        </button>
      )}

      {isDeleteAllOpen && (
        <DeleteAllModal
          title={title}
          total={total}
          plural={total === 1 ? allNoun.singular : allNoun.plural}
          note={noteFor(pageTypes) || undefined}
          onConfirm={deleteAll}
          onClose={() => setIsDeleteAllOpen(false)}
        />
      )}

      {infoModal}
    </>
  );
}
