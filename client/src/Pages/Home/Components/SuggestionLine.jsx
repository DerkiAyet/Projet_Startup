import '../Styles/Posts.css'
import postTestImg from '../../../Assets/images/test-post-img.png'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export const SuggestionLine = ({ userImg, userName, isSearch, familyName, givenName }) => {

    const { t } = useTranslation()
    const navigate = useNavigate()
    return (
        <div className="suggested-account-line">
            <div className="user-infos-box" style={{cursor: "pointer"}} onClick={() => navigate(`/users/${userName}/profile`)}>
                <div className="img-user-circle">
                    {
                        userImg ? (
                            <img
                                src={userImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${userImg}` : '../../../Assests/images/default_picture.jpeg'}
                                alt="suggested_account"
                                style={{ cursor: 'pointer' }}

                            />
                        ) : (
                            <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                {givenName?.charAt(0).toUpperCase()}
                                {familyName?.charAt(0).toUpperCase()}
                            </div>
                        )
                    }

                </div>
                <div className="user-parametres">
                    <span className="username">
                        {userName}
                    </span>
                    <span className="complete-name">
                        {givenName} {familyName}
                    </span>
                </div>
            </div>
            <button className="follow-account">
                {t('posts.follow')}
            </button>
        </div >
    )
}