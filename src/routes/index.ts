import { sessionsRouter } from './sessions'
import { usersRouter } from './users'
import { customersRouter } from './customers'

const routes = [
  { path: '/', router: sessionsRouter },
  { path: '/users', router: usersRouter },
  { path: '/customers', router: customersRouter }
]

export default routes