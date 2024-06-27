export const cookieOptions = {
  httpOnly: true, // Accessible via server and not client side script, may tamper with certain procedure like SSO, that is client-side access reliant
  secure: true,
  signed: true,
  secret: process.env.SESSION_SECRET!,
  // domain: 'localhost',
  // path: '/'
}

export const sessionCookieOptions = {
  ...cookieOptions,
  maxAge: Number(process.env.SESSION_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000  // Expires in 1 day or 8,640,00000ms
}

export const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_AT) || 60 * 60 * 1000 // 60 minutes or 360,0000ms
}

export const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_AT) 
  || 24 * 60 * 60 * 1000 // 24 hours or 8,600,000ms
}