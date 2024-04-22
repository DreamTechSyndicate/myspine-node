import argon2 from 'argon2'
import { 
  BadRequestError,
  ExternalServerError,
  InternalServerError,
  NotFoundError
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { User, IUser } from '../models'
import { sanitizeEmail } from '../utils/funcs/strings'
import { containsMissingFields } from '../utils/funcs/validation'

export const users: Controller = {
  getUsers: async (_req, res) => {
    try {
      const users = await User.readAll()
      res.status(200).json(users)
    } catch (err) {
      InternalServerError("get", "users", res)
    }
  },

  getUserById: async (req, res) => {
    try {
      const userId: number = parseInt(req.params.id)
      const userById: IUser = await User.readById(userId)

      if (userById) {
        res.status(200).json(userById)
      } else {
        NotFoundError("user", res)
      }
    } catch (err: unknown) {
      InternalServerError("get", "user", res)
    }
  },

  postUser: async (req, res) => {
    try {
      let email: string | undefined = req.body?.email
      let password: string | undefined = req.body?.password

      const existingUser = email && await User.readByEmail(email)

      if (existingUser) {
        res.redirect('/login')
      }

      const missingFields = containsMissingFields({ 
        payload: { email, password }, 
        requiredFields: ['email', 'password']
      })

      if (missingFields) {
        BadRequestError(missingFields, res)
      }
      
      const hashedPass: string | undefined = password
        ? await argon2.hash(password)
        : undefined;
  
      if (!hashedPass) {
        ExternalServerError("argon 2 hashing", res);
      }

      if (email && hashedPass) {
        const user = await User.create({ email, password: hashedPass });
        res.status(201).json(user);
      }
    } catch (err: Error | unknown) {
      InternalServerError("create", "user", res)
    }
  },

  putUser: async (req, res) => {
    try {
      const userId: number = parseInt(req.params.id)
      const userById: IUser = await User.readById(userId)

      let email: string | undefined = req.body?.email
      let password: string | undefined = req.body?.password

      if (!userById) {
        NotFoundError("user", res)
      }
      
      let payload: Partial<IUser> = {}
  
      if (email) {
        payload.email = email
      }

      if (password) {
        const hashedPass = await argon2.hash(password)
        !hashedPass && ExternalServerError("argon 2 hashing", res)

        payload.password = hashedPass
      }

      const updatedUser = await User.update(userId, payload);

      res.status(201).json(updatedUser)
    } catch (err: Error | unknown) {
      InternalServerError("update", "user", res)
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId: number = parseInt(req.params.id)
      const userDeleted: number  = await User.delete(userId)

      if (userDeleted) {
        res.status(204).json(userDeleted)
      } else {
        NotFoundError(`User ID: ${userId}`, res)
      }

    } catch (err: unknown) {
      InternalServerError("delete", "user", res)
    }
  }
}