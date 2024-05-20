# MySpine Node.js

## Scripts

### - Initial Configuration

  Run scripts `yarn && yarn build`

### - Development Phase

  #### Run `yarn build` when
  - Changes or see changes in tsconfig.json / webpack.config.js
  - Deploy to a production enviro

  #### Run `yarn` when
  - Changes or see changes in Package.json

  #### Run `yarn audit` and|or `yarn outdated` whenREA
  - Whenever you want to check dependency vulnerabilities && integrity respectively

  #### Run `yarn cache clean` when 
  - Whenever you want to clear local packages cache

## Framework & Language**
1. **Express.js** : Flexible and performant web API framework
2. **TypeScript** : Static+dynamic typed language, compiled to JavaScript
3. **Jest**       : Straightforward JavaScript test framework

## Dependencies
For development and production stages

1. **Knex.js** : SQL Query Builder
2. **SQLite** : Lightweight transactional relational database
3. **SQLite3** : Lightweight library for interactive SQLite in terminal & command prompt
4. **argon2**: Award winning cryptographic, key derivation function algorithm for protection against password cracking
5. **better-sqlite3-session-store** : Session-store for express-session in SQLite DB
6. **cookie-parser** : Middleware for parsing and managing cookies / signed cookies
7. **cors** : Safety middleware for Browser<>Server's Cross-Origin Resource Sharing
8. **crypto** : Cryptographic functionalities including OpenSSL hash, HMAC, cipher, decipher, sign and verify
9. **dotenv** : Environment loading module 
10. **express-rate-limit** : Brute-force rate limitor for Express.js routes
11. **express-session** : Session management for Express.js
12. **helmet** : Secure HTTP response headers against known CSRF attacks and other known vulnerabilities
13. **http-graceful-shutdown** : Graceful http servers termination logic
14. **jsonwebtoken** : JWT Token generation + verification with symmetric/asymmetric signatures
15. **nodemon** : A daemon that automatically watches, restarts and executes the application (See nodemon.json)
16. **uuid** : Universally Unique Identifier, 128-bit presented as 32-char hexadecimal string

## Other devDependencies
For development stage

1. **Prettier** : Opinionated formatter for code consistency and style
2. **eslint** : Guidelines for code convention and style
3. **eslint-plugin-prettier** : Prettier as a linter rule
4. **eslint-config-prettier** : Prettier without linter rule conflicts
5. **supertest** : Node.js HTTP requests-responses testing libary
6. **ts-jest** : Typescript processor with source map support for Jest
7. **babel-jest** : JavaScript Transformer for Jest using Babel