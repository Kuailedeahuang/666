import request from 'supertest'
import app from '../server.js'
import { supabase } from '../config/database.js'

// 测试数据
const testUser = {
  username: 'testuser_' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'Test123!',
  confirmPassword: 'Test123!'
}

let authToken = ''
let userId = ''

describe('认证 API 测试', () => {
  // 清理测试数据
  afterAll(async () => {
    if (userId) {
      await supabase.from('users').delete().eq('id', userId)
    }
  })

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toHaveProperty('message', '注册成功')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user).toHaveProperty('username', testUser.username)
      expect(response.body.user).toHaveProperty('email', testUser.email)

      authToken = response.body.token
      userId = response.body.user.id
    })

    it('应该拒绝重复注册', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409)

      expect(response.body).toHaveProperty('error', '用户已存在')
    })

    it('应该验证请求数据', async () => {
      const invalidUser = {
        username: 'ab', // 太短
        email: 'invalid-email',
        password: '123' // 太弱
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('error', '数据验证失败')
      expect(response.body.details).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/auth/login', () => {
    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toHaveProperty('message', '登录成功')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).toHaveProperty('id', userId)
    })

    it('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', '认证失败')
    })

    it('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', '认证失败')
    })
  })

  describe('GET /api/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.user).toHaveProperty('id', userId)
      expect(response.body.user).toHaveProperty('username', testUser.username)
      expect(response.body.user).toHaveProperty('email', testUser.email)
      expect(response.body.user).toHaveProperty('stats')
    })

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('error', '访问令牌缺失')
    })

    it('应该拒绝无效的令牌', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('error', '无效令牌')
    })
  })

  describe('PUT /api/auth/password', () => {
    it('应该成功修改密码', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!'
        })
        .expect(200)

      expect(response.body).toHaveProperty('message', '密码修改成功')
    })

    it('应该验证当前密码', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', '密码错误')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('应该成功退出登录', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', '退出登录成功')
    })
  })
})