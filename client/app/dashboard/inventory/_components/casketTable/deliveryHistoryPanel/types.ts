'use client';

export interface DeliveryHistoryType {
  deliveryid: number;
  deliverydate: string | unknown;
  quantityreceived: number | string;
  totalamountpaid: number | string;
  caskettype: string;
}
