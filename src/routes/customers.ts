import { Router } from 'express'
import { customers } from '../controllers/customers'

const router = Router()

router.get('/', customers.getCustomerByUserId)
router.post('/create', customers.postCustomer)
router.post('/:id/consult', customers.requestConsultation)
router.put('/:id/update', customers.putCustomer)
router.delete('/:id/delete', customers.deleteCustomer)

export { router as customersRouter }