import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/userContext";
import { useFirebase } from "../../contexts/firebaseContext";
import { MdOutlineMenu } from "react-icons/md";
import { TbHomeEdit, TbLogout } from "react-icons/tb";
import { MdHistory } from "react-icons/md";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { RiSettings5Line } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa";
import { AiOutlineFileDone } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import useTrackingRecords from "../Page Elements/TrackingPage/useTrackingRecord";
import { usePendingRequests } from "../Page Elements/PendingRequests/PendingRequestBackend";
import Profile from "./Profile";
import Popout from "../Page Elements/Popout/Popout";
import NotifBadge from "../Page Elements/NotifBadge/NotifBadge";
import "./Sidebar.css";

interface SidebarProps {
	onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeItem, setActiveItem] = useState<string>(() => {
		return localStorage.getItem("activePage") || "HOSPITALIZATION APPLICATION";
	});
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);

	// ✅ Use hooks
	const { accomplishedRecords } = useTrackingRecords();
	const { requests } = usePendingRequests();

	// Firestore notification states
	const [hasNewPendingRequest, setHasNewPendingRequest] = useState(false);
	const [hasNewAccomplishedRecord, setHasNewAccomplishedRecord] =
		useState(false);

	// ✅ LocalStorage Keys
	const ACCOMPLISHED_KEY = "lastAccomplishedCount";
	const LAST_DOC_IDS_KEY = "lastPendingDocIds";

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
				sidebarElement.removeEventListener("mouseenter", handleMouseEnter);
				sidebarElement.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, []);

	useEffect(() => {
		// Update active item based on URL path on refresh
		const currentPath = location.pathname;
		const matchingItem = menuItems.find((item) => item.path === currentPath);
		if (matchingItem) {
			setActiveItem(matchingItem.name);
			localStorage.setItem("activePage", matchingItem.name);
		}
	}, [location.pathname]);

	// ✅ Compare current state with last seen state
	useEffect(() => {
		// Get last seen counts from localStorage
		if (!uid) return;

		const lastSeenDocIds = JSON.parse(
			localStorage.getItem(LAST_DOC_IDS_KEY) || "[]"
		);
		const currentDocIds = requests.map((doc) => doc.id);
		const hasNewDocs = currentDocIds.some((id) => !lastSeenDocIds.includes(id));

		// Get last-seen counts per user
		const lastAccomplishedCount = parseInt(
			localStorage.getItem(ACCOMPLISHED_KEY) || "0",
			10
		);

		// ✅ Trigger notification only on new additions, not deletions
		if (selectedRole === "operations handler" || selectedRole === "admin") {
			if (hasNewDocs) {
				setHasNewPendingRequest(true);
				localStorage.setItem(LAST_DOC_IDS_KEY, JSON.stringify(currentDocIds));
			} else {
				setHasNewPendingRequest(false);
			}
		}

		// Check for new accomplished records
		if (selectedRole === "member") {
			setHasNewAccomplishedRecord(
				accomplishedRecords.length > lastAccomplishedCount
			);
			localStorage.setItem(
				ACCOMPLISHED_KEY,
				accomplishedRecords.length.toString()
			);
		}
	}, [requests, accomplishedRecords, selectedRole, uid]);

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
		localStorage.setItem("activePage", name); // Store active menu item
		if (name === "PENDING REQUESTS") {
			// ✅ Clear the new pending request notification
			setHasNewPendingRequest(false);
			const currentDocIds = requests.map((doc) => doc.id);
			localStorage.setItem(LAST_DOC_IDS_KEY, JSON.stringify(currentDocIds));
		}
		if (name === "HOSPITALIZATION TRACKING") {
			setHasNewAccomplishedRecord(false);
			localStorage.setItem(
				ACCOMPLISHED_KEY,
				accomplishedRecords.length.toString()
			);
		}
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
				<aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
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
										onClick={() => handleMenuClick(item.name)}
									>
										{item.name === "PENDING REQUESTS" ? (
											<NotifBadge show={hasNewPendingRequest}>
												{item.icon}
											</NotifBadge>
										) : (
											item.icon
										)}
										<span className="menu-text">{item.name}</span>
									</Link>
								) : (
									<Link
										to="#"
										className="logout-item"
										onClick={() => handleMenuClick(item.name, item.action)}
									>
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
