import express from 'express'
import { ApiError, ValidationMiddleware } from '../middlewares/ErrorMiddleware'
import AuthMiddleware, { Roles } from '../middlewares/AuthMiddleware'
import { body } from 'express-validator'
import { Admins, Groups, Latecomers, Students } from '../database'
import { generate } from 'generate-password'
import { Op } from 'sequelize'
import xl from 'xlsx'
import fs from 'fs'

let LateComersRouter = express()
LateComersRouter.get('/', 
	AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
            return res.json(await Latecomers.findAll({include:{model: Students, include: Groups}}))
		} catch (error) {
			next(error)	
		}
	}
)
LateComersRouter.post('/add', 
	AuthMiddleware(Roles.DUTY),
	body('studentId').notEmpty().withMessage('studentId is empty'),
	body('time').notEmpty().withMessage('time is empty'),
	body('reason').notEmpty().withMessage('reason is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
        let {studentId, time, reason} = req.body
		try {
            if(!await Students.findByPk(studentId)) throw ApiError.badRequest()
            await Latecomers.create({studentId, time, reason})
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
LateComersRouter.get('/xl',
	AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
			let result = await Latecomers.findAll({ include: { model: Students, include: Groups }})
			let resik = result
				.filter(item => item.student.name)
				.map(item => item.toJSON())
				.map(item => ({
					name: item.student.name,
					group: item.student.group.name,
					reason: item.reason,
					time: item.time
				}))

			if (resik.length == 0) throw ApiError.notFound()

			let wb = xl.utils.book_new()
			let ws = xl.utils.json_to_sheet(resik)
			xl.utils.book_append_sheet(wb, ws, 'latecomers')
		
			xl.writeFile(wb, './опоздавшие.xlsx', { type: 'buffer', compression: true })
			res.sendFile('опоздавшие.xlsx', { root: __dirname + '../../' })
		} catch (error) {
			next(error)
		}
	}
)
LateComersRouter.post('/remove', 
	AuthMiddleware(Roles.DUTY),
	body('id').notEmpty().withMessage('id is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
        let {id} = req.body
		try {
            let latecomer = await Latecomers.findByPk(id)
            if(!latecomer) throw ApiError.badRequest()
            await latecomer.destroy()
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
LateComersRouter.get('/removeAll', 
	AuthMiddleware(Roles.ADMIN),
	ValidationMiddleware,
	async (req, res, next) => {
		try {
            await Latecomers.destroy({ where: {}, truncate: true })
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
LateComersRouter.get('/:studentId', 
    AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
            return res.json(await Latecomers.findAll({where: {studentId: {[Op.like]: `%${req.params.studentId}%`}}, include: Students}))
		} catch (error) {
			next(error)	
		}
	}
)


export default LateComersRouter