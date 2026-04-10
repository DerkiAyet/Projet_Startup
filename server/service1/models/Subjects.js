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
            through: models.TeacherExpertise,
            foreignKey: 'idExpertise',
            otherKey: 'idTeacher'
        });

        Subjects.belongsToMany(models.Students, {
            through: models.StudentInterest, // Use the model, not string!
            foreignKey: 'idInterest', // This is the key in the through table that references Subjects
            otherKey: 'idStudent'     // This references Students
        });

    }

    return Subjects;
}