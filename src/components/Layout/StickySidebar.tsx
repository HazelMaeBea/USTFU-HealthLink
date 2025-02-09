import { useState } from "react";
import { Collapse } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./StickySidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { MdHistory } from "react-icons/md";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import Profile from "./Profile.tsx";
import { FaRegFolderOpen } from "react-icons/fa";
import { AiOutlineFileDone } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import Popout from "../Page Elements/Popout/Popout.tsx";

interface StickySidebarProps {
	onLogout: () => Promise<void>;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ onLogout }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeItem, setActiveItem] = useState("HOSPITALIZATION APPLICATION");
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);
	const navigate = useNavigate();

	const toggleSidebar = () => {
		setIsOpen(!isOpen);
	};

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
		{
			name: "HOSPITALIZATION APPLICATION",
			icon: <TbHomeEdit size={20} />,
			path: "/hospitalization-application",
		},
		{
			name: "HOSPITALIZATION TRACKING",
			icon: <MdHistory size={20} />,
			path: "/tracking",
		},
		{
			name: "FAQ",
			icon: <AiOutlineQuestionCircle size={20} />,
			path: "/faq",
		},
		{
			name: "SETTINGS",
			icon: <RiSettings5Line size={20} />,
			path: "/settings",
		},
		{
			name: "HOSPITALIZATION HISTORY",
			icon: <FaRegFolderOpen size={20} />,
			path: "/history",
		},
		{
			name: "PENDING REQUESTS",
			icon: <AiOutlineFileDone size={20} />,
			path: "/pendingrequests",
		},
		{
			name: "ADMIN SETTINGS",
			icon: <MdOutlineAdminPanelSettings size={20} />,
			path: "/adminsettings",
		},
		{
			name: "LOGOUT",
			icon: <TbLogout size={20} />,
			action: handleLogoutClick,
		},
	];

	return (
		<>
			<div className="sticky-sidebar">
				<button
					className="btn primary-btn toggle-button"
					onClick={toggleSidebar}
					aria-label="toggle-sidebar"
				>
					<MdOutlineMenu size={20} color="white" />
				</button>
				<Collapse in={isOpen}>
					<div className="sidebar-content">
						<Profile isCollapsed={false} />
						<nav className="SidebarMenu">
							{menuItems.map((item) => (
								<div
									key={item.name}
									className={`menu-item ${
										activeItem === item.name ? "active" : ""
									}`}
									onClick={
										item.action ? item.action : undefined
									}
								>
									{item.path ? (
										<Link
											to={item.path}
											onClick={() =>
												setActiveItem(item.name)
											}
										>
											{item.icon}{" "}
											<span className="menu-text">
												{item.name}
											</span>
										</Link>
									) : (
										<Link
											to="#"
											className="logout-item"
											onClick={handleLogoutClick}
										>
											{item.icon}{" "}
											<span className="menu-text">
												{item.name}
											</span>
										</Link>
									)}
								</div>
							))}
						</nav>
					</div>
				</Collapse>
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

export default StickySidebar;
