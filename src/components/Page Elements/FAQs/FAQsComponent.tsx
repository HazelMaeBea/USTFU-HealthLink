import "./FAQsComponent.css";

// placeholders for questions extracted from db
const questions = [
    {
        question: "What is the purpose of this website?",
        answer: "The purpose of this website is to provide a platform for users to track their packages and to provide a list of frequently asked questions.",
        media: "https://www.youtube.com/embed/q98_pz7wpa8"
    },
    {
        question: "How do I track my package?",
        answer: "To track your package, you can enter your tracking number in the search bar and click on the 'Track' button. You will then be able to see the status of your package.",
        media: "https://www.youtube.com/embed/bDANTCuT908?si=t_8Xph2cb7xwctVg"
    },
    {
        question: "How do I contact customer service?",
        answer: "To contact customer service, you can send an email to ustfuhealthlinkdevs@gmail.com or call us at 123-456-7890.",
        media: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=HFGIldZWA1Izwlvw"
    }
];

const FAQsComponent = () => {
    return (
        <div className="faqs-container">
            <div className="header-section">
                <h1>Frequently Asked Questions</h1>
            </div>
            <div className="content-section">
                <div className="question-section">
                    {questions.map((q, index) => (
                        <div key={index} className="question">
                            <h2>{q.question}</h2>
                            <p>{q.answer}</p>
                            {q.media && (
                                <iframe width="560" height="315" 
                                src={q.media} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen>
                                </iframe>
                            )}
                        </div>
                    ))}
                </div>            
            </div>
        </div>
    );
}

export default FAQsComponent;