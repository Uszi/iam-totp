import fs from 'fs'
import path from 'path'
import type { RequestHandler, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import type { MaybeSecureRequest } from '../models/secutity-models'
import User from '../models/user-model'
import config from '../config'

export const secureApplication = async (req: MaybeSecureRequest, res: Response, next: NextFunction) => {
    if(req?.headers?.authorization) {
        const { KEY_NAME } = config
        const token = req?.headers?.authorization
        const decoded = jwt.verify(token, fs.readFileSync(path.join(__dirname, '..', 'vault', KEY_NAME)));
        const user = await User.findOne({ _id: decoded.sub })
        req.user = { username: user.username }
    }
    next()
}

export const secureRoute = (): RequestHandler => (
	req: MaybeSecureRequest,
	res: Response,
	next: NextFunction
) => {
	if (req.user) {
		return next()
	} else {
		return res.sendStatus(401)
	}
}
