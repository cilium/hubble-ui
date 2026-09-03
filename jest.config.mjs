export default {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/*.(spec|test).(j|t)s?(x)',
    '<rootDir>/src/**/__tests__/**/*.(j|t)s?(x)',
  ],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '\\.(png|jpg|gif|ttf|woff|woff2)$': '<rootDir>/scripts/assets-transformer.js',
    '\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '\\.svg$': '<rootDir>/scripts/svg-mock.js',
    '^~backend/(.*)$': '<rootDir>/backend/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  modulePaths: ['<rootDir>/src'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['./scripts/jest.setup.js'],
};
