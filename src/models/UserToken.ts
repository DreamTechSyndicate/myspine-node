import knex from 'knex'
import knexConfig from '../../knexfile'
import { JwtPayload } from "src/utils/types/generic"
import { IUser } from './User'

export interface IUserToken {
  id: number,
  user_id: number,
  access_token: string,
  refresh_token: string,
  reset_password_token?: string,
  access_token_expires_at: Date,
  refresh_token_expires_at: Date,
  reset_password_token_expires_at?: Date,
  created_at: Date,
  updated_at: Date
}

export interface UserTokenResponse extends IUserToken {
  email: string
}

const USER_TOKENS_TABLE = 'user_tokens'
const db = knex(knexConfig)

export class UserToken {
  static async create(tokenBody: Partial<IUserToken>): Promise<IUserToken | null> {
    const {
      user_id,
      access_token,
      refresh_token
    } = tokenBody

    let tokens;
    if (access_token && refresh_token) {
      [tokens] = await db(USER_TOKENS_TABLE)
      .insert<IUserToken>({
        user_id,
        access_token,
        refresh_token,
        access_token_expires_at: new Date(Date.now() + (
          Number(process.env.ACCESS_TOKEN_EXPIRES_AT) || 15 * 60 * 1000 // 15 minutes or 900000ms
        )),
        refresh_token_expires_at: new Date(Date.now() + (
          Number(process.env.REFRESH_TOKEN_EXPIRES_AT) || 24 * 60 * 60 * 1000 // 1 day or 864000000ms
        ))
      })
      .returning('*')
    }

    return tokens
  }

  static async readByRefreshToken(decoded: JwtPayload): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('refresh_token', '=', decoded)
      .first<IUserToken>()
  }

  static async readByUserId(userId: number): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', userId)
      .first<IUserToken, Pick<IUserToken, "user_id">>()
  }

  static async update({ user_id, payload }: { user_id: number, payload: Partial<IUserToken> }): Promise<IUserToken> {
    await db(USER_TOKENS_TABLE)
      .where('user_id', '=', user_id)
      .update<Partial<IUserToken>>(payload)

      const updatedUserToken = await UserToken.readByUserId(user_id)
      return updatedUserToken
  }

  static async updateResetToken({ user_id, reset_password_token, reset_password_token_expires_at }: { 
    user_id: number,
    reset_password_token?: string,
    reset_password_token_expires_at?: Date, 
  }): Promise<IUserToken> {
    await db(USER_TOKENS_TABLE)
      .where('user_id', '=', user_id)
      .update<Partial<IUserToken>>({
        access_token: undefined,
        refresh_token: undefined,
        reset_password_token,
        reset_password_token_expires_at
      })

    const updatedUserToken = await UserToken.readByUserId(user_id)
    return updatedUserToken
  }

  static async delete(userId: number) {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', userId)
      .first<IUserToken, Pick<IUserToken, 'user_id'>>()
      .delete()
  }
}