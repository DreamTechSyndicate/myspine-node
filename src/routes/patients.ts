import { Router } from 'express'
import { patients } from '../controllers/patients'

const router = Router()

router.get('/:id', patients.getPatientById)
router.post('/create', patients.postPatient)
router.put('/:id/update', patients.putPatient)
router.delete('/:id/delete', patients.deletePatient)

export { router as patientsRouter }