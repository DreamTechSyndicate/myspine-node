import knex from "knex"
import knexConfig from '../../knexfile'
import { JwtPayload } from "src/utils/types/generic"

export interface IUserToken {
  id: number,
  user_id: number,
  access_token: string,
  refresh_token: string,
  reset_password_token?: string,
  access_token_expires_at: Date,
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
      refresh_token,
      reset_password_token
    } = tokenBody

    let tokens;

    if (access_token && refresh_token) {
      [tokens] = await db(USER_TOKENS_TABLE)
      .insert<IUserToken>({
        user_id,
        access_token,
        refresh_token,
        access_token_expires_at: new Date(Date.now() + (
          Number(process.env.ACCESS_TOKEN_EXPIRES_AT) || 15 * 60 * 1000
        ))
      })
      .returning('*')
    }

    if (reset_password_token) {
      [tokens] = await db(USER_TOKENS_TABLE)
      .insert<IUserToken>({
        user_id,
        reset_password_token,
      })
      .returning('*')
    }

    return tokens
  }

  static async readByToken(decoded: JwtPayload): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('refresh_token', '=', decoded)
      .first<IUserToken>()
  }

  static async readByUserId(userId: number): Promise<IUserToken> {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', userId)
      .first<IUserToken, Pick<IUserToken, "user_id">>()
  }

  static async updateResetToken({ userId, resetToken}: { userId: number, resetToken: string }): Promise<IUserToken> {
    await db(USER_TOKENS_TABLE)
      .where('user_id', '=', userId)
      .update<Partial<IUserToken>>({
        reset_token: resetToken
      })

    const updatedUserToken = await UserToken.readByUserId(userId)
    return updatedUserToken
  }

  static async delete(userId: number) {
    return await db(USER_TOKENS_TABLE)
      .where('user_id', '=', userId)
      .first<IUserToken, Pick<IUserToken, 'id'>>()
      .delete()
  }
}