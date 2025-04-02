import { useUser } from "../../contexts/userContext";
import { useFirebase } from "../../contexts/firebaseContext"; // Added for Firebase context
import { useState, useRef, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./StickySidebar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import NotifBadge from "../Page Elements/NotifBadge/NotifBadge";
import { collection, onSnapshot } from "firebase/firestore";

interface StickySidebarProps {
    onLogout: () => Promise<void>;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(() => {
        return localStorage.getItem("sidebarOpen") === "true" || false;
    });
    
    const [activeItem, setActiveItem] = useState(() => {
        return localStorage.getItem("activePage") || "HOSPITALIZATION APPLICATION";
    });
    
    const [isPopoutOpen, setIsPopoutOpen] = useState(false);
    const { selectedRole, availableRoles, switchRole } = useUser();
    const [hasNewPendingRequest, setHasNewPendingRequest] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { db } = useFirebase(); // Get db from Firebase context

    const sidebarRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Route redirection logic based on user role
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

        const validRoutes = validRoutesByRole[selectedRole] || validRoutesByRole.member;

        // If the current route doesn't match the role, redirect
        if (!validRoutes.includes(location.pathname)) {
            const fallbackRoute = validRoutes[0]; // Redirect to the first valid route for the role
            navigate(fallbackRoute);
        }
    }, [location.pathname, navigate, selectedRole]);

    const toggleSidebar = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem("sidebarOpen", String(newState));
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

    // SECURE: Use the context's switchRole function
    const handleRoleChange = (newRole: string) => {
        if (availableRoles.includes(newRole)) {
            switchRole(newRole);
        }
    };

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            localStorage.setItem("sidebarOpen", "false");
        }, 3000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                localStorage.setItem("sidebarOpen", "false");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (sidebarRef.current) {
            sidebarRef.current.addEventListener("mouseenter", handleMouseEnter);
            sidebarRef.current.addEventListener("mouseleave", handleMouseLeave);
        }
        return () => {
            if (sidebarRef.current) {
                sidebarRef.current.removeEventListener("mouseenter", handleMouseEnter);
                sidebarRef.current.removeEventListener("mouseleave", handleMouseLeave);
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
    }, [db]);

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

    useEffect(() => {
        const currentPath = location.pathname;
        const matchingItem = menuItems.find(
            (item) => item.path === currentPath
        );
        if (matchingItem) {
            setActiveItem(matchingItem.name);
            localStorage.setItem("activePage", matchingItem.name);
        }
    }, [location.pathname, menuItems]);

    return (
        <>
            <div className="sticky-sidebar" ref={sidebarRef}>
                <button
                    className="btn primary-btn toggle-button"
                    onClick={toggleSidebar}
                    aria-label="toggle-sidebar"
                >
                    <MdOutlineMenu size={20} color="white" />
                </button>
                <Collapse in={isOpen}>
                    <div className="sidebar-content">
                        <Profile 
                            isCollapsed={false} 
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
                                    onClick={
                                        item.action
                                            ? () => {
                                                    item.action();
                                                    if (
                                                        item.name ===
                                                        "PENDING REQUESTS"
                                                    ) {
                                                        setHasNewPendingRequest(
                                                            false
                                                        );
                                                    }
                                              }
                                            : undefined
                                    }
                                >
                                    {item.path ? (
                                        <Link
                                            to={item.path}
                                            onClick={() => {
                                                setActiveItem(item.name);
                                                localStorage.setItem("activePage", item.name);
                                                if (
                                                    item.name ===
                                                    "PENDING REQUESTS"
                                                ) {
                                                    setHasNewPendingRequest(
                                                        false
                                                    );
                                                }
                                            }}
                                        >
                                            {item.name ===
                                            "PENDING REQUESTS" ? (
                                                <NotifBadge
                                                    show={hasNewPendingRequest}
                                                >
                                                    {item.icon}
                                                </NotifBadge>
                                            ) : (
                                                item.icon
                                            )}{" "}
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