import { useUser } from "../../contexts/userContext";
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
	const [activeItem, setActiveItem] = useState<string>(() => {
		// Retrieve active item from localStorage or set a default
		return localStorage.getItem("activePage") || "HOSPITALIZATION APPLICATION";
	});
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);
	const { setSelectedRole } = useUser();
	const [role, setRole] = useState<string>(() => {
		return localStorage.getItem("selectedRole") || "operations handler";
	});
	// Simulation: pending request badge state
	const [hasNewPendingRequest, setHasNewPendingRequest] = useState(true);
	const navigate = useNavigate();

	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const storedRole =
			localStorage.getItem("selectedRole") || "operations handler";
		setRole(storedRole);
		setSelectedRole(storedRole);

		// Route correction logic
		const validRoutesByRole: Record<string, string[]> = {
			member: ["/home", "/tracking"],
			"operations handler": ["/pendingrequests", "/history", "/adminsettings"],
			admin: ["/pendingrequests", "/history", "/adminsettings"],
		};

		const validRoutes = validRoutesByRole[storedRole];

		// If the current route doesn't match the role, redirect
		if (!validRoutes.includes(location.pathname)) {
			const fallbackRoute = validRoutes[0]; // Redirect to the first valid route for the role
			navigate(fallbackRoute);
		}
	}, [location.pathname, navigate, setSelectedRole]);

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
		// Sync the role with localStorage on mount
		localStorage.setItem("selectedRole", role);
		setSelectedRole(role);
	}, [role, setSelectedRole]);

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

	useEffect(() => {
		const formRequestRef = collection(db, "FormRequest");
		const unsubscribe = onSnapshot(formRequestRef, (snapshot) => {
			const hasUpdate = snapshot
				.docChanges()
				.some(
					(change) => change.type === "added" || change.type === "modified"
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
		localStorage.setItem("activePage", name); // Store active menu item
		if (name === "PENDING REQUESTS") setHasNewPendingRequest(false);
		if (action) action();
	};

	const handleRoleChange = (newRole: string) => {
		setRole(newRole);
		localStorage.setItem("selectedRole", newRole); // Store new role in localStorage
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

	if (role === "member") {
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

	if (role === "operations handler") {
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
			} //remove this later
		);
	}

	if (role === "admin") {
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
					<Profile
						isCollapsed={isCollapsed}
						onRoleChange={handleRoleChange} // ✅ Pass the function
						currentRole={role}
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
