import React, { useEffect, useRef, ReactNode } from "react";
import styles from "./Popout.module.css";
import ReactDOM from "react-dom";

interface PopoutProps {
	title: string;
	message: string | ReactNode; // Changed from just string to support JSX content
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
	confirmText?: string; // New prop to customize confirmation button text
	showCancelButton?: boolean; // New prop to control whether cancel button is shown
}

const Popout: React.FC<PopoutProps> = ({
	title,
	message,
	onConfirm,
	onCancel,
	isOpen,
	confirmText = "Confirm", // Default text for confirm button
	showCancelButton = true, // Show cancel button by default
}) => {
	const popoutRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			if (
				popoutRef.current &&
				!popoutRef.current.contains(event.target as Node)
			) {
				onCancel();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("touchstart", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [isOpen, onCancel]);

	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className={styles.popoutContainer}>
			<div className={styles.popoutContent} ref={popoutRef}>
				<h2 className={styles.popoutHeader}>{title}</h2>
				<p className={styles.popoutMessage}>{message}</p>
				<div className={styles.popoutActions}>
					<button
						className={`${styles.popoutButton} ${styles.confirm}`}
						onClick={onConfirm}
					>
						{confirmText}
					</button>
					{showCancelButton && (
						<button
							className={`${styles.popoutButton} ${styles.cancel}`}
							onClick={onCancel}
						>
							Cancel
						</button>
					)}
				</div>
			</div>
		</div>,
		document.body
	);
};

export default Popout;
