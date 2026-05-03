import './App.css';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { createContext, useState, useEffect } from 'react';
import cookies from "js-cookie";
import i18n from './Utilities/config/i18n';
import { SocketProvider } from './Utilities/config/useSocket';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  useEffect(() => {
    const verifyUser = async () => {
      try {
        axios.defaults.withCredentials = true;

        const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/verify`);

        console.log("GATEWAY URL:", process.env.REACT_APP_API_URL_GATEWAY);

        setUserAuth({
          userId: res.data.userId,
          userName: res.data.userName,
          familyName: res.data.familyName,
          givenName: res.data.givenName,
          userImg: res.data.userImg,
          role: res.data.role,
          firstAuth: false
        });

      } catch (err) {
        // setUserAuth({
        //   userName: "ayet_derki",
        //   familyName: "Derki",
        //   givenName: "Ayet",
        //   userImg: null,
        //   role: "teacher",
        //   firstAuth: false
        // });
        navigate('/welcome')
        console.log(err);
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
        return <section> dashbord of admin </section>;
      default:
        return <section>No user</section>;
    }
  }

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, isRtl, setIsRtl, lang, setLang, userAuth, setUserAuth, getPosts, setGetPosts }}>
      <SocketProvider >
        <div className={`App ${isRtl ? "app-rtl" : ""}`} id={darkMode ? 'dark-mode' : 'light-mode'}>
          <Routes>

            <Route path='/register' element={<SignUp />} />
            <Route path='/register/add-child' element={<AddChild />} />
            <Route path='/login' element={<Login />} />
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
              <Route path="courses/:id" element={<CourseDisplay />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="my-students" element={<MyStudents />} />
              <Route path="chats" element={<Chat />} />
              <Route path="create-course" element={<CreateCourse />} />
              <Route path="create-assignment" element={<CreateAssignment />} />
              <Route path="create-tip" element={<CreateTip />} />
              <Route path="ai-bot" element={<section className='main-container'>AI Assistant</section>} />
              <Route path="search" element={<SearchPage />} />
              <Route path="activities" element={<StudentActivity />} />
              <Route path="activities/solve-assignment/:id" element={<AssignmentSolve />} />
              <Route path="/activities/review-assignment/:solutionId" element={<AssignmentReview />} />
              <Route path="progress" element={<section className='main-container'>Progress & Achievements</section>} />
              <Route path="ocr" element={<section className='main-container'>OCR Scanner</section>} />
              <Route path="share" element={<section className='main-container'>Share Resources</section>} />
              <Route path='parent-hub' element={<PostsFeed />} />
              <Route path="dashboard" element={<section className='main-container'>Dashboard</section>} />
              <Route path="users" element={<section className='main-container'>Users</section>} />
              <Route path="reports" element={<section className='main-container'>Reports</section>} />
              <Route path="profile" element={<section className='main-container'>Profile</section>} />
            </Route>
          </Routes>
          <ToastContainer position="top-right" autoClose={10000} />
          {userAuth.firstAuth && (userAuth.role === "teacher" || userAuth.role === "student") && <IntrestsPopup onFinish={submitIntrests} />}
        </div>
      </SocketProvider>
    </AppContext.Provider>
  );
}

export default App;
