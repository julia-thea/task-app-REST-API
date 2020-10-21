const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
  // const task = new Task(req.body)

  const task = new Task({
    ...req.body, // spread operator that copies all the properties from request body to this object
    owner: req.user._id
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
router.get('/tasks', auth, async (req, res) => {
  const match = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  try {
    // const tasks = await Task.find({})
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
      }
    }).execPopulate()
    res.send(req.user.tasks)
  } catch {
    res.status(500).send(e)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    // const task = await Task.findById(_id)
    const task = await Task.findOne({ _id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch {
    res.status(500).send(e)
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'completed', 'description']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Not a valid update!' })
  }

  try {
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    // const task = await Task.findById(req.params.id)

    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
    
    // if (!isValidOperation) {
      //   return res.status(400).send({ error: 'Not a valid update!' })
      // }
      
      if (!task) {
        return res.status(404).send()
      }

      updates.forEach((update) => task[update] = req.body[update])
      await task.save()

    res.send(task)

  } catch (e) {
    res.status(500).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      res.status(404).send({ error: "Task not found" })
    }
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router