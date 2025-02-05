import React, { useEffect, useRef } from "react";
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
	const popoutRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				popoutRef.current &&
				!popoutRef.current.contains(event.target as Node)
			) {
				onCancel();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onCancel]);

	if (!isOpen) return null;

	return (
		<div className={styles.popoutContainer}>
			<div className={styles.popoutContent} ref={popoutRef}>
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
