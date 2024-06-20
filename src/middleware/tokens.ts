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
import { 
  accessTokenCookieOptions, 
  refreshTokenCookieOptions 
} from './cookieOptions'
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

// TODO: Either remove or put back
// export const generateResetPasswordToken = async() => {
//   const resetToken = crypto.randomBytes(20).toString('hex')
//   const expirationDate = new Date()

//   expirationDate.setHours(expirationDate.getHours() + 1) // Expires in 24h

//   return {
//     reset_password_token: await argon2.hash(resetToken),
//     reset_password_token_expires_at: expirationDate
//   }
// }

export const generateResetPasswordToken = () => {
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);

  const token = Array.from(array).map(x => x.toString(16).padStart(8, '0')).join('');
  const expiresAt = new Date(Date.now() + 3600000).toISOString() // expires in 1 hour

  return {
    reset_password_token: token,
    reset_password_token_expires_at: expiresAt
  }
}

export const verifyToken = async (token: string): Promise<JwtPayload | string> => {
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

export const requireJwt = async(req: any, res: any, next: any) => {
  try {
    if (req.path === '/login' || req.path === '/patients/create') {
      next()
    } else {
      const authorizationHeader = req.headers.authorization

      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header is missing or invalid');
      }

      const token = authorizationHeader.split(' ')[1]
      const decoded = await verifyToken(token)

      req.user = decoded
      next()
    }
  } catch(err) {
    UnauthorizedRequestError('token', res, err)
  }
}

export const handleInitialTokens = async(userId: number, req: any, res: any): Promise<Partial<IUserToken> | undefined> => {
  const accessToken = generateToken({ userId, expiresIn: '1h' }) 
  const refreshToken = generateToken({ userId, expiresIn: '1d' }) // Stay logged-in, to obtain new access tokens once expired
  
  try {
    const existingTokens = await UserToken.readByUserId(userId)

    if (existingTokens) {
      if (new Date(existingTokens.access_token_expires_at) > new Date()) {        
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
      InternalServerError("create", "tokens", res)
      return;
    } else {
      return { 
        access_token: tokens.access_token, 
        refresh_token: tokens.refresh_token 
      }
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
    if (new Date(userToken.refresh_token_expires_at) > new Date()) {
      const updatedTokens = {
        access_token: generateToken({ userId: userToken.user_id, expiresIn: '1h' }),
        access_token_expires_at: new Date(Date.now() + accessTokenCookieOptions.maxAge).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + refreshTokenCookieOptions.maxAge).toISOString()
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
  setTokens: ({ 
    res, 
    token, 
    access_token, 
    refresh_token 
  }: { 
    res: any, 
    token: any,
    access_token: string, 
    refresh_token: string 
  }) => {
    res.cookie('Authorization', `Bearer ${token}`, accessTokenCookieOptions)
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