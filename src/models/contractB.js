'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ContractB extends Model {
        static associate(models) {
            ContractB.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
            ContractB.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    ContractB.init({
        title: DataTypes.STRING,
        customerId: DataTypes.UUID,
        userId: DataTypes.UUID,
        fileHash: DataTypes.STRING,
        blockchainTx: DataTypes.STRING,
        filePath: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'ContractB',
        tableName: 'ContractBs',
    });
    return ContractB;
};