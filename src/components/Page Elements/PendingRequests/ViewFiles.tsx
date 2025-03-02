import React, { useEffect } from "react";
import "./ViewFiles.css";

interface ViewFilesProps {
	file: { url?: string; filename: string };
	onClose: () => void;
}

const ViewFiles: React.FC<ViewFilesProps> = ({ file, onClose }) => {
	useEffect(() => {
		console.log("Viewing file:", file);
	}, [file]);

	const isPdf = file.filename.toLowerCase().endsWith(".pdf");

	return (
		<div className="view-file-overlay">
			<div className="view-file-container">
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
							<img
								src={file.url}
								alt={file.filename}
								className="full-file-preview"
								onError={(e) => {
									console.error("Error loading file", e);
								}}
							/>
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
