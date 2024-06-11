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
  Patient, 
  User, 
  UserToken
} from '../models'
import { 
  handleLoginTokens,
  handleLogoutTokens,
  handleSessionData,
  tokenStorage,
  MailTypes,
  verifyToken
} from '../middleware'
import { SessionData } from 'src/utils/types/express-session'
import { 
  generateResetPasswordToken,
  requestMail
} from '../middleware'
import { containsMissingFields } from '../utils/funcs/validation'
import { sanitizeEmail } from '../utils/funcs/strings'
import { Session } from '../models/Session'

export const sessions: Controller = {
  getSessionBySessionId: async(req, res) => {
    try {
      const { sessionId } = req.params

      if (sessionId) {
        throw new Error('Missing session Id')
      }

      const session = await Session.readBySessionId(sessionId)
      res.status(201).json(session)
    } catch (err) {
      InternalServerError("get", "session data", res, err)
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
        NotFoundError("user", res)
      }
      
      const isMatched = await argon2.verify(user!.password, password)

      if (!isMatched) {
        UnauthorizedRequestError("password", res)
      }

      const userId = user!.id
      const tokens: Partial<IUserToken> | undefined = await handleLoginTokens(userId, req, res)
      const sessions: SessionData | undefined = await handleSessionData(userId, req, res)
      
      if (tokens?.access_token && tokens?.refresh_token && sessions) {
        const decoded = await verifyToken(tokens.access_token, )

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
      
      await handleLogoutTokens(userId, res)
      
      req.session.destroy()
      req.session.save((err: unknown | Error) => {
        if (err) {
          console.warn('Error setting session data and/or cookie', err)
          InternalServerError("update", "session", res)
        }
      })
      res.send("Successfully logged out")
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
      const patient = user && await Patient.readByUserId(user.id)

      if (!user) {
        BadRequestError("email", res)
      }

      const user_id = user!.id
      const {
        reset_password_token,
        reset_password_token_expires_at
      } = await generateResetPasswordToken()

      if (!reset_password_token) {
        InternalServerError("create", "reset token", res)
      }

      const userToken = await UserToken.updateResetToken({ 
        user_id,
        reset_password_token,
        reset_password_token_expires_at
      })

      if (!userToken) {
        InternalServerError("update", "reset token", res)
      }

      const resetURL = `${clientURL}/passwordReset?token=${reset_password_token}&userId=${user_id}`
      
      const patientName = `${patient?.firstname} ${patient?.lastname}`

      requestMail({
        mailType: MailTypes.RESET_PASS_REQUESTED,
        to: { 
          email: user!.email,
          name: patientName,
          id: user!.id
        },
        html: `<p>Dear ${patientName},<br/><br/>
        You have requested a password reset for <a href="https://peaceofmindspine.com">peaceofmindspine.com</a> account. Please click on the following link <a href=${resetURL}>${resetURL}</a> to reset your password.</p>`
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
      const patient = user && await Patient.readByUserId(userId)

      if (!user) {
        InternalServerError("update", "password", res)
      }

      const exp = userToken.reset_password_token_expires_at
      const isTokenUnexpired = exp && (exp > new Date(Date.now()))
      
      if (reset_password_token === userToken.reset_password_token && isTokenUnexpired) {
        await UserToken.updateResetToken({ 
          user_id,
          reset_password_token: undefined,
          reset_password_token_expires_at: undefined
        })
      }

      requestMail({
        mailType: MailTypes.RESET_PASS_COMPLETED,
        to: { 
          email: user!.email, 
          name: `${patient?.firstname} ${patient?.lastname}`,
          id: user.id
        }
      })

      res.status(200).json({ message: "Password reset successfully" })
    } catch (err: Error | unknown) {
      InternalServerError("update", "password", res, err)
    }
  }
}