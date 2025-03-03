import React from "react";
import "./HistoryPopout.css";
interface HistoryPopoutProps {
  onClose: () => void;
}

const HistoryPopout: React.FC<HistoryPopoutProps> = ({ onClose }) => {
  const tableData = [
    {
      dateApproved: "2023-01-01",
      formType: "Inpatient",
      age: 19,
      college: "College of Engineering",
      term: "1st",
      academicYear: "2022-2023",
      load: "Full",
      status: "Approved",
      natureOfIllness: "Flu",
      physician: "Dr. Zander Jay De Guzman",
      procedures: "Checkup",
      remainingBenefits: "$1000",
    },
    {
      dateApproved: "2023-02-15",
      formType: "Inpatient",
      age: 19,
      college: "College of Engineering",
      term: "1st",
      academicYear: "2022-2023",
      load: "Full",
      status: "Pending",
      natureOfIllness: "Cold",
      physician: "Dr. Yellow",
      procedures: "Consultation",
      remainingBenefits: "$800",
    },
    {
      dateApproved: "2023-03-10",
      formType: "Inpatient",
      age: 19,
      college: "College of Engineering",
      term: "1st",
      academicYear: "2022-2023",
      load: "Full",
      status: "Approved",
      natureOfIllness: "Allergy",
      physician: "Dr. Brown",
      procedures: "Allergy Test",
      remainingBenefits: "$950",
    },
    {
      dateApproved: "2023-04-05",
      formType: "Outpatient",
      age: 19,
      college: "College of Engineering",
      term: "1st",
      academicYear: "2022-2023",
      load: "Full",
      status: "Denied",
      natureOfIllness: "Injury",
      physician: "Dr. White",
      procedures: "X-ray",
      remainingBenefits: "$700",
    },
  ];

  return (
    <div className="history-popout">
      <div className="history-popout-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Laufey Lin</h2>
        <table className="history-table">
          <thead>
            <tr>
              <th>Form Type</th>
              <th>Date Approved</th>
              <th>Nature of Illness</th>
              <th>Physician</th>
              <th>Procedures</th>
              <th>Remaining Benefits</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.formType}</td>
                <td>{row.dateApproved}</td>
                <td>{row.natureOfIllness}</td>
                <td>{row.physician}</td>
                <td>{row.procedures}</td>
                <td>{row.remainingBenefits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPopout;
