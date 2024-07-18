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
import { sendConsultationEmail } from '../utils/funcs/email'

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
        email,
        phone_number,
        age,
        sex,
        height,
        weight,
        occupation,
        acute_pain_type,
        pain_summary,
        pain_degree,
        pain_duration,
        activity_level,
        pain_area,
        pain_start_type,
        pain_start_cause,
        physical_theray_history,
        offered_spinal_surgery,
        spine_imaging_type,
        previous_spinal_surgery,
        limb_weakness_numbness,
        walking_unsteadiness,
        offered_procedure,
        offered_by,
        results_discussed,
        surgery_type,
        surgery_date_time,
        surgeon,
        hand_object_manipulation_problems,
        past_pain_medications,
        current_pain_medications,
        painful_activities,
        painful_leg_activities,
        helpful_activities,
        unoperational_due_to_pain,
        physician_visit_for_pain,
        injection_procedures_for_pain,
        injection_types,
        injection_relief,
        helpful_injections,
        injection_relief_duration,
        medical_problems,
        current_medications,
        password
      } = req.body

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: [
          'firstname',
          'lastname',
          'email',
          'phone_number',
          'age',
          'sex',
          'height',
          'weight',
          'occupation',
          'acute_pain_type',
          'pain_summary',
          'pain_degree',
          'pain_duration',
          'activity_level',
          'pain_area',
          'pain_start_type',
          'pain_start_cause',
          'physical_theray_history',
          'offered_spinal_surgery',
          'spine_imaging_type',
          'previous_spinal_surgery',
          'limb_weakness_numbness',
          'walking_unsteadiness',
          'offered_procedure',
          'offered_by',
          'results_discussed',
          'surgery_type',
          'surgery_date_time',
          'surgeon',
          'hand_object_manipulation_problems',
          'past_pain_medications',
          'current_pain_medications',
          'painful_activities',
          'painful_leg_activities',
          'helpful_activities',
          'unoperational_due_to_pain',
          'physician_visit_for_pain',
          'injection_procedures_for_pain',
          'injection_types',
          'injection_relief',
          'helpful_injections',
          'injection_relief_duration',
          'medical_problems',
          'current_medications'
        ]
      })

      if (missingFields) {
        BadRequestError(missingFields, res) 
      }

      const sanitizedEmail = sanitizeEmail(email)

      const payload = {
        firstname: capitalizeFirstLetter(firstname),
        lastname: capitalizeFirstLetter(lastname),
        email: sanitizedEmail,
        phone_number,
        age,
        sex,
        height,
        weight,
        occupation,
        acute_pain_type,
        pain_summary,
        pain_degree,
        pain_duration,
        activity_level,
        pain_area,
        pain_start_type,
        pain_start_cause,
        physical_theray_history,
        offered_spinal_surgery,
        spine_imaging_type,
        previous_spinal_surgery,
        limb_weakness_numbness,
        walking_unsteadiness,
        offered_procedure,
        offered_by,
        results_discussed,
        surgery_type,
        surgery_date_time,
        surgeon,
        hand_object_manipulation_problems,
        past_pain_medications,
        current_pain_medications,
        painful_activities,
        painful_leg_activities,
        helpful_activities,
        unoperational_due_to_pain,
        physician_visit_for_pain,
        injection_procedures_for_pain,
        injection_types,
        injection_relief,
        helpful_injections,
        injection_relief_duration,
        medical_problems,
        current_medications
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
        } else {
          // Customer can opt for a single-click registration
          // Given a password, customer will also create an account user with user_id
          const hashedPass: string | undefined = await argon2.hash(password)
          !hashedPass && ExternalServerError("argon 2 hashing", res);

          const user = await User.create({ email: sanitizedEmail, password: hashedPass })
          !user && new Error("Unable to create customer as a user")

          customer = await Customer.create({ ...payload, user_id: user!.id })
        }
      }

      customer && sendConsultationEmail(customer)

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

      sendConsultationEmail(customer)
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

      const missingFields = containsMissingFields({
        payload: req.body,
        requiredFields: [
          'firstname',
          'lastname',
          'email',
          'phone_number',
          'age',
          'sex',
          'height',
          'weight',
          'occupation',
          'acute_pain_type',
          'pain_summary',
          'pain_degree',
          'pain_duration',
          'activity_level',
          'pain_area',
          'pain_start_type',
          'pain_start_cause',
          'physical_theray_history',
          'offered_spinal_surgery',
          'spine_imaging_type',
          'previous_spinal_surgery',
          'limb_weakness_numbness',
          'walking_unsteadiness',
          'offered_procedure',
          'offered_by',
          'results_discussed',
          'surgery_type',
          'surgery_date_time',
          'surgeon',
          'hand_object_manipulation_problems',
          'past_pain_medications',
          'current_pain_medications',
          'painful_activities',
          'painful_leg_activities',
          'helpful_activities',
          'unoperational_due_to_pain',
          'physician_visit_for_pain',
          'injection_procedures_for_pain',
          'injection_types',
          'injection_relief',
          'helpful_injections',
          'injection_relief_duration',
          'medical_problems',
          'current_medications'
        ]
      })

      missingFields && BadRequestError(missingFields, res)

      let payload: Partial<ICustomer> = {}
      Object.keys(req.body).forEach((key) => {
        if (req.body[key]) {
          payload[key as keyof ICustomer] = req.body[key];
        }
      });

      const updatedCustomer = await Customer.update({ customerId, payload })
      updatedCustomer && sendConsultationEmail(updatedCustomer)

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