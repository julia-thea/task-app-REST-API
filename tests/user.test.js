const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')
const e = require('express')

// Creating a default user
const userOneId = new mongoose.Types.ObjectId()
const userOne = {
  _id: userOneId,
   name: 'Mary Lou',
   email: 'marylou@email.com',
   password: '56what!!',
   tokens: [{
     token: jwt.sign({ _id: userOneId }, process.env.USER_TOKEN)
   }]
}

beforeEach(async () => {
   await User.deleteMany()
   await new User(userOne).save()
})

test('Should sign up a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Jules T',
    email: 'julest4@email.com',
    password: 'MyPass777!'
  }).expect(201)

  // Assert that teh database changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Jules T',
      email: 'julest4@email.com'
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)
})

test('Should not login a user with bad credentials', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: 'somepass123'
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
  .get('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)
})

test('Not autheticated user should not be able to get profile', async () => {
  await request(app).get('/users/me').send().expect(401)
})

test('Should delete account for user', async () => {
  await request(app)
  .delete('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)
})

test('Not authenticated user should not be able to delete account', async () => {
  await request(app)
  .delete('/users/me')
  .send()
  .expect(401)
})