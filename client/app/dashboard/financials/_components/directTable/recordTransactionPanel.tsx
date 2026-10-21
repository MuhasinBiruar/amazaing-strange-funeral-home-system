'use client';

import { useState } from 'react';
import { createDirectTransaction } from '@/services/financialService';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import { formatCurrency } from '@/utils/format';
import {
  createTransactionQuerySchema,
  paymentCategoryEnum,
  paymentMethodEnum,
} from 'shared';

/** `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time. */
function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function RecordTransactionPanel({
  caseId,
  deceasedName,
  totalAmount,
  totalPaid,
  onClose,
  onSuccess,
}: {
  caseId: number;
  deceasedName: string;
  totalAmount: number | null;
  totalPaid: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const { infoModal, showInfo } = useInfoModal();

  const [amount, setAmount] = useState('');
  const [paymentdatetime, setPaymentdatetime] = useState<string>(
    toDateInputValue(new Date()),
  );
  const [paymentmethod, setPaymentmethod] = useState<string>(
    paymentMethodEnum.options[0],
  );
  const [paymentcategory, setPaymentcategory] = useState<string>(
    paymentCategoryEnum.options[0],
  );

  // Official receipt (optional: only sent when an OR number is typed)
  const [ornumber, setOrnumber] = useState('');
  const [pwdDiscount, setPwdDiscount] = useState('');
  const [discountId, setDiscountId] = useState('');
  const [withholdingTax, setWithholdingTax] = useState('');
  const [tin, setTin] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live summary
  const total = totalAmount ?? 0;
  const paymentNow = Number(amount) || 0;
  const isRefund = paymentcategory === 'Refund';
  const discount = Number(pwdDiscount) || 0;
  const totalDue = Math.max(total - discount, 0);
  const paidAfter = totalPaid + (isRefund ? -paymentNow : paymentNow);
  const amountLeft = totalDue - paidAfter;
  const isSettled = Math.round(amountLeft * 100) <= 0;
  const hasReceipt = ornumber.trim() !== '';

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasReceipt && discount > 0) {
      await showInfo({
        title: 'OR Number Needed',
        message:
          'The discount is stored on the official receipt. Enter the OR number to apply it.',
        severity: 'error',
      });
      return;
    }

    if (hasReceipt && (isRefund || !isSettled)) {
      await showInfo({
        title: 'Cannot Issue Official Receipt',
        message:
          'An official receipt can only be issued with a payment that fully settles the balance.',
        severity: 'error',
      });
      return;
    }

    // Money fields are numeric *strings* in the shared schema, so they are
    // not run through parseFloat.
    const result = createTransactionQuerySchema.safeParse({
      amount: amount.trim(),
      paymentdatetime,
      paymentmethod,
      paymentcategory,
      receipt: hasReceipt
        ? {
            ornumber: ornumber.trim(),
            tin,
            withholding_tax: withholdingTax.trim(),
            discount_id: discountId,
            pwd_discount: pwdDiscount.trim(),
          }
        : undefined,
    });

    if (!result.success) {
      await showInfo({
        title: 'Invalid Payment',
        message: result.error.issues[0].message,
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createDirectTransaction(caseId, result.data);
    } catch (err) {
      setIsSubmitting(false);

      await showInfo({
        title: 'Could Not Save Payment',
        message:
          err instanceof Error ? err.message : 'Failed to record transaction.',
        severity: 'error',
      });
      return;
    }

    // The parent only refreshes its table in onSuccess, so close with the
    // slide-out transition ourselves.
    onSuccess();
    requestClose();
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Record payment"
      badge={`CASE #${caseId}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title="Record Payment"
      subtitle={deceasedName}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="payment-amount" className={labelClass}>
              Amount (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₱
              </span>
              <input
                id="payment-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} pl-7`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment-date" className={labelClass}>
              Payment date
            </label>
            <input
              id="payment-date"
              type="date"
              required
              value={paymentdatetime}
              onChange={(e) => setPaymentdatetime(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="payment-category" className={labelClass}>
                Category
              </label>
              <select
                id="payment-category"
                value={paymentcategory}
                onChange={(e) => setPaymentcategory(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                {paymentCategoryEnum.options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payment-method" className={labelClass}>
                Method
              </label>
              <select
                id="payment-method"
                value={paymentmethod}
                onChange={(e) => setPaymentmethod(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                {paymentMethodEnum.options.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="rounded-lg border border-gray-200 p-3 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Official receipt (optional)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="or-number" className={labelClass}>
                  OR number
                </label>
                <input
                  id="or-number"
                  value={ornumber}
                  onChange={(e) => setOrnumber(e.target.value)}
                  placeholder="e.g. 0346"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="or-date" className={labelClass}>
                  Issue date
                </label>
                <input
                  id="or-date"
                  type="date"
                  value={toDateInputValue(new Date())}
                  disabled
                  className={`${fieldClass} disabled:bg-gray-50 disabled:text-gray-500`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="or-amount" className={labelClass}>
                OR amount
              </label>
              <input
                id="or-amount"
                value={formatCurrency(Math.ceil(paymentNow))}
                disabled
                className={`${fieldClass} disabled:bg-gray-50 disabled:text-gray-500`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="or-discount" className={labelClass}>
                  SC/PWD discount (PHP)
                </label>
                <input
                  id="or-discount"
                  type="number"
                  min="0"
                  step="1"
                  value={pwdDiscount}
                  onChange={(e) => setPwdDiscount(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="or-discount-id" className={labelClass}>
                  SC/PWD ID no.
                </label>
                <input
                  id="or-discount-id"
                  value={discountId}
                  onChange={(e) => setDiscountId(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="or-withholding" className={labelClass}>
                  Withholding tax (PHP)
                </label>
                <input
                  id="or-withholding"
                  type="number"
                  min="0"
                  step="1"
                  value={withholdingTax}
                  onChange={(e) => setWithholdingTax(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="or-tin" className={labelClass}>
                  TIN
                </label>
                <input
                  id="or-tin"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Total amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SC/PWD discount</span>
              <span>− {formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total due</span>
              <span>{formatCurrency(totalDue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid so far</span>
              <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">This payment</span>
              <span>
                {isRefund ? '− ' : ''}
                {formatCurrency(paymentNow)}
              </span>
            </div>
            <div
              className={`flex justify-between border-t border-gray-200 pt-1 font-semibold ${
                amountLeft < 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              <span>Amount left</span>
              <span>{formatCurrency(amountLeft)}</span>
            </div>
          </section>
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              label="Save payment"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>

      {infoModal}
    </SidePanel>
  );
}
