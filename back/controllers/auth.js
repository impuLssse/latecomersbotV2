import express from 'express'
import { ApiError, ValidationMiddleware } from '../middlewares/ErrorMiddleware'
import AuthMiddleware, { Roles } from '../middlewares/AuthMiddleware'
import { body } from 'express-validator'

let AuthRouter = express()
AuthRouter.get('/logout', (req, res, next) => {
	try {
		res.clearCookie('refreshToken')
		return res.json('ok')
	} catch (error) {
		next(error)
	}
})
AuthRouter.get('/isAuth', AuthMiddleware(Roles.DUTY), (req, res, next) => {
	try {
		return res.json(req.admin)
	} catch (error) {
		next(error)
	}
})

export default AuthRouter