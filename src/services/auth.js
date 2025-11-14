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
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.SECRET_KEY, { expiresIn: '1d' });
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
export const loginService = async (email, password) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.User.findOne({ where: { email }, raw: true });
        if (!response) {
            return resolve({
                err: 2,
                msg: 'Email or password is incorrect!',
                token: null
            });
        }
        const isCorrectPassword = bcrypt.compareSync(password, response.password);
        if (!isCorrectPassword) {
            return resolve({
                err: 2,
                msg: 'Email or password is incorrect!',
                token: null
            });
        }
        if (response.isBlocked) {
            return resolve({ err: 3, msg: 'Your account has been blocked!' });
        }
        const token = jwt.sign(
            {
                id: response.id,
                fullName: response.fullName,
                email: response.email,
                role: response.role
            },
            process.env.SECRET_KEY,
            { expiresIn: '1d' }
        );
        resolve({
            err: 0,
            msg: 'Login successfully!',
            token
        });
    } catch (error) {
        reject(error);
    }
});

export const changePasswordService = async (userId, password, newPassword) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.User.findOne({ where: { id: userId }, raw: true });
        if (!user) {
            return resolve({
                err: 1,
                msg: 'User not found!'
            })
        }
        const isCorrectPassword = bcrypt.compareSync(password, user.password);
        if (!isCorrectPassword) {
            return resolve({
                err: 2,
                msg: 'Current password is incorrect!'
            })
        }
        const hashNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(12));
        await db.User.update({ password: hashNewPassword }, { where: { id: userId } });
        resolve({
            err: 0,
            msg: 'Change password successfully!'
        })
    } catch (error) {
        reject(error);
    }
})

export const updateUserService = async (userId, { fullName, avatar }) =>new Promise(async (resolve, reject) => {
    try {
        if(!userId) return resolve({ err: 1, msg: 'User ID is required!' });
        const user = await db.User.findByPk(userId);
        if (!user) return resolve({ err: 1, msg: 'User not found!' });

        if(fullName)user.fullName = fullName;
        if(avatar)user.avatar = avatar;
        await user.save();
        resolve({ err: 0, msg: 'Update user successfully!', user });
    } catch (error) {
        reject({ err: 1, msg: 'Failed to update user: ' + error });
    }
});