'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, Plus } from 'lucide-react';
import type { Case } from 'shared';
import {
  createLifeplan,
  createLifeplanCompany,
  getLifeplanCompanies,
  type LifeplanCompany,
} from '@/services/financialService';
import { fieldClass, labelClass } from '../../fieldStyles';
import CaseSearchSelect from '../../caseSearchSelect';

const PANEL_TRANSITION_MS = 300 as const;

export default function CreateLifeplanPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [companies, setCompanies] = useState<LifeplanCompany[]>([]);
  const [companyid, setCompanyid] = useState<string>('');
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [plannumber, setPlannumber] = useState('');
  const [planholdername, setPlanholdername] = useState('');
  const [minimumthreshold, setMinimumthreshold] = useState('');
  const [totalamount, setTotalamount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    getLifeplanCompanies({
      page: 1,
      limit: 100,
      sortBy: 'companyname',
      sortOrder: 'asc',
    })
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  async function handleAddCompany() {
    if (!newCompanyName.trim()) return;
    setIsSavingCompany(true);
    try {
      const created = await createLifeplanCompany({
        companyname: newCompanyName,
        contactinfo: newCompanyContact || null,
      });
      setCompanies((prev) => [...prev, created.data]);
      setCompanyid(String(created.data.companyid));
      setIsAddingCompany(false);
      setNewCompanyName('');
      setNewCompanyContact('');
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Could not add company.',
      );
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) {
      setErrorMsg('Pick a case first.');
      return;
    }
    if (!companyid) {
      setErrorMsg('Pick or add a company.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createLifeplan({
        caseid: selectedCase.caseid,
        plannumber,
        planholdername,
        minimumthreshold: Number(minimumthreshold),
        totalamount: Number(totalamount),
        companyid: Number(companyid),
      });
      onCreated();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Could not create the life plan. Try again.',
      );
      setIsSubmitting(false);
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
        aria-label="New life plan"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-md bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-serif font-bold text-gray-900">
            New life plan
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <CaseSearchSelect selected={selectedCase} onSelect={setSelectedCase} />

            <div>
              <label htmlFor="plannumber" className={labelClass}>
                Plan number
              </label>
              <input
                id="plannumber"
                required
                value={plannumber}
                onChange={(e) => setPlannumber(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="planholdername" className={labelClass}>
                Plan holder name
              </label>
              <input
                id="planholdername"
                required
                value={planholdername}
                onChange={(e) => setPlanholdername(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="minimumthreshold" className={labelClass}>
                  Min. threshold (PHP)
                </label>
                <input
                  id="minimumthreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={minimumthreshold}
                  onChange={(e) => setMinimumthreshold(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="totalamount" className={labelClass}>
                  Total amount (PHP)
                </label>
                <input
                  id="totalamount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={totalamount}
                  onChange={(e) => setTotalamount(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="companyid" className={labelClass}>
                  Company
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCompany((v) => !v)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline cursor-pointer"
                >
                  <Plus size={12} />
                  New company
                </button>
              </div>

              {!isAddingCompany && (
                <select
                  id="companyid"
                  value={companyid}
                  onChange={(e) => setCompanyid(e.target.value)}
                  required
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">Select a company...</option>
                  {companies.map((c) => (
                    <option key={c.companyid} value={c.companyid}>
                      {c.companyname}
                    </option>
                  ))}
                </select>
              )}

              {isAddingCompany && (
                <div className="space-y-2 border border-gray-200 rounded-md p-3">
                  <input
                    placeholder="Company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    placeholder="Contact info (optional)"
                    value={newCompanyContact}
                    onChange={(e) => setNewCompanyContact(e.target.value)}
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    disabled={isSavingCompany || !newCompanyName.trim()}
                    onClick={handleAddCompany}
                    className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingCompany ? 'Saving...' : 'Save company'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <footer className="px-5 py-4 border-t border-gray-200 shrink-0 space-y-3">
            {errorMsg && (
              <p role="alert" className="text-sm text-red-500">
                {errorMsg}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCase || !companyid}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create life plan'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}