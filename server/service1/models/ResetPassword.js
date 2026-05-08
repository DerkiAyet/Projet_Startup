module.exports = (sequelize, DataTypes) => {
    const ResetPassword = sequelize.define("ResetPassword", { // very important: the model name in sequelize should match the name used in associations or the const in simple words
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },

        token: {
            type: DataTypes.STRING,
            allowNull: false
        },

        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'reset_pwds',
        timestamps: true,
    })

    return ResetPassword;
}