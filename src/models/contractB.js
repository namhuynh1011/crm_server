'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ContractB extends Model {
        static associate(models) {
            ContractB.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
            ContractB.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    ContractB.init({
        title: DataTypes.STRING,
        customerId: DataTypes.UUID,
        userId: DataTypes.UUID,
        fileHash: DataTypes.STRING,
        blockchainTx: DataTypes.STRING,
        contractIdOnChain: DataTypes.INTEGER,
        filePath: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'ContractB',
        tableName: 'ContractBs',
        underscored: false
    });
    return ContractB;
};