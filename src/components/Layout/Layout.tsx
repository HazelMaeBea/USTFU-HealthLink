import React, { useState, ReactNode, useEffect, useCallback } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import StickySidebar from "./StickySidebar";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Layout.css";
import { logout } from "../../services/auth";

interface LayoutProps {
  children: ReactNode;
  onLogout: () => Promise<void>;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    }, []);
    
  return (
    <div className="layout">
      <div className="HeaderContainer">
        <Header />
      </div>
      {isMobile ? (
        <StickySidebar />
      ) : (
        <Container className="SidebarContainer">
          <Sidebar onLogout={handleLogout} />
        </Container>
      )}
      <div className="MainContainer">
        <div className="MainContent">{children}</div>
      </div>
      <div className="FooterContainer">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
