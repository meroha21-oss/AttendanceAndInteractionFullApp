import React from "react";
import { Outlet } from "react-router-dom";
import DemoNavbar from "components/Navbars/DemoNavbar";
import Sidebar from "components/Sidebar/Sidebar";
import Footer from "components/Footer/Footer";
import studentRoutes from "routes/studentRoutes";

function StudentLayout() {
    const [backgroundColor, setBackgroundColor] = React.useState("blue");
    const mainPanel = React.useRef(null);

    return (
        <div className="wrapper">
            <Sidebar
                routes={studentRoutes}
                backgroundColor={backgroundColor}
            />
            <div className="main-panel" ref={mainPanel}>
                <DemoNavbar />
                <div className="content">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default StudentLayout;