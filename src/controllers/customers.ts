import { 
  BadRequestError,
  ExternalServerError,
  InternalServerError,
  NotFoundError,
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { Customer, ICustomer, User, IUser } from '../models'
import { containsMissingFields } from '../utils/funcs/validation'
import { 
  capitalizeFirstLetter, 
  sanitizeEmail 
} from '../utils/funcs/strings'
// import { sendConsultationEmail } from '../utils/funcs/email'

import argon2 from 'argon2'

export const customers: Controller = {
  getCustomerByUserId: async (req, res) => {
    try {      
      const userId: number = parseInt(req.query?.userId)

      if (!userId) {
        BadRequestError("user id", res)
      }

      const customer = await Customer.readByUserId(userId)

      if (!customer) {
        NotFoundError("customer", res)
      }

      res.status(200).json(customer)
    } catch (err: unknown) {
      InternalServerError("read", "customer", res, err)
    }
  },

  postCustomer: async (req, res) => {
    try {
      let {
        firstname,
        lastname,
        pain_description,
        pain_degree,
        address,
        email,
        phone_number,
        password
      } = req.body

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: ['firstname', 'lastname', 'pain_description', 'pain_degree', 'email', 'phone_number']
      })

      if (missingFields) {
        BadRequestError(missingFields, res) 
      }

      const sanitizedEmail = sanitizeEmail(email)

      const payload = {
        firstname: capitalizeFirstLetter(firstname),
        lastname: capitalizeFirstLetter(lastname),
        pain_description: pain_description,
        pain_degree,
        address,
        email: sanitizedEmail,
        phone_number
      }

      let customer;

      const existingCustomer = await Customer.readByEmail(payload.email)

      if (existingCustomer) {        
        const userByEmail = await User.readByEmail(existingCustomer.email)
        // Update an existing customer with a user_id if not already

        customer = userByEmail
          ? await Customer.update({ 
              customerId: existingCustomer.id, 
              payload: { ...payload, user_id: userByEmail!.id } 
          })
          : await Customer.update({
              customerId: existingCustomer.id,
              payload
          })
      }

      if (!existingCustomer) {
        if (!password) {
          // New customer might not have an associated user_id yet
          customer = await Customer.create(payload)
          customer && console.log('consultation requested for a non-accoount & non-existing customer:', customer)
        } else {
          // Customer can opt for a single-click registration
          // Given a password, customer will also create an account user with user_id
          const hashedPass: string | undefined = await argon2.hash(password)
          !hashedPass && ExternalServerError("argon 2 hashing", res);

          const user = await User.create({ email: sanitizedEmail, password: hashedPass })
          !user && new Error("Unable to create customer as a user")

          customer = await Customer.create({ ...payload, user_id: user!.id })
          customer && console.log('consultation requested for a new registered customer:', customer)
        }
      }

      // TODO: PUT BACK
      // customer && sendConsultationEmail(customer, res)

      res.status(201).json(customer)
    } catch (err: Error | unknown) {
      InternalServerError("create", "customer", res, err)
    }
  },

  requestConsultation: async (req, res) => {
    try {
      const customerId = parseInt(req.params?.id)
      const customer = await Customer.readById(customerId)

      if (!customer) {
        BadRequestError("customer", res)
      }

      // sendConsultationEmail(customer)

      console.log('requesting:', customer)
      res.status(201).json(customer)
    } catch (err) {
      InternalServerError("create", "consultation request", res, err)
    }
  },

  putCustomer: async (req, res) => {
    try {
      const customerId = parseInt(req.params?.id)
      const customer = await Customer.readById(customerId)

      if (!customer) {
        BadRequestError("customer", res)
      }

      let {
        firstname,
        lastname,
        pain_description,
        pain_degree,
        address,
        email,
        phone_number
      } = req.body

      const missingFields = containsMissingFields({ 
        payload: { 
          firstname,
          lastname, 
          pain_description, 
          pain_degree, 
          address, 
          email, 
          phone_number 
        }, 
        requiredFields: ['firstname', 'lastname', 'pain_description', 'pain_degree', 'email', 'phone_number'],
      })

      missingFields && BadRequestError(missingFields, res)

      let payload: Partial<ICustomer> = {}

      if (firstname) {
        payload.firstname = firstname
      }

      if (lastname) {
        payload.lastname = lastname
      }

      if (pain_description) {
        payload.pain_description = pain_description
      }

      if (pain_degree) {
        payload.pain_degree = pain_degree
      }

      if (address) {
        payload.address = address
      }

      if (email) {
        payload.email = sanitizeEmail(email)
      }

      if (phone_number) {
        payload.phone_number = phone_number
      }

      const updatedCustomer = await Customer.update({ customerId, payload })
      updatedCustomer && console.log('updatedCustomer:', updatedCustomer)

      // TODO: PUT BACK
      // updatdCustomer && sendConsultationEmail(updatedCustomer, res)

      res.status(201).json(updatedCustomer)
    } catch (err: Error | unknown) {
      InternalServerError("update", "customer", res, err)
    }
  },

  deleteCustomer: async (req, res) => {
    try {
      const customerId: number = parseInt(req.query?.id)
      const customerDeleted: number = await Customer.delete(customerId)

      if (customerDeleted) {
        res.status(204).json(customerDeleted)
      } else {
        NotFoundError(`Customer ID: ${customerId}`, res)
      }
    } catch (err: unknown) {
      InternalServerError("delete", "customer", res, err)
    }
  }
}