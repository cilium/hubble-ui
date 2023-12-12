export const getCurrentHistoryState = (): any | undefined => {
  // NOTE: This might be the case when you run this code with in-memory routing enabled
  if (typeof window === 'undefined') return undefined;
  if (window.history?.state == null) return undefined;

  // NOTE: `window.history.state` prop gives an object where user defined state
  // is placed inside `usr` prop.
  return window.history.state;
};
