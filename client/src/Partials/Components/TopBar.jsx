import React from 'react'
import '../Styles/TopBar.css'
import franceFlag from '../../Assets/images/la-france.png';
import ukFlag from '../../Assets/images/royaume-uni.png';
import saudiFlag from '../../Assets/images/saudi-arabia.png'
import { AppContext } from '../../App';
import { ReactComponent as MenuIcon } from "../../Assets/icons/NavIcons/menu.svg"
import { ReactComponent as NotificationIcon } from "../../Assets/icons/NavIcons/notification.svg"
import { useTranslation } from 'react-i18next';

function TopBar({ minimizeNav, setMinimizeNav }) {

    const {t} = useTranslation()

    const { lang, userAuth } = React.useContext(AppContext)

    
    const userType = userAuth.role || '';
    let givenName = userAuth.givenName || '';
    let familyName = userAuth.familyName || '';
    const profilePicture = userAuth.userImg || '';

    const minimize = () => setMinimizeNav(!minimizeNav);

    return (
        <div className='topbar-container'>
            <div className='topbar-wrapper'>
                <MenuIcon className='menu-icon' onClick={minimize} />
                <div className="user-params-box">
                    <div className="param-box">

                        <NotificationIcon className='notification-icon' />

                    </div>
                    <div className="param-box">
                        <img src={lang === 'fr' ? franceFlag : lang === 'en' ? ukFlag : saudiFlag} alt='drapeau de france' />
                    </div>
                    <div className="user-line-box">

                        {profilePicture ? (
                            <div className="user-account">
                                <img src={profilePicture} alt={`${givenName} ${familyName}`} />
                            </div>
                        ) : (
                            <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                {givenName?.charAt(0).toUpperCase()}
                                {familyName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="user-props">
                            <span style={{ fontSize: "0.9rem", fontWeight: "550" }}>{givenName} {familyName}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: "430" }}>
                                {
                                    userType === "teacher" ? t('logo.roleTeacher') : userType === "student" ? t('logo.roleStudent') : t('logo.roleParent')
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopBar
