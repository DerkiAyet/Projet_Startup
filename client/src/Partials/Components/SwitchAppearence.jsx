import React, { useContext } from "react";
import '../Styles/SideNav.css';
import { AppContext } from "../../App";
import { ReactComponent as DarkMoodIcon } from "../../Assets/icons/NavIcons/dark-mode.svg"
import { ReactComponent as LightMoodIcon } from "../../Assets/icons/NavIcons/light-mode.svg"
import { useTranslation } from "react-i18next";


export const SwitchAppearence = (props) => {

  const {t} = useTranslation()

  const { darkMode, setDarkMode } = useContext(AppContext)

  const handleChange = () => {
    setDarkMode(!darkMode)
  };

  return (
    <div className="switch-appear-container" ref={props.containerRef} onClick={(e) => e.stopPropagation()} >
      <div className="switch-title">
        <div className="switch-logo-container">
          <i class="ri-arrow-left-s-line nav-icon" onClick={() => props.handleHide()} />
          <span>
            {t('settings.switchAppearence')}
          </span>
        </div>
        {
          darkMode ?
            <DarkMoodIcon className="nav-icon" />
            :
            <LightMoodIcon className="nav-icon" />
        }

      </div>

      <div className="switch-input-box">
        <div className="switch-input">
          <span style={{ fontWeight: '500' }}>
            {t('settings.darkMode')}
          </span>
          <div
            className={`switch-toggle ${darkMode ? 'checked' : ''}`}
            role="switch"
            aria-checked={darkMode}
            onClick={handleChange}
            tabIndex="0"
          >
            <div className="slider"></div>
          </div>
        </div>
      </div>

    </div>
  )
}