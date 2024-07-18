import { sessionsRouter } from './sessions'
import { usersRouter } from './users'
import { customersRouter } from './customers'
import { customerFilesRouter } from './customerFiles'

const routes = [
  { path: '/', router: sessionsRouter },
  { path: '/users', router: usersRouter },
  { path: '/customers', router: customersRouter },
  { path: '/', router: customerFilesRouter }

]

export default routes