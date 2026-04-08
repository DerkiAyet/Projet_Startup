module.exports = (sequelize, DataTypes) => {
    const Parents = sequelize.define('Parents', {
        idParent: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        familyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        givenName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'parents',
        timestamps: true,
    })

    Parents.associate = (models) => {

        Parents.belongsToMany(models.Students, {
            through:  'child_parent',
            foreignKey: 'idParent', // join the table with the current user id as the foreign key
            otherKey: 'idStudent' // join the table with the student id as the other foreign key
        });

    }

    return Parents;

}