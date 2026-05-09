import React from 'react'
import '../Styles/Loader.css'

const Loader = () => {
    return (

        <div className="loader-overlay">
            <div className="loader-container">
                <div className="loader-dots">
                    <div className="loader-dot"></div>
                    <div className="loader-dot"></div>
                    <div className="loader-dot"></div>
                </div>
                <p className="loader-text">Operation in progress..</p>
            </div>
        </div>

    )
}

export default Loader
