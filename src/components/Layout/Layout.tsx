import React, { useState, ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  return (
    <div className="layout">
      <Header />
      <div className="layout-body" style={{ display: "flex" }}>
        {/* Pass `isSidebarOpen` and `toggleSidebar` to Sidebar */}
        <Sidebar isCollapsed={!isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="page-content" style={{ flex: 1, padding: "1rem" }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
