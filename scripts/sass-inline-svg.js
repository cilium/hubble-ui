/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const inliner = require('sass-inline-svg');
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = {
  'svg-icon': inliner(path.resolve(__dirname, '../src/icons/blueprint'), {
    optimize: true,
    encodingFormat: 'uri',
  }),
};
