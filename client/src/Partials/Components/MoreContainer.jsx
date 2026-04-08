import '../Styles/SideNav.css';
import {ReactComponent as LanguageIcon} from "../../Assets/icons/NavIcons/language.svg"
import {ReactComponent as DarkMoodIcon} from "../../Assets/icons/NavIcons/dark-mode.svg"
import {ReactComponent as ActivityIcon} from "../../Assets/icons/NavIcons/activity.svg"
import {ReactComponent as LockIcon} from "../../Assets/icons/NavIcons/lock.svg"
import {ReactComponent as HelpIcon} from "../../Assets/icons/NavIcons/help.svg"
import {ReactComponent as AboutIcon} from "../../Assets/icons/NavIcons/about.svg"
import { useTranslation } from 'react-i18next';

export const MoreContainer = ({handleSwitch, containerRef, handleLangSwitch}) => {

  const {t} = useTranslation()

  return (
    <div className="more-container" ref={containerRef}>
      <ul>
        <li>
          <div className="link" onClick={() => handleLangSwitch()}>
            <LanguageIcon className='nav-icon'/>
            <span>
              {t('settings.switchLanguage')}
            </span>
          </div>
        </li>
        <li>
          <div className="link" onClick={() => handleSwitch()}>
            <DarkMoodIcon className='nav-icon' />
            <span>
              {t('settings.switchAppearence')}
            </span>
          </div>
        </li>
        <li>
          <div className="link">
            <ActivityIcon className='nav-icon' />
            <span>
              {t('settings.yourActivity')}
            </span>
          </div>
        </li>
        <li>
          <div className="link">
            <LockIcon className='nav-icon' />
            <span>
              {t('settings.confidentiality')}
            </span>
          </div>
        </li>
        <li>
          <div className="link">
            <HelpIcon className='nav-icon' />
            <span style={{ textTransform: 'none' }}>
              {t('settings.helpAndReport')}
            </span>
          </div>
        </li>
        <li>
          <div className="line-decoration" />
          <button className="logout-btn link">
            <AboutIcon className='nav-icon' />
            <span>
              {t('settings.about')}
            </span>
          </button>
        </li>
      </ul>

    </div>
  )
}