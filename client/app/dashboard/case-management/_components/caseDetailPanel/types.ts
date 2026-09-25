import type { DeceasedRecord, Representative } from 'shared';

/** `<input type="date">` wants `yyyy-mm-dd`; the API gives back a Date (or null). */
export function toDateInputValue(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export interface DeceasedForm {
  firstname: string;
  middlename: string;
  lastname: string;
  causeofdeath: string;
  typeofdeath: string;
  physicaldescription: string;
  servicestatus: DeceasedRecord['servicestatus'];
  plantype: DeceasedRecord['plantype'];
  dateofdeath: string;
  hasmaturedlifeplan: boolean;
}

export function toDeceasedForm(record: DeceasedRecord): DeceasedForm {
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

export interface RepresentativeForm {
  firstname: string;
  middlename: string;
  lastname: string;
  relationship: string;
  contactnumber: string;
  address: string;
}

export function toRepresentativeForm(rep: Representative): RepresentativeForm {
  return {
    firstname: rep.firstname,
    middlename: rep.middlename ?? '',
    lastname: rep.lastname,
    relationship: rep.relationship ?? '',
    contactnumber: rep.contactnumber,
    address: rep.address ?? '',
  };
}
