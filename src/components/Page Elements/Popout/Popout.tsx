import React from "react";
import styles from "./Popout.module.css";

interface PopoutProps {
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
}

const Popout: React.FC<PopoutProps> = ({
	title,
	message,
	onConfirm,
	onCancel,
	isOpen,
}) => {
	if (!isOpen) return null;

	return (
		<div className={styles.popoutContainer}>
			<div className={styles.popoutContent}>
				<h2 className={styles.popoutHeader}>{title}</h2>
				<p className={styles.popoutMessage}>{message}</p>
				<div className={styles.popoutActions}>
					<button
						className={`${styles.popoutButton} ${styles.confirm}`}
						onClick={onConfirm}
					>
						Confirm
					</button>
					<button
						className={`${styles.popoutButton} ${styles.cancel}`}
						onClick={onCancel}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default Popout;
