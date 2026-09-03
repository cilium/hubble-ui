// Allow jest import static assets

const path = require('path');

module.exports = {
  process(_, filename) {
    return 'module.exports = ' + JSON.stringify(path.basename(filename)) + ';';
  },
};
