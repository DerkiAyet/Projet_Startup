import React, { useState, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SideNav from '../../Partials/Components/SideNav'
import TopBar from '../../Partials/Components/TopBar';
import { studentNavItems, studentTools, studentMobileNav } from '../config/navConfig';
import { toast } from 'react-toastify';
import { useSocket } from '../../Utilities/config/useSocket';
import { AppContext } from '../../App';


function StudentLayout() {

    const [minimizeNav, setMinimizeNav] = useState(false);

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

    return () => {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("user_notification");
    };
}, [socket]);

    return (
        <div className={`main-layout ${minimizeNav ? "shrink-nav" : ""}`}>
            <SideNav minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} navItems={studentNavItems} tools={studentTools} mobileNavItems={studentMobileNav} />
            <TopBar minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} />
            <section className="main-container">
                <Outlet />
            </section>
        </div>
    )
}

export default StudentLayout
