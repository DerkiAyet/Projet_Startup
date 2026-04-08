module.exports = (sequelize, DataTypes) => {
    const Adresses = sequelize.define('Adresses', {
        addressLine1: {
            type: DataTypes.STRING,
            allowNull: true
        },
        addressLine2: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true // some countries don’t use regions/states
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true,  // store ISO country code, not full name
            validate: {
                len: [2, 2],   // "US", "FR", "DZ"
                msg: "Use 2-letter ISO country codes"
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    }, {
        tableName: 'adresses',
        timestamps: false
    })

    Adresses.associate = (models) => {
        Adresses.belongsTo(models.Users, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
    };

    return Adresses;

}