import { app, server } from '../../src/server'
import { User, UserToken, IUser } from '../../src/models'
import knex, { Knex } from 'knex'
import knexConfig from '../../knexfile'
import request from 'supertest'
import { generateToken } from '../../src/middleware'

describe("sessions controller", () => {
  let db: Knex;
  let mockUserId: number = 696
  let users: IUser[] = [];
  let token: string = generateToken(mockUserId)

  const loginRoute = '/login'
  const logoutRoute = '/logout'

  beforeEach(async() => {
    db = knex(knexConfig)

    if (db) {
      await db('users').truncate()
    }

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

    users = await User.readAll()
  })

  afterAll(() => {
    server.close()
    db('users').truncate()
  })

  describe("login", () => {
    it("should login and return tokens", async() => {
      const user = users[1]
      const { id, email, password } = user
      const payload = { email, password }
      const token = generateToken(id)
    
      const res: any = await request(app)
        .post(loginRoute)
        .send(payload)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .accept('application/json')
        .expect(201)

      const userById = await User.readById(id)
      const userTokenById = await UserToken.readByUserId(id)

      expect(userById).toBeDefined()
      expect(userTokenById).toBeDefined()
      expect(userTokenById.access_token).toBeDefined()
      expect(userTokenById.refresh_token).toBeDefined()

      expect(res.body.email).toEqual(payload.email)
      expect(res.body.access_token).toBeDefined()
      expect(res.body.refresh_token).toBeDefined()
    });
  
    it("should return a 400 Bad Request if missing email/password", async () => {
    const res = await request(app)
      .post(loginRoute)
      .send({})
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .accept('application/json')
      .expect(400)

      expect(res.status).toBe(400)
      expect(res.body.message).toEqual("Email & Password Required")
    })
  })

  describe("logout", () => {
    it("should logout and delete User token if exists", async() => {
      const user = users[2]
      const userId = user.id
      const payload = { email: user.email, password: user.password }
      const oneDay = '1d'
      const token = generateToken(userId, oneDay)

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
        .send({ id: userId })
        .set('Content-Type', 'application/json')
        .expect(204)

      const signOutToken = await UserToken.readByUserId(userId)
      
      expect(signOutRes.body).toEqual({})
      expect(signOutToken).toBeUndefined()
    })
  })
})