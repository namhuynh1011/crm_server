import db from '../models'
import { v4 } from 'uuid'
import { Op } from 'sequelize';
// Create a new customer
export const createCustomerService = async (fullname, email, phone, address, createdBy) => new Promise(async (resolve, reject) => {
    try {
        if (!fullname || !email) {
            return resolve({
                err: 1,
                msg: 'Fullname and email are required!'
            })
        }
        const existed = await db.Customer.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { phone }
                ]
            }
        });
        if (existed) {
            return resolve({
                err: 2,
                msg: 'Email or phone is already in use!'
            });
        }
        const customer = await db.Customer.create({
            id: v4(),
            fullname,
            email,
            phone,
            address,
            createdBy
        })
        if (customer) {
            resolve({
                err: 0,
                msg: 'Create customer successfully!',
                customer
            })
        }
    } catch (error) {
        reject({
            err: 3,
            msg: 'Failed to create customer: ' + error
        })
    }
})
//Delete a customer
export const deleteCustomerService = async (customerId) => new Promise(async (resolve, reject) => {
    try {
        if (!customerId) {
            return resolve({
                err: 1,
                msg: 'Missing customer Id'
            })
        }
        const customer = await db.Customer.findOne({ where: { id: customerId } });
        if (!customer) {
            return resolve({
                err: 2,
                msg: 'Customer not found'
            })
        }
        await db.Customer.destroy({ where: { id: customerId } });
        return resolve({
            err: 0,
            msg: 'Delete customer successfully!'
        })
    } catch (error) {
        reject({
            err: 3,
            msg: 'Failed to delete customer: ' + error
        })
    }
})
//List all customers
export const listCustomersService = async () => new Promise(async (resolve, reject) => {
    try {
        const customers = await db.Customer.findAll({ order: [['createdAt', 'DESC']] });
        return resolve({
            err: 0,
            msg: 'OK',
            customers
        })
    } catch (error) {
        reject({
            err: 3,
            msg: 'Failed to list customers: ' + error
        })
    }
})
//Customer detail
export const getCustomerDetailService = async (customerId) => new Promise(async (resolve, reject) => {
    try {
        if (!customerId) {
            return resolve({
                err: 1,
                msg: 'Missing customer Id'
            })
        }
        const customer = await db.Customer.findByPk(customerId);
        if (!customer) {
            return resolve({
                err: 2,
                msg: 'Customer not found'
            })
        }
        return resolve({
            err: 0,
            msg: 'OK',
            customer
        })
    } catch (error) {
        reject({
            err: 3,
            msg: 'Failed to get customer detail: ' + error
        })
    }
})
//Get Customer Of User
export const getCustomerOfUserService = async (userId) => new Promise(async (resolve, reject) => {
    try {
        if (!userId) {
            return resolve({
                err: 1,
                msg: 'Missing user Id'
            })
        }
        const customers = await db.Customer.findAll({ where: { createdBy: userId }, order: [['createdAt', 'DESC']] });
        return resolve({
            err: 0,
            msg: 'OK',
            customers
        })
    } catch (error) {
        reject({
            err: 3,
            msg: 'Failed to get customers of user: ' + error
        })
    }
})
// Search customers by name
export const searchCustomerByNameService = async (name) => {
    try {
        if (!name) {
            return {
                err: 1,
                msg: 'Missing name to search'
            };
        }
        const customers = await db.Customer.findAll({
            where: {
                fullname: { [Op.like]: `%${name}%` }
            },
            order: [['createdAt', 'DESC']]
        });
        return {
            err: 0,
            msg: 'OK',
            customers
        };
    } catch (error) {
        // Ghi log lỗi chi tiết
        console.error('Search customer error:', error);
        return {
            err: 3,
            msg: 'Failed to search customers: ' + (error.message || JSON.stringify(error))
        };
    }
};