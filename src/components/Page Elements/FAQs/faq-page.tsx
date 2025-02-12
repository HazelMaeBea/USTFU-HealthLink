import { useState } from "react";
import { faqData } from "./faq-data";
import "./faq-styles.css";

export default function FAQPage() {
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
		<div className="faq-page">
			<div className="faq-container">
				<h1 className="faq-title">Frequently Asked Questions</h1>

				<input
					type="text"
					placeholder="Search FAQs..."
					className="faq-search-input"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>

				{searchTerm ? (
					<div className="faq-list">
						{filteredFAQs.map((item, index) => (
							<FAQItem key={index} {...item} />
						))}
					</div>
				) : (
					<div className="faq-categories">
						{faqData.map((category, index) => (
							<div key={index} className="faq-category">
								<h2 className="category-title">
									{category.topic}
								</h2>
								<div className="faq-list">
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

function FAQItem({ question, answer, media }: FAQItemProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={`faq-item ${isOpen ? "open" : ""}`}>
			<button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
				{question}
				<span className="faq-icon">{isOpen ? "−" : "+"}</span>
			</button>
			{isOpen && (
				<div className="faq-answer">
					<p>{answer}</p>
					{media && (
						<div
							className="faq-media"
							style={{
								display: "flex",
								justifyContent: "center",
							}}
						>
							<iframe
								width="280"
								height="165"
								src={media}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
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
