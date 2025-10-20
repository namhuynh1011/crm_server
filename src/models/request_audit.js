'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SupportRequestAudit extends Model {
        static associate(models) {
            // define association here
            SupportRequestAudit.belongsTo(models.User, { foreignKey: 'performed_by', as: 'user' });
            SupportRequestAudit.belongsTo(models.SupportRequest, { foreignKey: 'request_id', as: 'request' });
        }
    }
    SupportRequestAudit.init({
        request_id: DataTypes.UUID,
        action: DataTypes.STRING(128),
        performed_by: DataTypes.UUID,
        performed_at: DataTypes.DATE,
        data: DataTypes.JSON
    }, {
        sequelize,
        modelName: 'SupportRequestAudit',
        tableName: 'request_audits'
    });
    return SupportRequestAudit;
};