import React from 'react'
import '../Styles/LandingPage.css'
import { Link } from 'react-router-dom'
import firstImg from "../../../Assets/images/landing_img.png"
import secondImg from "../../../Assets/images/landing_img2.png"
import thirdImg from "../../../Assets/images/landing_img1.jpg"
import fourthImg from "../../../Assets/images/landing_img3.jpg"
import { ReactComponent as CheckIcon } from "../../../Assets/icons/AuthIcons/check.svg"
import { ReactComponent as NextIcon } from "../../../Assets/icons/AuthIcons/next.svg"
import { useTranslation, Trans } from 'react-i18next'


function LandingPage() {

    const { t } = useTranslation()

    return (
        <div className='lp_container'>
            <div className="lp_wrapper">
                <header className="lp_header">
                    <nav>
                        <div className="logo-container">
                            <div className="logo-line">
                                <div className="logo-content">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 10.0001V16.0001M6.00004 12.5001V16.0001C6.00004 16.7958 6.63218 17.5588 7.7574 18.1214C8.88262 18.684 10.4087 19.0001 12 19.0001C13.5913 19.0001 15.1175 18.684 16.2427 18.1214C17.3679 17.5588 18 16.7958 18 16.0001V12.5001M21.42 10.9221C21.5991 10.8431 21.751 10.7134 21.857 10.5489C21.963 10.3845 22.0184 10.1925 22.0164 9.99685C22.0143 9.8012 21.955 9.61044 21.8456 9.4482C21.7362 9.28596 21.5817 9.15937 21.401 9.08411L12.83 5.18011C12.5695 5.06126 12.2864 4.99976 12 4.99976C11.7137 4.99976 11.4306 5.06126 11.17 5.18011L2.60004 9.08011C2.42201 9.15809 2.27056 9.28625 2.16421 9.44893C2.05786 9.61161 2.00122 9.80176 2.00122 9.99611C2.00122 10.1905 2.05786 10.3806 2.16421 10.5433C2.27056 10.706 2.42201 10.8341 2.60004 10.9121L11.17 14.8201C11.4306 14.939 11.7137 15.0005 12 15.0005C12.2864 15.0005 12.5695 14.939 12.83 14.8201L21.42 10.9221Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </div>
                                <div className="logo-title" style={{ display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    <span style={{ fontWeight: "700" }} className="text-font">{t('logo.title')}</span>
                                </div>
                            </div>
                        </div>
                        <ul>
                            <li>
                                <Link to={"/search"}>
                                    {t('landing.courses')}
                                </Link>
                            </li>
                            <li>
                                {t('landing.features')}
                            </li>
                            <li>
                                {t('landing.community')}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.0707 13.3139L17.0207 8.36388C17.1129 8.26837 17.2232 8.19219 17.3453 8.13978C17.4673 8.08737 17.5985 8.05979 17.7313 8.05863C17.864 8.05748 17.9957 8.08278 18.1186 8.13306C18.2415 8.18334 18.3532 8.25759 18.4471 8.35149C18.5409 8.44538 18.6152 8.55703 18.6655 8.67993C18.7158 8.80282 18.7411 8.9345 18.7399 9.06728C18.7388 9.20006 18.7112 9.33128 18.6588 9.45329C18.6063 9.57529 18.5302 9.68564 18.4347 9.77788L12.7777 15.4349C12.5901 15.6224 12.3358 15.7277 12.0707 15.7277C11.8055 15.7277 11.5512 15.6224 11.3637 15.4349L5.70666 9.77788C5.61115 9.68564 5.53496 9.57529 5.48255 9.45329C5.43014 9.33128 5.40256 9.20006 5.4014 9.06728C5.40025 8.9345 5.42555 8.80282 5.47583 8.67993C5.52611 8.55703 5.60037 8.44538 5.69426 8.35149C5.78815 8.25759 5.89981 8.18334 6.0227 8.13306C6.1456 8.08278 6.27728 8.05748 6.41006 8.05863C6.54284 8.05979 6.67406 8.08737 6.79606 8.13978C6.91806 8.19219 7.02841 8.26837 7.12066 8.36388L12.0707 13.3139Z" fill="#0F172A" />
                                </svg>

                            </li>
                            <li>
                                {t('landing.pricing')}
                            </li>
                            <li>
                                <Link to={"/about"}>{t('landing.about')}</Link>
                            </li>
                        </ul>
                    </nav>
                    <div className="header-btns">
                        <Link className='login-btn header-btn' to={"/login"}>
                            {t('landing.logIn')}
                        </Link>
                        <Link className='signup-btn header-btn' to={"/register"}>
                            {t('landing.signUp')}
                        </Link>
                    </div>
                </header>

                <div className="sections-container">
                    <section id='first-section'>
                        {/* Background blobs */}
                        <div className="hero-blob hero-blob-1" />
                        <div className="hero-blob hero-blob-2" />
                        <div className="hero-blob hero-blob-3" />

                        <div className="section-flex-box left-side">
                            <h1>
                                <Trans
                                    i18nKey="landing.heroTitle"
                                    components={{
                                        highlight: <span className='highlight' />,
                                        br: <br />
                                    }}>
                                    <span className='highlight'>Swipe</span> right on <br /> education
                                </Trans>
                            </h1>
                            <p>
                                {t('landing.heroDescription')}
                            </p>
                            <Link className='section-btn' to={"/login"}>
                                {t('landing.startNow')}
                            </Link>

                            {/* Avatar stack */}
                            <div className="hero-social-proof">
                                <div className="avatar-stack">
                                    {["#EC4899", "#6366F1", "#10B981", "#F59E0B"].map((color, i) => (
                                        <div key={i} className="avatar-bubble" style={{ backgroundColor: color, zIndex: 4 - i }}>
                                            {["A", "B", "C", "D"][i]}
                                        </div>
                                    ))}
                                </div>
                                <div className="social-proof-text">
                                    <span className="social-proof-count">12,000+</span>
                                    <span className="social-proof-label">{t('landing.learnersOnBoard')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="section-flex-box img-box">
                            <img src={secondImg} alt="" />
                        </div>
                    </section>
                    <section id='how-section'>
                        <div className="section-flex-box img-box">
                            <img src={firstImg} alt="" />
                        </div>
                        <div className="section-flex-box left-side">
                            <h1>
                                <Trans
                                    i18nKey={"landing.howItWorks"}
                                    components={{
                                        highlight: <span className='highlight' />,
                                    }}
                                >
                                    How it <span className='highlight'>works</span>
                                </Trans>
                            </h1>
                            <ul>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" /> {t('landing.teachersShareKnowledge')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.teachersShareDesc')}
                                    </p>
                                </li>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" />
                                        {t('landing.studentsDiveIn')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.studentsDiveDesc')}
                                    </p>
                                </li>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" />
                                        {t('landing.parentsCheerAlong')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.parentsCheerDesc')}
                                    </p>
                                </li>
                            </ul>

                            <Link className='more-btn' to={"/about"}>
                                {t('landing.findMoreAboutApp')}
                                <NextIcon />
                            </Link>
                        </div>

                    </section>

                    <section id='courses-section'>
                        <div className="courses-section-header">
                            <h1>
                                <Trans
                                    i18nKey={"landing.topPicksForYou"}
                                    components={{
                                        highlight: <span className='highlight' />,
                                    }}
                                >
                                    Top <span className='highlight'>Picks</span> For You
                                </Trans>
                            </h1>
                            <p>{t('landing.handpickedDescription')}</p>
                        </div>
                        <div className="courses-grid">
                            {[
                                {
                                    tag: "Mathematics",
                                    tagColor: "#6366F1",
                                    tagBg: "#EEF2FF",
                                    title: "Algebra Fundamentals",
                                    desc: "Build a strong foundation in equations, functions, and problem-solving strategies.",
                                    students: "4.2k students",
                                    lessons: "24 lessons",
                                    rating: "4.9",
                                    instructor: "Ms. Carter",
                                    avatar: "C",
                                    avatarColor: "#EC4899",
                                },
                                {
                                    tag: "Science",
                                    tagColor: "#10B981",
                                    tagBg: "#ECFDF5",
                                    title: "Human Body Explained",
                                    desc: "Explore biology through engaging visuals, peer quizzes, and real-life applications.",
                                    students: "6.8k students",
                                    lessons: "31 lessons",
                                    rating: "4.8",
                                    instructor: "Dr. Patel",
                                    avatar: "P",
                                    avatarColor: "#F59E0B",
                                },
                                {
                                    tag: "Language",
                                    tagColor: "#EC4899",
                                    tagBg: "#FDF2F8",
                                    title: "Creative Writing 101",
                                    desc: "Unlock your voice with storytelling techniques, peer feedback, and writing challenges.",
                                    students: "3.1k students",
                                    lessons: "18 lessons",
                                    rating: "5.0",
                                    instructor: "Mr. Osei",
                                    avatar: "O",
                                    avatarColor: "#6366F1",
                                },
                            ].map((course, i) => (
                                <div className="course-card" key={i}>
                                    <div className="course-card-top">
                                        <span className="course-tag" style={{ color: course.tagColor, backgroundColor: course.tagBg }}>
                                            {course.tag}
                                        </span>
                                        <span className="course-rating">⭐ {course.rating}</span>
                                    </div>
                                    <h3 className="course-title">{course.title}</h3>
                                    <p className="course-desc">{course.desc}</p>
                                    <div className="course-meta">
                                        <span>{course.students}</span>
                                        <span className="course-meta-dot" />
                                        <span>{course.lessons}</span>
                                    </div>
                                    <div className="course-footer">
                                        <div className="course-instructor">
                                            <div className="course-avatar" style={{ backgroundColor: course.avatarColor }}>
                                                {course.avatar}
                                            </div>
                                            <span>{course.instructor}</span>
                                        </div>
                                        <Link className="course-cta" to="/search">{t('landing.enrollFree')}</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id='features-section'>
                        <div className="section-flex-box left-side">
                            <h1>
                                <Trans
                                    i18nKey={"landing.powerfulTools"}
                                    components={{
                                        highlight: <span className='highlight' />,
                                    }}
                                >
                                    Powerful Tools That Make Learning <span className='highlight'>Social</span>
                                </Trans>
                            </h1>
                            <ul>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" /> {t('landing.connectWithOthers')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.connectDesc')}
                                    </p>
                                </li>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" />
                                        {t('landing.peerFeedback')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.peerFeedbackDesc')}
                                    </p>
                                </li>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" />
                                        {t('landing.gamification')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.gamificationDesc')}
                                    </p>
                                </li>
                                <li>
                                    <h3>
                                        <CheckIcon className="ul-icon" />
                                        {t('landing.parentInsights')}
                                    </h3>
                                    <p className='ul-p'>
                                        {t('landing.parentInsightsDesc')}
                                    </p>
                                </li>
                            </ul>
                        </div>

                        <div className="section-flex-box img-box">
                            <img src={thirdImg} alt="" />
                        </div>

                    </section>

                    <section id='join-section'>
                        <img src={fourthImg} alt="" />
                        <div className="floating-join-box">
                            <h1 style={{ textAlign: "center" }}>
                                {t('landing.joinWorldOfLearning')}
                            </h1>
                            <p>
                                {t('landing.joinDescription')}
                            </p>
                            <Link className='section-btn' to={"/register"}>
                                {t('landing.signUpNow')}
                            </Link>
                        </div>
                    </section>
                </div>
                <footer className="lp_footer">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <div className="logo-line">
                                <div className="logo-content" style={{ background: "var(--main-color)", borderRadius: "var(--radius-md)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 10.0001V16.0001M6.00004 12.5001V16.0001C6.00004 16.7958 6.63218 17.5588 7.7574 18.1214C8.88262 18.684 10.4087 19.0001 12 19.0001C13.5913 19.0001 15.1175 18.684 16.2427 18.1214C17.3679 17.5588 18 16.7958 18 16.0001V12.5001M21.42 10.9221C21.5991 10.8431 21.751 10.7134 21.857 10.5489C21.963 10.3845 22.0184 10.1925 22.0164 9.99685C22.0143 9.8012 21.955 9.61044 21.8456 9.4482C21.7362 9.28596 21.5817 9.15937 21.401 9.08411L12.83 5.18011C12.5695 5.06126 12.2864 4.99976 12 4.99976C11.7137 4.99976 11.4306 5.06126 11.17 5.18011L2.60004 9.08011C2.42201 9.15809 2.27056 9.28625 2.16421 9.44893C2.05786 9.61161 2.00122 9.80176 2.00122 9.99611C2.00122 10.1905 2.05786 10.3806 2.16421 10.5433C2.27056 10.706 2.42201 10.8341 2.60004 10.9121L11.17 14.8201C11.4306 14.939 11.7137 15.0005 12 15.0005C12.2864 15.0005 12.5695 14.939 12.83 14.8201L21.42 10.9221Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="footer-brand-name">{t('logo.title')}</span>
                            </div>
                            <p className="footer-tagline">{t('landing.tagline')}.</p>
                        </div>

                        <div className="footer-links">
                            <div className="footer-col">
                                <h4>Product</h4>
                                <ul>
                                    <li><Link to="/search">{t('landing.courses')}</Link></li>
                                    <li><a href="#">{t('landing.features')}</a></li>
                                    <li><a href="#">{t('landing.pricing')}</a></li>
                                </ul>
                            </div>
                            <div className="footer-col">
                                <h4>{t('landing.company')}</h4>
                                <ul>
                                    <li><Link to="/about">{t('landing.about')}</Link></li>
                                    <li><a href="#">{t('landing.community')}</a></li>
                                    <li><a href="#">Blog</a></li>
                                </ul>
                            </div>
                            <div className="footer-col">
                                <h4>{t('landing.support')}</h4>
                                <ul>
                                    <li><a href="#">{t('landing.helpCenter')}</a></li>
                                    <li><a href="#">{t('landing.privacyPolicy')}</a></li>
                                    <li><a href="#">{t('landing.termsOfUse')}</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <span>© 2026 SnapLearn. {t('landing.allRightsReserved')}</span>
                        <div className="footer-socials">
                            {/* Twitter/X */}
                            <a href="#" className="social-icon" aria-label="Twitter">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.845l4.262 5.636 4.887-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor" />
                                </svg>
                            </a>
                            {/* Instagram */}
                            <a href="#" className="social-icon" aria-label="Instagram">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" fill="currentColor" />
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" className="social-icon" aria-label="LinkedIn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default LandingPage
