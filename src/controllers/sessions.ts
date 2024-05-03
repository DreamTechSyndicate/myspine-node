import argon2 from 'argon2'
import { 
  BadRequestError,
  InternalServerError,
  UnauthorizedRequestError,
  NotFoundError,
  ExternalServerError
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { IUserToken, User, UserToken } from '../models'
import { 
  handleLoginTokens, 
  handleLogoutTokens,
  handleSessionData
} from '../middleware'
import { SessionData } from 'src/utils/types/express-session'
import { 
  generateResetToken,
  requestMail
} from '../middleware'
import { containsMissingFields } from '../utils/funcs/validation'
import { sanitizeEmail } from '../utils/funcs/strings'

export const sessions: Controller = {
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
        NotFoundError("user", res)
      }
      
      const isMatched = await argon2.verify(user!.password, password)

      if (!isMatched) {
        UnauthorizedRequestError("password", res)
      }

      const userId = user!.id
      const tokens: Partial<IUserToken> | undefined = await handleLoginTokens(userId, req, res)
      const sessions: SessionData | undefined = await handleSessionData(userId, req, res)

      if (tokens && sessions) {
        res.status(201).json({
          message: "Successfully logged in",
          date: { ...user, ...tokens, sessions }
        })
      }
    } catch (err: unknown) {
      InternalServerError("login", "user account", res, err)
    }
  },

  logout: async(req, res) => {
    try {
      const userId = parseInt(req.params?.userId)
      
      await handleLogoutTokens(userId, res)
      
      req.session.destroy()

      res.send("Successfully logging out")
      res.redirect('/login')
    } catch (err: Error | unknown) {
      InternalServerError("logout", "user", res, err)
    }
  },

  forgotPassword: async(req, res) => {
    const { email } = req.body
    const clientURL = process.env.CLIENT_URL

    try {
      const user = await User.readByEmail(sanitizeEmail(email))

      if (!user) {
        BadRequestError("email", res)
      }

      const user_id = user!.id
      const {
        reset_password_token,
        reset_password_token_expiration_date
      } = await generateResetToken()

      if (!reset_password_token) {
        InternalServerError("create", "reset token", res)
      }

      const userToken = await UserToken.updateResetToken({ 
        user_id,
        reset_password_token,
        reset_password_token_expiration_date
      })

      if (!userToken) {
        InternalServerError("update", "reset token", res)
      }

      const resetURL = `${clientURL}/passwordReset?token=${reset_password_token}&userId=${user_id}`

      // TODO: PUT BACK
      // requestMail({
      //   mailType: 'reset_pass_requested',
      //   to: user!.email,
      //   from: undefined,
      //   url: resetURL
      // })

      res.status(201).json({ 
        message: "Password reset successfully requested", 
        data: {
          user_id, 
          reset_password_token,   
          reset_password_token_expiration_date
        }
      })
    } catch (err: Error | unknown) {
      InternalServerError("update", "password", res, err)
    }
  },

  resetPassword: async(req, res) => {
    try {
      const {
        user_id, 
        new_password,
        reset_password_token,
      } = req.body

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: ['user_id', 'new_password', 'reset_password_token'],
      })

      if (missingFields) {
        BadRequestError(missingFields, res)
      }

      const hashedPass: string | undefined = await argon2.hash(new_password)
  
      if (!hashedPass) {
        ExternalServerError("argon 2 hashing", res)
      }

      const userId = parseInt(user_id)
      const userById = await User.readById(userId)
      const userToken = await UserToken.readByUserId(userId)

      if (!userById) {
        NotFoundError("user", res)
      }

      if (!userToken) {
        NotFoundError("user token", res)
      }

      const payload = { password: hashedPass }
      const user = await User.update({ userId, payload })

      if (!user) {
        InternalServerError("update", "password", res)
      }

      const exp = userToken.reset_password_token_expiration_date
      const isTokenUnexpired = exp && (exp > new Date(Date.now()))
      if (reset_password_token === userToken.reset_password_token && isTokenUnexpired) {
        await UserToken.updateResetToken({ 
          user_id,
          reset_password_token: undefined,
          reset_password_token_expiration_date: undefined
        })
      }

      // TODO: PUT BACK
      // requestMail({
      //   mailType: 'reset_pass_completed',
      //   to: user!.email,
      //   from: undefined
      // })

      res.status(200).json({ message: "Password reset successfully" })
    } catch (err: Error | unknown) {
      InternalServerError("update", "password", res, err)
    }
  }
}