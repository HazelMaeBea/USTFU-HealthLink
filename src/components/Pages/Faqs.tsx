import "../TrackingPage/TrackingPage.css";
import "./HistoryPage.css";

const FAQs = () => {
  return (
    <div>
      <div title="history" className="Tabby">
        <section className="tab-content">
          <div className="history-header">
            <button className="btn btn-filter">Filter</button>
            <h3 className="header">History</h3>
            <button className="btn btn-export">Export CSV</button>
          </div>
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
            <tbody>{/* iterate through the database */}</tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default FAQs;
