import { Router } from 'express'
import { patients } from '../controllers/patients'

const router = Router()

router.get('/', patients.getPatientByUserId)
router.post('/create', patients.postPatient)
router.post('/:id/consult', patients.requestConsultation)
router.put('/:id/update', patients.putPatient)
router.delete('/:id/delete', patients.deletePatient)

export { router as patientsRouter }