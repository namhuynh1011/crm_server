import db from '../models';
import jwt from 'jsonwebtoken'
import { v4 } from 'uuid'
import bcrypt from 'bcryptjs'
require('dotenv').config()
const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(12));
//Lấy danh sach tất cả người dùng
export const getAllUsersService = () => new Promise(async (resolve, reject) => {
    try {
        const users = await db.User.findAll({
            where: {role: {[db.Sequelize.Op.ne]: 'admin'}},
            attributes: { exclude: ['password'] },
        });
        resolve({
            err: 0,
            msg: 'Get all users successfully!',
            data: users
        });
    } catch (error) {
        reject(error);
    }
});

export const getUserByIdService = (userId) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password'] }
        });
        if (!user) return resolve({ err: 1, msg: 'User not found!' }); // phải dùng resolve để trả promise
        return resolve({ err: 0, msg: 'Get user successfully!', user });
    } catch (error) {
        return reject({ err: 1, msg: 'Failed to get user: ' + error });
    }
});

export const deleteUserService = async (id) => {
    try {
        const deleted = await db.User.destroy({ where: { id } });
        if (!deleted) return { err: 1, msg: 'User not found or cannot delete!' };
        return { err: 0, msg: 'Delete user successfully!' };
    } catch (error) {
        return { err: 1, msg: 'Failed to delete user: ' + error };
    }
}

export const blockUserService = async (id, status) => {
    try {
        const user = await db.User.findByPk(id);
        if (!user) return { err: 1, msg: 'User not found!' };
        user.isBlocked = status;
        await user.save();
        return { err: 0, msg: status ? 'User blocked!' : 'User unblocked!' };
    } catch (error) {
        return { err: 2, msg: 'Failed to change user status: ' + error };
    }
};

export const createUserService = async ({fullname, email, password, role}) =>new Promise(async (resolve, reject) => {
    try {
        if(!email){
            return resolve({err: 1, msg: 'Email is required!'})
        }
        const userData = {
            id: v4(),
            fullname,
            email,
            password: hashPassword(password),
            role,
        };
        const [user, created] = await db.User.findOrCreate({
            where: { email },
            defaults: userData
        });
        if(created){
           const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.SECRET_KEY, { expiresIn: '1d' });
           resolve({
                err: 0,
                msg: 'Create user successfully!',
                token
            });
        }else{
            return resolve({ err: 1, msg: 'User already exists!', token });
        }
    } catch (error) {
        return resolve({ err: 1, msg: 'Failed to create user: ' + error });
    }
})

