import React, { useEffect, useRef, useState } from "react";
import styles from "./ViewFiles.module.css";
import { HiOutlineX } from "react-icons/hi";

interface ViewFilesProps {
	file: { url?: string; filename: string };
	onClose: () => void;
}

const ViewFiles: React.FC<ViewFilesProps> = ({ file, onClose }) => {
	// Create ref for the modal content
	const modalContentRef = useRef<HTMLDivElement>(null);
	// Add state for image zoom
	const [zoom, setZoom] = useState(1);

	useEffect(() => {
		console.log("Viewing file:", file);

		// Handler for escape key
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		// Add event listener for escape key
		document.addEventListener("keydown", handleKeyDown);

		// Clean up the event listener when component unmounts
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			// Reset zoom when component unmounts
			setZoom(1);
		};
	}, [file, onClose]);

	const isPdf = file.filename.toLowerCase().endsWith(".pdf");

	// Handle background click to close modal
	const handleBackgroundClick = (e: React.MouseEvent) => {
		// Close only if clicking directly on the overlay (not its children)
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	// Add zoom controls
	const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
	const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
	const resetZoom = () => setZoom(1);

	return (
		<div
			className={styles["view-file-overlay"]}
			onClick={handleBackgroundClick}
		>
			<div
				className={styles["view-file-container"]}
				ref={modalContentRef}
			>
				<div className={styles["view-file-header"]}>
					<h3
						className={styles["view-file-title"]}
						title={file.filename}
					>
						{file.filename}
					</h3>
					<button
						className={styles["close-button"]}
						onClick={onClose}
					>
						<HiOutlineX size={20} />
					</button>
				</div>
				<div className={styles["view-file-content"]}>
					{file.url ? (
						isPdf ? (
							<iframe
								src={file.url}
								title={file.filename}
								className={styles["pdf-preview"]}
							/>
						) : (
							<div className={styles["image-preview-container"]}>
								<div className={styles["zoom-controls"]}>
									<button
										onClick={zoomOut}
										className={styles["zoom-button"]}
										title="Zoom Out"
									>
										−
									</button>
									<div className={styles["zoom-percentage"]}>
										{Math.round(zoom * 100)}%
									</div>
									<button
										onClick={resetZoom}
										className={`${styles["zoom-button"]} ${styles["reset-button"]}`}
										title="Reset Zoom"
									>
										Reset
									</button>
									<button
										onClick={zoomIn}
										className={styles["zoom-button"]}
										title="Zoom In"
									>
										+
									</button>
								</div>
								<div className={styles["image-wrapper"]}>
									<img
										src={file.url}
										alt={file.filename}
										className={styles["full-size-image"]}
										style={{ transform: `scale(${zoom})` }}
										onError={(e) => {
											console.error(
												"Error loading file",
												e
											);
										}}
									/>
								</div>
							</div>
						)
					) : (
						<div className={styles["file-fallback"]}>
							<p>No preview available.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ViewFiles;
