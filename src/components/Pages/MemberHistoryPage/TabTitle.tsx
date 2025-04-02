import React from "react";
import styles from "./Tabs.module.css"; // Updated to use the consolidated CSS file

type Props = {
	title: string;
	isActive: boolean;
	onClick: () => void;
};

const TabTitle: React.FC<Props> = ({ title, isActive, onClick }) => {
	return (
		<div
			className={`${styles["tab-title"]} ${
				isActive ? styles.active : ""
			}`}
			onClick={onClick}
		>
			{title}
		</div>
	);
};

export default TabTitle;
