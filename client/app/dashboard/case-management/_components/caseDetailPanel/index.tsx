import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type {
  DeceasedRecordRow,
  DocumentWithUrl,
  Representative,
} from 'shared';
import {
  getDeceasedRecord,
  updateDeceasedRecord,
} from '@/services/deceasedRecordService';
import { getRepresentative } from '@/services/representativeService';
import { getDocumentsByCase } from '@/services/documentService';
import { fieldClass, labelClass } from '../fieldStyles';
import DocumentsSection from './documentsSection';

const PANEL_TRANSITION_MS = 300 as const;

/** `<input type="date">` wants `yyyy-mm-dd`; the API gives back a Date (or null). */
function toDateInputValue(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

interface DeceasedForm {
  firstname: string;
  middlename: string;
  lastname: string;
  causeofdeath: string;
  typeofdeath: string;
  physicaldescription: string;
  servicestatus: DeceasedRecordRow['servicestatus'];
  plantype: DeceasedRecordRow['plantype'];
  dateofdeath: string;
  hasmaturedlifeplan: boolean;
}

function toDeceasedForm(record: DeceasedRecordRow): DeceasedForm {
  return {
    firstname: record.firstname,
    middlename: record.middlename ?? '',
    lastname: record.lastname,
    causeofdeath: record.causeofdeath ?? '',
    typeofdeath: record.typeofdeath ?? '',
    physicaldescription: record.physicaldescription ?? '',
    servicestatus: record.servicestatus,
    plantype: record.plantype,
    dateofdeath: toDateInputValue(record.dateofdeath),
    hasmaturedlifeplan: record.hasmaturedlifeplan,
  };
}

interface RepresentativeForm {
  firstname: string;
  middlename: string;
  lastname: string;
  relationship: string;
  contactnumber: string;
  address: string;
}

function toRepresentativeForm(rep: Representative): RepresentativeForm {
  return {
    firstname: rep.firstname,
    middlename: rep.middlename ?? '',
    lastname: rep.lastname,
    relationship: rep.relationship ?? '',
    contactnumber: rep.contactnumber,
    address: rep.address ?? '',
  };
}

/**
 * Slide-in panel opened by clicking a deceased name in the case log. Shows
 * (and lets staff edit) the deceased record and representative info, plus
 * every document uploaded for the case.
 *
 * @remarks
 * Deceased edits save for real via `PATCH /deceasedrecords/:id`. Representative
 * edits do not — there is no `PATCH /representatives/:id` endpoint yet, so
 * that section's Save is disabled with an explanatory note rather than
 * pretending to persist something it can't.
 */
export default function CaseDetailPanel({
  caseid,
  representativeid,
  onClose,
}: {
  caseid: number;
  representativeid: number | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deceasedForm, setDeceasedForm] = useState<DeceasedForm | null>(null);
  const [isSavingDeceased, setIsSavingDeceased] = useState(false);
  const [deceasedSaveError, setDeceasedSaveError] = useState<string | null>(
    null,
  );
  const [deceasedSaved, setDeceasedSaved] = useState(false);

  const [representativeForm, setRepresentativeForm] =
    useState<RepresentativeForm | null>(null);

  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [deceased, representative, docs] = await Promise.all([
          getDeceasedRecord(caseid),
          representativeid ? getRepresentative(representativeid) : null,
          getDocumentsByCase(caseid, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setDeceasedForm(toDeceasedForm(deceased));
        setRepresentativeForm(
          representative ? toRepresentativeForm(representative) : null,
        );
        setDocuments(docs);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load case details:', error);
        setLoadError('Could not load this case. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [caseid, representativeid]);

  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  async function handleSaveDeceased() {
    if (!deceasedForm) return;

    setIsSavingDeceased(true);
    setDeceasedSaveError(null);
    setDeceasedSaved(false);

    try {
      await updateDeceasedRecord(caseid, {
        firstname: deceasedForm.firstname,
        middlename: deceasedForm.middlename || null,
        lastname: deceasedForm.lastname,
        causeofdeath: deceasedForm.causeofdeath || null,
        typeofdeath: deceasedForm.typeofdeath || null,
        physicaldescription: deceasedForm.physicaldescription || null,
        servicestatus: deceasedForm.servicestatus,
        plantype: deceasedForm.plantype,
        dateofdeath: deceasedForm.dateofdeath
          ? new Date(deceasedForm.dateofdeath)
          : null,
        hasmaturedlifeplan: deceasedForm.hasmaturedlifeplan,
      });
      setDeceasedSaved(true);
    } catch (error) {
      setDeceasedSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save changes. Try again.',
      );
    } finally {
      setIsSavingDeceased(false);
    }
  }

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Case details"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-112 bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <span className="inline-block bg-orange-100 text-orange-800 text-[10px] font-semibold px-2 py-0.5 rounded mb-1.5">
              CASE #{caseid}
            </span>
            <h2 className="text-lg font-serif font-bold text-gray-900">
              {deceasedForm
                ? `${deceasedForm.firstname} ${deceasedForm.lastname}`
                : 'Case details'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </div>
          )}

          {!isLoading && loadError && (
            <p className="text-sm text-red-500">{loadError}</p>
          )}

          {!isLoading && !loadError && deceasedForm && (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Deceased information
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First name</label>
                    <input
                      value={deceasedForm.firstname}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? { ...prev, firstname: e.target.value }
                            : prev,
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Middle name</label>
                    <input
                      value={deceasedForm.middlename}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? { ...prev, middlename: e.target.value }
                            : prev,
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Last name</label>
                  <input
                    value={deceasedForm.lastname}
                    onChange={(e) =>
                      setDeceasedForm((prev) =>
                        prev ? { ...prev, lastname: e.target.value } : prev,
                      )
                    }
                    className={fieldClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Service status</label>
                    <select
                      value={deceasedForm.servicestatus}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                servicestatus: e.target
                                  .value as DeceasedForm['servicestatus'],
                              }
                            : prev,
                        )
                      }
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="intake">Intake</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Plan type</label>
                    <select
                      value={deceasedForm.plantype}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                plantype: e.target
                                  .value as DeceasedForm['plantype'],
                              }
                            : prev,
                        )
                      }
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="Direct">Direct</option>
                      <option value="Life">Life</option>
                      <option value="LGU">LGU</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Cause of death</label>
                    <input
                      value={deceasedForm.causeofdeath}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? { ...prev, causeofdeath: e.target.value }
                            : prev,
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Type of death</label>
                    <input
                      value={deceasedForm.typeofdeath}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? { ...prev, typeofdeath: e.target.value }
                            : prev,
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Physical description</label>
                  <textarea
                    rows={2}
                    value={deceasedForm.physicaldescription}
                    onChange={(e) =>
                      setDeceasedForm((prev) =>
                        prev
                          ? { ...prev, physicaldescription: e.target.value }
                          : prev,
                      )
                    }
                    className={`${fieldClass} resize-y`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className={labelClass}>Date of death</label>
                    <input
                      type="date"
                      value={deceasedForm.dateofdeath}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? { ...prev, dateofdeath: e.target.value }
                            : prev,
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 pb-1.5">
                    <input
                      type="checkbox"
                      checked={deceasedForm.hasmaturedlifeplan}
                      onChange={(e) =>
                        setDeceasedForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                hasmaturedlifeplan: e.target.checked,
                              }
                            : prev,
                        )
                      }
                      className="cursor-pointer"
                    />
                    Matured life plan
                  </label>
                </div>

                {deceasedSaveError && (
                  <p className="text-xs text-red-500">{deceasedSaveError}</p>
                )}
                {deceasedSaved && !deceasedSaveError && (
                  <p className="text-xs text-emerald-600">Saved.</p>
                )}

                <button
                  type="button"
                  disabled={isSavingDeceased}
                  onClick={handleSaveDeceased}
                  className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSavingDeceased && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {isSavingDeceased ? 'Saving...' : 'Save changes'}
                </button>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Representative information
                </h3>

                {!representativeForm && (
                  <p className="text-sm text-gray-400">
                    No representative on file.
                  </p>
                )}

                {representativeForm && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>First name</label>
                        <input
                          value={representativeForm.firstname}
                          onChange={(e) =>
                            setRepresentativeForm((prev) =>
                              prev
                                ? { ...prev, firstname: e.target.value }
                                : prev,
                            )
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Middle name</label>
                        <input
                          value={representativeForm.middlename}
                          onChange={(e) =>
                            setRepresentativeForm((prev) =>
                              prev
                                ? { ...prev, middlename: e.target.value }
                                : prev,
                            )
                          }
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Last name</label>
                      <input
                        value={representativeForm.lastname}
                        onChange={(e) =>
                          setRepresentativeForm((prev) =>
                            prev
                              ? { ...prev, lastname: e.target.value }
                              : prev,
                          )
                        }
                        className={fieldClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Relationship</label>
                        <input
                          value={representativeForm.relationship}
                          onChange={(e) =>
                            setRepresentativeForm((prev) =>
                              prev
                                ? { ...prev, relationship: e.target.value }
                                : prev,
                            )
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Contact number</label>
                        <input
                          value={representativeForm.contactnumber}
                          onChange={(e) =>
                            setRepresentativeForm((prev) =>
                              prev
                                ? { ...prev, contactnumber: e.target.value }
                                : prev,
                            )
                          }
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Address</label>
                      <textarea
                        rows={2}
                        value={representativeForm.address}
                        onChange={(e) =>
                          setRepresentativeForm((prev) =>
                            prev
                              ? { ...prev, address: e.target.value }
                              : prev,
                          )
                        }
                        className={`${fieldClass} resize-y`}
                      />
                    </div>

                    <p className="text-[11px] text-gray-400">
                      Editing representatives isn&apos;t available yet — there&apos;s
                      no save endpoint for it. Changes here won&apos;t persist.
                    </p>
                    <button
                      type="button"
                      disabled
                      title="Not available yet"
                      className="flex items-center gap-1.5 text-sm bg-gray-200 text-gray-500 rounded-md px-3 py-1.5 cursor-not-allowed"
                    >
                      Save changes
                    </button>
                  </>
                )}
              </section>

              <DocumentsSection
                caseid={caseid}
                documents={documents}
                onUploaded={(doc) =>
                  setDocuments((prev) => [doc, ...prev])
                }
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
