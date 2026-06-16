import './App.css';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { createContext, useState, useEffect } from 'react';
import cookies from "js-cookie";
import i18n from './Utilities/config/i18n';
import { SocketProvider } from './Utilities/config/useSocket';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import IntroPage from './Partials/Components/IntroPage';
import TeacherLayout from './Layouts/Components/TeacherLayout';
import StudentLayout from './Layouts/Components/StudentLayout';
import ParentLayout from './Layouts/Components/ParentLayout';
import AdminLayout from './Layouts/Components/AdminLayout';
import SignUp from './Pages/Authentication/Components/SignUp';
import Login from './Pages/Authentication/Components/Login';
import axios from 'axios';
import AddChild from './Pages/Authentication/Components/AddChild';
import PostsFeed from './Pages/Home/Pages/PostsFeed';
import Chat from './Pages/Home/Pages/Chat';
import CalendarPage from './Pages/Teacher/Pages/Calendar';
import CreateCourse from './Pages/Teacher/Pages/CreateCourse';
import Courses from './Pages/Teacher/Pages/MyCourses';
// import Notifications from './Pages/Home/Pages/Notifications';
import CourseDisplay from './Pages/Teacher/Pages/CourseDisplay';
import LandingPage from './Pages/Authentication/Components/LandingPage';
import CreateAssignment from './Pages/Teacher/Pages/CreateAssignement';
import CreateTip from './Pages/Teacher/Pages/CreateTip';
import IntrestsPopup from './Pages/Authentication/Components/IntrestsPopup';
import SearchPage from './Pages/Student/Pages/Search';
import StudentActivity from './Pages/Student/Pages/Activity';
import AssignmentSolve from './Pages/Student/Pages/AssignmentSolve';
import MyStudents from './Pages/Teacher/Pages/MyStudents';
import AssignmentReview from './Pages/Teacher/Pages/AssignmentReview';
import MyChildren from './Pages/Parent/Pages/MyChildren';
import CreateChild from './Pages/Parent/Pages/CreateChild';
import ConfirmParent from './Pages/Student/Pages/ConfirmParent';
import Classroom from './Pages/Teacher/Pages/Classroom';
import ClassroomPage from './Pages/Teacher/Pages/ClassroomPage';
import LoginAdmin from './Pages/Authentication/Components/LoginAdmin';
import Dashboard from './Pages/Admin/Pages/Dashboard';
import Users from './Pages/Admin/Pages/Users';
import Reports from './Pages/Admin/Pages/Reports';
import Settings from './Pages/Admin/Pages/Settings';
import Content from './Pages/Admin/Pages/Content';
import Subjects from './Pages/Admin/Components/Subjects';
import Levels from './Pages/Admin/Components/Levels';
import Specialities from './Pages/Admin/Components/Specialities';
import NotFound from './Shared/Pages/NotFound';
import Missions from './Pages/Admin/Components/Missions';
import CollaborativeSession from './Pages/Student/Pages/CollaborativeSession';
import OnlineCourses from './Pages/Teacher/Pages/OnlineCourses';
import CreateOnlineCourse from './Pages/Teacher/Pages/CreateOnlineCourse';
import CreateRessource from './Pages/Student/Pages/CreateRessource';
import MyResources from './Pages/Student/Pages/MyResources';
import Profile from './Pages/Home/Pages/Profile';
import MyPerformance from './Pages/Student/Pages/Performance';
import ChatBot from './Pages/Home/Pages/ChatBot';
import UserPortfolio from './Pages/Home/Pages/UserPortfolio';
import TeacherCourses from './Pages/Teacher/Pages/TeacherCourses';
import StudentResources from './Pages/Student/Pages/StudentResources';

axios.defaults.withCredentials = true;

export const AppContext = createContext();

function App() {

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const [lang, setLang] = useState(cookies.get("i18next") || "ar");

  useEffect(() => {
    window.document.dir = i18n.dir();
  }, [lang]);

  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    setIsRtl(document.documentElement.dir === "rtl");
  }, []);

  const [showIntro, setShowIntro] = useState(true);

  const handleIntroTimeout = () => {
    setShowIntro(false); // Hide the intro screen
  };

  const [userAuth, setUserAuth] = useState({
    userId: 0,
    userName: "",
    familyName: "",
    givenName: "",
    userImg: "",
    role: "anonymous",
    firstAuth: false
  })

  const navigate = useNavigate()
  const [isVerifying, setIsVerifying] = useState(true);

  const PUBLIC_ROUTES = ['/welcome', '/login', '/register', '/login/admin', '/forget-password']; // we define the allowed paths in the case where is not authenticated
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/verify`);
        setUserAuth({
          userId: res.data.id,
          userName: res.data.userName,
          familyName: res.data.familyName,
          givenName: res.data.givenName,
          userImg: res.data.userImg,
          role: res.data.role,
          firstAuth: false
        });
      } catch (err) {
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
          window.location.pathname.startsWith(route)
        );
        if (!isPublicRoute) {
          navigate('/welcome');
        }
        console.log(err);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyUser();
  }, []);


  // Helper function to choose layout based on role
  const getLayout = () => {

    const role = userAuth.role;

    switch (role) {
      case "teacher":
        return <TeacherLayout />;
      case "student":
        return <StudentLayout />;
      case "parent":
        return <ParentLayout />;
      case "admin":
        return <AdminLayout />;
      default:
        return <section>No user</section>;
    }
  };

  const [getPosts, setGetPosts] = useState(false)

  const submitIntrests = (intrestsSelected) => {

    const link = userAuth.role === "teacher" ? `${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/teacher/expertise` : `${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/student/interests`

    axios.defaults.withCredentials = true
    axios.post(link, { interests: intrestsSelected }, {
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(() => {
        setUserAuth({ ...userAuth, firstAuth: false })
        setGetPosts(true)
      })
      .catch((err) => console.error(err.response.data))

  }

  const getHomePage = () => {
    const role = userAuth.role;

    switch (role) {
      case "teacher":
        return <PostsFeed />;
      case "student":
        return <PostsFeed />;
      case "parent":
        return <MyChildren />;
      case "admin":
        return <Dashboard />;
      default:
        return <section>No user</section>;
    }
  }

  if (isVerifying) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff"
      }}>
        {/* Replace with your own logo/spinner */}
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid #f0f0f0",
          borderTop: "4px solid var(--main-color, #F29DB6)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        <p style={{
          marginTop: "1rem",
          fontFamily: "'Nunito', sans-serif",
          color: "#8A8A8A",
          fontSize: "0.95rem"
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, isRtl, setIsRtl, lang, setLang, userAuth, setUserAuth, getPosts, setGetPosts }}>
      {showIntro ? (
        <IntroPage onTimeout={handleIntroTimeout} />
      ) : (
        <SocketProvider >
          <div className={`App ${isRtl ? "app-rtl" : ""}`} id={darkMode ? 'dark-mode' : 'light-mode'}>
            <Routes>

              <Route path='/register' element={<SignUp />} />
              <Route path='/register/add-child' element={<AddChild />} />
              <Route path='/login' element={<Login />} />
              <Route path='/login/admin' element={<LoginAdmin />} />
              <Route path='/forget-password' element={<h1>forget password</h1>} />
              <Route path='/reset-password/:token' element={<h1>reset password</h1>} />
              <Route path='/welcome' element={<LandingPage />} />
              <Route path='/create-child' element={<CreateChild />} />
              <Route path='/confirm-parent' element={<ConfirmParent />} />

              {/* Main route based on role */}
              <Route path="/" element={getLayout()}>
                {/* Placeholder routes */}
                <Route index element={getHomePage()} />
                <Route path="courses" element={<Courses />} />
                <Route path="teacher/:userName/courses" element={<TeacherCourses />} />
                <Route path="courses/:id" element={<CourseDisplay />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="my-students" element={<MyStudents />} />
                <Route path="my-resources" element={<MyResources />} />
                <Route path="student/:userName/resources" element={<StudentResources />} />
                <Route path="chats" element={<Chat />} />
                <Route path="create-course" element={<CreateCourse />} />
                <Route path="create-assignment" element={<CreateAssignment />} />
                <Route path="create-tip" element={<CreateTip />} />
                <Route path="create-online-course" element={<CreateOnlineCourse />} />
                <Route path="share" element={<CreateRessource />} />
                <Route path="ai-bot" element={<ChatBot />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="activities" element={<StudentActivity />} />
                <Route path="activities/solve-assignment/:id" element={<AssignmentSolve />} />
                <Route path="/activities/review-assignment/:solutionId" element={<AssignmentReview />} />
                <Route path="progress" element={<MyPerformance />} />
                <Route path='parent-hub' element={<PostsFeed />} />
                {/* <Route path="dashboard" element={<Dashboard />} /> */}
                <Route path="users" element={<Users />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/subjects" element={<Subjects />} />
                <Route path="settings/subjects/:subjectId" element={<Specialities />} />
                <Route path="settings/levels/:levelId" element={<Missions />} />
                <Route path="settings/levels" element={<Levels />} />
                <Route path="content" element={<Content />} />
                <Route path="profile" element={<Profile />} />
                <Route path="users/:userName/profile" element={<UserPortfolio />} />
                <Route path="classrooms" element={<Classroom />} />
                <Route path='classrooms/:classroomId' element={<ClassroomPage />} />
                <Route path='classrooms/:classroomId/sessions/:sessionId' element={<CollaborativeSession />} />
                <Route path="online-courses" element={<OnlineCourses />} />
              </Route>

              <Route path='*' element={<NotFound />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={10000} />
            {userAuth.firstAuth && (userAuth.role === "teacher" || userAuth.role === "student") && <IntrestsPopup onFinish={submitIntrests} />}
          </div>
        </SocketProvider>
      )}
    </AppContext.Provider>
  );
}

export default App;
