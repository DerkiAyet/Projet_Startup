import React, { useState, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SideNav from '../../Partials/Components/SideNav'
import TopBar from '../../Partials/Components/TopBar';
import { adminMainNav } from '../config/navConfig';
import { toast } from 'react-toastify';
import { useSocket } from '../../Utilities/config/useSocket';
import { AppContext } from '../../App';

function AdminLayout() {

    const [minimizeNav, setMinimizeNav] = useState(false);

    const { userAuth } = useContext(AppContext)

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const userSocketId = userAuth.userId;

        // 2. Enregistrement supplémentaire pour les notifications admin
        socket.emit('register_admin');


        socket.on('user_notification', (data) => {
            console.log("Notification reçue:", data);
            toast.info(`${userSocketId} ${data.message}`);
        });

        return () => {
            socket.off('user_notification');
        };
    }, [socket]);

    return (
        <div className={`main-layout ${minimizeNav ? "shrink-nav" : ""}`}>
            <SideNav minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} navItems={adminMainNav} tools={[]} />
            <TopBar minimizeNav={minimizeNav} setMinimizeNav={setMinimizeNav} />
            <section className="main-container">
                <Outlet />
            </section>
        </div>
    )
}

export default AdminLayout
