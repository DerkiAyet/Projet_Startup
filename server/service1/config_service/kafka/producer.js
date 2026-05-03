const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:29092']
}); 

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('[Kafka] Producer connected');
};

const publishUsers = async (user) => {
  await producer.send({
    topic: 'users.sync',
    messages: [{
      key: String(user.id),
      value: JSON.stringify({
        event: 'USER_UPDATED',
        data: {
          id: user.id,
          userName: user.userName,
          familyName: user.familyName,
          givenName: user.givenName,
          email: user.email,
          role: user.role,
          dateOfBirth: user.dateOfBirth,
        },  // exclude sensitive fields like password
        timestamp: Date.now()
      })
    }]
  });
};

const publishSubject = async (subject) => {
  await producer.send({
    topic: 'subjects.sync',
    messages: [{
      key: String(subject.idSubject),
      value: JSON.stringify({
        event: 'SUBJECT_UPDATED',
        data: subject,
        timestamp: Date.now()
      })
    }]
  });
};

const publishSubSubject = async (subSubject) => {
  await producer.send({
    topic: 'sub-subjects.sync',
    messages: [{
      key: String(subSubject.idSub),
      value: JSON.stringify({
        event: 'SUB_SUBJECT_UPDATED',
        data: subSubject,
        timestamp: Date.now()
      })
    }]
  });
};

const publishStudentInterests = async (studentId, interestIds) => {
  // Un seul message qui contient TOUS les interests du student
  await producer.send({
    topic: 'student-interests.sync',
    messages: [{
      key: String(studentId),          // ← clé = studentId suffit
      value: JSON.stringify({
        event: 'STUDENT_INTERESTS_UPDATED',
        data: {
          idStudent: studentId,
          interestIds: interestIds      // ← tableau complet [1, 3, 5]
        },
        timestamp: Date.now()
      })
    }]
  });
};

const publishTeacherExpertise = async (teacherId, expertiseIds) => {
  await producer.send({
    topic: 'teacher-expertise.sync',
    messages: [{
      key: String(teacherId),
      value: JSON.stringify({
        event: 'TEACHER_EXPERTISE_UPDATED',
        data: {
          idTeacher: teacherId,
          expertiseIds: expertiseIds    // ← tableau complet [2, 4]
        },
        timestamp: Date.now()
      })
    }]
  });
};

module.exports = { connectProducer, publishSubject, publishSubSubject, publishUsers, publishStudentInterests, publishTeacherExpertise };