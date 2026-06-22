module.exports = (sequelize, DataTypes) => {
    const Reports = sequelize.define('Reports', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        about: { 
            type: DataTypes.ENUM('post', 'comment', 'content', 'user'),
            allowNull: false
        },
        refId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        refType: {
            type: DataTypes.ENUM('course', 'assignment', 'tip', 'resource', 'onlineCourse'),
            allowNull: true
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        processedByAdmin: {
            type: DataTypes.INTEGER,
            defaultValue: null
        }
    }, {
        tableName: 'reports',
        timestamps: true,
    })

    Reports.associate = (models) => {
        Reports.hasOne(models.Warnings, {
            foreignKey: 'reportId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }

    Reports.associate = (models) => {
        Reports.hasOne(models.ContentModerationAction, {
            foreignKey: 'reportId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }

    return Reports
}