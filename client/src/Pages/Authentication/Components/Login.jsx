import React, { useState, useContext } from 'react'
import "../Styles/Login.css"
import { ReactComponent as NameIcon } from "../../../Assets/icons/AuthIcons/name-auth-icon.svg"
import { ReactComponent as PwdIcon } from "../../../Assets/icons/AuthIcons/pwd-auth-icon.svg"
import { ReactComponent as GoogleIcon } from "../../../Assets/icons/AuthIcons/social-media-auth-logo.svg"
import { ReactComponent as SignInIcon } from "../../../Assets/icons/AuthIcons/sign-in-auth-icon.svg"

import MainImg from "../../../Assets/images/signup-photo.png"
import DecorationImg from "../../../Assets/images/arrow-signup-decoration.png"
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../../../App'
import { useTranslation } from 'react-i18next'


function Login() {

  const { t } = useTranslation()

  const [credentials, setCredentials] = useState({
    identifier: "",
    password: ""
  })
  const [errors, setErrors] = useState({
    identifier: "",
    password: ""
  });

  const { setUserAuth } = useContext(AppContext);

  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const handleLogin = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!credentials.identifier.trim()) {
      newErrors.identifier = t('auth.usernameOrEmailPlaceholder');
    }

    if (!credentials.password.trim()) {
      newErrors.password = t('auth.errors.enterPassword');
    }

    // If there are errors → show UI errors, stop function
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({ identifier: "", password: "" });

    axios.post("http://localhost:8080/auth/login", credentials, {
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => {

        console.log(res.data)

        setUserAuth({
          userId: res.data.userId,
          userName: res.data.userName,
          familyName: res.data.familyName,
          givenName: res.data.givenName,
          userImg: res.data.userImg,
          role: res.data.role,
          firstAuth: false
        });

        navigate("/");
      })
      .catch((err) => {
        console.error(err.response?.data);

        if (err.response?.data?.errorUser) {
          setErrors({ ...errors, identifier: t('auth.userNotFound') })
        }

        if (err.response?.data?.errorPassword) {
          setErrors({ ...errors, password: t('auth.wrongPassword') })
        }

      });
  };

  const handleFocus = (fieldName) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: ""
    }));
  }


  return (
    <div className='login-container'>
      <div className="login-wrapper">
        <div className="img-wrapper">
          <img src={MainImg} alt="signup-form" />
        </div>

        <div className="form-container">
          <form action="" className='login-form'>
            <div className='title-box'>
              <div className="top-line">
                <div className="logo-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 10.0001V16.0001M6.00004 12.5001V16.0001C6.00004 16.7958 6.63218 17.5588 7.7574 18.1214C8.88262 18.684 10.4087 19.0001 12 19.0001C13.5913 19.0001 15.1175 18.684 16.2427 18.1214C17.3679 17.5588 18 16.7958 18 16.0001V12.5001M21.42 10.9221C21.5991 10.8431 21.751 10.7134 21.857 10.5489C21.963 10.3845 22.0184 10.1925 22.0164 9.99685C22.0143 9.8012 21.955 9.61044 21.8456 9.4482C21.7362 9.28596 21.5817 9.15937 21.401 9.08411L12.83 5.18011C12.5695 5.06126 12.2864 4.99976 12 4.99976C11.7137 4.99976 11.4306 5.06126 11.17 5.18011L2.60004 9.08011C2.42201 9.15809 2.27056 9.28625 2.16421 9.44893C2.05786 9.61161 2.00122 9.80176 2.00122 9.99611C2.00122 10.1905 2.05786 10.3806 2.16421 10.5433C2.27056 10.706 2.42201 10.8341 2.60004 10.9121L11.17 14.8201C11.4306 14.939 11.7137 15.0005 12 15.0005C12.2864 15.0005 12.5695 14.939 12.83 14.8201L21.42 10.9221Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="title-line">
                <span>
                  {t('auth.welcomeBack')}
                </span>
                <p>
                  {t('auth.loginDescription')}
                </p>
              </div>
              <img src={DecorationImg} />
            </div>
            <div className="inputs-box">
              <div className="form-input">
                <label htmlFor="identifier-user">
                  {t('auth.usernameOrEmail')}
                </label>
                <div className={`input-line ${errors.identifier ? "input-error" : ""}`}>
                  <NameIcon />
                  <input
                    type="email"
                    placeholder={t('auth.usernameOrEmailPlaceholder')}
                    autoComplete="off"
                    onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
                    onFocus={() => handleFocus("identifier")}
                  />
                </div>
                {errors.identifier && <p className="error-text">{errors.identifier}</p>}
              </div>
              <div className="form-input">
                <label htmlFor="pwd-user">
                  {t('auth.password')}
                </label>
                <div className={`input-line ${errors.password ? "input-error" : ""}`}>
                  <PwdIcon />
                  <input
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete="new-password"
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    onFocus={() => handleFocus("password")}
                  />
                </div>
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
              <button className='submit-btn' type='submit' onClick={handleLogin}>
                <span>{t('auth.signIn')}</span> <SignInIcon />
              </button>
            </div>
            <div className="signup-line">
              {t('auth.dontHaveAccount')} <Link to={"/register"} className='auth-link'>{t('auth.signUp')}</Link>
            </div>
            <button className='social-auth-btn'>
              <GoogleIcon />
              <span>{t('auth.signUpWithGoogle')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
