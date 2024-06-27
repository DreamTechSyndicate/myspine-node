import cors from 'cors'
import cookieParser from 'cookie-parser'
import express, { Application } from 'express'
// import fs from 'fs'
import helmet from 'helmet'
// import https from 'https'
import http from 'http'
import knex from "knex"
import knexConfig from "../knexfile"
import rateLimit from 'express-rate-limit'
import routes from './routes'
import session from 'express-session'
import shutdown from 'http-graceful-shutdown'
import { 
  corsOptions,
  helmetOptions, 
  limiterOptions,
  sessionOptions,
  requireJwt
} from './middleware'

export const app: Application = express()

// TODO: put back for prod
// const credentials = {
//   key: fs.readFileSync(process.env.PRIVATE_KEY_PATH 
//     || './certs/local-key.pem', 'utf8'),
//   cert: fs.readFileSync(process.env.CERTIFICATE_PATH 
//     || './certs/local-cert.pem', 'utf8')
// }

const db = knex(knexConfig)
const dev_env = 'development'
const env = process.env.NODE_ENV
const port = process.env.PORT

app.use(express.json())
app.use(cookieParser(process.env.SESSION_SECRET!))
app.use(cors(corsOptions))
app.use( session(sessionOptions))

routes.forEach(({ path, router }) => {
  app.use(path, router)
})

app.use("/", (
  rateLimit(limiterOptions),
  requireJwt,
  helmet(helmetOptions)
))

// TODO: put back for prod
// export const server = https.createServer(credentials, app);
export const server = http.createServer(app)

const teardown = async() => {
  const tables = ['users', 'user_tokens', 'patients']
  try {
    console.log('Starting teardown')
    if (env === dev_env) {
      for (const table of tables) {
        await db(table).truncate()
      }
    }
    await db.destroy()
    console.log('Database connection closed')
  } catch (err) {
    console.error('Error tearing down database connection:', err)
  }
}

server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}!`)
})

shutdown(server, {
  signals: 'SIGINT SIGTERM',
  timeout: 10000,
  onShutdown: teardown,
})