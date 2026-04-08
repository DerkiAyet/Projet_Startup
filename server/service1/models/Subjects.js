module.exports = (sequelize, DataTypes) => {
    const Subjects = sequelize.define('Subjects', {
        idSubject: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subImg: {
            type: DataTypes.STRING,
            allowNull: true
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'subjects',
        timestamps: false,
    })

    Subjects.associate = (models) => {

        Subjects.belongsToMany(models.Teachers, {
            through: 'teacher_expertise',
            foreignKey: 'idSubject',
            otherKey: 'idTeacher'
        });

        Subjects.belongsToMany(models.Students, {
            through: 'student_interests',
            foreignKey: 'idInterest',
            otherKey: 'idStudent'
        });

    }

    return Subjects;
}