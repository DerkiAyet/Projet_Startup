module.exports = (sequelize, DataTypes) => {
    const StudentInterest = sequelize.define('StudentInterest', { // very important: the model name in sequelize should match the name used in associations or the const in simple words
        idStudent: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'students',
                key: 'idStudent'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        idInterest: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'subjects',
                key: 'idSubject'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
    }, {
        tableName: 'student_interests',
        timestamps: true,
        createdAt: 'addedAt', // optional: rename createdAt
        updatedAt: false      // we don’t need updatedAt in a junction table
    })

    return StudentInterest;
}