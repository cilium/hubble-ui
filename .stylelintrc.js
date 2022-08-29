module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-css-modules'],
  plugins: ['stylelint-scss'],
  rules: {
    'string-quotes': 'single',
    'value-list-comma-newline-after': null,
    'declaration-colon-newline-after': null,
    'declaration-empty-line-before': null,
    'no-missing-end-of-source-newline': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'at-rule-no-unknown': null,
    'at-rule-empty-line-before': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
  },
};
