import React, { useState, ReactNode, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import StickySidebar from "./StickySidebar";
import { Container } from "react-bootstrap";

interface LayoutProps {
  children: ReactNode;
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


  return (
    <div className="layout">
      <div className="HeaderContainer">
        <Header />
      </div>
      {isMobile ? (
          <StickySidebar />
        ) : (
          <Container className="SidebarContainer">
            <Sidebar/>
          </Container>
        )}
      <div className="layout-body" style={{ display: "flex" }}>
        <main className="page-content" style={{ flex: 1, padding: "1rem" }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
