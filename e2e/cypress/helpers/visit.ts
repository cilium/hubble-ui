export type Opts = {
  preset?: Preset;
};

export enum Preset {
  TenantJobs = 'tenant-jobs',
  NSListCheck = 'ns-list-check',
}

export const createQueryParams = (opts?: Opts) => {
  if (opts == null) return {};
  const e2e = createInnerParamString(opts).trim();

  return { e2e };
};

const createInnerParamString = (opts?: Opts): string => {
  if (opts == null) return '';
  let e2e = !opts?.preset ? '' : `preset=${opts.preset}`;

  return e2e;
};
