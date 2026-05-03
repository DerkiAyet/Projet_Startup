import React, { useContext, useEffect, useState } from 'react'
import '../Styles/SignUp.css'
import MainImg from "../../../Assets/images/signup-photo.png"
import DecorationImg from "../../../Assets/images/arrow-signup-decoration.png"
import { ReactComponent as NextIcon } from "../../../Assets/icons/NavIcons/navigate-next.svg"
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ReactComponent as NameIcon } from "../../../Assets/icons/AuthIcons/name-auth-icon.svg"
import { ReactComponent as BirthIcon } from "../../../Assets/icons/AuthIcons/birth-auth-icon.svg"
import { ReactComponent as EmailIcon } from "../../../Assets/icons/AuthIcons/email-auth-icon.svg"
import { ReactComponent as PwdIcon } from "../../../Assets/icons/AuthIcons/pwd-auth-icon.svg"
import { ReactComponent as GoogleIcon } from "../../../Assets/icons/AuthIcons/social-media-auth-logo.svg"
import { ReactComponent as SignInIcon } from "../../../Assets/icons/AuthIcons/sign-in-auth-icon.svg"
import axios from 'axios'
import { AppContext } from '../../../App'
import { useTranslation, Trans } from 'react-i18next'



function SignUp() {

    const { t } = useTranslation()

    const [strength, setStrength] = useState(0);

    const checkStrength = (password) => {
        let score = 0;
        if (!password) return 0;

        // length
        if (password.length >= 8) score += 1;

        // uppercase
        if (/[A-Z]/.test(password)) score += 1;

        // number
        if (/\d/.test(password)) score += 1;

        // special character
        if (/[\W_]/.test(password)) score += 1;

        return score;
    }

    const getStrengthLabel = (score) => {
        switch (score) {
            case 0: return '';
            case 1: return  t('auth.weak');
            case 2: return  t('auth.fair');
            case 3: return  t('auth.good');
            case 4: return  t('auth.strong');
            default: return '';
        }
    }

    const [userInfos, setUserInfos] = useState({
        role: "",
        familyName: "",
        givenName: "",
        DateOfBirth: "",
        userName: "",
        email: "",
        password: ""
    })
    const [errors, setErrors] = useState({
        familyName: "",
        givenName: "",
        DateOfBirth: "",
        userName: "",
        email: "",
        password: ""
    });

    const [step, setStep] = useState(0)

    const handleBtnSubmit = (e) => { e.preventDefault() }

    const handlFirstStep = (e) => {

        handleBtnSubmit(e)

        const newErrors = {};

        if (!userInfos.familyName.trim()) {
            newErrors.familyName =  t('auth.errors.enterFamilyName');
        }

        if (!userInfos.givenName.trim()) {
            newErrors.givenName =  t('auth.errors.enterGivenName');
        }
        if (!userInfos.DateOfBirth.trim()) {
            newErrors.DateOfBirth =  t('auth.errors.enterBirthDate');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        setErrors({
            familyName: "",
            givenName: "",
            DateOfBirth: "",
            userName: "",
            email: "",
            password: ""
        })

        setStep(step + 1)

    }

    const { setUserAuth } = useContext(AppContext);
    const navigate = useNavigate();

    const handleSubmit = (e) => {

        handleBtnSubmit(e)

        const newErrors = {};

        if (!userInfos.userName.trim()) {
            newErrors.userName = t('auth.errors.enterUsername');
        }

        if (!userInfos.email.trim()) {
            newErrors.email = t('auth.errors.enterEmail');
        }
        if (!userInfos.password.trim()) {
            newErrors.password =  t('auth.errors.enterPassword');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        setErrors({
            familyName: "",
            givenName: "",
            DateOfBirth: "",
            userName: "",
            email: "",
            password: ""
        })

        axios.defaults.withCredentials = true;

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/register`, userInfos, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((res) => {
                setUserAuth({
                    userId: res.data.userId,
                    userName: userInfos.userName,
                    familyName: userInfos.familyName,
                    givenName: userInfos.givenName,
                    userImg: userInfos.userImg,
                    role: userInfos.role,
                    firstAuth: true
                });

                if (userInfos.role !== "parent") {
                    navigate('/')
                } else {
                    navigate('/register/add-child')
                }
            })
            .catch((err) => {
                console.error(err.response?.data);
                if (err.response?.data?.errorUsername) {
                    setErrors({ ...errors, userName:  t('auth.errors.usernameExists') })
                }
                if (err.response?.data?.errorEmail) {
                    setErrors({ ...errors, email:  t('auth.errors.emailInUse') })
                }
            });

    }

    const handleFocus = (fieldName) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            [fieldName]: ""
        }));
    }

    return (
        <div className='signup-container'>
            <div className="signup-wrapper">
                <div className="img-wrapper">
                    <img src={MainImg} alt="signup-form" />
                </div>
                <div className="form-container">
                    <form action="" className='signup-form'>
                        {
                            !userInfos.role ?
                                <motion.div
                                    key="roleSelection"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.4 }}
                                    className='motion-div'
                                >
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
                                                {t('auth.whoIsJoining')}
                                            </span>
                                            <p>
                                                {t('auth.roleDescription')}
                                            </p>
                                        </div>
                                        <img src={DecorationImg} alt='main-road' />
                                    </div>
                                    <div className="choices-box">
                                        <div className="choice-line" id='teacher-role' onClick={() => setUserInfos({ ...userInfos, role: "teacher" })}>
                                            <span>
                                                <Trans
                                                    i18nKey={"auth.teacherRole"}
                                                    components={{
                                                        italic: <span style={{ fontStyle: "italic" }} />
                                                    }}
                                                >
                                                    Teacher: <span style={{ fontStyle: "italic" }}> “Master of knowledge.” </span>
                                                </Trans>
                                            </span>
                                            <NextIcon className="auth-icon" />
                                        </div>
                                        <div className="choice-line" id='student-role' onClick={() => setUserInfos({ ...userInfos, role: "student" })}>
                                            <Trans
                                                i18nKey={"auth.studentRole"}
                                                components={{
                                                    italic: <span style={{ fontStyle: "italic" }} />
                                                }}
                                            >
                                                <span>Student: <span style={{ fontStyle: "italic" }}>“Knowledge hunter.”</span></span>
                                            </Trans>
                                            <NextIcon className="auth-icon" />
                                        </div>
                                        <div className="choice-line" id='parent-role' onClick={() => setUserInfos({ ...userInfos, role: "parent" })}>
                                            <Trans
                                                i18nKey={"auth.parentRole"}
                                                components={{
                                                    italic: <span style={{ fontStyle: "italic" }} />
                                                }}
                                            >
                                                <span>Parent: <span style={{ fontStyle: "italic" }}>“The guardian of progress.”</span>
                                                </span></Trans>
                                            <NextIcon className="auth-icon" />
                                        </div>
                                    </div>
                                    <div className="login-line">
                                        {t('auth.alreadyHaveAccount')} <Link to={"/login"} className='auth-link'>{t('auth.signInLink')}</Link>
                                    </div>
                                </motion.div>
                                :
                                step === 0 ?
                                    <motion.div
                                        key="step0"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className='motion-div'
                                    >
                                        <div className='title-box'>
                                            <div className="top-line">
                                                <div className="return-line" onClick={() => setUserInfos({ ...userInfos, role: "" })}>
                                                    <NextIcon className="go-back-icon" />
                                                    <span>{t('auth.chooseDifferentRole')}</span>
                                                </div>
                                            </div>
                                            <div className="title-line">
                                                <span>
                                                    {t('auth.startYourJourney')}
                                                </span>
                                                <p>
                                                    {t('auth.journeyDescription')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="inputs-box">
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                    {t('auth.familyName')}
                                                </label>
                                                <div className={`input-line ${errors.familyName ? "input-error" : ""}`}>
                                                    <NameIcon className="input-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder={t('auth.familyNamePlaceholder')}
                                                        value={userInfos.familyName}
                                                        onChange={(e) => setUserInfos({ ...userInfos, familyName: e.target.value })}
                                                        onFocus={() => handleFocus("familyName")}
                                                    />
                                                </div>
                                                {errors.familyName && <p className="error-text">{errors.familyName}</p>}
                                            </div>
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                    {t('auth.givenName')}
                                                </label>
                                                <div className={`input-line ${errors.givenName ? "input-error" : ""}`}>
                                                    <NameIcon className="input-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder={t('auth.givenNamePlaceholder')}
                                                        value={userInfos.givenName}
                                                        onChange={(e) => setUserInfos({ ...userInfos, givenName: e.target.value })}
                                                        onFocus={() => handleFocus("givenName")}
                                                    />
                                                </div>
                                                {errors.givenName && <p className="error-text">{errors.givenName}</p>}
                                            </div>
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                    {t('auth.dateOfBirth')}
                                                </label>
                                                <div className={`input-line ${errors.DateOfBirth ? "input-error" : ""}`}>
                                                    <BirthIcon className="input-birth-icon" />
                                                    <input
                                                        type="date"
                                                        placeholder="dd/mm/yyy"
                                                        value={userInfos.DateOfBirth}
                                                        onChange={(e) => setUserInfos({ ...userInfos, DateOfBirth: e.target.value })}
                                                        onFocus={() => handleFocus("DateOfBirth")}
                                                    />
                                                </div>
                                                {errors.DateOfBirth && <p className="error-text">{errors.DateOfBirth}</p>}
                                            </div>
                                            <button className='submit-btn' onClick={handlFirstStep}>
                                                {t('auth.next')}
                                            </button>
                                        </div>
                                        <div className="login-line">
                                            {t('auth.alreadyHaveAccount')} <Link to={"/login"} className='auth-link'>{t('auth.signInLink')}</Link>
                                        </div>
                                        <button className='social-auth-btn'>
                                            <GoogleIcon />
                                            <span>{t('auth.signUpWithGoogle')}</span>
                                        </button>
                                    </motion.div>
                                    :
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.4 }}
                                        className='motion-div'
                                    >
                                        <div className='title-box'>
                                            <div className="top-line">
                                                <div className="return-line" onClick={() => setStep(step - 1)}>
                                                    <NextIcon className="go-back-icon" />
                                                    <span>{t('auth.goBack')}</span>
                                                </div>
                                            </div>
                                            <div className="title-line">
                                                <span>
                                                    {
                                                        userInfos.role === "teacher" ?
                                                            t('auth.welcomeEducator') :
                                                            userInfos.role === "student" ?
                                                                t('auth.welcomeExplorer') :
                                                                t('auth.welcomeSupporter')

                                                    }
                                                </span>
                                                <p>
                                                    {
                                                        userInfos.role === "teacher" ?
                                                            t('auth.educatorDescription') :
                                                            userInfos.role === "student" ?
                                                                t('auth.explorerDescription') :
                                                                t('auth.supporterDescription')

                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="inputs-box">
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                     {t('auth.userName')}
                                                </label>
                                                <div className={`input-line ${errors.userName ? "input-error" : ""}`}>
                                                    <NameIcon className="input-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder= {t('auth.userNamePlaceholder')}
                                                        value={userInfos.userName}
                                                        onChange={(e) => setUserInfos({ ...userInfos, userName: e.target.value })}
                                                        onFocus={() => handleFocus("userName")}
                                                    />
                                                </div>
                                                {errors.userName && <p className="error-text">{errors.userName}</p>}
                                            </div>
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                    {t('auth.email')}
                                                </label>
                                                <div className={`input-line ${errors.email ? "input-error" : ""}`}>
                                                    <EmailIcon className="input-icon" />
                                                    <input
                                                        type="email"
                                                        placeholder={t('auth.emailPlaceholder')}
                                                        autoComplete="off"
                                                        value={userInfos.email}
                                                        onChange={(e) => setUserInfos({ ...userInfos, email: e.target.value })}
                                                        onFocus={() => handleFocus("email")}
                                                    />
                                                </div>
                                                {errors.email && <p className="error-text">{errors.email}</p>}
                                            </div>
                                            <div className="form-input">
                                                <label htmlFor="familyName-user">
                                                    {t('auth.password')}
                                                </label>
                                                <div className={`input-line ${errors.givenName ? "input-error" : ""}`}>
                                                    <PwdIcon className="input-icon" />
                                                    <input
                                                        type="password"
                                                        placeholder={t('auth.passwordPlaceholder')}
                                                        autoComplete="new-password"
                                                        value={userInfos.password}
                                                        onChange={(e) => {
                                                            setUserInfos({ ...userInfos, password: e.target.value });
                                                            setStrength(checkStrength(e.target.value));
                                                        }}
                                                        onFocus={() => handleFocus("password")}
                                                    />
                                                </div>
                                                {
                                                    userInfos.password &&
                                                    <div className="password-strength-bar">
                                                        {[1, 2, 3, 4].map((level) => (
                                                            <div
                                                                key={level}
                                                                className={`strength-segment ${strength >= level ? 'active' : ''}`}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                }
                                                {strength > 0 && (
                                                    <p className="strength-label">
                                                        {t('auth.passwordStrength')} {getStrengthLabel(strength)}
                                                    </p>
                                                )}
                                                {errors.password && <p className="error-text">{errors.password}</p>}
                                            </div>
                                            <button className='submit-btn' type='submit' onClick={handleSubmit}>
                                                <span>{t('auth.signUp')}</span> <SignInIcon />
                                            </button>
                                        </div>
                                        <div className="login-line">
                                            {t('auth.alreadyHaveAccount')} <Link to={"/login"} className='auth-link'>{t('auth.signInLink')}</Link>
                                        </div>
                                        <button className='social-auth-btn'>
                                            <GoogleIcon />
                                            <span>{t('auth.signUpWithGoogle')}</span>
                                        </button>
                                    </motion.div>
                        }
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SignUp
