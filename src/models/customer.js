'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      // define association here
      Customer.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
  }
  Customer.init({
    fullname: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    createdBy: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Customer',
  });
  return Customer;
};