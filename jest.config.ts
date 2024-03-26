import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
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
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>/src' }),
  },
  modulePaths: [tsconfig.compilerOptions.baseUrl],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        useESM: true,
        isolatedModules: true,
        babelConfig: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['./scripts/jest.setup.js'],
};

export default config;
