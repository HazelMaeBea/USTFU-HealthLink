import React, { useEffect, useRef } from "react";
import "./ViewFiles.css";

interface ViewFilesProps {
	file: { url?: string; filename: string };
	onClose: () => void;
}

const ViewFiles: React.FC<ViewFilesProps> = ({ file, onClose }) => {
	// Create ref for the modal content
	const modalContentRef = useRef<HTMLDivElement>(null);

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

	return (
		<div className="view-file-overlay" onClick={handleBackgroundClick}>
			<div className="view-file-container" ref={modalContentRef}>
				<div className="view-file-header">
					<h3 className="view-file-title">{file.filename}</h3>
					<button className="close-button" onClick={onClose}>
						×
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
								<img
									src={file.url}
									alt={file.filename}
									className="full-size-image"
									onError={(e) => {
										console.error("Error loading file", e);
									}}
								/>
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
