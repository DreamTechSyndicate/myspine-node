import argon2 from 'argon2'
import { 
  BadRequestError,
  InternalServerError,
  UnauthorizedRequestError,
  NotFoundError,
  ExternalServerError
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { 
  IUserToken, 
  Customer, 
  User, 
  UserToken,
} from '../models'
import { 
  handleLoginTokens,
  handleSessionData,
  tokenStorage,
  verifyToken,
  handleLogoutTokens
} from '../middleware'
import { SessionData } from 'src/utils/types/express-session'
import { 
  generateResetPasswordToken
} from '../middleware'
import { containsMissingFields, verifyCSPRNG } from '../utils/funcs/validation'
import { sanitizeEmail } from '../utils/funcs/strings'
import { sendPasswordResetEmail } from '../utils/funcs/email'

const clientURL = process.env.CLIENT_URL

export const sessions: Controller = {
  authenticate: async(req, res) => {
    try {
      if (req.session?.userId && req.session?.email) {
        const { userId, email } = req.session
        res.status(200).send({
          userId,
          email,
          authenticated: true
        })
      }
    } catch {
      UnauthorizedRequestError("session", res)
    }
  },

  login: async(req, res) => {
    try {
      const { email, password } = req.body

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: ['email', 'password'],
      })

      if (missingFields) {
        BadRequestError(missingFields, res)
      }

      const user = await User.readByEmail(sanitizeEmail(email))
      
      if (!user) {
        return NotFoundError("user", res)
      }
      
      const isMatched = await argon2.verify(user!.password, password)

      if (!isMatched) {
        return UnauthorizedRequestError("password", res)
      }

      const user_id = user!.id
      const tokens: Partial<IUserToken> | undefined | void = await handleLoginTokens(user_id, res)
      const sessions: SessionData | undefined = await handleSessionData(user, req, res)
      
      if (tokens?.access_token && tokens?.refresh_token && sessions) {
        const decoded = await verifyToken(tokens.access_token)

        tokenStorage.setTokens({
          res,
          token: decoded,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        })
      
        res.status(201).json({
          message: "Successfully logged in",
          data: user
        })
      }
    } catch (err: unknown) {
      InternalServerError("login", "user account", res, err)
    }
  },

  logout: async(req, res) => {
    try {
      const userId = parseInt(req.params?.userId)

      if (!userId) {
        BadRequestError("user id", res)
      }

      await handleLogoutTokens(userId, req, res)
      
      res.status(204).end()
    } catch (err: Error | unknown) {
      InternalServerError("logout", "user", res, err)
    }
  },

  forgotPassword: async(req, res) => {
    const { email } = req.body

    try {
      const user = await User.readByEmail(sanitizeEmail(email))
      const customer = user && await Customer.readByUserId(user.id)

      if (!customer) {
        return BadRequestError("email", res)
      }

      const user_id = user.id
      
      const {
        reset_password_token,
        reset_password_token_expires_at
      } = generateResetPasswordToken()

      if (!reset_password_token) {
        return InternalServerError("create", "reset token", res)
      }

      const userToken = await UserToken.readByUserId(user_id)

      if (!userToken) {
        const newUserToken = await UserToken.create({
          user_id,
          reset_password_token,
          reset_password_token_expires_at
        })

        !newUserToken && 
        InternalServerError("create", "user token", res)

      } else {
        const updatedUserToken = await UserToken.updateResetToken({
          user_id,
          reset_password_token,
          reset_password_token_expires_at
        })

        !updatedUserToken && 
        InternalServerError("update", "reset token", res)
      }

      const resetURL = `${clientURL}/password/reset?token=${reset_password_token}&userId=${user_id}`

      const customerName = customer ? `${customer?.firstname} ${customer?.lastname}` : 'Customer'

      sendPasswordResetEmail({
        userId: user!.id,
        name: customerName,
        email: user!.email,
        resetURL
      })

      res.status(201).json({ 
        message: "Password reset successfully requested",
        data: {
          user_id,
          reset_password_token,
          reset_password_token_expires_at
        }
      })
    } catch (err: Error | unknown) {
      InternalServerError("read", "password reset", res, err)
    }
  },

  renderPasswordReset: async(req, res) => {
    try {
      const { token, userId } = req.query

      if (!token || !userId) {
        BadRequestError("token or userId", res)
      }

      const userToken = await UserToken.readByUserId(parseInt(userId))

      if (!userToken) {
        return NotFoundError("token", res)
      }

      const exp = new Date(userToken.reset_password_token_expires_at!)
      const isTokenExpired = exp && (exp < new Date(Date.now()))

      if (isTokenExpired) {
        return BadRequestError("expired token", res)
      }

      const isValid = verifyCSPRNG({
        storedToken: userToken.reset_password_token,
        providedToken: token
      })

      if (isValid) {
        res.status(200).send(true) 
      }
      
    } catch (err: Error | unknown) {
      InternalServerError("read", "reset password token", res, err)
    }
  },

  resetPassword: async(req, res) => {
    try {
      const {
        new_password,
        user_id,
        reset_password_token
      } = req.body

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: ['new_password', 'user_id', 'reset_password_token'],
      })

      if (missingFields) {
        return BadRequestError(missingFields, res)
      }

      const hashedPass: string | undefined = await argon2.hash(new_password)
  
      if (!hashedPass) {
        return ExternalServerError("argon 2 hashing", res)
      }

      const userId = parseInt(user_id)
      const userById = await User.readById(userId)

      if (!userById) {
        return NotFoundError("user", res)
      }

      const userToken = await UserToken.readByUserId(userId)

      if (!userToken.reset_password_token) {
        return NotFoundError("user token", res)
      }

      const exp = new Date(userToken.reset_password_token_expires_at!)
      const isTokenExpired = exp && (exp < new Date(Date.now()))
      
      if (isTokenExpired) {
        return BadRequestError("expired token", res)
      }

      const isValid = verifyCSPRNG({ storedToken: userToken.reset_password_token, providedToken: reset_password_token })

      if (!isValid) {
        return BadRequestError("token", res)
      }

      const payload = { password: hashedPass }
      const user = await User.update({ userId, payload })

      if (!user) {
        InternalServerError("update", "password", res)
      }

      await UserToken.updateResetToken({ 
        user_id,
        reset_password_token: undefined,
        reset_password_token_expires_at: undefined
      })

      // TODO: put back once finalized
      // const customer = user && await Customer.readByUserId(userId)
      // sendEmail({
      //   mailType: MailTypes.RESET_PASS_COMPLETED,
      //   to: { 
      //     email: user!.email, 
      //     name: `${customer?.firstname} ${customer?.lastname}`,
      //     id: user.id
      //   }
      // })

      res.status(200).json({ message: "Password reset successfully" })
    } catch (err: Error | unknown) {
      InternalServerError("update", "password", res, err)
    }
  }
}