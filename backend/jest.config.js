module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/rag/**'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true
};
