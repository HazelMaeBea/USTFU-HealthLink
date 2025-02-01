// src/components/Layout.tsx
import React, { useState, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

// Adding children prop to the Layout component
interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout">
      <Header />
      <div className="layout-body" style={{ display: "flex" }}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="page-content" style={{ flex: 1, padding: "1rem" }}>
        <Outlet />
          {children} {/* This renders the children passed to Layout */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
