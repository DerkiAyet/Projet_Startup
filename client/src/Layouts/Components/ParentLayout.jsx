import React, { useState, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SideNav from '../../Partials/Components/SideNav'
import TopBar from '../../Partials/Components/TopBar';
import { parentMainNav, parentTools, parentMobileNav } from '../config/navConfig';
import { useSocket } from '../../Utilities/config/useSocket';
import { toast } from 'react-toastify';
import { AppContext } from '../../App';

function ParentLayout() {

    const [minimizeNav, setMinimizeNav] = useState(false);

    const { userAuth } = useContext(AppContext)

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('user_notification', (data) => {
            console.log("Notification reçue:", data);
            toast.info(`${userAuth.userId} ${data.message}`);
        });

        return () => {
            socket.off('user_notification');
        };
    }, [socket]);


    return (
        <div className={`main-layout ${minimizeNav ? "shrink-nav" : ""}`}>
            <SideNav minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} navItems={parentMainNav} tools={parentTools} mobileNavItems={parentMobileNav} />
            <TopBar minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} />
            <section className="main-container">
                <Outlet />
            </section>
        </div>
    )
}

export default ParentLayout
