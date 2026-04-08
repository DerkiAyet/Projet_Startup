module.exports = (sequelize, DataTypes) => {
    const Teachers = sequelize.define('Teachers', {
        idTeacher: {
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
        placeOfWork: {
            type: DataTypes.STRING,
            allowNull: true
        },
        grade: {
            type: DataTypes.ENUM(
                'plateform_teacher',    // for online teaching platforms (the default value)
                'pre_school',       // preschool / kindergarten
                'primary',          // elementary school
                'middle_school',    // middle / junior high
                'high_school',      // high / senior high
                'undergraduate',    // university bachelor
                'postgraduate',     // master / PhD
                'other'             // for non-standard or miscellaneous
            ),
            allowNull: false,
            defaultValue: 'plateform_teacher'
        }

    }, {
        tableName: 'teachers',
        timestamps: true,
    })

    Teachers.associate = (models) => {

        Teachers.belongsToMany(models.Subjects, {
            through: 'teacher_expertise',
            foreignKey: 'idTeacher',
            otherKey: 'idSubject'
        });

    }

    return Teachers;
}