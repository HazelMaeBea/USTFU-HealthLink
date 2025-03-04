import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import styles from "./BacktoTop.module.css";

interface BacktoTopProps {
	showBelow?: number; // Scroll threshold to show button (in pixels)
}

const BacktoTop: React.FC<BacktoTopProps> = ({ showBelow = 300 }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > showBelow) {
				if (!isVisible) setIsVisible(true);
			} else {
				if (isVisible) setIsVisible(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [showBelow, isVisible]);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<>
			{isVisible && (
				<button
					onClick={scrollToTop}
					aria-label="Back to top"
					className={styles.backToTop}
				>
					<FaArrowUp />
				</button>
			)}
		</>
	);
};

export default BacktoTop;
