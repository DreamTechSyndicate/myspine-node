import knex from 'knex'
import knexConfig from '../../knexfile'
import { SessionData } from '../utils/types/express-session'

const SESSIONS_TABLE = 'sessions'
const db = knex(knexConfig)

// export interface ISession {
//   sid: string
// }

export class Session {
  static async readBySessionId(sessionId: string): Promise<SessionData> {
    return await db(SESSIONS_TABLE)
      .where('id', '=', sessionId)
      .first<SessionData, Pick<SessionData, "id">>()
  }
}