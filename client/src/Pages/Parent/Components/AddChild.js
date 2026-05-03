import React, { useState } from 'react'
import '../Styles/AddChild.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as EmailIcon } from "../../../Assets/icons/AuthIcons/email-auth-icon.svg"
import { ReactComponent as ChildIcon } from "../../../Assets/icons/AuthIcons/children-input.svg"
import DoneImg from "../../../Assets/images/done.png"
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next'

import axios from 'axios'

export const AddChild = ({onClose}) => {

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

    const handleFocus = () => {
        setError("")
    }

    return (
        <div className='add-child-overlay'>
            <div className="add-child-wrapper">
                {!messageSent ?
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="form-container"
                    >
                        <form action="" className='add-child-form'>
                            <div className='title-box'>
                                <div className="title-line">
                                    <span>
                                        {t('auth.addYourChild')}
                                    </span>
                                    <CloseIcon onClick={onClose} />
                                </div>
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
                        <button onClick={onClose}>
                            {t('auth.allSet')}
                        </button>
                    </motion.div>
                }

            </div>

        </div>
    )
}