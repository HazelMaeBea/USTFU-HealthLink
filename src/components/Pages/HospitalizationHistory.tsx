import { useState } from "react";
import "../Page Elements/TrackingPage/TrackingPage.css";
import "./HistoryPage.css";

const HospitalizationHistory = () => {
  const [activeTab, setActiveTab] = useState("All");

  const tableData = [
    //sample data
    {
      dateApproved: "2023-01-01",
      name: "John Doe",
      age: 20,
      college: "Engineering",
      term: "1",
      ay: "2022-2023",
      load: "Full",
      status: "Approved",
      natureOfIllness: "Flu",
      physician: "Dr. Smith",
      procedures: "Checkup",
      remainingBenefits: "$1000",
    },
  ];

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
          {tableData.map((row, index) => (
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

    for (const row of tableData) {
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

  return (
    <div>
      <div title="history" className="Tabby">
        <section className="tab-content">
          <div className="title-header" style={{ textAlign: "center" }}>
            <h3 className="header">History</h3>
          </div>
          <div className="history-header">
            <div className="left-buttons">
              <button
                className="btn btn-filter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-filter"
                  viewBox="0 0 16 16"
                >
                  <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
                </svg>
                {" Filter "}
              </button>
              <button
                className={`btn-history btn ${
                  activeTab === "All" ? "btn-active" : ""
                }`}
                onClick={() => setActiveTab("All")}
              >
                All
              </button>
              <button
                className={`btn-history btn ${
                  activeTab === "Eyeglasses" ? "btn-active" : ""
                }`}
                onClick={() => setActiveTab("Eyeglasses")}
              >
                Eyeglasses
              </button>
              <button
                className={`btn-history btn ${
                  activeTab === "Inpatient" ? "btn-active" : ""
                }`}
                onClick={() => setActiveTab("Inpatient")}
              >
                Inpatient
              </button>
              <button
                className={`btn-history btn ${
                  activeTab === "Outpatient" ? "btn-active" : ""
                }`}
                onClick={() => setActiveTab("Outpatient")}
              >
                Outpatient
              </button>
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
