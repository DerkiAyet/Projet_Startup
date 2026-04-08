import '../Styles/Posts.css'
import postTestImg from '../../../Assets/images/test-post-img.png'
import { useTranslation } from 'react-i18next'

export const SuggestionLine = () => {

    const {t} = useTranslation()

    return (
        <div className="suggested-account-line">
            <div className="user-infos-box">
                <div className="img-user-circle">
                    <img
                        src={postTestImg}
                        alt="suggested_account"
                        style={{ cursor: 'pointer' }}
                    // onClick={() => navigate(`/${userName}`)}
                    />
                </div>
                <div className="user-parametres">
                    <span className="username">
                        userName
                    </span>
                    <span className="suggested-for-you">
                        Followed by teacher Ahmed + 2 more
                    </span>
                </div>
            </div>
            <button className="follow-account">
                 {t('posts.follow')}
            </button>
        </div >
    )
}