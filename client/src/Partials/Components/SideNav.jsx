import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from "../../App";
import '../Styles/SideNav.css';
import { Link, useNavigate } from 'react-router-dom';
import { MoreContainer } from './MoreContainer';
import { SwitchLanguage } from './SwitchLanguage';
import { useTranslation } from 'react-i18next';
import { ReactComponent as NotificationsIcon } from '../../Assets/icons/NavIcons/notification.svg';
import { ReactComponent as ProfileIcon } from '../../Assets/icons/NavIcons/profile.svg';
import { ReactComponent as SettingsIcon } from '../../Assets/icons/NavIcons/settings.svg';
import { ReactComponent as LogoutIcon } from '../../Assets/icons/NavIcons/logout.svg';
import { ReactComponent as AppLogo } from '../../Assets/images/favicon-40.svg'
import { SwitchAppearence } from './SwitchAppearence'
import axios from 'axios';
import Notifications from './Notifications';

function SideNav({ minimizeNav, setMinimizeNav, navItems = [], tools = [], mobileNavItems = [], itemTools = [] }) {
    const { t } = useTranslation();
    const { darkMode, setUserAuth, userAuth } = useContext(AppContext);

    const userType = userAuth.role || '';

    const [moreBtnClicked, setMoreBtn] = useState(false);
    const [switchModeClicked, setSwitchMode] = useState(false);
    const [showLangBtn, setShowLangBtn] = useState(false);

    const moreContainerRef = useRef(null);
    const btnMoreRef = useRef(null);
    const switchModeRef = useRef(null);
    const langRef = useRef(null);

    const toggleMore = (e) => {
        e.stopPropagation();
        setMoreBtn(!moreBtnClicked);
    };

    const zoom = () => setMinimizeNav(false);

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                moreContainerRef.current &&
                !moreContainerRef.current.contains(event.target) &&
                btnMoreRef.current &&
                !btnMoreRef.current.contains(event.target)
            ) setMoreBtn(false);

            if (switchModeRef.current && !switchModeRef.current.contains(event.target))
                setSwitchMode(false);

            if (langRef.current && !langRef.current.contains(event.target))
                setShowLangBtn(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showSwitchMode = () => { setMoreBtn(false); setSwitchMode(true); };
    const hideSwitchMode = () => {
        setSwitchMode(false);
        setMoreBtn(true)
    }

    const hideLangBox = () => {
        setShowLangBtn(false);
        setMoreBtn(true)
    }


    const showLangBox = () => { setMoreBtn(false); setShowLangBtn(true); };

    const [currentIndexMain, setCurrentIndexMain] = useState(0);
    const [toolsCurrentIndex, settoolsCurrentIndex] = useState(null);
    const [subCurrentIndex, setSubCurrentIndex] = useState(null);
    const [itemToolsCurrentIndex, setItemToolsCurrentIndex] = useState(null)

    const handleMainClick = (index) => {
        setCurrentIndexMain(index);
        settoolsCurrentIndex(null);
        setSubCurrentIndex(null);
        setItemToolsCurrentIndex(null);
    }

    const handleToolsClick = (index) => {
        settoolsCurrentIndex(index);
        setCurrentIndexMain(null);
        setSubCurrentIndex(null);
        setItemToolsCurrentIndex(null);
    }

    const handleSubClick = (index) => {
        setSubCurrentIndex(index);
        setCurrentIndexMain(null);
        settoolsCurrentIndex(null);
        setItemToolsCurrentIndex(null);
    }

    const handleItemToolClick = (index) => {
        setItemToolsCurrentIndex(index);
        settoolsCurrentIndex(null);
        setSubCurrentIndex(null);
    }

    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    const Logout = () => {

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/logout`, {})
            .then(() => {
                setUserAuth({
                    userName: "",
                    familyName: "",
                    givenName: "",
                    userImg: "",
                    role: "anonymous"
                })
                navigate('/login')
            })
            .catch((err) => {
                console.error(err.response?.data)
            })

    }

    const [notificationOpen, setNotificationOpen] = useState(false)

    return (
        <>
            <div className={`sidenav-container ${notificationOpen ? "open-notification-page" : "closing-notification-page"}`}>
                {/* The desktop sidenav */}
                <div className={`sidenav ${minimizeNav ? 'minimize-nav' : ''}`}>
                    {
                        minimizeNav ?
                            <div className="logo-content">
                                <AppLogo />
                            </div>
                            :
                            <div className="logo-container">
                                <div className="logo-line">
                                    <div className="logo-content">
                                        <AppLogo />
                                    </div>
                                    <div className="logo-title" style={{ display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        <span style={{ fontWeight: "700" }} className="text-font">{t('logo.title')}</span>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: darkMode ? "rgba(255, 255, 255, 0.128);" : "#00000050" }}>
                                            {
                                                userType === "teacher" ? t('logo.roleTeacher') : userType === "student" ? t('logo.roleStudent') : userType === "parent" ? t('logo.roleParent') : t('logo.roleAdmin')
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                    }

                    <nav>

                        {/* Main Nav Items */}
                        <ul>
                            {navItems.map((item, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={item.path || '/'}
                                        className={`link ${minimizeNav ? 'minimize-link' : ''} ${currentIndexMain === idx ? 'active' : ''}`}
                                        onClick={() => { zoom(); handleMainClick(idx) }}
                                    >
                                        <item.icon className="nav-icon" />
                                        <span className={minimizeNav ? 'hide' : ''}>{t(item.title)}</span>
                                    </Link>
                                    {
                                        item.hasSubItems && (
                                            <ul className='sub-items' style={{ display: `${currentIndexMain === idx ? "block" : "none"}` }}>
                                                {
                                                    itemTools.map((tool, idxx) => (
                                                        <Link
                                                            to={tool.path ?? '.'} //stays on the current path
                                                            className={`link ${minimizeNav ? 'minimize-link' : ''} ${itemToolsCurrentIndex === idxx ? 'active' : ''}`}
                                                            onClick={() => { zoom(); handleItemToolClick(idxx) }}
                                                        >
                                                            <tool.icon className="nav-icon" />
                                                            <span className={minimizeNav ? 'hide' : ''}>{t(tool.title)}</span>
                                                        </Link>
                                                    ))
                                                }
                                            </ul>
                                        )
                                    }
                                </li>
                            ))}
                        </ul>

                        {/* Tools Section (optional) */}
                        {tools.length > 0 ? (
                            <ul className="optional-items">
                                <span style={{ fontSize: "0.9rem", margin: "8px 0", fontWeight: 600 }}>
                                    {t("tools.tools")}
                                </span>
                                {tools.map((tool, idx) => (
                                    <li key={idx}>
                                        <Link
                                            to={tool.path || '/'}
                                            className={`link ${minimizeNav ? 'minimize-link' : 'special-link'} ${toolsCurrentIndex === idx ? 'active' : ''}`}
                                            onClick={() => { zoom(); handleToolsClick(idx) }}
                                        >
                                            <tool.icon className="nav-icon" />
                                            <span className={minimizeNav ? 'hide' : ''}>{t(tool.title)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>) : (
                            <div className="divider" />
                        )
                        }

                        {/* Fixed Advanced Options */}
                        <ul className='advanced-options'>
                            <li>
                                <Link to="/profile" className={`link ${minimizeNav ? 'minimize-link' : ''} ${subCurrentIndex === "profile" ? 'active' : ''}`} onClick={() => { zoom(); handleSubClick("profile") }}>
                                    <ProfileIcon className='nav-icon' />
                                    <span className={minimizeNav ? 'hide' : ''}>{t('profileNav.profile')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link className={`link ${minimizeNav ? 'minimize-link' : ''} ${subCurrentIndex === "notifications" ? 'active' : ''}`} onClick={() => { zoom(); handleSubClick("notifications"); setNotificationOpen(true) }}>
                                    <NotificationsIcon className='nav-icon' />
                                    <span className={minimizeNav ? 'hide' : ''}>{t('profileNav.notifications')}</span>
                                </Link>
                            </li>
                            <li>
                                <div className={`settings-link ${minimizeNav ? 'minimize-link' : ''} ${subCurrentIndex === "settings" ? 'active' : ''}`} ref={btnMoreRef} onClick={(e) => { toggleMore(e); handleSubClick("settings") }}>
                                    {moreBtnClicked &&
                                        <MoreContainer
                                            containerRef={moreContainerRef}
                                            handleSwitch={showSwitchMode}
                                            handleLangSwitch={showLangBox}
                                        />
                                    }

                                    {
                                        switchModeClicked &&
                                        <SwitchAppearence
                                            containerRef={switchModeRef}
                                            handleHide={hideSwitchMode}
                                        />
                                    }

                                    {
                                        showLangBtn &&
                                        <SwitchLanguage
                                            langRef={langRef}
                                            hideLangBox={hideLangBox}
                                        />
                                    }

                                    <SettingsIcon className='nav-icon' />
                                    <span className={minimizeNav ? 'hide' : ''}>{t('profileNav.settings')}</span>
                                </div>
                            </li>
                        </ul>

                        {
                            notificationOpen && <Notifications onClose={() => setNotificationOpen(false)} />
                        }

                    </nav>

                    {/* Logout */}
                    <div className="more_btn logout" onClick={Logout} style={{ marginTop: "auto" }}>
                        <div className={`link ${minimizeNav ? 'minimize-link' : ''}`}>
                            <LogoutIcon className='nav-icon' />
                            <span className={minimizeNav ? 'hide' : ''}>{t('logout')}</span>
                        </div>
                    </div>

                </div>
            </div>
            {/* The mobile bottom nav */}
            {mobileNavItems.length > 0 && (
                <div className="mobile-bottom-nav">
                    {mobileNavItems.map((item, index) => {
                        const isMiddle = index === 2; // The middle icon (Home)
                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`mobile-nav-item ${isMiddle ? 'middle-item' : ''}`}
                                onClick={() => window.scrollTo(0, 0)}
                            >
                                <div className="mobile-icon-wrapper">
                                    <item.icon className="mobile-nav-icon" />
                                    {isMiddle && <div className="middle-circle"></div>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}

export default SideNav;
