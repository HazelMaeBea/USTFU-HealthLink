import { useState } from "react"; // Remove useRef and useEffect
import "../TrackingPage/TrackingPage.css";
import styles from "./HistoryPage.module.css";
import type { PendingRequest } from "../PendingRequests/types";
import { usePendingRequests } from "../PendingRequests/PendingRequestBackend";
import { FiSearch, FiFilter, FiDownload, FiPlus, FiX } from "react-icons/fi";

const HospitalizationHistory = () => {
	const [selectedType, setSelectedType] = useState("All");
	const [filters, setFilters] = useState<string[]>([]);
	const [showFilterOptions, setShowFilterOptions] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showDateRangePopup, setShowDateRangePopup] = useState(false);
	const [dateRange, setDateRange] = useState({ start: "", end: "" });
	const [showFilterPopup, setShowFilterPopup] = useState<string | null>(null);

	// Fix destructuring from the hook
	const { requests: pendingRequestsData, pagination } = usePendingRequests(
		1,
		100
	); // Get more items for history

	// Add error handling state
	const [error, setError] = useState<string | null>(null);

	// Remove tableContainerRef and hasHorizontalScroll state
	// Remove the useEffect for scroll detection

	// Format data for the table
	const formatTableData = (request: PendingRequest) => {
		try {
			const { formData, dateSubmitted, requester } = request;

			return {
				formType: formData?.formType || "Unknown",
				dateApproved: dateSubmitted || "-",
				name: requester || "Unknown",
				age: formData?.age || "-",
				college: formData?.college || "-",
				term:
					formData?.formType === "hospital"
						? formData?.term || "-"
						: "-",
				academicYear:
					formData?.formType === "hospital"
						? formData?.year || "-"
						: "-",
				load:
					formData?.formType === "hospital" ||
					formData?.formType === "admission"
						? formData?.load || "-"
						: "-",
				status:
					formData?.formType === "hospital" ||
					formData?.formType === "admission"
						? formData?.status || "-"
						: "-",
				natureOfIllness:
					formData?.formType === "hospital"
						? formData?.illness || "-"
						: "-",
				physician:
					formData?.formType === "hospital"
						? formData?.physician || "-"
						: "-",
				procedures:
					formData?.formType === "hospital"
						? formData?.procedures || "-"
						: "-",
				remainingBenefits: "-",
			};
		} catch (err) {
			console.error("Error formatting table data:", err);
			setError("Error formatting request data");
			return null;
		}
	};

	const tableData = pendingRequestsData
		.map(formatTableData)
		.filter((item) => item !== null); // Filter out any null items from errors

	const termOptions = ["1st", "2nd"];
	const collegeOptions = ["College of Engineering", "College of Music"];
	const academicYearOptions = ["2022-2023", "2023-2024"];
	const loadOptions = ["Full", "Part-time"];
	const statusOptions = ["Approved", "Pending", "Denied"];

	const removeFilter = (filterToRemove: string) => {
		setFilters((prev) =>
			prev.filter((filter) => filter !== filterToRemove)
		);
	};

	const applyFilters = (data: any[]) => {
		return data.filter((row) => {
			if (!row) return false; // Skip null rows

			const matchesType =
				selectedType === "All" || row.formType === selectedType;

			const matchesSearch =
				searchQuery === "" ||
				row.name.toLowerCase().includes(searchQuery.toLowerCase());

			return (
				matchesType &&
				matchesSearch &&
				filters.every((filter) => {
					const [filterType, filterValue] = filter.split(": ");
					if (filterType === "Date") {
						const [startDate, endDate] = filterValue.split(" - ");
						return (
							row.dateApproved >= startDate &&
							row.dateApproved <= endDate
						);
					} else if (filterType === "College") {
						return filterValue.split(", ").includes(row.college);
					} else if (filterType === "Term") {
						return filterValue.split(", ").includes(row.term);
					} else if (filterType === "Academic Year") {
						return filterValue
							.split(", ")
							.includes(row.academicYear);
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
		if (!a || !b) return 0; // Handle null values
		const dateA =
			a.dateApproved !== "-" ? new Date(a.dateApproved).getTime() : 0;
		const dateB =
			b.dateApproved !== "-" ? new Date(b.dateApproved).getTime() : 0;
		return dateB - dateA; // Descending order (latest date first)
	});

	const renderContent = () => {
		if (error) {
			return (
				<div className={styles.errorMessage}>
					<div className={styles.errorIcon}>!</div>
					<p>{error}</p>
				</div>
			);
		}

		if (sortedData.length === 0) {
			return (
				<div className={styles.noDataMessage}>
					<div className={styles.emptyStateIcon}>
						<FiFilter size={36} />
					</div>
					<p>No history records found</p>
					<small>Try adjusting your filters or search criteria</small>
				</div>
			);
		}

		return (
			<div className={styles.tableContainer}>
				<table className={styles.table}>
					<thead>
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
							<tr
								key={index}
								className={
									index % 2 === 0
										? styles.evenRow
										: styles.oddRow
								}
							>
								<td className={styles.formTypeCell}>
									{row?.formType || "-"}
								</td>
								<td>{row?.dateApproved || "-"}</td>
								<td className={styles.nameCell}>
									{row?.name || "-"}
								</td>
								<td>{row?.age || "-"}</td>
								<td>{row?.college || "-"}</td>
								<td>{row?.term || "-"}</td>
								<td>{row?.academicYear || "-"}</td>
								<td>{row?.load || "-"}</td>
								<td>
									<span
										className={`${styles.statusBadge} ${
											row?.status
												? styles[
														`status${
															row.status
																.charAt(0)
																.toUpperCase() +
															row.status
																.slice(1)
																.toLowerCase()
														}`
												  ] || styles.statusUnknown
												: styles.statusUnknown
										}`}
									>
										{row?.status || "-"}
									</span>
								</td>
								<td>{row?.natureOfIllness || "-"}</td>
								<td>{row?.physician || "-"}</td>
								<td>{row?.procedures || "-"}</td>
								<td>{row?.remainingBenefits || "-"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
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
			if (!row) continue; // Skip null rows
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
			const filterIndex = newFilters.findIndex((f) =>
				f.startsWith(filter)
			);
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
		<div className={styles.historyPageContainer}>
			<div className={styles.historyCard}>
				<div className={styles.historyCardHeader}>
					<h3 className={styles.historyTitle}>Transaction History</h3>
					<p className={styles.historySubtitle}>
						View and filter all transaction records
					</p>
				</div>

				<div className={styles.historyControls}>
					<div className={styles.searchControls}>
						<div className={styles.searchInputContainer}>
							<FiSearch className={styles.searchIcon} />
							<input
								type="text"
								className={styles.searchInput}
								placeholder="Search by name"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div className={styles.formTypeFilter}>
							<select
								className={styles.formTypeSelect}
								aria-label="Form Type"
								value={selectedType}
								onChange={(e) =>
									setSelectedType(e.target.value)
								}
							>
								<option value="All">All Forms</option>
								<option value="hospital">Hospital</option>
								<option value="eyeglasses">Eyeglasses</option>
								<option value="admission">Admission</option>
							</select>
						</div>
					</div>

					<div className={styles.filterControls}>
						<div className={styles.activeFilters}>
							{filters.map((filter, index) => (
								<div key={index} className={styles.filterTag}>
									<span className={styles.filterText}>
										{filter.split(":")[0]}
									</span>
									<button
										className={styles.filterRemove}
										onClick={(e) => {
											e.stopPropagation();
											removeFilter(filter);
										}}
										title="Remove filter"
									>
										<FiX size={16} />
									</button>
								</div>
							))}
						</div>

						{availableFilters.length > 0 && (
							<div className={styles.filterDropdownContainer}>
								<button
									className={styles.addFilterBtn}
									onClick={() =>
										setShowFilterOptions(!showFilterOptions)
									}
								>
									<FiPlus size={14} />
									<span>Filter</span>
								</button>

								{showFilterOptions && (
									<div
										className={styles.filterOptionsDropdown}
									>
										{availableFilters.map((filter) => (
											<button
												key={filter}
												className={styles.filterOption}
												onClick={() =>
													handleAddFilter(filter)
												}
											>
												{filter}
											</button>
										))}
									</div>
								)}
							</div>
						)}

						<button
							className={styles.exportBtn}
							onClick={exportToCSV}
							disabled={filteredData.length === 0}
							title="Export to CSV"
						>
							<FiDownload size={14} />
							<span>Export</span>
						</button>
					</div>
				</div>

				<div className={styles.historyContent}>{renderContent()}</div>

				<div className={styles.historyFooter}>
					<div className={styles.recordsCount}>
						Showing {sortedData.length} of {tableData.length}{" "}
						records
					</div>
				</div>
			</div>

			{showDateRangePopup && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3>Select Date Range</h3>
							<button
								className={styles.closeModal}
								onClick={() => setShowDateRangePopup(false)}
							>
								<FiX size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<div className={styles.formGroup}>
								<label htmlFor="start-date">Start Date</label>
								<input
									id="start-date"
									type="date"
									value={dateRange.start}
									onChange={(e) =>
										setDateRange((prev) => ({
											...prev,
											start: e.target.value,
										}))
									}
								/>
							</div>
							<div className={styles.formGroup}>
								<label htmlFor="end-date">End Date</label>
								<input
									id="end-date"
									type="date"
									value={dateRange.end}
									onChange={(e) =>
										setDateRange((prev) => ({
											...prev,
											end: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<div className={styles.modalFooter}>
							<button
								className={styles.cancelBtn}
								onClick={() => setShowDateRangePopup(false)}
							>
								Cancel
							</button>
							<button
								className={styles.applyBtn}
								onClick={handleDateRangeSubmit}
								disabled={!isDateRangeValid}
							>
								Apply Filter
							</button>
						</div>
					</div>
				</div>
			)}

			{showFilterPopup && (
				<div className={styles.modalOverlay}>
					<div
						className={`${styles.modalContainer} ${styles.filterModal}`}
					>
						<div className={styles.modalHeader}>
							<h3>Filter by {showFilterPopup}</h3>
							<button
								className={styles.closeModal}
								onClick={() => setShowFilterPopup(null)}
							>
								<FiX size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<div className={styles.filterOptionsList}>
								{showFilterPopup === "Term" &&
									termOptions.map((option) => (
										<div
											key={option}
											className={styles.checkboxOption}
										>
											<input
												id={`term-${option}`}
												type="checkbox"
												value={option}
												className={styles.checkboxInput}
											/>
											<label
												htmlFor={`term-${option}`}
												className={styles.checkboxLabel}
											>
												{option}
											</label>
										</div>
									))}
								{showFilterPopup === "College" &&
									collegeOptions.map((option) => (
										<div
											key={option}
											className={styles.checkboxOption}
										>
											<input
												id={`college-${option}`}
												type="checkbox"
												value={option}
												className={styles.checkboxInput}
											/>
											<label
												htmlFor={`college-${option}`}
												className={styles.checkboxLabel}
											>
												{option}
											</label>
										</div>
									))}
								{showFilterPopup === "Academic Year" &&
									academicYearOptions.map((option) => (
										<div
											key={option}
											className={styles.checkboxOption}
										>
											<input
												id={`academicYear-${option}`}
												type="checkbox"
												value={option}
												className={styles.checkboxInput}
											/>
											<label
												htmlFor={`academicYear-${option}`}
												className={styles.checkboxLabel}
											>
												{option}
											</label>
										</div>
									))}
								{showFilterPopup === "Load" &&
									loadOptions.map((option) => (
										<div
											key={option}
											className={styles.checkboxOption}
										>
											<input
												id={`load-${option}`}
												type="checkbox"
												value={option}
												className={styles.checkboxInput}
											/>
											<label
												htmlFor={`load-${option}`}
												className={styles.checkboxLabel}
											>
												{option}
											</label>
										</div>
									))}
								{showFilterPopup === "Status" &&
									statusOptions.map((option) => (
										<div
											key={option}
											className={styles.checkboxOption}
										>
											<input
												id={`status-${option}`}
												type="checkbox"
												value={option}
												className={styles.checkboxInput}
											/>
											<label
												htmlFor={`status-${option}`}
												className={styles.checkboxLabel}
											>
												{option}
											</label>
										</div>
									))}
							</div>
						</div>
						<div className={styles.modalFooter}>
							<button
								className={styles.cancelBtn}
								onClick={() => setShowFilterPopup(null)}
							>
								Cancel
							</button>
							<button
								className={styles.applyBtn}
								onClick={() =>
									handleFilterSubmit(
										showFilterPopup,
										Array.from(
											document.querySelectorAll(
												`.${styles.checkboxInput}:checked`
											)
										).map(
											(input) =>
												(input as HTMLInputElement)
													.value
										)
									)
								}
							>
								Apply Filter
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default HospitalizationHistory;
