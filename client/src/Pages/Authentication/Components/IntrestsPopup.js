import React, { useEffect, useState } from 'react';
import '../Styles/IntrestsPopup.css';
import axios from 'axios'

const MIN_SELECTION = 1;

const IntrestsPopup = ({ onFinish }) => {

    const [selected, setSelected] = useState(new Set());

    const [categories, setCategories] = useState([])

    useEffect(() => {
        axios.defaults.withCredentials = true
        axios.get('http://localhost:8080/auth/infos/get-subjects')
        .then((res) => setCategories(res.data))
        .catch((err) => console.error(err.response.data))
    }, [])

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const canContinue = selected.size >= MIN_SELECTION;

    return (
        <div className="interests-overlay">
            <div className="interests-popup">
                {/* ── Decorative blobs inside the card ── */}
                <div className="interests-blob blob-1" />
                <div className="interests-blob blob-2" />

                {/* ── Header ── */}
                <div className="interests-header">
                    <h1>What are you into?</h1>
                    <p>
                        Pick at least <strong>{MIN_SELECTION} categories</strong> and we'll
                        personalise your learning experience.
                    </p>
                </div>

                {/* ── Scrollable grid area ── */}
                <div className="interests-grid-scroll">
                    <div className="interests-grid">
                        {categories.map((cat, i) => (
                            <button
                                key={cat.id}
                                className={`interest-card ${selected.has(cat.idSubject) ? 'interest-card--selected' : ''}`}
                                style={{ animationDelay: `${i * 40}ms` }}
                                onClick={() => toggle(cat.idSubject)}
                            >
                                {/* <span className="interest-emoji">{cat.emoji}</span> */}
                                <span className="interest-name">{cat.name}</span>
                                <span className="interest-check">✓</span>
                                <img src={`http://localhost:8080/auth/uploads/${cat.subImg}`} alt="course" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="interests-footer">
                    <span className="selection-count">
                        {selected.size > 0
                            ? `${selected.size} selected${selected.size < MIN_SELECTION ? ` — pick ${MIN_SELECTION - selected.size} more` : ''}`
                            : 'Nothing selected yet'}
                    </span>
                    <button
                        className={`interests-continue-btn ${canContinue ? 'active' : ''}`}
                        disabled={!canContinue}
                        onClick={() => onFinish && onFinish([...selected])} // [...selected] turns the Set { 5, 8, 12 } to an array [5, 8, 12]
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntrestsPopup;