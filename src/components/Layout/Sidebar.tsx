import Profile from "./Profile";
import "./Sidebar.css";
import { Link } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { MdHistory } from "react-icons/md";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import { useState } from "react";

const Sidebar = () => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeItem, setActiveItem] = useState("HOSPITALIZATION APPLICATION");

	const toggleSidebar = () => setIsCollapsed(!isCollapsed);

	const menuItems = [
		{
			name: "HOSPITALIZATION APPLICATION",
			icon: <TbHomeEdit size={20} />,
			path: "/home",
		},
		{
			name: "HOSPITALIZATION TRACKING",
			icon: <MdHistory size={20} />,
			path: "/tracking",
		},
		{
			name: "FAQ",
			icon: <AiOutlineQuestionCircle size={20} />,
			path: "/faqs",
		},
		{
			name: "SETTINGS",
			icon: <RiSettings5Line size={20} />,
			path: "/settings",
		},
		{ name: "LOGOUT", icon: <TbLogout size={20} />, path: "/logout" },
	];

	return (
		<div className={`sidebar-wrapper ${isCollapsed ? "collapsed" : ""}`}>
			<button
				onClick={toggleSidebar}
				className="toggle-btn"
				title="Toggle Sidebar"
			>
				<MdOutlineMenu size={20} />
			</button>
			<aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
				<Profile isCollapsed={isCollapsed} />
				<nav className="SidebarMenu">
					{menuItems.map((item) => (
						<div
							key={item.name}
							className={`menu-item ${
								activeItem === item.name ? "active" : ""
							}`}
						>
							<Link
								to={item.path}
								onClick={() => setActiveItem(item.name)}
							>
								{item.icon}{" "}
								<span className="menu-text">{item.name}</span>
							</Link>
						</div>
					))}
				</nav>
			</aside>
		</div>
	);
};

export default Sidebar;
