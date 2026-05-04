module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true, 
            autoIncrement: true,
            autoIncrement: true
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        familyName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        givenName: {
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
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('anonymous', 'teacher', 'student', 'parent', 'admin'),
            allowNull: false,
            defaultValue: 'anonymous'
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        uerImg: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'prefer not to say'),
            allowNull: true
        },
        address: {
            type: DataTypes.JSON,
            allowNull: true
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                is: /^[+0-9\s\-()]+$/i,
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
        tableName: 'users',
        timestamps: true,
    })

    Users.associate = (models) => {
        Users.hasOne(models.Adresses, {
            foreignKey: 'userId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
    
    return Users;

}