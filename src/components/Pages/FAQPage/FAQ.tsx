import { useState } from "react";
import styles from "./FAQ.module.css";

// Assuming you'll import the data from the correct path
// You may need to adjust this path to where your faq-data.ts file is located
import { faqData } from "./faq-data";

export default function FAQ() {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredFAQs = faqData.flatMap((category) =>
		category.items
			.filter(
				(item) =>
					item.question
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					item.answer.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.map((item) => ({ ...item, category: category.topic }))
	);

	return (
		<div className={styles.faqPage}>
			<div className={styles.faqContainer}>
				<h1 className={styles.faqTitle}>Frequently Asked Questions</h1>

				<div className={styles.searchContainer}>
					<input
						type="text"
						placeholder="Search FAQs..."
						className={styles.searchInput}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				{searchTerm ? (
					<div className={styles.faqList}>
						{filteredFAQs.length > 0 ? (
							filteredFAQs.map((item, index) => (
								<FAQItem key={index} {...item} />
							))
						) : (
							<div className={styles.noResults}>
								No results found for "{searchTerm}"
							</div>
						)}
					</div>
				) : (
					<div className={styles.faqCategories}>
						{faqData.map((category, index) => (
							<div key={index} className={styles.faqCategory}>
								<h2 className={styles.categoryTitle}>
									{category.topic}
								</h2>
								<div className={styles.faqList}>
									{category.items.map((item, itemIndex) => (
										<FAQItem key={itemIndex} {...item} />
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function FAQItem({ question, answer, media, category }: FAQItemProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}>
			<button
				className={styles.faqQuestion}
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				<div className={styles.questionContent}>
					{category && (
						<span className={styles.categoryTag}>{category}</span>
					)}
					<span className={styles.questionText}>{question}</span>
				</div>
				<span className={styles.faqIcon}>{isOpen ? "−" : "+"}</span>
			</button>
			{isOpen && (
				<div className={styles.faqAnswer}>
					<p className={styles.faqAnswerText}>{answer}</p>
					{media && (
						<div className={styles.faqMedia}>
							<iframe
								width="560"
								height="315"
								src={media}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								title={`Media for ${question}`}
							></iframe>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface FAQItemProps {
	question: string;
	answer: string;
	media?: string;
	category?: string;
}
