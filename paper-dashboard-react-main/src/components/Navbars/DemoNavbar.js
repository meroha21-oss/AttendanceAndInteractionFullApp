import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Container,
  InputGroup,
  InputGroupText,
  Input,
} from "reactstrap";

import adminRoutes from "routes/adminRoutes";
import teacherRoutes from "routes/teacherRoutes";
import studentRoutes from "routes/studentRoutes";
import { useAuth } from "../../contexts/AuthContext";

// Import the components conditionally based on role
let StudentLecturesToday, TeacherLecturesToday;

function Header(props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [lecturesDropdownOpen, setLecturesDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [color, setColor] = React.useState("transparent");
  const sidebarToggle = React.useRef();
  const location = useLocation();
  const navigate = useNavigate();

  // Get auth context
  const { user, logout, isAuthenticated } = useAuth();

  const toggle = () => {
    if (isOpen) {
      setColor("transparent");
    } else {
      setColor("dark");
    }
    setIsOpen(!isOpen);
  };

  const lecturesDropdownToggle = () => {
    setLecturesDropdownOpen(!lecturesDropdownOpen);
  };

  const userDropdownToggle = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Combine all routes for brand name detection
  const getAllRoutes = () => {
    return [...adminRoutes, ...teacherRoutes, ...studentRoutes];
  };

  const getBrand = () => {
    let brandName = "Dashboard";
    const currentPath = location.pathname;

    getAllRoutes().forEach((route) => {
      if (currentPath === route.path) {
        brandName = route.name;
      }
    });

    return brandName;
  };

  const openSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    sidebarToggle.current.classList.toggle("toggled");
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Update navbar color on resize
  const updateColor = () => {
    if (window.innerWidth < 993 && isOpen) {
      setColor("dark");
    } else {
      setColor("transparent");
    }
  };

  React.useEffect(() => {
    window.addEventListener("resize", updateColor);
    return () => {
      window.removeEventListener("resize", updateColor);
    };
  });

  React.useEffect(() => {
    if (
        window.innerWidth < 993 &&
        document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      sidebarToggle.current.classList.toggle("toggled");
    }
  }, [location]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    return user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
  };

  // Get user role display name
  const getUserRole = () => {
    if (!user || !user.role) return "User";

    const roles = {
      admin: "Administrator",
      teacher: "Teacher",
      student: "Student",
      super_admin: "Super Admin",
    };

    return roles[user.role] || user.role;
  };

  // Dynamically load the appropriate component based on role
  const renderLecturesToday = () => {
    if (!user || !user.role) return null;

    // Lazy load components when needed
    if (user.role === "student") {
      if (!StudentLecturesToday) {
        try {
          StudentLecturesToday = React.lazy(() =>
              import("../../pages/student/StudentLecturesToday"),
          );
        } catch (error) {
          console.error("Failed to load StudentLecturesToday:", error);
          return <div>Unable to load today's lectures</div>;
        }
      }

      return (
          <React.Suspense
              fallback={
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <div>Loading lectures...</div>
                </div>
              }
          >
            <StudentLecturesToday />
          </React.Suspense>
      );
    }

    if (user.role === "teacher") {
      if (!TeacherLecturesToday) {
        try {
          TeacherLecturesToday = React.lazy(() =>
              import("../../pages/teacher/TeacherLecturesToday"),
          );
        } catch (error) {
          console.error("Failed to load TeacherLecturesToday:", error);
          return <div>Unable to load today's lectures</div>;
        }
      }

      return (
          <React.Suspense
              fallback={
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <div>Loading lectures...</div>
                </div>
              }
          >
            <TeacherLecturesToday />
          </React.Suspense>
      );
    }

    // For admin or other roles, show a different message or hide the dropdown
    return <div className="p-3">No lectures to display for your role.</div>;
  };

  return (
      <Navbar
          color={color}
          expand="lg"
          className={`navbar-absolute fixed-top ${
              color === "transparent" ? "navbar-transparent" : ""
          }`}
      >
        <Container fluid>
          <div className="navbar-wrapper">
            <div className="navbar-toggle">
              <button
                  type="button"
                  ref={sidebarToggle}
                  className="navbar-toggler"
                  onClick={() => openSidebar()}
              >
                <span className="navbar-toggler-bar bar1" />
                <span className="navbar-toggler-bar bar2" />
                <span className="navbar-toggler-bar bar3" />
              </button>
            </div>
            <NavbarBrand href="/">{getBrand()}</NavbarBrand>
          </div>
          <NavbarToggler onClick={toggle}>
            <span className="navbar-toggler-bar navbar-kebab" />
            <span className="navbar-toggler-bar navbar-kebab" />
            <span className="navbar-toggler-bar navbar-kebab" />
          </NavbarToggler>
          <Collapse isOpen={isOpen} navbar className="justify-content-end">
            <form>
              <InputGroup className="no-border">
                <Input placeholder="Search..." />
                <InputGroupText>
                  <i className="nc-icon nc-zoom-split" />
                </InputGroupText>
              </InputGroup>
            </form>
            <Nav navbar>
              <NavItem>
                <Link to="#pablo" className="nav-link btn-magnify">
                  <i className="nc-icon nc-layout-11" />
                  <p>
                    <span className="d-lg-none d-md-block">Stats</span>
                  </p>
                </Link>
              </NavItem>

              {/* Lectures Today Dropdown (Only for students and teachers) */}
              {isAuthenticated &&
              user &&
              (user.role === "student" || user.role === "teacher") ? (
                  <Dropdown
                      nav
                      isOpen={lecturesDropdownOpen}
                      toggle={lecturesDropdownToggle}
                  >
                    <DropdownToggle caret nav>
                      <i className="nc-icon nc-calendar-60" />
                      <p>
                        <span className="d-lg-none d-md-block">Today's Lectures</span>
                      </p>
                    </DropdownToggle>
                    <DropdownMenu
                        right
                        style={{
                          minWidth: "350px",
                          maxWidth: "400px",
                          maxHeight: "500px",
                          overflowY: "auto",
                        }}
                    >
                      <DropdownItem header className="text-center">
                        Today's Schedule
                      </DropdownItem>
                      <DropdownItem divider />
                      <div className="p-0">
                        {renderLecturesToday()}
                      </div>
                      <DropdownItem divider />
                      <DropdownItem
                          tag={Link}
                          to={
                            user.role === "student"
                                ? "/student/lectures"
                                : "/teacher/lectures"
                          }
                          className="text-center"
                          onClick={() => setLecturesDropdownOpen(false)}
                      >
                        <i className="nc-icon nc-calendar-60 mr-2" />
                        View Full Schedule
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
              ) : null}

              {/* User Profile Dropdown */}
              {isAuthenticated && user ? (
                  <Dropdown
                      nav
                      isOpen={userDropdownOpen}
                      toggle={userDropdownToggle}
                  >
                    <DropdownToggle caret nav className="d-flex align-items-center">
                      <div className="user-avatar mr-2">
                        <div className="avatar-circle">
                      <span className="avatar-initials">
                        {getUserInitials()}
                      </span>
                        </div>
                      </div>
                      <div className="d-none d-md-block">
                        <span className="user-name">{user.name}</span>
                        <small className="text-muted d-block">
                          {getUserRole()}
                        </small>
                      </div>
                    </DropdownToggle>
                    <DropdownMenu right>
                      <DropdownItem header>
                        <div className="text-center">
                          <div className="avatar-circle-lg mb-2">
                        <span className="avatar-initials-lg">
                          {getUserInitials()}
                        </span>
                          </div>
                          <div className="font-weight-bold">
                            {user.name || user.email}
                          </div>
                          <small className="text-muted">{getUserRole()}</small>
                        </div>
                      </DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem divider />
                      <DropdownItem onClick={handleLogout} className="text-danger">
                        <i className="nc-icon nc-button-power mr-2" />
                        Logout
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
              ) : (
                  <NavItem>
                    <Link to="/login" className="nav-link btn-rotate">
                      <i className="nc-icon nc-key-25" />
                      <p>
                        <span className="d-lg-none d-md-block">Login</span>
                      </p>
                    </Link>
                  </NavItem>
              )}
            </Nav>
          </Collapse>
        </Container>
      </Navbar>
  );
}

export default Header;