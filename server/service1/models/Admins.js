module.exports = (sequelize, DataTypes) => {
    const Admins = sequelize.define('Admins', {
        idAdmin: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        givenName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        familyName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Must be a valid email address"
                }
            }
        },
        pwd: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isActive: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: true 
        }
    }, {
        tableName: 'admins',
        timestamps: true
    });

    return Admins;
};
