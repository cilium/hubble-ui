module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(j|t)s?(x)',
    '<rootDir>/src/**/?(*.)(spec|test).(j|t)s?(x)',
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    '\\.(png|jpg|gif|ttf|woff|woff2)$':
      '<rootDir>/scripts/assets-transformer.js',
    '\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '\\.svg$': '<rootDir>/scripts/svg-mock.js',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^~backend/(.*)$': '<rootDir>/backend/$1',
  },
  moduleDirectories: ['node_modules', 'utils'],
  setupFilesAfterEnv: ['./scripts/jest.setup.js'],
};
