// Supplier bill shapes (GET /supplier-bills/*). The API client adds
// billView=consumption-v2 and bypasses the HTTP cache for these paths.

export interface Option { value: string; label: string }

export interface BillFilters {
  groupAdmin?: boolean;
  groupName?: string | null;
  departments?: Option[];
  resourceTypes?: Option[];
  projects?: Option[];
  creators?: Option[];
  summaryUpdating?: boolean;
}

export interface BillTotal { currency: string; consumptionTotal?: string | null; payableTotal?: string | null; pendingConsumption?: string | null }

interface BillAmounts { currency: string; consumptionTotal: string; payableTotal?: string | null; pendingConsumption?: string | null }

export interface DayRow extends BillAmounts { businessDate: string; resourceTypeName: string; resourceCount: number; entryCount: number }

export interface CreatorRow extends BillAmounts {
  id: string;
  businessDate?: string | null;
  creatorId: string;
  creatorName: string;
  creatorUsername?: string | null;
  resourceType?: string | null;
  resourceTypeName: string;
  resourceCount: number;
  entryCount: number;
}

export interface DepartmentRow extends BillAmounts {
  businessDate?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  memberCount: number;
  resourceTypeName: string;
  resourceCount: number;
  entryCount: number;
}

export interface EntryRow {
  businessDate: string;
  resourceTypeName: string;
  resourceName?: string | null;
  sourceKind: string;
  projectName: string;
  modelKey?: string | null;
  consumption: string;
  payable?: string | null;
  pending?: boolean;
  currency: string;
}

export interface BillPage<T> { items: T[]; total: number; totals?: BillTotal[]; summaryUpdating?: boolean }

export const UNASSIGNED = '__UNASSIGNED__';
