import db from '../models'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 } from 'uuid'
require('dotenv').config()

const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(12))

export const registerService = async (fullname, email, password, role) => new Promise(async (resolve, reject) => {
    try {
        if (!email) {
            return resolve({
                err: 1,
                msg: 'Email is required!'
            })
        }
        const userData = {
            id: v4(),
            fullname,
            email,
            password: hashPassword(password),
            role,
        }
        const [user, created] = await db.User.findOrCreate({
            where: { email },
            defaults: userData
        })

        if (created) {
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1d' });
            resolve({
                err: 0,
                msg: 'Register successfully!',
                token
            });
        } else {
            resolve({
                err: 2,
                msg: 'Email is already in use!',
                token: null
            });
        }
    } catch (error) {
        reject(error)
    }
});