import { toDateInputValue } from '@/utils/toDateInputValue';
import type { DeceasedRecord, Representative } from 'shared';

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
  hasadvanceddecomposition: boolean;
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
    hasadvanceddecomposition: record.hasadvanceddecomposition,
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
