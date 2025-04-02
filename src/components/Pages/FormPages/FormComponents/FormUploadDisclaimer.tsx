import React from "react";

const FormUploadDisclaimer: React.FC = () => {
	return (
		<>
			<hr className="section-separator" />
			<div className="file-types-info">
				<div className="upload-section-title">
					Kindly upload the necessary documents needed.
				</div>
				<div className="file-types-label">Accepted File Types:</div>
				<div className="file-types-list">PDF, PNG, JPG, and JPEG</div>
			</div>
		</>
	);
};

export default FormUploadDisclaimer;
