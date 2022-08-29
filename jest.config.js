module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/?(*.)(spec|test).(j|t)s?(x)',
    '<rootDir>/src/**/__tests__/**/*.(j|t)s?(x)',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
      isolatedModules: true,
      babelConfig: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
      },
    },
  },
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '\\.(png|jpg|gif|ttf|woff|woff2)$':
      '<rootDir>/scripts/assets-transformer.js',
    '\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '\\.svg$': '<rootDir>/scripts/svg-mock.js',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^~backend/(.*)$': '<rootDir>/backend/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest/legacy',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['./scripts/jest.setup.js'],
};
