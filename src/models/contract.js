'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Contract extends Model {
        static associate(models) {
            Contract.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
            Contract.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    Contract.init({
        contract_code: DataTypes.STRING,
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        contract_value: DataTypes.DECIMAL,
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE,
        status: DataTypes.ENUM('Draft', 'Pending', 'Active', 'Expired', 'Cancelled'),
        payment_terms: DataTypes.TEXT,
        customer_id: DataTypes.UUID,
        user_id: DataTypes.UUID
    }, {
        sequelize,
        modelName: 'Contract',
    });
    return Contract;
};