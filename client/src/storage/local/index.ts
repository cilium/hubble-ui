const LAST_NAMESPACE_KEY = '@hubble-ui/namespace';

export const getLastNamespace = (): string | null => {
  return localStorage.getItem(LAST_NAMESPACE_KEY);
};

export const saveLastNamespace = (ns: string) => {
  localStorage.setItem(LAST_NAMESPACE_KEY, ns);
};
