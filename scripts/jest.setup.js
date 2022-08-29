import { randomFillSync } from 'crypto';

window.crypto = {
  getRandomValues(buffer) {
    return randomFillSync(buffer);
  },
};
