import { useState, useEffect, useRef } from "react";
import "../TrackingPage/TrackingPage.css";
import styles from "./HistoryPage.module.css";
import type { PendingRequest } from "../PendingRequests/types";
import { usePendingRequests } from "../PendingRequests/PendingRequestBackend";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiX,
  FiCheck,
} from "react-icons/fi";
import PageButtons from "../PageButtons/PageButtons";

const HospitalizationHistory = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [filters, setFilters] = useState<string[]>([]);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDateRangePopup, setShowDateRangePopup] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilterPopup, setShowFilterPopup] = useState<string | null>(null);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [exportFilename, setExportFilename] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  // Add export success notification state
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showClearAllConfirmation, setShowClearAllConfirmation] =
    useState(false);
  const [showFormTypeDropdown, setShowFormTypeDropdown] = useState(false);
  const [loadInput, setLoadInput] = useState(""); // Add state for the Load input
  const [loadRange, setLoadRange] = useState(false); // State to track if range input is added
  const [loadEndInput, setLoadEndInput] = useState(""); // State for the second input in the range

  // Refs for the dropdown containers
  const formTypeDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Fix destructuring from the hook
  const { requests: pendingRequestsData, pagination } = usePendingRequests(
    1,
    100
  ); // Get more items for history

  // Add error handling state
  const [error, setError] = useState<string | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, filters, searchQuery]);

  // Hide export success notification after timeout
  useEffect(() => {
    if (showExportSuccess) {
      const timer = setTimeout(() => {
        setShowExportSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showExportSuccess]);

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

  // Format data for the table
  const formatTableData = (request: PendingRequest) => {
    try {
      const { formData, dateSubmitted, requester } = request;

      let formTypeDisplay;
      let formTypeValue; // For filtering
      let formTypeText; // Added for CSV export - plain text representation

      if (formData?.formType === "hospital" && formData?.origFormType) {
        const origType = formData.origFormType;
        formTypeValue = origType;

        if (formData.hospital) {
          // Create JSX for display
          formTypeDisplay = (
            <>
              {origType}{" "}
              <span className={styles.doneAsText}>
                (done as {formData.hospitalStatus})
              </span>
            </>
          );
          // Create plain text for export
          formTypeText = `${origType} (done as ${formData.hospitalStatus})`;
        } else {
          formTypeDisplay = origType;
          formTypeText = origType;
        }
      } else {
        formTypeDisplay = formData?.formType ? formData.formType : "Unknown";
        formTypeValue = formData?.formType || "Unknown";
        formTypeText = formData?.formType || "Unknown";
      }

      return {
        formType: formTypeDisplay,
        formTypeValue: formTypeValue,
        formTypeText: formTypeText, // Added for CSV export
        dateApproved: dateSubmitted || "-",
        name: requester || "Unknown",
        age: formData?.age || "-",
        college: formData?.college || "-",
        term: formData?.formType === "hospital" ? formData?.term || "-" : "-",
        academicYear:
          formData?.formType === "hospital" ? formData?.year || "-" : "-",
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
          formData?.formType === "hospital" ? formData?.illness || "-" : "-",
        physician:
          formData?.formType === "hospital" ? formData?.physician || "-" : "-",
        procedures:
          formData?.formType === "hospital" ? formData?.procedures || "-" : "-",
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
  const academicYearOptions = ["2022-2023", "2023-2024", "2024-2025"];
  const statusOptions = [
    "Tenured",
    "Tenured-Track",
    "Lecturer Before 2001",
    "Extendee",
    "Retiree",
  ];

  const removeFilter = (filterToRemove: string) => {
    setFilters((prev) => prev.filter((filter) => filter !== filterToRemove));
  };

  const applyFilters = (data: any[]) => {
    return data.filter((row) => {
      if (!row) return false; // Skip null rows

      const matchesType =
        selectedType === "All" ||
        row.formTypeValue === selectedType ||
        (selectedType === "hospital" &&
          (row.formTypeValue === "inpatient" ||
            row.formTypeValue === "outpatient"));

      const matchesSearch =
        searchQuery === "" ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesType &&
        matchesSearch &&
        filters.every((filter) => {
          const [filterType, filterValue] = filter.split(": ");
          if (filterType === "Date") {
            const [startDateStr, endDateStr] = filterValue.split(" - ");

            // Parse the date strings to get month, day, year
            const startParts = startDateStr.split("/");
            const endParts = endDateStr.split("/");

            if (startParts.length === 3 && endParts.length === 3) {
              // Create Date objects with time set to beginning and end of day
              const startDate = new Date(
                parseInt(startParts[2]), // year
                parseInt(startParts[0]) - 1, // month (0-indexed)
                parseInt(startParts[1]), // day
                0,
                0,
                0,
                0 // time set to 00:00:00.000
              );

              const endDate = new Date(
                parseInt(endParts[2]), // year
                parseInt(endParts[0]) - 1, // month (0-indexed)
                parseInt(endParts[1]), // day
                23,
                59,
                59,
                999 // time set to 23:59:59.999
              );

              // Parse the row's date
              const rowDate =
                row.dateApproved !== "-" ? new Date(row.dateApproved) : null;

              if (!rowDate) return false;

              // Compare using proper Date objects
              return rowDate >= startDate && rowDate <= endDate;
            }
            return false;
          } else if (filterType === "College") {
            return filterValue.split(", ").includes(row.college);
          } else if (filterType === "Term") {
            return filterValue.split(", ").includes(row.term);
          } else if (filterType === "Academic Year") {
            return filterValue.split(", ").includes(row.academicYear);
          } else if (filterType === "Load") {
            // Handle range for Load filter
            const [startValue, endValue] = filterValue.split(" - ").map(Number);
            const rowLoad = parseFloat(row.load);
            if (!isNaN(startValue) && isNaN(endValue)) {
              // Only start value is provided
              return rowLoad === startValue;
            }
            return (
              !isNaN(startValue) &&
              !isNaN(endValue) &&
              !isNaN(rowLoad) &&
              rowLoad >= startValue &&
              rowLoad <= endValue
            );
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

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedData.length / recordsPerPage));
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Create a function to render page numbers - simplified version
  const renderPageButtons = () => {
    const pageNumbers = [];
    const maxButtonsToShow = 5; // Show max 5 buttons at a time

    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    // Previous button
    pageNumbers.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        className={`btn btn-history ${styles.pageButton}`}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      // Only show certain pages to prevent too many buttons
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= startPage && i <= endPage) // Pages in the middle range
      ) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`btn btn-history ${
              currentPage === i ? "btn-active" : ""
            } ${styles.pageButton}`}
          >
            {i}
          </button>
        );
      } else if (
        (i === startPage - 1 && startPage > 2) ||
        (i === endPage + 1 && endPage < totalPages - 1)
      ) {
        // Add ellipsis where needed
        pageNumbers.push(
          <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>
            &hellip;
          </span>
        );
      }
    }

    // Next button
    pageNumbers.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        className={`btn btn-history ${styles.pageButton}`}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    );

    return pageNumbers;
  };

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
            {currentRecords.map((row, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? styles.evenRow : styles.oddRow}
              >
                <td className={styles.formTypeCell}>{row?.formType || "-"}</td>
                <td>{row?.dateApproved || "-"}</td>
                <td className={styles.nameCell}>{row?.name || "-"}</td>
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
                              row.status.charAt(0).toUpperCase() +
                              row.status.slice(1).toLowerCase()
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

  // Form type options
  const formTypeOptions = [
    { value: "All", label: "All Forms" },
    { value: "inpatient", label: "Inpatient" },
    { value: "outpatient", label: "Outpatient" },
    { value: "eyeglasses", label: "Eyeglasses" },
    { value: "admission", label: "Admission" },
  ];

  // Generate descriptive filename based on applied filters - Enhanced version
  const generateFilename = () => {
    const datePart = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const nameComponents = ["HealthLink-History"];

    // Add form type if specific
    if (selectedType !== "All") {
      const formType =
        formTypeOptions.find((opt) => opt.value === selectedType)?.label ||
        selectedType;
      nameComponents.push(formType);
    }

    // Add filter details
    if (filters.length > 0) {
      // Create a shortened representation of the filters
      const filterSummary = [];

      // Check for date filter
      const dateFilter = filters.find((f) => f.startsWith("Date:"));
      if (dateFilter) {
        filterSummary.push("DateRange");
      }

      // Check for status filter
      const statusFilter = filters.find((f) => f.startsWith("Status:"));
      if (statusFilter) {
        const statusValue = statusFilter.split(": ")[1];
        filterSummary.push(statusValue.replace(/, /g, "-"));
      }

      // Check for college filter
      const collegeFilter = filters.find((f) => f.startsWith("College:"));
      if (collegeFilter) {
        filterSummary.push("College");
      }

      // Add term filter if present
      const termFilter = filters.find((f) => f.startsWith("Term:"));
      if (termFilter) {
        const termValue = termFilter.split(": ")[1];
        filterSummary.push(`Term-${termValue}`);
      }

      // Add academic year filter if present
      const yearFilter = filters.find((f) => f.startsWith("Academic Year:"));
      if (yearFilter) {
        const yearValue = yearFilter.split(": ")[1];
        filterSummary.push(`AY-${yearValue}`);
      }

      // If we have filter info, add to filename
      if (filterSummary.length > 0) {
        nameComponents.push(filterSummary.join("_"));
      }
    }

    // If search query is present
    if (searchQuery) {
      nameComponents.push(
        `Search-${searchQuery.substring(0, 10).replace(/\s+/g, "-")}`
      );
    }

    // Add export date
    nameComponents.push(datePart);

    return nameComponents.join("_").replace(/\s+/g, "-") + ".csv";
  };

  // Get descriptive info for the filename hint
  const getExportFileDescription = () => {
    const descriptions = [];

    // Add form type info
    if (selectedType !== "All") {
      descriptions.push(
        `Form type: ${
          formTypeOptions.find((opt) => opt.value === selectedType)?.label
        }`
      );
    }

    // Add filter descriptions
    if (filters.length > 0) {
      descriptions.push(`Filters: ${filters.length} active`);
    }

    // Add search info
    if (searchQuery) {
      descriptions.push(`Search: "${searchQuery}"`);
    }

    // If no specific filters, mention it includes all records
    if (selectedType === "All" && filters.length === 0 && !searchQuery) {
      return "Includes all history records.";
    }

    return descriptions.join(" • ");
  };

  const prepareExport = () => {
    const suggestedFilename = generateFilename();
    setExportFilename(suggestedFilename);
    setShowExportPopup(true);
  };

  // Improved CSV export with better handling of special characters
  const exportToCSV = (filename: string) => {
    // Helper function to format cell data safely for CSV
    const escapeCSV = (field: string) => {
      // If the field contains quotes, commas, or newlines, wrap in quotes and escape inner quotes
      if (/[",\n\r]/.test(field)) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

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

    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) => {
        if (!row) return "";
        return [
          escapeCSV(row.dateApproved || ""),
          escapeCSV(row.formTypeText || ""), // Use formTypeText instead of formType
          escapeCSV(row.name || ""),
          escapeCSV(row.age?.toString() || ""),
          escapeCSV(row.college || ""),
          escapeCSV(row.term || ""),
          escapeCSV(row.academicYear || ""),
          escapeCSV(row.load || ""),
          escapeCSV(row.status || ""),
          escapeCSV(row.natureOfIllness || ""),
          escapeCSV(row.physician || ""),
          escapeCSV(row.procedures || ""),
          escapeCSV(row.remainingBenefits || ""),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setShowExportPopup(false);
    setShowExportSuccess(true);
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
          // Ensure month is 1-2 digits without leading zero for consistency
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

  const handleFilterSubmit = (filter: string, selectedOptions: string[]) => {
    setFilters((prev) => {
      const newFilters = [...prev];
      const filterIndex = newFilters.findIndex((f) => f.startsWith(filter));
      let filterValue = "";

      if (filter === "Load") {
        // Handle range for Load filter
        filterValue =
          loadRange && loadEndInput
            ? `${filter}: ${loadInput} - ${loadEndInput}`
            : `${filter}: ${loadInput}`;
      } else {
        filterValue = `${filter}: ${selectedOptions.join(", ")}`;
      }

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

            {/* This is your current dropdown implementation which should work */}
            <div className={styles.formTypeFilter} ref={formTypeDropdownRef}>
              <button
                className={styles.formTypeButton}
                onClick={() => setShowFormTypeDropdown(!showFormTypeDropdown)}
                aria-label="Select Form Type"
                aria-expanded={showFormTypeDropdown}
              >
                {formTypeOptions.find((option) => option.value === selectedType)
                  ?.label || "All Forms"}
                <span className={styles.formTypeIcon}>▼</span>
              </button>

              {showFormTypeDropdown && (
                <div className={styles.formTypeDropdown}>
                  {formTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`${styles.formTypeOption} ${
                        selectedType === option.value
                          ? styles.formTypeOptionSelected
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

          <div className={styles.filterControls}>
            <div className={styles.activeFilters}>
              {filters.map((filter, index) => {
                const [filterType, filterValue] = filter.split(": ");
                return (
                  <div key={index} className={styles.filterTag}>
                    <span className={styles.filterText}>{filterType}:</span>
                    <span className={styles.filterValue}>{filterValue}</span>
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
                );
              })}

              {/* Add clear all filters button if there are any filters */}
              {(filters.length > 0 ||
                selectedType !== "All" ||
                searchQuery) && (
                <button
                  className={styles.clearAllFiltersBtn}
                  onClick={() => setShowClearAllConfirmation(true)}
                  title="Clear all filters"
                >
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className={styles.filterButtonContainer}>
              {availableFilters.length > 0 && (
                <div
                  className={styles.filterDropdownContainer}
                  ref={filterDropdownRef}
                >
                  <button
                    className={styles.addFilterBtn}
                    onClick={() => setShowFilterOptions(!showFilterOptions)}
                  >
                    <FiPlus size={14} />
                    <span>Filter</span>
                  </button>

                  {showFilterOptions && (
                    <div className={styles.filterOptionsDropdown}>
                      {availableFilters.map((filter) => (
                        <button
                          key={filter}
                          className={styles.filterOption}
                          onClick={() => handleAddFilter(filter)}
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
                onClick={prepareExport}
                disabled={filteredData.length === 0}
                title="Export to CSV"
              >
                <FiDownload size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.historyContent}>{renderContent()}</div>

        <div className={styles.historyFooter}>
          <div className={styles.recordsCount}>
            {sortedData.length > 0
              ? `Showing ${indexOfFirstRecord + 1}-${Math.min(
                  indexOfLastRecord,
                  sortedData.length
                )} of ${sortedData.length} records`
              : "No records to display"}
          </div>

          {/* Replace PageButtons component with our custom pagination */}
          {sortedData.length > 0 && (
            <div className={styles.historyPagination}>
              {renderPageButtons()}
            </div>
          )}
        </div>
      </div>

      {/* Date Range Popup */}
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

      {/* Filter Options Popup */}
      {showFilterPopup && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContainer} ${styles.filterModal}`}>
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
                    <div key={option} className={styles.checkboxOption}>
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
                {/* ...existing code... */}
                {showFilterPopup === "College" &&
                  collegeOptions.map((option) => (
                    <div key={option} className={styles.checkboxOption}>
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
                    <div key={option} className={styles.checkboxOption}>
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
                {showFilterPopup === "Load" && (
                  <div className={styles.numberInputOption}>
                    <label
                      htmlFor="load-input"
                      className={styles.numberInputLabel}
                    ></label>
                    <input
                      id="load-input"
                      type="number"
                      className={styles.numberInput}
                      placeholder="Input Load"
                      value={loadInput}
                      onChange={(e) => setLoadInput(e.target.value)}
                    />
                    {!loadRange ? (
                      <button
                        className={styles.addRangeBtn}
                        onClick={() => setLoadRange(true)}
                      >
                        Add Range
                      </button>
                    ) : (
                      <>
                        <span className={styles.rangeArrow}>→</span>
                        <input
                          id="load-end-input"
                          type="number"
                          className={styles.numberInput}
                          placeholder="Input Load"
                          value={loadEndInput}
                          onChange={(e) => setLoadEndInput(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                )}
                {showFilterPopup === "Status" &&
                  statusOptions.map((option) => (
                    <div key={option} className={styles.checkboxOption}>
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
                onClick={() => {
                  if (showFilterPopup === "Load") {
                    handleFilterSubmit("Load", [loadInput]);
                  } else {
                    handleFilterSubmit(
                      showFilterPopup,
                      Array.from(
                        document.querySelectorAll(
                          `.${styles.checkboxInput}:checked`
                        )
                      ).map((input) => (input as HTMLInputElement).value)
                    );
                  }
                }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {showExportPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3>Export History Data</h3>
              <button
                className={styles.closeModal}
                onClick={() => setShowExportPopup(false)}
                aria-label="Export"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                You are about to export {filteredData.length} records to CSV
                format.
              </p>
              <div className={styles.formGroup}>
                <label htmlFor="export-filename">Filename</label>
                <input
                  id="export-filename"
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  className={styles.filenameInput}
                />
                <small className={styles.filenameHint}>
                  {getExportFileDescription()}
                </small>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowExportPopup(false)}
              >
                Cancel
              </button>
              <button
                className={styles.applyBtn}
                onClick={() => exportToCSV(exportFilename)}
              >
                Export Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export success notification */}
      {showExportSuccess && (
        <div className={styles.exportSuccess}>
          <div className={styles.exportSuccessIcon}>
            <FiCheck size={20} />
          </div>
          <p className={styles.exportSuccessText}>
            Export successful! File downloaded to your device.
          </p>
        </div>
      )}

      {/* Clear All Filters Confirmation Modal */}
      {showClearAllConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3>Clear All Filters</h3>
              <button
                className={styles.closeModal}
                onClick={() => setShowClearAllConfirmation(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to clear all filters? This will reset your
                search and filter selections.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowClearAllConfirmation(false)}
              >
                Cancel
              </button>
              <button className={styles.applyBtn} onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalizationHistory;
