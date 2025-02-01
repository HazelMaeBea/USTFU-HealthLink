import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Profile from "./Profile";
import "./Sidebar.css";

const Sidebar = ({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) => {
  const [activeItem, setActiveItem] = useState("HOSPITALIZATION APPLICATION");
  const navigate = useNavigate(); // Initialize useNavigate

  const menuItems = [
    { name: "HOSPITALIZATION APPLICATION", path: "/home" },
    { name: "HOSPITALIZATION TRACKING", path: "/tracking" },
    { name: "FAQ", path: "/faqs" },
    { name: "SETTINGS", path: "/settings" },
    { name: "LOGOUT", path: "/logout" },
  ];

  const handleMenuClick = (itemName: string, path: string) => {
    setActiveItem(itemName);
    navigate(path); // Navigate to the selected route
  };

  return (
    <div className={`Sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="Profile">
        <Profile />
      </div>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isOpen ? "Close" : "Menu"}
      </button>
      <ul className="SidebarMenu">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={activeItem === item.name ? "active" : ""}
            onClick={() => handleMenuClick(item.name, item.path)} // Handle click and navigate
          >
            <span className="menu-icon"></span>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
