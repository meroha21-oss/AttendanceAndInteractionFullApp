import React from "react";
import { Outlet } from "react-router-dom";
import DemoNavbar from "components/Navbars/DemoNavbar";
import Sidebar from "components/Sidebar/Sidebar";
import Footer from "components/Footer/Footer";
import adminRoutes from "routes/adminRoutes";

function AdminLayout() {
    const [backgroundColor, setBackgroundColor] = React.useState("blue");
    const mainPanel = React.useRef(null);

    return (
        <div className="wrapper">
            <Sidebar
                routes={adminRoutes}
                backgroundColor={backgroundColor}
            />
            <div className="main-panel" ref={mainPanel}>
                <DemoNavbar />
                <div className="content">
                    {/* This renders the child routes */}
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default AdminLayout;