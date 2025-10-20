'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SupportRequest extends Model {
        static associate(models) {
            // define association here
            SupportRequest.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'user' });
            SupportRequest.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
        }
    }
    SupportRequest.init({
        fullname: DataTypes.STRING,
        email: DataTypes.STRING,
        subject: DataTypes.STRING,
        message: DataTypes.TEXT,
        request_type: DataTypes.ENUM('complaints', 'advices', 'inquiries', 'feedback', 'others'),
        priority: DataTypes.ENUM('low', 'medium', 'high'),
        status: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        note: DataTypes.TEXT,
        customer_id: DataTypes.UUID,
        assigned_to: DataTypes.UUID
    }, {
        sequelize,
        modelName: 'SupportRequest',
        tableName: 'support_requests',
    });
    return SupportRequest;
};