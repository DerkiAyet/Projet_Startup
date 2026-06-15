import React, { useState, useEffect, useRef } from 'react';
import '../Styles/IntroPage.css';
import { ReactComponent as AppIcon } from '../../Assets/images/favicon-40.svg';
import Typed from 'typed.js';

function IntroPage({ onTimeout }) {
    const [isVisible, setIsVisible] = useState(true);
    const typedElement = useRef(null);
    const typedInstance = useRef(null);

    useEffect(() => {
        // Lancer l'animation Typed
        typedInstance.current = new Typed(typedElement.current, {
            strings: ['SnapLearn'],
            typeSpeed: 80,
            backSpeed: 40,
            backDelay: 1600,
            loop: true,
        });

        // Nettoyage
        return () => {
            if (typedInstance.current) {
                typedInstance.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onTimeout();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onTimeout]);

    return (
        isVisible && (
            <div className="introPage">

                <AppIcon className="log-img" />

                <div style={{ marginTop: "1rem" }}>
                    <span ref={typedElement} className="multi-texte" style={{ fontFamily: "Pacifico, sans-serif", fontSize: "2.5rem", color: "#374151", fontWeight: "500" }}></span>
                </div>

                {/* <div className="company-logo">
                    <span>made with ❤️ by</span>
                    <div className="meta-company">
                        <span className="gradiant-text">A Group of CS Students</span>
                    </div>
                </div> */}
            </div>
        )
    );
}

export default IntroPage;