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
          'pain_areas',
          'pain_start_type',
          'pain_start_causes',
          'physical_therapy_history',
          'offered_spinal_surgery',
          'spine_imaging_types',
          'previous_spinal_surgery',
          'limb_weakness_numbness',
          'walking_unsteadiness',
          'offered_procedure',
          'offered_by',
          'discussed_result',
          'surgery_type',
          'surgery_date_time',
          'surgeon',
          'hand_object_manipulation_problem',
          'past_pain_medication',
          'current_pain_medication',
          'painful_activities',
          'painful_leg_activities',
          'helpful_activities',
          'unoperational_due_to_pain',
          'physician_visit_for_pain',
          'injection_procedure_for_pain',
          'injection_types',
          'injection_relief',
          'helpful_injection',
          'injection_relief_duration',
          'medical_problem',
          'current_medication'
        ]
      })

      if (missingFields) {
        BadRequestError(missingFields, res) 
      }

      const sanitizedEmail = sanitizeEmail(req.body.email)

      const payload: Partial<ICustomer> = {
        firstname: capitalizeFirstLetter(req.body.firstname),
        lastname: capitalizeFirstLetter(req.body.lastname),
        email: sanitizedEmail,
        phone_number: req.body.phone_number,
        age: req.body.age,
        sex: req.body.sex,
        height: req.body.height,
        weight: req.body.weight,
        occupation: req.body.occupation,
        acute_pain_type: req.body.acute_pain_type,
        pain_summary: req.body.pain_summary,
        pain_degree: req.body.pain_degree,
        pain_duration: req.body.pain_duration,
        activity_level: req.body.activity_level,
        pain_areas: req.body.pain_areas,
        pain_start_type: req.body.pain_start_type,
        pain_start_causes: req.body.pain_start_causes,
        physical_therapy_history: req.body.physical_therapy_history,
        offered_spinal_surgery: req.body.offered_spinal_surgery,
        spine_imaging_types: req.body.spine_imaging_types,
        previous_spinal_surgery: req.body.previous_spinal_surgery,
        limb_weakness_numbness: req.body.limb_weakness_numbness,
        walking_unsteadiness: req.body.walking_unsteadiness,
        offered_procedure: req.body.offered_procedure,
        offered_by: req.body.offered_by,
        discussed_result: req.body.discussed_result,
        surgery_type: req.body.surgery_type,
        surgery_date_time: req.body.surgery_date_time,
        surgeon: req.body.surgeon,
        hand_object_manipulation_problem: req.body.hand_object_manipulation_problem,
        past_pain_medication: req.body.past_pain_medication,
        current_pain_medication: req.body.current_pain_medications,
        painful_activities: req.body.painful_activities,
        painful_leg_activities: req.body.painful_leg_activities,
        helpful_activities: req.body.helpful_activities,
        unoperational_due_to_pain: req.body.unoperational_due_to_pain,
        physician_visit_for_pain: req.body.physician_visit_for_pain,
        injection_procedure_for_pain: req.body.injection_procedure_for_pain,
        injection_types: req.body.injection_types,
        injection_relief: req.body.injection_relief,
        helpful_injection: req.body.helpful_injection,
        injection_relief_duration: req.body.injection_relief_duration,
        medical_problem: req.body.medical_problem,
        current_medication: req.body.current_medication
      }

      let customer;

      const existingCustomer = payload.email && await Customer.readByEmail(payload.email)

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
        if (!req.body.password) {
          // New customer might not have an associated user_id yet
          customer = await Customer.create(payload)
        } else {
          // Customer can opt for a single-click registration
          // Given a password, customer will also create an account user with user_id
          const hashedPass: string | undefined = await argon2.hash(req.body.password)
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
          'pain_areas',
          'pain_start_type',
          'pain_start_causes',
          'physical_therapy_history',
          'offered_spinal_surgery',
          'spine_imaging_types',
          'previous_spinal_surgery',
          'limb_weakness_numbness',
          'walking_unsteadiness',
          'offered_procedure',
          'offered_by',
          'discussed_result',
          'surgery_type',
          'surgery_date_time',
          'surgeon',
          'hand_object_manipulation_problem',
          'past_pain_medication',
          'current_pain_medication',
          'painful_activities',
          'painful_leg_activities',
          'helpful_activities',
          'unoperational_due_to_pain',
          'physician_visit_for_pain',
          'injection_procedure_for_pain',
          'injection_types',
          'injection_relief',
          'helpful_injection',
          'injection_relief_duration',
          'medical_problem',
          'current_medication'
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