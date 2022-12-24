import express from 'express'
import { ApiError, ValidationMiddleware } from '../middlewares/ErrorMiddleware'
import AuthMiddleware, { Roles } from '../middlewares/AuthMiddleware'
import { body } from 'express-validator'
import { Groups, Students } from '../database'
import { Op } from 'sequelize'

let StudentsRouter = express()
StudentsRouter.get('/',
    AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
			return res.json(await Students.findAll({include: Groups}))
		} catch (error) {
			next(error)	
		}
	}
)
StudentsRouter.post('/add', 
    AuthMiddleware(Roles.ADMIN),
	body('name').notEmpty().withMessage('name is empty'),
    body('groupId').notEmpty().withMessage('group is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
        let {name, groupId} = req.body
		try {
			if(await Students.findOne({where: {name}})) throw new ApiError.badRequest()
            let group = await Groups.findByPk(groupId)
            if(!group) throw new ApiError.badRequest()
            await Students.create({name, groupId})
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
StudentsRouter.post('/remove', 
    AuthMiddleware(Roles.ADMIN),
	body('id').notEmpty().withMessage('id is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
        let {id} = req.body
		try {
			let student = await Students.findByPk(id)
			if(!student) throw new ApiError.badRequest()
            await student.destroy()
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
StudentsRouter.get('/:name', 
    AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
            return res.json(await Students.findAll({where: {name: {[Op.like]: `%${req.params.name}%`}}, include: Groups}))
		} catch (error) {
			next(error)	
		}
	}
)

export default StudentsRouter