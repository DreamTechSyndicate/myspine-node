import { Router } from 'express'
import { sessions } from '../controllers'

const router = Router()

router.post('/login', sessions.login)
router.post('/logout/:userId', sessions.logout)

router.post('/password/forgot', sessions.forgotPassword)
router.post('/password/reset', sessions.resetPassword)

router.get('/session/:sessionId', sessions.getSessionBySessionId)

export { router as sessionsRouter }