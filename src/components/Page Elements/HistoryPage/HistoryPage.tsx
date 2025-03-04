import { useState } from "react";
import "../TrackingPage/TrackingPage.css";
import "./HistoryPage.css";
import type { Archive } from "../PendingRequests/types";
import { usePendingRequests } from "../PendingRequests/PendingRequestBackend";

const HospitalizationHistory = () => {
	const [selectedType, setSelectedType] = useState("All");
	const [filters, setFilters] = useState<string[]>([]);
	const [showFilterOptions, setShowFilterOptions] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showDateRangePopup, setShowDateRangePopup] = useState(false);
	const [dateRange, setDateRange] = useState({ start: "", end: "" });
	const [showFilterPopup, setShowFilterPopup] = useState<string | null>(null);
	const pendingRequests = usePendingRequests();

	// connect to the database
	//dapat pagkasubmit ng forms, kung anong tab nila ginawa isasave na yon as form type
	//para malagyan niyo ng form type dito
	const formatTableData = (request: Archive) => {
		const { formData, dateSubmitted, requester } = request;

		return {
			formType: formData.formType,
			dateApproved: dateSubmitted || "-",
			name: requester, // Directly from Archive
			age: formData.age || "-",
			college: formData.college || "-",

			// Only available in HospitalFormData and AdmissionFormData
			term: formData.formType === "hospital" ? formData.term || "-" : "-",
			academicYear:
				formData.formType === "hospital" ? formData.year || "-" : "-",
			load:
				formData.formType === "hospital" || formData.formType === "admission"
					? formData.load || "-"
					: "-",
			status:
				formData.formType === "hospital" || formData.formType === "admission"
					? formData.status || "-"
					: "-",

			// Only available in HospitalFormData
			natureOfIllness:
				formData.formType === "hospital" ? formData.illness || "-" : "-",
			physician:
				formData.formType === "hospital" ? formData.physician || "-" : "-",
			procedures:
				formData.formType === "hospital" ? formData.procedures || "-" : "-",
			remainingBenefits: "-",
		};
	};

	const tableData = pendingRequests.map(formatTableData);

	const termOptions = ["1st", "2nd"];
	const collegeOptions = ["College of Engineering", "College of Music"];
	const academicYearOptions = ["2022-2023", "2023-2024"];
	const loadOptions = ["Full", "Part-time"];
	const statusOptions = ["Approved", "Pending", "Denied"];

	const removeFilter = (filterToRemove: string) => {
		setFilters((prev) => prev.filter((filter) => filter !== filterToRemove));
	};

	const applyFilters = (data: any[]) => {
		return data.filter((row) => {
			const matchesType =
				selectedType === "All" || row.formType === selectedType;
			return (
				matchesType &&
				filters.every((filter) => {
					const [filterType, filterValue] = filter.split(": ");
					if (filterType === "Date") {
						const [startDate, endDate] = filterValue.split(" / ");
						return row.dateApproved >= startDate && row.dateApproved <= endDate;
					} else if (filterType === "College") {
						return filterValue.split(", ").includes(row.college);
					} else if (filterType === "Term") {
						return filterValue.split(", ").includes(row.term);
					} else if (filterType === "Academic Year") {
						return filterValue.split(", ").includes(row.academicYear);
					} else if (filterType === "Load") {
						return filterValue.split(", ").includes(row.load);
					} else if (filterType === "Status") {
						return filterValue.split(", ").includes(row.status);
					}
					return true;
				})
			);
		});
	};

	const filteredData = applyFilters(tableData);

	const isDateRangeValid =
		dateRange.start !== "" &&
		dateRange.end !== "" &&
		dateRange.start <= dateRange.end;

	const sortedData = [...filteredData].sort((a, b) => {
		const dateA =
			a.dateApproved !== "-" ? new Date(a.dateApproved).getTime() : 0;
		const dateB =
			b.dateApproved !== "-" ? new Date(b.dateApproved).getTime() : 0;
		return dateB - dateA; // Descending order (latest date first)
	});

	const renderContent = () => {
		return (
			<table className="history-table">
				<thead className="history-table-header">
					<tr>
						<th>Form Type</th>
						<th>Date Approved</th>
						<th>Name</th>
						<th>Age</th>
						<th>College</th>
						<th>Term</th>
						<th>Academic Year</th>
						<th>Load</th>
						<th>Status</th>
						<th>Nature of Illness</th>
						<th>Physician</th>
						<th>Procedures</th>
						<th>Remaining Benefits</th>
					</tr>
				</thead>
				<tbody>
					{sortedData.map((row, index) => (
						<tr key={index}>
							<td>{row.formType}</td>
							<td>{row.dateApproved}</td>
							<td>{row.name}</td>
							<td>{row.age}</td>
							<td>{row.college}</td>
							<td>{row.term}</td>
							<td>{row.academicYear}</td>
							<td>{row.load}</td>
							<td>{row.status}</td>
							<td>{row.natureOfIllness}</td>
							<td>{row.physician}</td>
							<td>{row.procedures}</td>
							<td>{row.remainingBenefits}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	};

	const exportToCSV = () => {
		const csvRows = [];
		const headers = [
			"Date Approved",
			"Form Type",
			"Name",
			"Age",
			"College",
			"Term",
			"Academic Year",
			"Load",
			"Status",
			"Nature of Illness",
			"Physician",
			"Procedures",
			"Remaining Benefits",
		];
		csvRows.push(headers.join(","));

		for (const row of filteredData) {
			const values = [
				row.dateApproved,
				row.formType,
				row.name,
				row.age,
				row.college,
				row.term,
				row.academicYear,
				row.load,
				row.status,
				row.natureOfIllness,
				row.physician,
				row.procedures,
				row.remainingBenefits,
			];
			csvRows.push(values.join(","));
		}

		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.setAttribute("hidden", "");
		a.setAttribute("href", url);
		a.setAttribute("download", "history.csv");
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleAddFilter = (filter: string) => {
		if (filter === "Date") {
			setShowDateRangePopup(true);
		} else {
			setShowFilterPopup(filter);
		}
		setShowFilterOptions(false);
	};

	const handleDateRangeSubmit = () => {
		if (isDateRangeValid) {
			setFilters((prev) => {
				const newFilters = [...prev];
				const dateFilterIndex = newFilters.findIndex((filter) =>
					filter.startsWith("Date:")
				);
				const formatDate = (date: string) => {
					const [year, month, day] = date.split("-");
					return `${month}/${day}/${year}`;
				};
				const dateFilterValue = `Date: ${formatDate(
					dateRange.start
				)} - ${formatDate(dateRange.end)}`;
				if (dateFilterIndex !== -1) {
					newFilters[dateFilterIndex] = dateFilterValue;
				} else {
					newFilters.push(dateFilterValue);
				}
				return newFilters;
			});
			setShowDateRangePopup(false);
		}
	};

	const handleFilterSubmit = (filter: string, selectedOptions: string[]) => {
		setFilters((prev) => {
			const newFilters = [...prev];
			const filterIndex = newFilters.findIndex((f) => f.startsWith(filter));
			const filterValue = `${filter}: ${selectedOptions.join(", ")}`;
			if (filterIndex !== -1) {
				newFilters[filterIndex] = filterValue;
			} else {
				newFilters.push(filterValue);
			}
			return newFilters;
		});
		setShowFilterPopup(null);
	};

	const availableFilters = [
		"Date",
		"College",
		"Term",
		"Academic Year",
		"Load",
		"Status",
	].filter(
		(filter) =>
			!filters.some((selectedFilter) => selectedFilter.startsWith(filter))
	);

	return (
		<div>
			<div title="history" className="Tabby">
				<section className="tab-content">
					<div className="title-header" style={{ textAlign: "center" }}>
						<h3 className="header">History</h3>
					</div>
					<div className="history-header">
						<div className="left-buttons">
							<input
								type="text"
								className="search-bar"
								placeholder="Search Patient Name"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<select
								className="btn btn-filter document-type"
								aria-label="Document Type"
								value={selectedType}
								onChange={(e) => setSelectedType(e.target.value)}
							>
								<option value="All">All Forms</option>
								<option value="Inpatient">Inpatient</option>
								<option value="Outpatient">Outpatient</option>
								<option value="Eyeglasses">Eyeglasses</option>
							</select>
							{filters.map((filter, index) => (
								<button
									key={index}
									className="btn btn-filter"
									onClick={() => handleAddFilter(filter.split(":")[0])}
								>
									{filter}
									<span
										className="btn-remove-filter"
										onClick={(e) => {
											e.stopPropagation();
											removeFilter(filter);
										}}
										style={{ fontSize: "2em" }}
									>
										&times;
										{/* this is the X button */}
									</span>
								</button>
							))}
							<div className="filter-container">
								{availableFilters.length > 0 && (
									<button
										className="btn btn-filter add-filter"
										onClick={() => setShowFilterOptions(!showFilterOptions)}
									>
										<strong>+</strong> Add Filter
									</button>
								)}
								{showFilterOptions && (
									<div
										className="filter-options"
										style={{ position: "absolute" }}
									>
										{availableFilters.map((filter) => (
											<button
												key={filter}
												className="btn btn-filter-option"
												onClick={() => handleAddFilter(filter)}
											>
												{filter}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
						<button className="btn btn-export" onClick={exportToCSV}>
							Export CSV
						</button>
					</div>
					{renderContent()}
				</section>
			</div>
			{showDateRangePopup && (
				<div className="date-range-popup">
					<div className="date-range-popup-content">
						<h3 className="date-filter-header">Date Range</h3>
						<label>
							Start Date:
							<input
								type="date"
								value={dateRange.start}
								onChange={(e) =>
									setDateRange((prev) => ({
										...prev,
										start: e.target.value,
									}))
								}
							/>
						</label>
						<label>
							End Date:
							<input
								type="date"
								value={dateRange.end}
								onChange={(e) =>
									setDateRange((prev) => ({
										...prev,
										end: e.target.value,
									}))
								}
							/>
						</label>
						<div className="popup-buttons">
							<button onClick={() => setShowDateRangePopup(false)}>
								Cancel
							</button>
							<button
								onClick={handleDateRangeSubmit}
								disabled={!isDateRangeValid}
							>
								Submit
							</button>
						</div>
					</div>
				</div>
			)}
			{showFilterPopup && (
				<div className="filter-popup">
					<div className="filter-popup-content">
						<h3 className="filter-header">Filter {showFilterPopup}</h3>
						<div className="filter-options-list">
							{showFilterPopup === "Term" &&
								termOptions.map((option) => (
									<div key={option} className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											value={option}
											id={`term-${option}`}
										/>
										<label
											className="form-check-label"
											htmlFor={`term-${option}`}
										>
											{option}
										</label>
									</div>
								))}
							{showFilterPopup === "College" &&
								collegeOptions.map((option) => (
									<div key={option} className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											value={option}
											id={`college-${option}`}
										/>
										<label
											className="form-check-label"
											htmlFor={`college-${option}`}
										>
											{option}
										</label>
									</div>
								))}
							{showFilterPopup === "Academic Year" &&
								academicYearOptions.map((option) => (
									<div key={option} className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											value={option}
											id={`academicYear-${option}`}
										/>
										<label
											className="form-check-label"
											htmlFor={`academicYear-${option}`}
										>
											{option}
										</label>
									</div>
								))}
							{showFilterPopup === "Load" &&
								loadOptions.map((option) => (
									<div key={option} className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											value={option}
											id={`load-${option}`}
										/>
										<label
											className="form-check-label"
											htmlFor={`load-${option}`}
										>
											{option}
										</label>
									</div>
								))}
							{showFilterPopup === "Status" &&
								statusOptions.map((option) => (
									<div key={option} className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											value={option}
											id={`status-${option}`}
										/>
										<label
											className="form-check-label"
											htmlFor={`status-${option}`}
										>
											{option}
										</label>
									</div>
								))}
						</div>
						<div className="popup-buttons">
							<button onClick={() => setShowFilterPopup(null)}>Cancel</button>
							<button
								onClick={() =>
									handleFilterSubmit(
										showFilterPopup,
										Array.from(
											document.querySelectorAll(
												".filter-popup-content input:checked"
											)
										).map((input) => (input as HTMLInputElement).value)
									)
								}
							>
								Submit
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default HospitalizationHistory;
