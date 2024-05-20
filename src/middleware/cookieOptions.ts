export const cookieOptions = {
  secret: process.env.SESSION_SECRET!,
  httpOnly: true, // Accessible via server and not client side script, may tamper with certain procedure like SSO, that is client-side access reliant
  secure: true,
  maxAge: Number(process.env.SESSION_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000  // Expires in 1 day or 864000000ms
}