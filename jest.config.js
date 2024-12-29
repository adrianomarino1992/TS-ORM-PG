/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',  
  testPathIgnorePatterns : 
  [
    "__tests__/classes", 
  ] 
};

/* tests order
connection
schema
...others
*/