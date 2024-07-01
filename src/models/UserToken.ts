import knex from 'knex'
import knexConfig from '../../knexfile'
import { JwtPayload } from "src/utils/types/generic"

export interface IUserToken {
  id: number,
  user_id: number,
  access_token: string,
  refresh_token: string,
  reset_password_token?: string,
  access_token_expires_at: string,
  refresh_token_expires_at: string,
  reset_password_token_expires_at?: string,
  created_at: string,
  updated_at: string
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
      refresh_token,
      reset_password_token,
      access_token_expires_at,
      refresh_token_expires_at,
      reset_password_token_expires_at
    } = tokenBody

    const [tokens] = await db(USER_TOKENS_TABLE)
    .insert<IUserToken>({
      user_id,
      access_token,
      refresh_token,
      reset_password_token,
      access_token_expires_at,
      refresh_token_expires_at,
      reset_password_token_expires_at
    })
    .returning('*')

    return tokens
  }

  static async readByRefreshToken(decoded: JwtPayload): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('refresh_token', '=', decoded)
      .first<IUserToken>()
  }

  static async readByUserId(user_id: number): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', user_id)
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
    reset_password_token_expires_at?: string, 
  }): Promise<IUserToken> {
    await db(USER_TOKENS_TABLE)
      .where('user_id', '=', user_id)
      .update<Partial<IUserToken>>({
        access_token: '',
        refresh_token: '',
        reset_password_token: reset_password_token || '',
        reset_password_token_expires_at: reset_password_token_expires_at || ''
      })

    const updatedUserToken = await UserToken.readByUserId(user_id)
    return updatedUserToken
  }

  static async delete(user_id: number) {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', user_id)
      .first<IUserToken, Pick<IUserToken, 'user_id'>>()
      .delete()
  }
}