module.exports = (sequelize, DataTypes) => {
    const TeacherExpertise = sequelize.define('TeacherExpertise', {
        idTeacher: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'teachers',
                key: 'idTeacher'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        idExpertise: {
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
        tableName: 'teacher_expertise',
        timestamps: true,
        createdAt: 'addedAt',
        updatedAt: false
    })

    return TeacherExpertise;
}