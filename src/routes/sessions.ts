import { Router } from 'express'
import { sessions } from '../controllers'
import { isAuthenticated } from '../middleware'

const router = Router()

router.post('/login', sessions.login)
router.post('/logout/:userId', sessions.logout)

router.post('/password/forgot', sessions.forgotPassword)
router.post('/password/reset', sessions.resetPassword)

router.get('/password/reset', sessions.renderPasswordReset)
router.get('/session/:sessionId', sessions.getSessionBySessionId)
router.get('/authenticate', isAuthenticated, sessions.authenticate)

export { router as sessionsRouter }