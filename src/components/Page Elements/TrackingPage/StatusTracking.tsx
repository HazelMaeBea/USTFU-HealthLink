const StatusTracking: React.FC<{ onBack: () => void }> = ({ onBack }) => {
	return (
		<div className="p-4 bg-gray-100 border rounded mt-2">
			<button
				className="mb-2 p-2 bg-blue-500 text-white rounded"
				onClick={onBack}
			>
				Back to Records
			</button>
			<div> Jabol </div>
		</div>
	);
};

export default StatusTracking;
