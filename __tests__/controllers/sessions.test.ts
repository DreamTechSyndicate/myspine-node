import { app, server } from '../../src/server'
import { User, UserToken } from '../../src/models'
import knex, { Knex } from 'knex'
import knexConfig from '../../knexfile'
import request from 'supertest'
import { generateToken } from '../../src/middleware'

describe("sessions controller", () => {
  let db: Knex;
  let mockUserId: number = 696
  let token: string = generateToken({ userId: mockUserId })

  const truncateDb = async() => {
    db = knex(knexConfig)
  
    if (db) {
      await db('users').truncate()
    }
  }

  const terminateServer = async() => {
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve()
      })
    })
  }

  describe.only("login", () => {    
    const loginRoute = '/login'

    beforeEach(async() => {
      await truncateDb()
      await terminateServer()
    })

    it.only("should login and return tokens", async() => {
      await User.create({
        email: 'wwhite@msn.com',
        password: 'ricin'
      })
  
      await User.create({
        email: 'pinkman.abq@yahoo.com',
        password: 'margolis'
      })
  
      await User.create({
        email: 'gus@pollohermanos.cl',
        password: 'laundromat'
      })
  
      const users = await User.readAll()
      const { id, email, password } = users[1]
      const payload = { email, password }
      const token = generateToken({ userId: id })
    
      const res: any = await request(app)
        .post(loginRoute)
        .send(payload)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .accept('application/json')
        .expect(201)
      
      const userTokenById = await UserToken.readByUserId(id)

      expect(userTokenById).toBeDefined()
      expect(userTokenById.access_token).toBeDefined()
      expect(userTokenById.refresh_token).toBeDefined()

      expect(res.body.email).toEqual(payload.email)
      expect(res.body.access_token).toBeDefined()
      expect(res.body.refresh_token).toBeDefined()
      
      expect(res.body.session_data.logged_in).toEqual(true)
      expect(res.body.session_data.user_id).toEqual(userTokenById.user_id)
    });
  
    it("should return a 400 Bad Request if missing email/password", async () => {
      await truncateDb()
      const res = await request(app)
        .post(loginRoute)
        .send({})
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .accept('application/json')
        .expect(400)

        expect(res.status).toBe(400)
        expect(res.body.message).toEqual("Email, Password Required")
      })
  })

  describe("logout", () => {  
    const loginRoute = '/login'
    const logoutRoute = '/logout'
  
    afterEach(async() => {
      await truncateDb()
      await terminateServer()
    })

    it("should logout and delete User token if exists", async() => {
      await User.create({
        email: 'wwhite@msn.com',
        password: 'ricin'
      })
  
      await User.create({
        email: 'pinkman.abq@yahoo.com',
        password: 'margolis'
      })
  
      await User.create({
        email: 'gus@pollohermanos.cl',
        password: 'laundromat'
      })

      const user = await User.readByEmail('gus@pollohermanos.cl')
      const userId = user?.id
      const payload = { email: user?.email, password: user?.password }

      if (userId) {
        const token = generateToken({ userId, expiresIn: '1d' })
  
        // Login to generate access / refresh tokens 
        await request(app)
          .post(loginRoute)
          .send(payload)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'application/json')
          .accept('application/json')
          .expect(201)
  
        const signInToken = await UserToken.readByUserId(userId)
  
        expect(signInToken).toBeDefined()
        expect(signInToken.user_id).toEqual(userId)
        expect(signInToken.access_token).toBeDefined()
  
        const signOutRes = await request(app)
          .post(`${logoutRoute}`)
          .send({ userId })
          .set('Content-Type', 'application/json')
          .expect(204)
  
        const signOutToken = await UserToken.readByUserId(userId)
        
        expect(signOutRes.body).toEqual({})
        expect(signOutToken).toBeUndefined()
      }
    })
  })
})