import { Session } from 'express-session'
declare module 'express-session';

export interface SessionData extends Session {
  userId?: number
  email?: string
}