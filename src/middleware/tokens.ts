import crypto from 'crypto'
import fs from 'fs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { 
  InternalServerError,
  UnauthorizedRequestError 
} from '../utils/funcs/errors'
import { v4 } from 'uuid'
import { UserToken, IUserToken } from '../models'
import { JwtPayload } from 'src/utils/types/generic'
import argon2 from 'argon2'

export const privateKey = crypto.createPrivateKey({
  key: fs.readFileSync(process.env.PRIVATE_KEY_PATH 
    || './certs/local-key.pem', 'utf8'),
  format: 'pem'
})

const publicKey = crypto.createPublicKey({
  key: fs.readFileSync(process.env.PRIVATE_KEY_PATH
  || './certs/local-key.pem', 'utf-8'),
  format: 'pem'
})

export const generateToken = ({ userId, expiresIn }: { userId: number, expiresIn?: string }) => {
  const payload =  { id: v4(), userId }
  const options: SignOptions = { 
    algorithm: 'RS256', 
    expiresIn: expiresIn || '1h'
  }

  return jwt.sign(payload, privateKey, options)
}

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  return await new Promise<JwtPayload>((resolve, reject) => {
    jwt.verify(token, publicKey, (err, decoded) => {
      if (err) {
        err.name === 'JsonWebTokenError' && err.message === 'invalid signature' ?
          reject(new Error('Invalid token signature')) :
          reject(err)
      }
      resolve(decoded as JwtPayload);
    })
  })
}

export const generateResetToken = async() => {
  const resetToken = crypto.randomBytes(20).toString('hex')
  const expirationDate = new Date()

  expirationDate.setHours(expirationDate.getHours() + 24) // Expires in 24h

  return {
    reset_password_token: await argon2.hash(resetToken),
    reset_password_token_expiration_date: expirationDate
  }
}

export const requireJwt = async(req: any, res: any, next: any) => {
  try {
    const authorizationHeader = req.headers.authorization
    
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing')
    }

    const token = authorizationHeader.split(' ')[1]
    const decoded = await verifyToken(token)

    req.user = decoded
    next()
  } catch(err) {
    UnauthorizedRequestError('token', res, err)
  }
}

export const handleLoginTokens = async(userId: number, _req: any, res: any): Promise<Partial<IUserToken> | undefined> => {
  const accessToken = generateToken({ userId, expiresIn: '15m' }) 
  const refreshToken = generateToken({ userId, expiresIn: '1d' }) // Stay logged-in, to obtain new access tokens once exprired
  
  try {
    const existingTokens = await UserToken.readByUserId(userId)

    if (existingTokens && existingTokens.access_token_expires_at > new Date(Date.now())) {
      // Skip insertion if user already has valid tokens
      return { 
        access_token: existingTokens.access_token, 
        refresh_token: existingTokens.refresh_token 
      }
    }

    const tokens = await UserToken.create({
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (!tokens) {
      return undefined;
    }

    return { 
      access_token: tokens?.access_token, 
      refresh_token: tokens?.refresh_token 
    }
  } catch (err) {
    InternalServerError("login", "user", res, err)
    return undefined
  }
}

export const handleLogoutTokens = async(userId: number, res: any) => {
  try {
    const userToken = await UserToken.readByUserId(userId)

    if (!userToken) {
      UnauthorizedRequestError("refresh token", res)
    } else {
      await UserToken.delete(userId)
      res.status(204).end()
    }
  } catch (err) {
    InternalServerError("logout", "user", res, err)
  }
}