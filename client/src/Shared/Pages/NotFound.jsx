import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-code">404</div>
                <h1 className="not-found-title">Page not found</h1>
                <p className="not-found-desc">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <button className="not-found-btn" onClick={() => navigate(-1)}> {/*go back to last path*/}
                    Go back
                </button>
            </div>
        </div>
    );
};

export default NotFound;