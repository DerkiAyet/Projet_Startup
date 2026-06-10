import React, { useState, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SideNav from '../../Partials/Components/SideNav'
import TopBar from '../../Partials/Components/TopBar';
import { studentNavItems, studentTools, studentMobileNav } from '../config/navConfig';
import { toast } from 'react-toastify';
import { useSocket } from '../../Utilities/config/useSocket';
import { AppContext } from '../../App';
import NewLevelToast from '../../Partials/Components/NewLevelToast';
import NewAchievementToast from '../../Partials/Components/NewAchievementToast';
import NewGameToast from '../../Partials/Components/NewGameToast';

const mock_level = {
    creatorId: 1,
    name: "Beginner",
    key: 0,
    coverImg: "images/1780940412568beginner_badge.png",
    xpRequired: 0,
    missions: [
        {
            type: "ENROLL_COURSE",
            toDo: 1
        },
        {
            type: "SOLVE_QUIZ",
            toDo: 2
        },
        {
            type: "PUBLISH_POST",
            toDo: 1
        }
    ]
}

function StudentLayout() {

    const [minimizeNav, setMinimizeNav] = useState(false);

    const [newLevelToast, setNewLevelToast] = useState({
        visible: false,
        level: null,
        nextLevelXp: 0
    })
    const [newGameToast, setNewGameToast] = useState({
        visible: false,
        level: null,
        nextLevelXp: 0
    })
    const [newAchievmentToast, setnewAchievmentToast] = useState({
        visible: false,
        mission: null
    })

    const { userAuth } = useContext(AppContext)

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on("connect_error", (err) => {
            console.log("❌ Connection error:", err.message);
        });

        socket.on('user_notification', (data) => {
            console.log("🔔 Notification reçue:", data);
            toast.info(`${userAuth.userId} ${data.message}`);
        });

        socket.emit('join_game', { userId: userAuth.userId });

        socket.on('game_started', ({ firstLevel, nextLevelXp }) => {
            setNewGameToast({
                visible: true,
                level: firstLevel,
                nextLevelXp: nextLevelXp
            })
        })

        socket.on('new_level', ({ xpGain, pointsGain, nextLevel: newLevel, nextLevelXp }) => {
            if (!newLevel) return
            setNewLevelToast({
                visible: true,
                level: newLevel,
                nextLevelXp: nextLevelXp
            })
        })

        socket.on('new_achievement', ({ mission, xpGain, pointsGain }) => {
            setnewAchievmentToast({
                visible: true,
                mission: mission
            })
        })

        return () => {
            socket.off("connect_error");
            socket.off("user_notification");
            socket.off("game_started");
            socket.off("new_level");
            socket.off("new_achievement");
            socket.emit('leave_game', { userId: userAuth.userId })
        };
    }, [socket]);

    return (
        <div className={`main-layout ${minimizeNav ? "shrink-nav" : ""}`} style={{ position: "relative" }}>
            <SideNav minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} navItems={studentNavItems} tools={studentTools} mobileNavItems={studentMobileNav} />
            <TopBar minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} />
            <section className="main-container">
                <Outlet />
            </section>
            <NewLevelToast
                visible={newLevelToast.visible}
                onClose={() => setNewLevelToast({ visible: false, level: null, nextLevelXp: 0 })}
                level={newLevelToast.level}
            />
            <NewGameToast
                visible={newGameToast.visible}
                onClose={() => setNewGameToast({ visible: false, level: null, nextLevelXp: 0 })}
                level={newGameToast.level}
            />
            <NewAchievementToast
                visible={newAchievmentToast.visible}
                onClose={() => setnewAchievmentToast({ visible: false, mission: null })}
                mission={newAchievmentToast.mission}
            />
        </div>
    )
}

export default StudentLayout
