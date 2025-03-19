import React, { useEffect, useRef, useState } from "react";
import "./ViewFiles.css";
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
		<div className="view-file-overlay" onClick={handleBackgroundClick}>
			<div className="view-file-container" ref={modalContentRef}>
				<div className="view-file-header">
					<h3 className="view-file-title" title={file.filename}>
						{file.filename}
					</h3>
					<button className="close-button" onClick={onClose}>
						<HiOutlineX size={20} />
					</button>
				</div>
				<div className="view-file-content">
					{file.url ? (
						isPdf ? (
							<iframe
								src={file.url}
								title={file.filename}
								className="pdf-preview"
							/>
						) : (
							<div className="image-preview-container">
								<div className="zoom-controls">
									<button
										onClick={zoomOut}
										className="zoom-button"
									>
										-
									</button>
									<button
										onClick={resetZoom}
										className="zoom-button"
									>
										Reset
									</button>
									<button
										onClick={zoomIn}
										className="zoom-button"
									>
										+
									</button>
								</div>
								<div className="image-wrapper">
									<img
										src={file.url}
										alt={file.filename}
										className="full-size-image"
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
						<div className="file-fallback">
							<p>No preview available.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ViewFiles;
