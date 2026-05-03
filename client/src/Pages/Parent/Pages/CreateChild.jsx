import React, { useContext, useState } from 'react'
import '../Styles/CreateChild.css'
import MainImg from "../../../Assets/images/signup-photo.png"
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ReactComponent as NameIcon } from "../../../Assets/icons/AuthIcons/name-auth-icon.svg"
import { ReactComponent as BirthIcon } from "../../../Assets/icons/AuthIcons/birth-auth-icon.svg"
import { ReactComponent as EmailIcon } from "../../../Assets/icons/AuthIcons/email-auth-icon.svg"
import DoneImg from "../../../Assets/images/done.png"
import axios from 'axios'
import { AppContext } from '../../../App'
import { useTranslation } from 'react-i18next'



function CreateChild() {

    const { t } = useTranslation()
    const { userAuth } = useContext(AppContext);

    const [childInfos, setChildInfos] = useState({
        familyName: userAuth.familyName,
        givenName: "",
        DateOfBirth: "",
        email: "",
    })

    const [errors, setErrors] = useState({
        familyName: "",
        givenName: "",
        DateOfBirth: "",
        email: "",
    });

    const [step, setStep] = useState(0)

    const handleBtnSubmit = (e) => { e.preventDefault() }

    const navigate = useNavigate();

    const handleSubmit = (e) => {

        handleBtnSubmit(e)

        const newErrors = {};

        if (!childInfos.familyName.trim()) {
            newErrors.familyName = t('auth.errors.enterFamilyName');
        }

        if (!childInfos.givenName.trim()) {
            newErrors.givenName = t('auth.errors.enterGivenName');
        }
        if (!childInfos.DateOfBirth.trim()) {
            newErrors.DateOfBirth = t('auth.errors.enterBirthDate');
        }
        if (!childInfos.email.trim()) {
            newErrors.email = t('auth.errors.enterEmail');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        setErrors({
            familyName: "",
            givenName: "",
            DateOfBirth: "",
            email: "",
        })

        axios.defaults.withCredentials = true;

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/infos/confirm-parent`, childInfos, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((res) => {
                setStep((prev) => prev + 1)
            })
            .catch((err) => {
                console.error(err.response?.data);
                if (err.response?.data?.errorEmail) {
                    setErrors({ ...errors, email: t('auth.errors.emailInUse') })
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
        <div className='create-child-container'>
            <div className="create-child-wrapper">
                <div className="img-wrapper">
                    <img src={MainImg} alt="create-child-form" />
                </div>
                <div className="form-container">
                    <form action="" className='create-child-form'>
                        {
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
                                            <div className="logo-content">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M22 10.0001V16.0001M6.00004 12.5001V16.0001C6.00004 16.7958 6.63218 17.5588 7.7574 18.1214C8.88262 18.684 10.4087 19.0001 12 19.0001C13.5913 19.0001 15.1175 18.684 16.2427 18.1214C17.3679 17.5588 18 16.7958 18 16.0001V12.5001M21.42 10.9221C21.5991 10.8431 21.751 10.7134 21.857 10.5489C21.963 10.3845 22.0184 10.1925 22.0164 9.99685C22.0143 9.8012 21.955 9.61044 21.8456 9.4482C21.7362 9.28596 21.5817 9.15937 21.401 9.08411L12.83 5.18011C12.5695 5.06126 12.2864 4.99976 12 4.99976C11.7137 4.99976 11.4306 5.06126 11.17 5.18011L2.60004 9.08011C2.42201 9.15809 2.27056 9.28625 2.16421 9.44893C2.05786 9.61161 2.00122 9.80176 2.00122 9.99611C2.00122 10.1905 2.05786 10.3806 2.16421 10.5433C2.27056 10.706 2.42201 10.8341 2.60004 10.9121L11.17 14.8201C11.4306 14.939 11.7137 15.0005 12 15.0005C12.2864 15.0005 12.5695 14.939 12.83 14.8201L21.42 10.9221Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="title-line">
                                            <span>
                                                Create Your Child's Account
                                            </span>
                                            <p>
                                                Enter your child's credentials
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
                                                    value={childInfos.familyName}
                                                    onChange={(e) => setChildInfos({ ...childInfos, familyName: e.target.value })}
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
                                                    value={childInfos.givenName}
                                                    onChange={(e) => setChildInfos({ ...childInfos, givenName: e.target.value })}
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
                                                    value={childInfos.DateOfBirth}
                                                    onChange={(e) => setChildInfos({ ...childInfos, DateOfBirth: e.target.value })}
                                                    onFocus={() => handleFocus("DateOfBirth")}
                                                />
                                            </div>
                                            {errors.DateOfBirth && <p className="error-text">{errors.DateOfBirth}</p>}
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
                                                    value={childInfos.email}
                                                    onChange={(e) => setChildInfos({ ...childInfos, email: e.target.value })}
                                                    onFocus={() => handleFocus("email")}
                                                />
                                            </div>
                                            {errors.email && <p className="error-text">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <button className='submit-btn' type='submit' onClick={handleSubmit}>
                                        <span>Create Child</span>
                                    </button>
                                </motion.div>
                                :
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="motion-div success-box"
                                >
                                    <img src={DoneImg} alt="done-figure" />
                                    <span>
                                        {t('auth.childAccountCreated')}
                                    </span>
                                    <p>
                                        {t('auth.childAccountSuccess')}
                                    </p>
                                    <button onClick={() => navigate('/')}>
                                        {t('auth.allSet')}
                                    </button>
                                </motion.div>
                        }
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreateChild
