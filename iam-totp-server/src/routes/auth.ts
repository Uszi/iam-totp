import fs from 'fs'
import path from 'path'
import createRouter from 'express-promise-router'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import axios from 'axios'

import config from '../config'

import User from '../models/user-model'

import { isTOTPRequired } from '../services/totp'

const router = createRouter()

router.post('/register', async (req, res) => {
    /* get username/password from request body */
    const { username, password } = req.body;

    /* some validation - may be extended or moved into function */
    if (!(username && password)) {
        return res.sendStatus(400);
    }
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).send('User exists');
    }
    const { data: rapid_api_secret } = await axios.request({
        method: 'GET',
        url: 'https://google-authenticator.p.rapidapi.com/new_v2/',
        headers: {
          'X-RapidAPI-Key': config.RapidAPI_Key,
          'X-RapidAPI-Host': 'google-authenticator.p.rapidapi.com'
        }
    })
    await User.create({
        username: username,
        password: await bcrypt.hash(password, 8),
        rapid_api_secret
    })

    const { data: qr_code } = await axios.request({
        method: 'GET',
        url: 'https://google-authenticator.p.rapidapi.com/enroll/',
        params: {secret: rapid_api_secret, issuer: 'AcmeCorp', account: username},
        headers: {
            'X-RapidAPI-Key': config.RapidAPI_Key,
            'X-RapidAPI-Host': 'google-authenticator.p.rapidapi.com'
        }
    })

    return res.status(201).json({ qr_code })
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body
    // Basic validation
    if (!(username && password)) {
      return res.sendStatus(400)
    }

    const user = await User.findOne({ username })
    
    if (user && (await bcrypt.compare(password, user.password))) {
        const ip_addr = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        const bIsTOTPRequired = isTOTPRequired(user, req.fingerprint.hash, ip_addr)
        const { KEY_NAME } = config
        // Create token
        const token = jwt.sign(
            { sub: user._id, bIsTOTPRequired },
            fs.readFileSync(path.join(__dirname, '..', 'vault', KEY_NAME)),
            {
                expiresIn: bIsTOTPRequired ? '5m' : '2h',
            }
        )
        // store device fingerprint hash - newest first for optimalization
        user.devices_fingerprints = [{fingerprint_hash: req.fingerprint.hash, timestamp_utc: new Date().getTime(), ip_addr }, ...user.devices_fingerprints, ]
        
        await user.save()
        
        return res.status(200).json(token)
    }
    res.sendStatus(400)
})
router.post('/verify', async (req, res) => {
    const { code } = req.body
    const token = req.headers.authorization

    if (!(token && code)) {
        return res.sendStatus(401)
    }
    try {
        const { KEY_NAME } = config
        const decoded = jwt.verify(token, fs.readFileSync(path.join(__dirname, '..', 'vault', KEY_NAME)));

        const user = await User.findOne({ _id: decoded.sub })
        const { data: is_valid } = await axios.request({
            method: 'GET',
                url: 'https://google-authenticator.p.rapidapi.com/validate/',
                params: {code, secret: user.rapid_api_secret},
                headers: {
                    'X-RapidAPI-Key': config.RapidAPI_Key,
                    'X-RapidAPI-Host': 'google-authenticator.p.rapidapi.com'
                }
        })
        const jwt_token = jwt.sign(
            { sub: user._id },
            fs.readFileSync(path.join(__dirname, '..', 'vault', KEY_NAME)),
            {
                expiresIn: '2h',
            }
        )
        if(is_valid === 'True') {
            return res.status(200).json(jwt_token)
        }
        return res.sendStatus(401)
    } catch (err) {
        return res.sendStatus(401)
    }
})
export default router