export const randomBase36Hash = (): string => {
  return Math.random().toString(36).slice(2);
};
