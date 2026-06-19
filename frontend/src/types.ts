export type User = {
  id: number;
  login: string;
  email: string;
  full_name: string;
  role: 'admin' | 'viewer';
  is_active: boolean;
};

export type Kpi = {
  key: string;
  label: string;
  nps: number;
  n: number;
  promoter_share: number;
  neutral_share: number;
  detractor_share: number;
  plan_target: number;
  plan_fact: number;
  plan_completion: number;
  is_small_base: boolean;
};

export type DashboardResponse = {
  title: string;
  breadcrumbs: string[];
  wave: string;
  primary: Kpi;
  comparisons: Kpi[];
  trend: Array<{ period: string; values: Record<string, number> }>;
  structure: Array<{
    key: string;
    label: string;
    rows: Array<{ period: string; promoters: number; neutrals: number; detractors: number }>;
  }>;
};

export type Wave = { code: string; label: string };

export type RegionMetric = {
  region: string;
  macroregion: string;
  n: number;
  nps: number;
  promoters: number;
  neutrals: number;
  detractors: number;
  promoter_share: number;
  neutral_share: number;
  detractor_share: number;
};

export type RegionsDashboardResponse = {
  title: string;
  wave: string;
  segment: string | null;
  product: string | null;
  settlement_type: string | null;
  sample_total: number;
  regions: RegionMetric[];
  structure: Array<{ region: string; promoters: number; neutrals: number; detractors: number }>;
  trend: Array<{ period: string; values: Record<string, number> }>;
};
