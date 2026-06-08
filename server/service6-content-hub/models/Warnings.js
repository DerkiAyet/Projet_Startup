module.exports = (sequelize, DataTypes) => {
    const Warnings = sequelize.define('Warnings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reportId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'reports', key: 'id' }
        },
        targetId: {
            type: DataTypes.INTEGER,
            allowNull: false  // the user being warned
        },
        sentByAdmin: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('warning', 'suspension', 'ban'),
            defaultValue: 'warning'
        }
    }, {
        tableName: 'warnings',
        timestamps: true
    })

    Warnings.associate = (models) => {
        Warnings.belongsTo(models.Reports, {
            foreignKey: 'reportId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }

    return Warnings
}