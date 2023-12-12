import _pluralize from 'pluralize';

export interface Pluralized {
  num: number;
  plural: string;
  original: string;
  be: string;
}

export const pluralize = (word: string, num: number, concat?: boolean): Pluralized => {
  return {
    num,
    plural: _pluralize(word, num, !!concat),
    original: word,
    be: num === 1 ? 'is' : 'are',
  };
};
