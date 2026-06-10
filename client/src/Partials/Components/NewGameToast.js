import React, { useEffect, useState } from 'react'
import { ReactComponent as CheckIcon } from "../../Assets/icons/AuthIcons/check.svg"
import { ReactComponent as XPIcon } from '../../Assets/icons/AdminIcons/xp.svg'
import '../Styles/GameToast.css'

const getMessage = (type, toDo) => {
    switch (type) {
        case "PUBLISH_POST":
            return `Try publishing ${toDo} post(s)`;

        case "NEW_FOLLOWEE":
            return `Follow ${toDo} user(s) to connect`;

        case "NEW_FOLLOWER":
            return `Gain your first ${toDo} follower(s)`;

        case "ENROLL_COURSE":
            return `Enroll in ${toDo} course(s) to start learning`;

        case "SOLVE_QUIZ":
            return `Complete ${toDo} quiz(zes) to test yourself`;

        case "SEND_SOLUTION":
            return `Submit ${toDo} solution(s)`;

        case "GET_GRADE":
            return `Receive ${toDo} graded result(s)`;

        case "PARTICIPATE_CLASSROOM":
            return `Join ${toDo} classroom session(s)`;

        case "DO_HOMEWORK":
            return `Complete ${toDo} homework task(s)`;

        case "PARTICPATE_SESSION":
            return `Join ${toDo} live session(s)`;

        case "SHARE_RESSOURCE":
            return `Share ${toDo} learning resource(s)`;

        default:
            return "Start your first mission";
    }
};

function NewGameToast({ onClose, visible, level, nextLevelXp }) {
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setClosing(false) // ← reset on every new toast

        const exitTimer = setTimeout(() => setClosing(true), 7500);
        const closeTimer = setTimeout(onClose, 8000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(closeTimer);
        };
    }, [visible]);

    if (!visible) return null;
    return (
        <div className={`game-toast ${closing ? 'toast-exit' : ''}`}>
            <div className="level-img">
                <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/game/uploads/${level.coverImg}`} alt={`level ${level.name}`} />
            </div>
            <div className="level-infos">
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <h5>👋 Welcome to the SnapLearn!</h5>
                    <p className="toast-subtitle">
                        Here’s what you can do to start your journey
                    </p>
                </div>
                <ul className="mission-todo">
                    {
                        level.missions.map((mission) => (
                            <li> <CheckIcon /> {getMessage(mission.type, mission.toDo)} </li>
                        ))
                    }
                    <li className='xp-required'>
                        <CheckIcon />
                        Earn {nextLevelXp} XP to unlock the next level
                    </li>
                </ul>
            </div>
            <div className="toast-progress" />
        </div>
    )
}

export default NewGameToast
