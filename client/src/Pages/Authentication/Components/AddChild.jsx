import React, { useState } from 'react'
import '../Styles/SignUp.css'
import MainImg from "../../../Assets/images/signup-photo.png"
import DecorationImg from "../../../Assets/images/arrow-signup-decoration.png"
import { ReactComponent as EmailIcon } from "../../../Assets/icons/AuthIcons/email-auth-icon.svg"
import { ReactComponent as ChildIcon } from "../../../Assets/icons/AuthIcons/children-input.svg"
import DoneImg from "../../../Assets/images/done.png"
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, Trans } from 'react-i18next'

import axios from 'axios'

function AddChild() {

    const {t} = useTranslation()

    const [childEmail, setChildEmail] = useState('')
    const [error, setError] = useState('')
    const [messageSent, setMessageSent] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmitChild = (e) => {

        e.preventDefault()

        if (!childEmail.trim()) {
            setError(t('auth.errors.enterChildEmail'))
            return;
        }

        axios.defaults.withCredentials = true

        setLoading(true)

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/request-child`, { email: childEmail }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((res) => {
                if (res.data?.message) {
                    setMessageSent(true)
                }
            })
            .catch((err) => console.error(err.response.data))
            .finally(() => setLoading(false))
    }

    const navigate = useNavigate()

    const handleFocus = () => {
        setError("")
    }

    return (
        <div className='signup-container'>
            <div className="signup-wrapper">
                <div className="img-wrapper">
                    <img src={MainImg} alt="signup-form" />
                </div>
                {!messageSent ?
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.4 }}
                        className="form-container"
                    >
                        <form action="" className='signup-form'>
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
                                        {t('auth.addYourChild')}
                                    </span>
                                    <p>
                                        <Trans
                                        i18nKey={"auth.addChildDescription"}
                                        components={{
                                            br: <br />
                                        }}
                                        >
                                            Add your child’s account to manage and track their progress.
                                            <br />Invite them by email or create an account for them.
                                        </Trans>
                                    </p>
                                </div>
                                <img src={DecorationImg} alt='main-road' />
                            </div>
                            <div className="inputs-box child-box">
                                <div className="form-input">
                                    <div className="input-label">
                                        <ChildIcon />
                                        <label htmlFor="email">
                                            {t('auth.childsEmail')}
                                        </label>
                                    </div>
                                    <div className={`input-line ${error ? "input-error" : ""}`}>
                                        <EmailIcon className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder={t('auth.emailPlaceholder')}
                                            onChange={(e) => setChildEmail(e.target.value)}
                                            onFocus={handleFocus}
                                        />
                                    </div>
                                    {error && <p className="error-text">{error}</p>}
                                </div>
                            </div>
                            <button className='submit-btn' type='submit' onClick={handleSubmitChild} disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span>{t('auth.sending')}</span>
                                    </>
                                ) : (
                                    <span>{t('auth.addChild')}</span>
                                )}
                            </button>
                            <div className="login-line">
                                {t('auth.maybeAddChildLater')} <Link to={"/"} className='auth-link'>{t('auth.skip')}</Link>
                            </div>
                        </form>
                    </motion.div>
                    :
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="success-box"
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

            </div>

        </div>
    )
}

export default AddChild
