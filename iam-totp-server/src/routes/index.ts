import createRouter from 'express-promise-router'

import { secureRoute } from '../middleware/security'

import authRoutes from './auth'
import userRoutes from './user'

const router = createRouter()

router.use('/auth', authRoutes)
router.use('/user', secureRoute(), userRoutes)

export default router