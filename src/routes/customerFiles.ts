import { Router } from 'express'
import { customerFiles } from '../controllers/customerFiles'

const router = Router()

router.get('/auth/dropbox/oauth2', customerFiles.auth)
router.get('/auth/dropbox/callback', customerFiles.authCallback)
router.post('/customers/dropbox/upload', customerFiles.upload)

export { router as customerFilesRouter }