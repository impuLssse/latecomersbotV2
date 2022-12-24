import { DataTypes, Sequelize } from 'sequelize'
import { Roles } from './middlewares/AuthMiddleware'

const siteDB = new Sequelize(
	process.env.NODE_ENV === 'prod' ? process.env.DB_NAME : process.env.DB_LNAME,
	process.env.NODE_ENV === 'prod' ? process.env.DB_USER : process.env.DB_LUSER,
	process.env.NODE_ENV === 'prod' ? process.env.DB_PASSWORD : process.env.DB_LPASSWORD, {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		dialect: 'mysql',
	}
)

export const Students = siteDB.define('students', {
	id: {
		type: DataTypes.INTEGER,
        autoIncrement: true,
		unique: true,
		primaryKey: true
	},
    name: {
        type: DataTypes.STRING,
        unique: true
    }
}, {
    timestamps: false,
})

export const Latecomers = siteDB.define('latecomers', {
	id: {
		type: DataTypes.INTEGER,
        autoIncrement: true,
		unique: 'Students',
		primaryKey: true
	},
    reason: {
        type: DataTypes.TEXT
    },
    time: {
        type: DataTypes.INTEGER
    },
}, {
    timestamps: false
})

export const Groups = siteDB.define('groups', {
    id: {
		type: DataTypes.INTEGER,
		unique: true,
		primaryKey: true,
        autoIncrement: true
	},
    name: {
        type: DataTypes.STRING,
        unique: true
    }
}, {
    timestamps: false
})

export const Admins = siteDB.define('admins', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
    },
    code: {
        type: DataTypes.STRING,
    },
    role: {
        type: DataTypes.STRING,
    }
}, {
    updatedAt: false
})

Groups.hasMany(Students)
Students.belongsTo(Groups)

Latecomers.belongsTo(Students, {
    onDelete: 'RESTRICT',
})
Students.hasMany(Latecomers)

export default siteDB