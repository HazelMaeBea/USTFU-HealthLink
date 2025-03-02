import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import StickySidebar from "./StickySidebar";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Layout.css";
import { useFirebase } from "../../contexts/firebaseContext";

// No longer need the LayoutProps interface since we're using Outlet
const Layout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { logout } = useFirebase(); // Get logout directly from context

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout]); // Add logout to dependency array

  return (
    <div className="layout">
      <div className="HeaderContainer">
        <Header />
      </div>
      {isMobile ? (
        <StickySidebar onLogout={handleLogout} />
      ) : (
        <Container className="SidebarContainer">
          <Sidebar onLogout={handleLogout} />
        </Container>
      )}
      <div className="MainContainer">
        <div className="MainContent">
          <Outlet /> {/* Use Outlet instead of children prop */}
        </div>
      </div>
      <div className="FooterContainer">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;