module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-css-modules',
    'stylelint-config-prettier-scss',
  ],
  plugins: ['stylelint-scss'],
  rules: {
    'declaration-empty-line-before': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'at-rule-no-unknown': null,
    'at-rule-empty-line-before': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
  },
};
