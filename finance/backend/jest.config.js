module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/src/tests/**/*.spec.js'
  ],
  
  // Ignorar arquivos
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Setup antes dos testes
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js'
  ],
  
  // Configuração de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Arquivos para análise de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/config/**',
    '!src/server.js',
    '!src/app.js'
  ],
  
  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Configurações de cache
  cacheDirectory: '.jest-cache'
};