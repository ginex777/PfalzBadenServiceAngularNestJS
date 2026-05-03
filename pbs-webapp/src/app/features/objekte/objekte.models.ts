import type { ObjectStatus } from '@pbs/types';

export type ObjectStatusFilter = 'ALL' | ObjectStatus;

export interface ObjectFormData {
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  note: string;
  customerId: string;
  status: ObjectStatus;
}

export const EMPTY_OBJECT_FORM: ObjectFormData = {
  name: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  note: '',
  customerId: '',
  status: 'AKTIV',
};
