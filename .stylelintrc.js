module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-scss'],
  rules: {
    'string-quotes': 'double',
    'value-list-comma-newline-after': null,
    'declaration-colon-newline-after': null,
    'declaration-empty-line-before': null,
    'no-missing-end-of-source-newline': null,
    'at-rule-no-unknown': null,
    'at-rule-empty-line-before': null,
    'no-descending-specificity': null,
  },
};
