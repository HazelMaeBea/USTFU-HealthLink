import { useState } from "react";
import "../Page Elements/TrackingPage/TrackingPage.css";
import "./HistoryPage.css";

const HospitalizationHistory = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [filters, setFilters] = useState<string[]>([]);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const tableData = [
    //sample data
    //i added a few more data because when there's only 1 row. adding a filter creates a vertical scroll that adjusts the page
    //to fix: not allowed to switch options after choosing a filter.
    {
      dateApproved: "2023-01-01",
      name: "Zander Zara",
      age: 19,
      college: "College of Engineering",
      term: "1",
      ay: "2022-2023",
      load: "Full",
      status: "Approved",
      natureOfIllness: "Flu",
      physician: "Dr. Smith",
      procedures: "Checkup",
      remainingBenefits: "$1000",
    },
    {
      dateApproved: "2023-02-15",
      name: "Laufey Lin",
      age: 22,
      college: "College of Music",
      term: "2",
      ay: "2022-2023",
      load: "Part-time",
      status: "Pending",
      natureOfIllness: "Cold",
      physician: "Dr. Johnson",
      procedures: "Consultation",
      remainingBenefits: "$800",
    },
    {
      dateApproved: "2023-03-10",
      name: "Luke Chiang",
      age: 21,
      college: "College of Engineering",
      term: "1",
      ay: "2022-2023",
      load: "Full",
      status: "Approved",
      natureOfIllness: "Allergy",
      physician: "Dr. Brown",
      procedures: "Allergy Test",
      remainingBenefits: "$950",
    },
    {
      dateApproved: "2023-04-05",
      name: "Grent Perez",
      age: 23,
      college: "College of Music",
      term: "2",
      ay: "2022-2023",
      load: "Full",
      status: "Denied",
      natureOfIllness: "Injury",
      physician: "Dr. White",
      procedures: "X-ray",
      remainingBenefits: "$700",
    },
  ];

  const termOptions = ["1st", "2nd"];
  const collegeOptions = ["College of Engineering", "College of Music"];
  const ayOptions = ["2022-2023", "2023-2024"];
  const loadOptions = ["Full", "Part-time"];
  const statusOptions = ["Approved", "Pending", "Denied"];

  const filteredData = tableData.filter((row) =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    return (
      <table className="history-table">
        <thead className="history-table-header">
          <tr>
            <th>Date Approved</th>
            <th>Name</th>
            <th>Age</th>
            <th>College</th>
            <th>Term</th>
            <th>AY</th>
            <th>Load</th>
            <th>Status</th>
            <th>Nature of Illness</th>
            <th>Physician</th>
            <th>Procedures</th>
            <th>Remaining Benefits</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr key={index}>
              <td>{row.dateApproved}</td>
              <td>{row.name}</td>
              <td>{row.age}</td>
              <td>{row.college}</td>
              <td>{row.term}</td>
              <td>{row.ay}</td>
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
      "Name",
      "Age",
      "College",
      "Term",
      "AY",
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
        row.name,
        row.age,
        row.college,
        row.term,
        row.ay,
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
    setFilters([...filters, filter]);
    setShowFilterOptions(false);
  };

  const availableFilters = [
    "Date",
    "College",
    "Term",
    "AY",
    "Load",
    "Status",
    // "Procedures",
  ].filter((filter) => !filters.includes(filter));

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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">All Forms</option>
                <option value="Inpatient">Inpatient</option>
                <option value="Outpatient">Outpatient</option>
                <option value="Eyeglasses">Eyeglasses</option>
              </select>
              {filters.map((filter, index) => (
                <select
                  key={index}
                  className="btn btn-filter"
                  value={filter}
                  onChange={(e) => {
                    const newFilters = [...filters];
                    newFilters[index] = e.target.value;
                    setFilters(newFilters);
                  }}
                >
                  <option value="">{filter}</option>
                  {filter === "Term" &&
                    termOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  {filter === "College" &&
                    collegeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  {filter === "AY" &&
                    ayOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  {filter === "Load" &&
                    loadOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  {filter === "Status" &&
                    statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  {/* Add options based on the selected filter */}
                </select>
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
    </div>
  );
};

export default HospitalizationHistory;
