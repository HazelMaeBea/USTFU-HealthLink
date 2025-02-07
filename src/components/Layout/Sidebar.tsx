import Profile from "./Profile";
import "./Sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { MdHistory } from "react-icons/md";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import { useState } from "react";
import Popout from "../Page Elements/Popout/Popout";

interface SidebarProps {
    onLogout: () => Promise<void>;
  }

  const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeItem, setActiveItem] = useState("HOSPITALIZATION APPLICATION");
    const [isPopoutOpen, setIsPopoutOpen] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const handleLogoutClick = () => {
        setIsPopoutOpen(true);
    };

    const handleConfirm = async () => {
        try {
            await onLogout();
            navigate("/login"); 
        } catch (error) {
            console.error("Logout error:", error);
        }
    };
    
    const handleCancel = () => {
        setIsPopoutOpen(false);
    };

    const menuItems = [
        { name: "HOSPITALIZATION APPLICATION", icon: <TbHomeEdit size={20} />, path: "/home" },
        { name: "HOSPITALIZATION TRACKING", icon: <MdHistory size={20} />, path: "/tracking" },
        { name: "FAQ", icon: <AiOutlineQuestionCircle size={20} />, path: "/faqs" },
        { name: "SETTINGS", icon: <RiSettings5Line size={20} />, path: "/settings" },
        { name: "LOGOUT", icon: <TbLogout size={20} />, action: handleLogoutClick },
    ];

    console.log(menuItems);

    return (
        <>
            <div className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                <button onClick={toggleSidebar} className="toggle-btn">
                    <MdOutlineMenu size={20} />
                </button>
                <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                    <Profile isCollapsed={isCollapsed} />
                    <nav className="SidebarMenu">
                        {menuItems.map((item) => (
                            <div 
                            key={item.name} 
                            className={`menu-item ${activeItem === item.name ? "active" : ""}`}
                            onClick={item.action ? item.action : undefined}
                            >
                                {item.path ? (
                                    <Link to={item.path} onClick={() => setActiveItem(item.name)}>
                                        {item.icon} <span className="menu-text">{item.name}</span>
                                    </Link>
                                ) : (
                                    <Link to="#" className="logout-item" onClick={handleLogoutClick}>
                                        {item.icon} <span className="menu-text">{item.name}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>
            </div>
            {isPopoutOpen && (
                <Popout
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isOpen={isPopoutOpen}
                />
            )}
        </>
    );
};

export default Sidebar;
