import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../contexts/userContext";
import { useFirebase } from "../../../contexts/firebaseContext";
import Profile from "../Profile/Profile";
import Popout from "../Popout/Popout";
import NotifBadge from "../NotifBadge/NotifBadge";
import { useNotifications } from "../NotifBadge/NotifTrigger";
import {
	MdOutlineMenu,
	MdHistory,
	MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { AiOutlineQuestionCircle, AiOutlineFileDone } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa";
import "./Sidebar.css";

interface SidebarProps {
	onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeItem, setActiveItem] = useState<string>(() => {
		return (
			localStorage.getItem("activePage") || "HOSPITALIZATION APPLICATION"
		);
	});
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);

	// SECURE: Get role state from useUser context
	const { selectedRole, availableRoles, switchRole } = useUser();
	const { uid } = useFirebase();

	const navigate = useNavigate();

	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Route correction logic
		const validRoutesByRole: Record<string, string[]> = {
			member: [
				"/home",
				"/home/inpatient",
				"/home/admission",
				"/home/outpatient",
				"/home/eyeglasses",
				"/tracking",
				"/settings",
				"/faqs",
			],
			"operations handler": [
				"/pendingrequests",
				"/history",
				"/adminsettings",
				"/settings",
				"/faqs",
			],
			admin: [
				"/pendingrequests",
				"/history",
				"/adminsettings",
				"/settings",
				"/faqs",
			],
		};

		const validRoutes =
			validRoutesByRole[selectedRole] || validRoutesByRole.member;

		// If the current route doesn't match the role, redirect
		if (!validRoutes.includes(location.pathname)) {
			const fallbackRoute = validRoutes[0]; // Redirect to the first valid route for the role
			navigate(fallbackRoute);
		}
	}, [location.pathname, navigate, selectedRole]);

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
		// Update active item based on URL path on refresh
		const currentPath = location.pathname;
		const matchingItem = menuItems.find(
			(item) => item.path === currentPath
		);
		if (matchingItem) {
			setActiveItem(matchingItem.name);
			localStorage.setItem("activePage", matchingItem.name);
		}
	}, [location.pathname]);

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

	// Use the hook with optional chaining to prevent errors if it returns undefined
	const { hasNewPendingRequest = false, hasNewAccomplishedRecord = false } = useNotifications?.(
		{
			uid,
			selectedRole,
		}
	) || {};

	const handleMenuClick = (name: string, action?: () => void) => {
		setActiveItem(name);
		localStorage.setItem("activePage", name); // Store active menu item
		if (action) action();
	};

	// SECURE: Use the context's switchRole function
	const handleRoleChange = (newRole: string) => {
		if (availableRoles.includes(newRole)) {
			switchRole(newRole);
		}
	};

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
				icon: (
					<NotifBadge show={hasNewAccomplishedRecord}>
						<MdHistory size={20} />
					</NotifBadge>
				),
				path: "/tracking",
			}
		);
	}

	if (selectedRole === "operations handler") {
		menuItems.unshift(
			{
				name: "PENDING REQUESTS",
				icon: (
					<NotifBadge show={hasNewPendingRequest}>
						<AiOutlineFileDone size={20} />
					</NotifBadge>
				),
				path: "/pendingrequests",
			},
			{
				name: "HOSPITALIZATION HISTORY",
				icon: <FaRegFolderOpen size={20} />,
				path: "/history",
			},
			{
				name: "ADMIN SETTINGS",
				icon: <MdOutlineAdminPanelSettings size={20} />,
				path: "/adminsettings",
			} //remove this later
		);
	}

	if (selectedRole === "admin") {
		menuItems.unshift(
			{
				name: "PENDING REQUESTS",
				icon: <AiOutlineFileDone size={20} />,
				path: "/pendingrequests",
			},
			{
				name: "HOSPITALIZATION HISTORY",
				icon: <FaRegFolderOpen size={20} />,
				path: "/history",
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
				style={{ position: "relative" }}
			>
				<button
					onClick={toggleSidebar}
					className="toggle-btn"
					aria-label="Toggle sidebar"
				>
					<MdOutlineMenu size={20} />
				</button>
				<aside
					className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
					role="complementary"
					aria-label="sidebar navigation"
				>
					<Profile
						isCollapsed={isCollapsed}
						onRoleChange={handleRoleChange}
						currentRole={selectedRole}
					/>
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
