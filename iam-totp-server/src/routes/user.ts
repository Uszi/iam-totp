import createRouter from 'express-promise-router'
import type { SecuredRequest } from '../models/secutity-models'

const router = createRouter()

router.get('/me', (req: SecuredRequest, res) => {
    res.send(req.user)
})

export default router