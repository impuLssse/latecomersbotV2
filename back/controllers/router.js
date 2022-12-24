import express from 'express'
import AdminsRouter from './admins'
import AuthRouter from './auth'
import GroupsRouter from './groups'
import LateComersRouter from './latecomers'
import StudentsRouter from './students'

let router = express()

router.use('/auth', AuthRouter)
router.use('/admins', AdminsRouter)
router.use('/students', StudentsRouter)
router.use('/groups', GroupsRouter)
router.use('/latecomers', LateComersRouter)

export default router