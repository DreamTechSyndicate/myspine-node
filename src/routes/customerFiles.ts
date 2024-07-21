import { Router } from 'express'
import { customerFiles } from '../controllers/customerFiles'

const router = Router()

router.get('/auth/dropbox', customerFiles.authDropbox)
router.get('/auth/dropbox/callback', customerFiles.authDropboxCallback)
router.post('/customers/dropbox/upload', customerFiles.upload)

export { router as customerFilesRouter }