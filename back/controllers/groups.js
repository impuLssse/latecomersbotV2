import express from 'express'
import { ApiError, ValidationMiddleware } from '../middlewares/ErrorMiddleware'
import AuthMiddleware, { Roles } from '../middlewares/AuthMiddleware'
import { body } from 'express-validator'
import { Admins, Groups } from '../database'

let GroupsRouter = express()
GroupsRouter.post('/add', 
	AuthMiddleware(Roles.ADMIN),
	body('name').notEmpty().withMessage('name is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
		try {
			let {name} = req.body
			console.log(name)
			if(await Groups.findOne({where:{name}})) throw ApiError.badRequest()
			await Groups.create({name})
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
GroupsRouter.post('/remove', 
	AuthMiddleware(Roles.ADMIN),
	body('id').notEmpty().withMessage('id is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
		try {
			let {id} = req.body
			let group = await Groups.findByPk(id)
			if(!group) throw ApiError.badRequest()
			await group.destroy()
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
GroupsRouter.get('/', 
	AuthMiddleware(Roles.DUTY),
	async (req, res, next) => {
		try {
            return res.json(await Groups.findAll())
		} catch (error) {
			next(error)	
		}
	}
)


export default GroupsRouter