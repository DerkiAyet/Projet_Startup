import React, { useState, useContext } from 'react'
import "../Styles/Login.css"
import { ReactComponent as NameIcon } from "../../../Assets/icons/AuthIcons/name-auth-icon.svg"
import { ReactComponent as PwdIcon } from "../../../Assets/icons/AuthIcons/pwd-auth-icon.svg"
import { ReactComponent as SignInIcon } from "../../../Assets/icons/AuthIcons/sign-in-auth-icon.svg"
import { ReactComponent as AppLogo } from '../../../Assets/images/favicon-40.svg'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../../../App'
import { useTranslation } from 'react-i18next'


function LoginAdmin() {

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

    axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/login/admin`, credentials, {
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
          setErrors({ ...errors, identifier: t('auth.errors.userNotFound') })
        }

        if (err.response?.data?.errorPassword) {
          setErrors({ ...errors, password: t('auth.errors.wrongPassword') })
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
    <div className='login-admin-container'>
      <div className="login-wrapper">
        <div className="form-container">
          <form action="" className='login-form'>
            <div className='title-box'>
              <div className="top-line">
                <div className="logo-content">
                  <AppLogo />
                </div>
              </div>
              <div className="title-line">
                <span>
                  {t('auth.welcomeBackAdmin')}
                </span>
                <p>
                  {t('auth.loginDescriptionAdmin')}
                </p>
              </div>
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginAdmin
