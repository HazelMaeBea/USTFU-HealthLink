import { useRole } from "./RoleContext";
import Profile from "./Profile";
import "./Sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { MdHistory } from "react-icons/md";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa";
import { AiOutlineFileDone } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import Popout from "../Page Elements/Popout/Popout";
import NotifBadge from "../Page Elements/NotifBadge/NotifBadge";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../src/config/firebase";

interface SidebarProps {
	onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeItem, setActiveItem] = useState("HOSPITALIZATION APPLICATION");
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);
	const { selectedRole } = useRole();
	const [hasNewPendingRequest, setHasNewPendingRequest] = useState(false);
	const navigate = useNavigate();

	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
	};

	const handleMouseLeave = () => {
		hoverTimeoutRef.current = setTimeout(() => {
			setIsCollapsed(true);
		}, 3000);
	};

	useEffect(() => {
		const sidebarElement = document.querySelector(".sidebar-wrapper");
		if (sidebarElement) {
			sidebarElement.addEventListener("mouseenter", handleMouseEnter);
			sidebarElement.addEventListener("mouseleave", handleMouseLeave);
		}
		return () => {
			if (sidebarElement) {
				sidebarElement.removeEventListener(
					"mouseenter",
					handleMouseEnter
				);
				sidebarElement.removeEventListener(
					"mouseleave",
					handleMouseLeave
				);
			}
		};
	}, []);

	useEffect(() => {
		const formRequestRef = collection(db, "FormRequest");
		const unsubscribe = onSnapshot(formRequestRef, (snapshot) => {
			const hasUpdate = snapshot
				.docChanges()
				.some(
					(change) =>
						change.type === "added" || change.type === "modified"
				);
			setHasNewPendingRequest(hasUpdate);
		});
		return () => unsubscribe();
	}, []);

	const toggleSidebar = () => setIsCollapsed(!isCollapsed);

	const handleLogoutClick = () => setIsPopoutOpen(true);

	const handleConfirm = async () => {
		try {
			await onLogout();
			navigate("/login");
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleCancel = () => setIsPopoutOpen(false);

	const handleMenuClick = (name: string, action?: () => void) => {
		setActiveItem(name);
		if (name === "PENDING REQUESTS") setHasNewPendingRequest(false);
		if (action) action();
	};

	// const handleRoleSwitch = () => {
	//     if (selectedRole === "operations handler") {
	//         switchRole("member");
	//     } else if (selectedRole === "member") {
	//         switchRole("operations handler");
	//     }
	// };

	const menuItems = [
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
		{
			name: "LOGOUT",
			icon: <TbLogout size={20} />,
			action: handleLogoutClick,
		},
	];

	if (selectedRole === "member") {
		menuItems.unshift(
			{
				name: "HOSPITALIZATION APPLICATION",
				icon: <TbHomeEdit size={20} />,
				path: "/home",
			},
			{
				name: "HOSPITALIZATION TRACKING",
				icon: <MdHistory size={20} />,
				path: "/tracking",
			}
		);
	}

	if (selectedRole === "operations handler" || selectedRole === "admin") {
		menuItems.unshift(
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
			}
		);
	}

	return (
		<>
			<div
				className={`sidebar-wrapper ${isCollapsed ? "collapsed" : ""}`}
				// Removed dynamic zIndex so sidebar stays below the footer
				style={{ position: "relative" }}
			>
				<button
					onClick={toggleSidebar}
					className="toggle-btn"
					aria-label="Toggle sidebar"
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
								{item.path ? (
									<Link
										to={item.path}
										onClick={() =>
											handleMenuClick(item.name)
										}
									>
										{item.name === "PENDING REQUESTS" ? (
											<NotifBadge
												show={hasNewPendingRequest}
											>
												{item.icon}
											</NotifBadge>
										) : (
											item.icon
										)}
										<span className="menu-text">
											{item.name}
										</span>
									</Link>
								) : (
									<Link
										to="#"
										className="logout-item"
										onClick={() =>
											handleMenuClick(
												item.name,
												item.action
											)
										}
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
