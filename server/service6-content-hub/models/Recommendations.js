module.exports = (sequelize, DataTypes) => {
    const Recommendations = sequelize.define('Recommendations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            autoIncrement: true
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        contentId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contentType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contentTitle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        subCategoryId: {
            type: DataTypes.INTEGER,
            defaultValue: false
        },
        viewedByStudent: {
            type: DataTypes.BOOLEAN,
            default: false
        }
    }, {
        tableName: 'recommendations',
        timestamps: true,
    })

    return Recommendations
}