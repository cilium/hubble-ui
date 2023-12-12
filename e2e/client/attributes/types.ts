// NOTE: The idea is that we pass any test attributes here and this functions
// can decide whether we need to actually set `data-*` attributes
export type AttrsFn = (obj: any) => any;
export type SelectorFn = (sel: string) => any;
