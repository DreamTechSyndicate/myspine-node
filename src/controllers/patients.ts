import { 
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from '../utils/funcs/errors'
import { Controller } from '../utils/types/generic'
import { Patient, User, IPatient } from '../models'
import { containsMissingFields } from '../utils/funcs/validation'
import { 
  capitalizeFirstLetter, 
  sanitizeEmail 
} from '../utils/funcs/strings'
import { MailTypes, sendEmail } from '../middleware'

export const patients: Controller = {
  getPatientById: async (req, res) => {
    try {
      const patientId: number = parseInt(req.params.id)
      const patient = await Patient.readById(patientId)

      if (!patient) {
        NotFoundError("patient", res)
      }

      res.status(200).json(patient)
    } catch (err: unknown) {
      InternalServerError("get", "patient", res, err)
    }
  },

  postPatient: async (req, res) => {
    try {
      let {
        user_id,
        firstname,
        lastname,
        pain_description,
        pain_degree,
        address,
        email,
        phone_number
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

      let user;
      let patient;

      user_id
        ? user = await User.readById(user_id)
        : patient = await Patient.create(payload)


      if (user) {
        patient = await Patient.create({ ...payload, user_id })
        
        await User.update({ 
          userId: user_id, 
          payload: { email: sanitizedEmail }
        })
      }

      if (patient) {
        sendEmail({
          mailType: MailTypes.APPT_REQUESTED,
          from: {
            email: patient.email,
            name: `${patient.firstname} ${patient.lastname}`,
            id: patient.id
          },
          html: `<p>Greetings, doc!<br/><br/>
          A patient has requested an appointment with you.<br/><br/>
          <b>Name: </b>${patient.firstname} ${patient.lastname}<br/>
          <b>Pain description: </b>${patient.pain_description}<br/>
          <b>Pain degree: </b>${patient.pain_degree}<br/>
          <b>Address: </b>${patient.address || 'N/A'}<br/>
          <b>Email: </b>${patient.email}<br/>
          <b>Phone number: </b>${patient.phone_number}<br/></p>` 
        })
      }

      res.status(201).json(patient)
    } catch (err: Error | unknown) {
      InternalServerError("create", "patient", res, err)
    }
  },

  putPatient: async (req, res) => {
    try {
      const patientId = parseInt(req.params.id)
      let {
        user_id,
        firstname,
        lastname,
        pain_description,
        pain_degree,
        address,
        email,
        phone_number
      } = req.body

      const patient = await Patient.readById(patientId)
      
      if (!patient) {
        throw new Error('User does not exist')
      }

      let payload: Partial<IPatient> = {}

      if (user_id) {
        payload.user_id = user_id
      }

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
        const missingFields = containsMissingFields({ 
          payload: req.body, 
          requiredFields: ['firstname', 'lastname', 'pain_description', 'pain_degree', 'email', 'phone_number'],
        })

        missingFields && BadRequestError(missingFields, res)
      }

      const updatedPatient = await Patient.update({ patientId, payload })
      res.status(201).json(updatedPatient)
    } catch (err: Error | unknown) {
      InternalServerError("update", "patient", res, err)
    }
  },

  deletePatient: async (req, res) => {
    try {
      const patientId: number = parseInt(req.params.id)
      const patientDeleted: number = await Patient.delete(patientId)

      if (patientDeleted) {
        res.status(204).json(patientDeleted)
      } else {
        NotFoundError(`Patient ID: ${patientId}`, res)
      }
    } catch (err: unknown) {
      InternalServerError("delete", "patient", res, err)
    }
  }
}