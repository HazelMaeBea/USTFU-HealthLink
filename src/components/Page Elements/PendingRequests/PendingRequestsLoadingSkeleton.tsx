import React from "react";
import "./PendingRequests.css";

const PendingRequestsLoadingSkeleton: React.FC = () => {
	// Create an array to render multiple skeleton requests
	const skeletonItems = Array(5).fill(null);

	return (
		<div className="loading-requests-container">
			{skeletonItems.map((_, index) => (
				<div className="loading-request" key={index}>
					<div className="loading-request-header">
						<div className="loading-field-group">
							<div className="loading-label skeleton"></div>
							<div className="loading-value skeleton"></div>
						</div>
						<div className="loading-field-group">
							<div className="loading-label skeleton"></div>
							<div className="loading-value skeleton"></div>
						</div>
						<div className="loading-field-group">
							<div className="loading-label skeleton"></div>
							<div className="loading-value skeleton"></div>
						</div>
						<div className="loading-badge skeleton"></div>
						<div className="loading-arrow skeleton"></div>
					</div>
				</div>
			))}

			{/* Pagination skeleton */}
			<div className="loading-pagination">
				{[...Array(5)].map((_, index) => (
					<div
						key={index}
						className="loading-page-button skeleton"
					></div>
				))}
			</div>
		</div>
	);
};

export default PendingRequestsLoadingSkeleton;
