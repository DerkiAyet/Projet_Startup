import React, { useEffect, useState } from 'react'
import { ReactComponent as CheckIcon } from "../../Assets/icons/AuthIcons/check.svg"
import { ReactComponent as XPIcon } from '../../Assets/icons/AdminIcons/xp.svg'
import newAchievement from '../../Assets/images/achievement.png'

import '../Styles/GameToast.css'

const getMessage = (type, toDo) => {
    switch (type) {
        case "PUBLISH_POST":
            return `Publish ${toDo} post(s)`;

        case "NEW_FOLLOWEE":
            return `Follow ${toDo} user(s)`;

        case "NEW_FOLLOWER":
            return `Gain ${toDo} new follower(s)`;

        case "ENROLL_COURSE":
            return `Enroll in ${toDo} course(s)`;

        case "SOLVE_QUIZ":
            return `Complete ${toDo} quiz(zes)`;

        case "SEND_SOLUTION":
            return `Submit ${toDo} solution(s)`;

        case "GET_GRADE":
            return `Earn ${toDo} graded result(s)`;

        case "PARTICIPATE_CLASSROOM":
            return `Join ${toDo} classroom session(s)`;

        case "DO_HOMEWORK":
            return `Complete ${toDo} homework task(s)`;

        case "PARTICPATE_SESSION":
            return `Participate in ${toDo} live session(s)`;

        case "SHARE_RESSOURCE":
            return `Share ${toDo} learning resource(s)`;

        default:
            return "Unknown mission";
    }
};

function NewAchievementToast({ onClose, visible, mission }) {
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setClosing(false) // ← reset on every new toast

        const exitTimer = setTimeout(() => setClosing(true), 95000);
        const closeTimer = setTimeout(onClose, 10000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(closeTimer);
        };
    }, [visible]);

    if (!visible) return null;
    return (
        <div className={`game-toast ${closing ? 'toast-exit' : ''}`}>
            <div className="level-img">
                <img src={newAchievement} alt={`new achieveement`} />
            </div>
            <div className="level-infos">
                <h5>🏆 Achievement Unlocked!</h5>
                <h6>
                    <CheckIcon />You completed: {getMessage(mission.type, mission.toDo)}
                </h6>
                <p className="toast-subtext" style={{ color: "#EC4899" }}>
                    Keep going — your progress is building up 🚀
                </p>
            </div>
            <div className="toast-progress" />
        </div>
    )
}

export default NewAchievementToast
