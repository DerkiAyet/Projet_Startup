import React, {useContext} from "react";
import '../Styles/SideNav.css';
import { ReactComponent as ArabicIcon } from "../../Assets/icons/NavIcons/arabic.svg"
import { ReactComponent as FrenchIcon } from "../../Assets/icons/NavIcons/french.svg"
import { ReactComponent as EnglishIcon } from "../../Assets/icons/NavIcons/english.svg"
import { useTranslation } from 'react-i18next';
import { AppContext } from "../../App";




export const SwitchLanguage = ({langRef, hideLangBox}) => {


    const { setLang, setIsRtl, lang } = useContext(AppContext)

    const { t , i18n } = useTranslation();
 
    const changeLanguage = (lang, dir) => {
        i18n.changeLanguage(lang);
        setLang(lang);
        setIsRtl(dir)
    }


  return (
    <div className="switch-language-container" ref={langRef} onClick={(e) => e.stopPropagation()} >
      <div className="switch-title">
        <div className="switch-logo-container">
          <i class="ri-arrow-left-s-line nav-icon" onClick={() => hideLangBox()} />
          <span>
            {t('settings.switchLanguage')}
          </span>
        </div>
        
        {
            lang === "en" ? <EnglishIcon className="nav-icon" /> : lang === "fr" ? <FrenchIcon className="nav-icon" /> : <ArabicIcon className="nav-icon" />
        }

      </div>

      <div className="options-box">
        <li>
          <div className="link" onClick={() => changeLanguage('en', false)}>
            <EnglishIcon className='nav-icon'/>
            <span>
              {t('settings.english')}
            </span>
          </div>
          <div className="link" onClick={() => changeLanguage('fr', false)}>
            <FrenchIcon className='nav-icon'/>
            <span>
              {t('settings.french')}
            </span>
          </div>
          <div className="link" onClick={() => changeLanguage('ar', true)}>
            <ArabicIcon className='nav-icon'/>
            <span>
              {t('settings.arabic')}
            </span>
          </div>
        </li>
      </div>

    </div>
  )
}