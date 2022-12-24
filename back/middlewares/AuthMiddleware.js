import { Admins } from "../database"
import { ApiError } from "./ErrorMiddleware"

export const Roles = {
    DUTY: {
        value: "DUTY",
        authority: 1
    },
    ADMIN: {
        value: "ADMIN",
        authority: 2
    },
    ROOT: {
        value: "ROOT",
        authority: 3
    }
}

export default function AuthMiddleware(role) {
    return async (req, res, next) => {
        try {
            let code = req.headers.code || req.cookies.code
            if(!code) throw ApiError.unAuth()
            let admin = await Admins.findOne({where:{code}})
            if(!admin) throw ApiError.unAuth()
            req.admin = admin

			let userAuthority = 0
			let needAuthority = 0
			for(let el in Roles) {
				if(Object.prototype.hasOwnProperty.call(Roles, el)) {
					if(Roles[el].value === admin.role) userAuthority = Roles[el].authority
					if(Roles[el] === role) needAuthority = Roles[el].authority
				}
			}
			if (userAuthority >= needAuthority) next()
			else throw ApiError.noPermission()
        } catch (error) {
            next(error)
        }
    }
}
