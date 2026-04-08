module.exports = (sequelize, DataTypes) => {
    const TeacherExpertise = sequelize.define('TeacherExpertise', {
        idTeacher: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Teachers',
                key: 'idTeacher'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        idExpertise: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Subjects',
                key: 'idSubject'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
    }, {
        tableName: 'teacher_expertise',
        timestamps: false,
    })

    return TeacherExpertise;
}