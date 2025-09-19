/**
 * Configuração do Jest para os testes unitários
 * Define ambiente, cobertura e configurações específicas
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Diretório raiz dos testes
  rootDir: './',
  
  // Padrões de arquivos de teste
  testMatch: [
    '<rootDir>/**/*.test.js',
    '<rootDir>/**/*.spec.js'
  ],
  
  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Configuração de cobertura
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Arquivos para análise de cobertura
  collectCoverageFrom: [
    '<rootDir>/../**/*.js',
    '!<rootDir>/**',
    '!<rootDir>/../examples/**',
    '!<rootDir>/../config/**',
    '!<rootDir>/../server.js',
    '!<rootDir>/../app.js'
  ],
  
  // Limite mínimo de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup antes dos testes
  setupFilesAfterEnv: [
    '<rootDir>/setup.js'
  ],
  
  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../$1',
    '^@tests/(.*)$': '<rootDir>/$1'
  },
  
  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Configurações de timeout
  testTimeout: 10000,
  
  // Configurações de mock
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  

  
  // Configurações de relatório
  reporters: [
    'default'
  ],
  
  // Configurações de watch
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/tests/coverage/',
    '/tests/reports/'
  ],
  
  // Configurações de cache
  cacheDirectory: '<rootDir>/.jest-cache'
};