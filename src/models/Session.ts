import knex from 'knex'
import knexConfig from '../../knexfile'

const SESSIONS_TABLE = 'sessions'
const db = knex(knexConfig)

export interface ISession {
  id: Number
  sid: string
  sess: string,
  expire: Number // Timestamp
}

export class Session {
  static async readBySessionId(sessionId: string): Promise<ISession> {
    return await db(SESSIONS_TABLE)
      .where('sid', '=', sessionId)
      .first<ISession, Pick<ISession, "sid">>()
  }
}