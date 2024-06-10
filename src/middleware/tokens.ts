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
import { accessTokenCookieOptions, cookieOptions, refreshTokenCookieOptions } from './cookieOptions'
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

export const generateResetPasswordToken = async() => {
  const resetToken = crypto.randomBytes(20).toString('hex')
  const expirationDate = new Date()

  expirationDate.setHours(expirationDate.getHours() + 24) // Expires in 24h

  return {
    reset_password_token: await argon2.hash(resetToken),
    reset_password_token_expires_at: expirationDate
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

export const handleLoginTokens = async(userId: number, req: any, res: any): Promise<Partial<IUserToken> | undefined> => {
  const accessToken = generateToken({ userId, expiresIn: '1h' }) 
  const refreshToken = generateToken({ userId, expiresIn: '1d' }) // Stay logged-in, to obtain new access tokens once expired
  
  try {
    const existingTokens = await UserToken.readByUserId(userId)

    if (existingTokens) {

      if (existingTokens.access_token_expires_at > new Date(Date.now())) {        
        return { 
          access_token: existingTokens.access_token, 
          refresh_token: existingTokens.refresh_token
        }

      } else {
        const tokens = await handleTokenRefresh(userId, req, res)
        
        return {
          access_token: tokens?.access_token,
          refresh_token: tokens?.refresh_token
        }
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
      access_token: tokens.access_token, 
      refresh_token: tokens.refresh_token 
    }
  } catch (err) {
    InternalServerError("login", "user", res, err)
    return undefined
  }
}

export const handleTokenRefresh = async(userId: number, req: any, res: any) => {
  const refreshToken = req.signedCookies.refreshToken

  if (!refreshToken) {
    return UnauthorizedRequestError("refresh token", res);
  }

  try {
    const userToken = await UserToken.readByRefreshToken(refreshToken);

    if (!userToken) {
      return UnauthorizedRequestError("refresh token", res);
    }

    // Generate a new access_token if the refresh_token has not already expired
    if (userToken.refresh_token_expires_at > new Date(Date.now())) {

      const updatedTokens = {
        access_token: generateToken({ userId: userToken.user_id, expiresIn: '1h' }),
        access_token_expires_at: new Date(Date.now() + accessTokenCookieOptions.maxAge),
        refresh_token_expires_at: new Date(Date.now() + refreshTokenCookieOptions.maxAge)
      }
        
      const response = await UserToken.update({ 
        user_id: userId, 
        payload: updatedTokens
      })

      !response && InternalServerError("update", "user token", res)
    
      return { 
        access_token: updatedTokens.access_token,
        refresh_token: refreshToken
      }
    } else {
      res.redirect('/login')
      return undefined
    }

  } catch (err) {
    InternalServerError("refresh", "token", res, err);
  }
};

export const tokenStorage = {
  setTokens: ({ res, access_token, refresh_token }: { 
    res: any, 
    access_token: string, 
    refresh_token: string 
  }) => {
    res.cookie('accessToken', access_token, accessTokenCookieOptions);
    res.cookie('refreshToken', refresh_token, refreshTokenCookieOptions)
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