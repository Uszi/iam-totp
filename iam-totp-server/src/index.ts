import express from 'express'
import Fingerprint from 'express-fingerprint'
import cors from 'cors'
import routes from './routes/index'
import database from './database'
import config from './config'
import { secureApplication } from './middleware/security'

database.connect()

const app = express()

app.use(cors())

const { API_PORT } = config

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use(express.json())
app.use(secureApplication)
app.use(Fingerprint())
app.use(routes)

app.listen(API_PORT, () => {
  console.log(`App listening on port ${API_PORT}`)
})

export default app