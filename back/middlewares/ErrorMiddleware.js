import { validationResult } from "express-validator";

export class ApiError extends Error {
    constructor(status, code, errors = []) {
        super(code);
        this.status = status
        this.errors = errors
    }

    static badRequest (errors = []) {
        return new ApiError (400, 'BAD_REQUEST', errors)
    }

    static unAuth () {
        return new ApiError (403, 'NOT_AUTHORIZED')
    }

    static noPermission () {
        return new ApiError (403, "NOT_HAVE_PERMISSION")
    }

    static notFound () {
        return new ApiError (404, "NOT_FOUND")
    }
}

export const ErrorMiddleware = (err, req, res, next) => {
	if (err instanceof ApiError){
        return res.status(err.status).json({code: err.message, errors:err.errors})
    }
    
    console.log(err)
    return res.status(500).json({code:'INTERNAL_SERVER_ERROR'})
}

export const ValidationMiddleware = (req, res, next) => {
	if(!validationResult(req).isEmpty()) throw ApiError.badRequest(validationResult(req).array())
	next()
}