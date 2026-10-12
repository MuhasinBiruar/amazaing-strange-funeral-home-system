'use client';

/** Delivery record displayed in the casket-specific history panel. */
export interface DeliveryHistoryType {
  deliveryid: number;
  deliverydate: string | unknown;
  quantityreceived: number | string;
  totalamountpaid: number | string;
  caskettype: string;
}
