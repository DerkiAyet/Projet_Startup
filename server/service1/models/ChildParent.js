module.exports = (sequelize, DataTypes) => {
    const ChildParent = sequelize.define('ChildParent', {
        idParent: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Parents',
                key: 'idParent'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            primaryKey: true,
        },
        idStudent: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Students',
                key: 'idStudent'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            primaryKey: true,
        },
        pending: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'child_parent',
        timestamps: true,
        createdAt: 'addedAt', 
        updatedAt: false   
    })

    return ChildParent;

}