import express from 'express'
import { ApiError, ValidationMiddleware } from '../middlewares/ErrorMiddleware'
import AuthMiddleware, { Roles } from '../middlewares/AuthMiddleware'
import { body } from 'express-validator'
import { Admins } from '../database'
import { generate } from 'generate-password'

let AdminsRouter = express()
AdminsRouter.post('/add',
	AuthMiddleware(Roles.ADMIN),
	body('name').notEmpty().withMessage('name is empty'),
    body('role').notEmpty().withMessage('role is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
		try {
			let {name, role} = req.body
			// if (
			// 	String(role).toUpperCase() != Roles.ADMIN.value &&
			// 	String(role).toLowerCase() != Roles.DUTY.value &&
			// 	String(role).toUpperCase() != Roles.ROOT.value
			// ) throw ApiError.badRequest()
			await Admins.create({id: name, role: String(role).toUpperCase(), code: generate({numbers:true, length:12})})
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
AdminsRouter.post('/remove', 
	AuthMiddleware(Roles.ADMIN),
	body('name').notEmpty().withMessage('name is empty'),
	ValidationMiddleware,
	async (req, res, next) => {
		let {name} = req.body
		try {
			let admin = await Admins.findByPk(name)
			if(!admin) throw ApiError.badRequest()
			await admin.destroy()
            return res.json('ok')
		} catch (error) {
			next(error)	
		}
	}
)
AdminsRouter.get('/', 
	AuthMiddleware(Roles.ADMIN),
	async (req, res, next) => {
		try {
            return res.json(await Admins.findAll())
		} catch (error) {
			next(error)	
		}
	}
)


export default AdminsRouter