import React from "react";
import styles from "./PendingRequestList.module.css";

const PendingRequestsLoadingSkeleton: React.FC = () => {
	// Create an array to represent the number of skeleton items to show
	const skeletonItems = Array(3).fill(null);

	return (
		<div className={styles["loading-requests-container"]}>
			{skeletonItems.map((_, index) => (
				<div key={index} className={styles["loading-request"]}>
					<div className={styles["loading-request-header"]}>
						<div className={styles["loading-field-group"]}>
							<div
								className={`${styles.skeleton} ${styles["loading-label"]}`}
							></div>
							<div
								className={`${styles.skeleton} ${styles["loading-value"]}`}
							></div>
						</div>
						<div className={styles["loading-field-group"]}>
							<div
								className={`${styles.skeleton} ${styles["loading-label"]}`}
							></div>
							<div
								className={`${styles.skeleton} ${styles["loading-value"]}`}
							></div>
						</div>
						<div className={styles["loading-field-group"]}>
							<div
								className={`${styles.skeleton} ${styles["loading-label"]}`}
							></div>
							<div
								className={`${styles.skeleton} ${styles["loading-value"]}`}
							></div>
						</div>
						<div
							className={`${styles.skeleton} ${styles["loading-arrow"]}`}
						></div>
					</div>
				</div>
			))}

			<div className={styles["loading-pagination"]}>
				<div
					className={`${styles.skeleton} ${styles["loading-page-button"]}`}
				></div>
				<div
					className={`${styles.skeleton} ${styles["loading-page-button"]}`}
				></div>
				<div
					className={`${styles.skeleton} ${styles["loading-page-button"]}`}
				></div>
			</div>
		</div>
	);
};

export default PendingRequestsLoadingSkeleton;
