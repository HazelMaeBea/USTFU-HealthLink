import React from "react";
import "./NotifBadge.css";

interface NotifBadgeProps {
	show: boolean;
	className?: string;
	children: React.ReactNode;
}

const NotifBadge: React.FC<NotifBadgeProps> = ({
	show,
	className,
	children,
}) => {
	return (
		<div
			className={`notif-badge-wrapper ${className || ""}`}
			data-testid={show ? "notification-active" : "notification-inactive"}
		>
			{children}
			{show && <span className="notif-badge-dot" />}
		</div>
	);
};

export default NotifBadge;
