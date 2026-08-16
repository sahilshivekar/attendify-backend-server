export default {
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  testMatch: [
    '**/src/test/**/*.test.js',
    '**/src/modules/**/*.test.js'
  ]
};
