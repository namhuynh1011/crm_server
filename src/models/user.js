'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.hasMany(models.Customer, { foreignKey: 'createdBy', as: 'customers' });
      User.hasMany(models.Contract, { foreignKey: 'user_id', as: 'contracts' });
    }
  }
  User.init({
    fullname: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.ENUM('admin', 'employee', 'customer'),
    avatar: DataTypes.STRING,
    isBlocked: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};