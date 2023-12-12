export type SSRError = {
  error: string;
  httpStatus: number | null;
  component?: string;
  docsLink?: string;
};
