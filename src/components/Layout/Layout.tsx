import React, { useState, ReactNode, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import StickySidebar from "./StickySidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prevState) => !prevState);
  };
  
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
      <Header />
      <div className="layout-body" style={{ display: "flex" }}>
        {/* Pass `isSidebarOpen` and `toggleSidebar` to Sidebar */}
        {isMobile ? (
          <StickySidebar />
        ) : (
          <Sidebar isCollapsed={!isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <main className="page-content" style={{ flex: 1, padding: "1rem" }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
