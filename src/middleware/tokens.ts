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

export const generateCSPRNG = () => {
  const array = new Uint32Array(4)
  crypto.getRandomValues(array)

  return Array.from(array).map(x => x.toString(16).padStart(8, '0')).join('');
} 

export const generateResetPasswordToken = () => {
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);

  const token = generateCSPRNG()
  const expiresAt = new Date(Date.now() + 3600000).toISOString() // expires in 1 hour

  return {
    reset_password_token: token,
    reset_password_token_expires_at: expiresAt
  }
}

const generateNewAccessToken = async(user_id: number, existingTokens: Partial<IUserToken>, res: any) => {
  const newAccessToken = generateToken({ userId: user_id, expiresIn: '1h' })
  const newAccessTokenExpiresAt = new Date(Date.now() + accessTokenCookieOptions.maxAge).toISOString()

  const updated = await UserToken.update({
    user_id,
    payload: {
      access_token: newAccessToken,
      access_token_expires_at: newAccessTokenExpiresAt
    }
  })
  
  return !updated ? 
    InternalServerError("update", "access token", res) : {
    access_token: updated.access_token,
    refresh_token: existingTokens.refresh_token
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
    const exemptedPaths = [
      '/login',
      '/customers/create',
      '/auth/dropbox',
      '/auth/dropbox/callback',
      '/customers/dropbox/upload'
    ]

    if (exemptedPaths.includes(req.path)) {
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

export const handleLoginTokens = async(user_id: number, res: any): Promise<Partial<IUserToken> | undefined | void> => {
  try {    
    const existingTokens = await UserToken.readByUserId(user_id)
    const generatedTokens = {
      access_token: generateToken({ userId: user_id }),
      refresh_token: generateToken({ userId: user_id, expiresIn: '1d' }),
      access_token_expires_at: new Date(Date.now() + accessTokenCookieOptions.maxAge).toISOString(),
      refresh_token_expires_at: new Date(Date.now() + refreshTokenCookieOptions.maxAge).toISOString()
    }

    if (!existingTokens) {
      const created = await UserToken.create({
        user_id,
        ...generatedTokens
      })
      
      return !created ? 
        InternalServerError("create", "login tokens", res) : {
          access_token: created.access_token,
          refresh_token: created.refresh_token
        }
    }
    
    if (existingTokens) {
      const {
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at
      } = existingTokens

      if (!refresh_token) {
        const updated = await UserToken.update({
          user_id,
          payload: generatedTokens
        })
        
        return !updated ? 
        InternalServerError("update", "login token", res) : {
          access_token: updated.access_token,
          refresh_token: updated.refresh_token
        }
      }
  
      const isAccessTokenExpired = new Date(access_token_expires_at) < new Date(Date.now())
      const isRefreshTokenExpired = new Date(refresh_token_expires_at) < new Date(Date.now())
  
      if (isAccessTokenExpired) { 
        return isRefreshTokenExpired
          ? UnauthorizedRequestError("refresh token", res)
          : await generateNewAccessToken(user_id, existingTokens, res)
      } else {
        return {
          access_token: existingTokens.access_token,
          refresh_token: existingTokens.refresh_token
        }
      }
    }
  } catch (err) {
    InternalServerError("login", "user", res, err)
    return undefined
  }
}

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

export const handleLogoutTokens = async (user_id: number, req: any, res: any) => {
  try {
    const userToken = await UserToken.readByUserId(user_id)

    if (!userToken) {
      UnauthorizedRequestError("refresh token", res)
    } else {
      const isSecure = process.env.NODE_ENV === 'development' ? false : true
      const config = { 
        path: '/', 
        httpOnly: true,
        secure: isSecure,
        signed: true,
        sameSite: false  
      }

      res.clearCookie('connect.sid', config);
      res.clearCookie('refresh_token', config);
      res.clearCookie('access_token', config);

      req?.session?.destroy()

      userToken && await UserToken.update({
        user_id, 
        payload: {
          refresh_token: '',
          access_token: ''
        } 
      })
    }
  } catch (err) {
    InternalServerError("delete", "user token", res, err)
  }
}