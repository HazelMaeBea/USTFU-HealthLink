import React, { useEffect, useRef, ReactNode } from "react";
import styles from "./Popout.module.css";
import ReactDOM from "react-dom";

interface PopoutProps {
	title: string;
	message: string | ReactNode;
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
	confirmText?: string;
	showCancelButton?: boolean;
	ariaLabel?: string; // Add new prop for accessibility
}

const Popout: React.FC<PopoutProps> = ({
	title,
	message,
	onConfirm,
	onCancel,
	isOpen,
	confirmText = "Confirm",
	showCancelButton = true,
	ariaLabel, // Add new prop
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
		<div
			className={styles.popoutContainer}
			aria-label={ariaLabel || title} // Use ariaLabel prop or fall back to title
			role="dialog"
			aria-modal="true"
		>
			<div className={styles.popoutContent} ref={popoutRef}>
				<h2 className={styles.popoutHeader}>{title}</h2>
				<p className={styles.popoutMessage}>{message}</p>
				<div className={styles.popoutActions}>
					<button
						className={`${styles.popoutButton} ${styles.confirm}`}
						onClick={onConfirm}
						aria-label={confirmText}
					>
						{confirmText}
					</button>
					{showCancelButton && (
						<button
							className={`${styles.popoutButton} ${styles.cancel}`}
							onClick={onCancel}
							aria-label="Cancel"
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
