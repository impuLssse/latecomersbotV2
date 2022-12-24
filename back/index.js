import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './controllers/router';
import { ErrorMiddleware } from './middlewares/ErrorMiddleware';
import DB from './database';

const app = express()

app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
	// allowedHeaders: ['X-Requested-With', 'X-HTTP-Method-Override', 'Accept', 'Content-Type', 'Code'],
	methods: ['GET', 'POST', 'OPTIONS']
}))
app.use(express.json({limit: "10kb"}))
app.use(cookieParser())
app.use(urlencoded({extended: true, limit: "10kb"}))
app.use(router)
app.use(ErrorMiddleware)

app.get('/', (req, res) => {
    res.json('не урчи')
})

let start = async () => {
    try {
        await DB.authenticate()
        await DB.sync()
        app.listen(process.env.PORT, () => {
            console.log(`[SERVER] started on http://localhost:${process.env.PORT}/`)
        })
    } catch (e) {
        console.log(e)
    }
}
start()