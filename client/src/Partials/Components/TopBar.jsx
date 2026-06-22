import React, {useEffect} from 'react'
import '../Styles/TopBar.css'
import franceFlag from '../../Assets/images/la-france.png';
import ukFlag from '../../Assets/images/royaume-uni.png';
import saudiFlag from '../../Assets/images/saudi-arabia.png'
import { AppContext } from '../../App';
import { ReactComponent as MenuIcon } from "../../Assets/icons/NavIcons/menu.svg"
import { ReactComponent as NotificationIcon } from "../../Assets/icons/NavIcons/notification.svg"
import { ReactComponent as ArabicIcon } from "../../Assets/icons/NavIcons/arabic.svg"
import { ReactComponent as FrenchIcon } from "../../Assets/icons/NavIcons/french.svg"
import { ReactComponent as EnglishIcon } from "../../Assets/icons/NavIcons/english.svg"
import { useTranslation } from 'react-i18next';

function TopBar({ minimizeNav, setMinimizeNav }) {

    const { t, i18n } = useTranslation()
    const { setLang, setIsRtl, lang, userAuth } = React.useContext(AppContext)

    const changeLanguage = (lang, dir) => {
        i18n.changeLanguage(lang);
        setLang(lang);
        setIsRtl(dir)
    }

    const userType = userAuth.role || '';
    let givenName = userAuth.givenName || '';
    let familyName = userAuth.familyName || '';
    const profilePicture = userAuth.userImg || '';

    const minimize = () => setMinimizeNav(!minimizeNav);

    const [openLang, setOpenLang] = React.useState(false)
    const langRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langRef.current && !langRef.current.contains(event.target))
                setOpenLang(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className='topbar-container'>
            <div className='topbar-wrapper'>
                <MenuIcon className='menu-icon' onClick={minimize} />
                <div className="user-params-box">
                    <div className="param-box">

                        <NotificationIcon className='notification-icon' />

                    </div>
                    <div className="param-box" style={{ position: "relative", cursor: "pointer" }} onClick={() => setOpenLang((prev) => !prev)}>
                        <img src={lang === 'fr' ? franceFlag : lang === 'en' ? ukFlag : saudiFlag} alt='drapeau de france' />
                        {
                            openLang &&
                            <div className="lang-box" onClick={(e) => e.stopPropagation()} ref={langRef}>
                                <li>
                                    <div className="link" onClick={() => changeLanguage('en', false)}>
                                        <EnglishIcon className='nav-icon' />
                                        <span>
                                            {t('settings.english')}
                                        </span>
                                    </div>
                                    <div className="link" onClick={() => changeLanguage('fr', false)}>
                                        <FrenchIcon className='nav-icon' />
                                        <span>
                                            {t('settings.french')}
                                        </span>
                                    </div>
                                    <div className="link" onClick={() => changeLanguage('ar', true)}>
                                        <ArabicIcon className='nav-icon' />
                                        <span>
                                            {t('settings.arabic')}
                                        </span>
                                    </div>
                                </li>
                            </div>
                        }
                    </div>
                    <div className="user-line-box">

                        {profilePicture ? (
                            <div className="user-account">
                                <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${userAuth.userImg}`} alt={`${givenName} ${familyName}`} />
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
                                    userType === "teacher" ? t('logo.roleTeacher') : userType === "student" ? t('logo.roleStudent') : userType === "parent" ? t('logo.roleParent') : t('logo.roleAdmin')
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
