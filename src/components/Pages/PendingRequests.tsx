import React, { useState, useRef, useEffect } from "react";
import PendingRequestList from "../Page Elements/PendingRequests/PendingRequestsList";
import { FiSearch, FiFilter, FiPlus, FiX, FiClock } from "react-icons/fi";
import historyStyles from "../Page Elements/HistoryPage/HistoryPage.module.css";
import styles from "./PendingRequests.module.css";

const PendingRequests: React.FC = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState("All");
	const [filters, setFilters] = useState<string[]>([]);
	const [showFilterOptions, setShowFilterOptions] = useState(false);
	const [showFilterPopup, setShowFilterPopup] = useState<string | null>(null);
	const [showFormTypeDropdown, setShowFormTypeDropdown] = useState(false);
	const [showClearAllConfirmation, setShowClearAllConfirmation] =
		useState(false);

	// Add proper date range state
	const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
		start: "",
		end: "",
	});
	const [showDateRangePopup, setShowDateRangePopup] = useState(false);

	// Refs for the dropdown containers
	const formTypeDropdownRef = useRef<HTMLDivElement>(null);
	const filterDropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdowns when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			// Close form type dropdown when clicking outside
			if (
				formTypeDropdownRef.current &&
				!formTypeDropdownRef.current.contains(event.target as Node)
			) {
				setShowFormTypeDropdown(false);
			}

			// Close filter options dropdown when clicking outside
			if (
				filterDropdownRef.current &&
				!filterDropdownRef.current.contains(event.target as Node)
			) {
				setShowFilterOptions(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const removeFilter = (filterToRemove: string) => {
		setFilters((prev) =>
			prev.filter((filter) => filter !== filterToRemove)
		);
	};

	const handleAddFilter = (filter: string) => {
		if (filter === "Date") {
			setShowDateRangePopup(true);
		} else {
			setShowFilterPopup(filter);
		}
		setShowFilterOptions(false);
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

	const clearAllFilters = () => {
		setFilters([]);
		setSelectedType("All");
		setSearchQuery("");
		setShowClearAllConfirmation(false);
	};

	// Handle date range input changes
	const handleDateRangeChange = (field: "start" | "end", value: string) => {
		setDateRange((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Handle date range filter submission
	const handleDateRangeSubmit = () => {
		if (
			dateRange.start &&
			dateRange.end &&
			dateRange.start <= dateRange.end
		) {
			setFilters((prev) => {
				const newFilters = [...prev];
				const dateFilterIndex = newFilters.findIndex((filter) =>
					filter.startsWith("Date:")
				);
				const formatDate = (date: string) => {
					const [year, month, day] = date.split("-");
					return `${parseInt(month)}/${parseInt(day)}/${year}`;
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

	// Form type options
	const formTypeOptions = [
		{ value: "All", label: "All Forms" },
		{ value: "inpatient", label: "Inpatient" },
		{ value: "outpatient", label: "Outpatient" },
		{ value: "eyeglasses", label: "Eyeglasses" },
		{ value: "admission", label: "Admission" },
	];

	// Filter options
	const collegeOptions = [
		"College of Accountancy",
		"College of Architecture",
		"Faculty of Arts and Letters",
		"Faculty of Civil Law",
		"College of Commerce and Business Administration",
		"College of Education",
		"Faculty of Engineering",
		"College of Fine Arts and Design",
		"Graduate School",
		"Graduate School of Law",
		"College of Information and Computing Sciences",
		"Faculty of Medicine and Surgery",
		"Conservatory of Music",
		"College of Nursing",
		"Faculty of Pharmacy",
		"Institute of Physical Education and Athletics",
		"College of Rehabilitation Sciences",
		"College of Science",
		"College of Tourism and Hospitality Management",
	];

	const statusOptions = [
		"Tenured",
		"Tenured-Track",
		"Lecturer Before 2001",
		"Extendee",
		"Retiree",
	];

	const availableFilters = ["College", "Status", "Date"].filter(
		(filter) =>
			!filters.some((selectedFilter) => selectedFilter.startsWith(filter))
	);

	return (
		<div className={styles.pendingRequestsContainer}>
			<div className={styles.pendingRequestsCard}>
				<div className={styles.pendingRequestsCardHeader}>
					<h3 className={styles.pendingRequestsTitle}>
						Pending Requests
					</h3>
					<p className={styles.pendingRequestsSubtitle}>
						Review and process submitted form applications
					</p>
				</div>

				<div className={historyStyles.historyControls}>
					<div className={historyStyles.searchControls}>
						<div className={historyStyles.searchInputContainer}>
							<FiSearch className={historyStyles.searchIcon} />
							<input
								type="text"
								className={historyStyles.searchInput}
								placeholder="Search by name, requester, transaction ID..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div
							className={historyStyles.formTypeFilter}
							ref={formTypeDropdownRef}
						>
							<button
								className={historyStyles.formTypeButton}
								onClick={() =>
									setShowFormTypeDropdown(
										!showFormTypeDropdown
									)
								}
								aria-label="Select Form Type"
								aria-expanded={showFormTypeDropdown}
							>
								{formTypeOptions.find(
									(option) => option.value === selectedType
								)?.label || "All Forms"}
								<span className={historyStyles.formTypeIcon}>
									▼
								</span>
							</button>

							{showFormTypeDropdown && (
								<div className={historyStyles.formTypeDropdown}>
									{formTypeOptions.map((option) => (
										<button
											key={option.value}
											className={`${
												historyStyles.formTypeOption
											} ${
												selectedType === option.value
													? historyStyles.formTypeOptionSelected
													: ""
											}`}
											onClick={() => {
												setSelectedType(option.value);
												setShowFormTypeDropdown(false);
											}}
										>
											{option.label}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					<div className={historyStyles.filterControls}>
						<div className={historyStyles.activeFilters}>
							{filters.map((filter, index) => {
								const [filterType, filterValue] =
									filter.split(": ");
								return (
									<div
										key={index}
										className={historyStyles.filterTag}
									>
										<span
											className={historyStyles.filterText}
										>
											{filterType}:
										</span>
										<span
											className={
												historyStyles.filterValue
											}
										>
											{filterValue}
										</span>
										<button
											className={
												historyStyles.filterRemove
											}
											onClick={(e) => {
												e.stopPropagation();
												removeFilter(filter);
											}}
											title="Remove filter"
										>
											<FiX size={16} />
										</button>
									</div>
								);
							})}

							{/* Add clear all filters button if there are any filters */}
							{(filters.length > 0 ||
								selectedType !== "All" ||
								searchQuery) && (
								<button
									className={historyStyles.clearAllFiltersBtn}
									onClick={() =>
										setShowClearAllConfirmation(true)
									}
									title="Clear all filters"
								>
									<span>Clear all</span>
								</button>
							)}
						</div>

						<div className={historyStyles.filterButtonContainer}>
							{availableFilters.length > 0 && (
								<div
									className={
										historyStyles.filterDropdownContainer
									}
									ref={filterDropdownRef}
								>
									<button
										className={historyStyles.addFilterBtn}
										onClick={() =>
											setShowFilterOptions(
												!showFilterOptions
											)
										}
									>
										<FiPlus size={14} />
										<span>Filter</span>
									</button>

									{showFilterOptions && (
										<div
											className={
												historyStyles.filterOptionsDropdown
											}
										>
											{availableFilters.map((filter) => (
												<button
													key={filter}
													className={
														historyStyles.filterOption
													}
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
						</div>
					</div>
				</div>

				<div className={styles.pendingRequestsContent}>
					{/* Render the pending requests list */}
					<PendingRequestList
						searchQuery={searchQuery}
						selectedType={selectedType}
						filters={filters}
					/>
				</div>
			</div>

			{/* Filter Options Popup */}
			{showFilterPopup && (
				<div className={historyStyles.modalOverlay}>
					<div
						className={`${historyStyles.modalContainer} ${historyStyles.filterModal}`}
					>
						<div className={historyStyles.modalHeader}>
							<h3>Filter by {showFilterPopup}</h3>
							<button
								className={historyStyles.closeModal}
								onClick={() => setShowFilterPopup(null)}
							>
								<FiX size={20} />
							</button>
						</div>
						<div className={historyStyles.modalBody}>
							<div className={historyStyles.filterOptionsList}>
								{showFilterPopup === "College" &&
									collegeOptions.map((option) => (
										<div
											key={option}
											className={
												historyStyles.checkboxOption
											}
										>
											<input
												id={`college-${option}`}
												type="checkbox"
												value={option}
												className={
													historyStyles.checkboxInput
												}
											/>
											<label
												htmlFor={`college-${option}`}
												className={
													historyStyles.checkboxLabel
												}
											>
												{option}
											</label>
										</div>
									))}
								{showFilterPopup === "Status" &&
									statusOptions.map((option) => (
										<div
											key={option}
											className={
												historyStyles.checkboxOption
											}
										>
											<input
												id={`status-${option}`}
												type="checkbox"
												value={option}
												className={
													historyStyles.checkboxInput
												}
											/>
											<label
												htmlFor={`status-${option}`}
												className={
													historyStyles.checkboxLabel
												}
											>
												{option}
											</label>
										</div>
									))}
							</div>
						</div>
						<div className={historyStyles.modalFooter}>
							<button
								className={historyStyles.cancelBtn}
								onClick={() => setShowFilterPopup(null)}
							>
								Cancel
							</button>
							<button
								className={historyStyles.applyBtn}
								onClick={() => {
									handleFilterSubmit(
										showFilterPopup,
										Array.from(
											document.querySelectorAll(
												`.${historyStyles.checkboxInput}:checked`
											)
										).map(
											(input) =>
												(input as HTMLInputElement)
													.value
										)
									);
								}}
							>
								Apply Filter
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Date Range Popup */}
			{showDateRangePopup && (
				<div className={historyStyles.modalOverlay}>
					<div className={historyStyles.modalContainer}>
						<div className={historyStyles.modalHeader}>
							<h3>
								<FiClock className="me-2" />
								Select Date Range
							</h3>
							<button
								className={historyStyles.closeModal}
								onClick={() => setShowDateRangePopup(false)}
							>
								<FiX size={20} />
							</button>
						</div>
						<div className={historyStyles.modalBody}>
							<div className={styles.dateRangeInputs}>
								<div className={historyStyles.formGroup}>
									<label htmlFor="start-date">
										Start Date
									</label>
									<input
										id="start-date"
										type="date"
										value={dateRange.start}
										onChange={(e) =>
											handleDateRangeChange(
												"start",
												e.target.value
											)
										}
									/>
								</div>
								<div className={historyStyles.formGroup}>
									<label htmlFor="end-date">End Date</label>
									<input
										id="end-date"
										type="date"
										value={dateRange.end}
										onChange={(e) =>
											handleDateRangeChange(
												"end",
												e.target.value
											)
										}
									/>
								</div>
							</div>
						</div>
						<div className={historyStyles.modalFooter}>
							<button
								className={historyStyles.cancelBtn}
								onClick={() => setShowDateRangePopup(false)}
							>
								Cancel
							</button>
							<button
								className={historyStyles.applyBtn}
								onClick={handleDateRangeSubmit}
								disabled={
									!dateRange.start ||
									!dateRange.end ||
									dateRange.start > dateRange.end
								}
							>
								Apply Filter
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Clear All Filters Confirmation Modal */}
			{showClearAllConfirmation && (
				<div className={historyStyles.modalOverlay}>
					<div className={historyStyles.modalContainer}>
						<div className={historyStyles.modalHeader}>
							<h3>Clear All Filters</h3>
							<button
								className={historyStyles.closeModal}
								onClick={() =>
									setShowClearAllConfirmation(false)
								}
							>
								<FiX size={20} />
							</button>
						</div>
						<div className={historyStyles.modalBody}>
							<p>
								Are you sure you want to clear all filters? This
								will reset your search and filter selections.
							</p>
						</div>
						<div className={historyStyles.modalFooter}>
							<button
								className={historyStyles.cancelBtn}
								onClick={() =>
									setShowClearAllConfirmation(false)
								}
							>
								Cancel
							</button>
							<button
								className={historyStyles.applyBtn}
								onClick={clearAllFilters}
							>
								Clear All
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PendingRequests;
