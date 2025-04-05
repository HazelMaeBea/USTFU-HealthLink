import { useState } from "react";
import styles from "./TrackingPage.module.css"; // Updated import to use module CSS
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import StatusTracking from "./StatusTracking";
import useTrackingRecords from "./useTrackingRecord";
import { Record } from "../PendingRequestPage/types";

const TrackingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [previousCurrentPage, setPreviousCurrentPage] = useState(1);
  const [revisionCurrentPage, setRevisionCurrentPage] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState<{
    transactionID: string;
    dateTime: Date;
    status: string;
  } | null>(null);

  const { pendingRecords, accomplishedRecords, revisionRecords } =
    useTrackingRecords();
  const recordsPerPage = 7;

  const pendingTotalPages = Math.ceil(pendingRecords.length / recordsPerPage);
  const previousTotalPages = Math.ceil(
    accomplishedRecords.length / recordsPerPage
  );
  const revisionTotalPages = Math.ceil(revisionRecords.length / recordsPerPage);

  const pendingCurrentRecords: Record[] = pendingRecords.slice(
    (pendingCurrentPage - 1) * recordsPerPage,
    pendingCurrentPage * recordsPerPage
  );
  const previousCurrentRecords: Record[] = accomplishedRecords.slice(
    (previousCurrentPage - 1) * recordsPerPage,
    previousCurrentPage * recordsPerPage
  );
  const revisionCurrentRecords: Record[] = revisionRecords.slice(
    (revisionCurrentPage - 1) * recordsPerPage,
    revisionCurrentPage * recordsPerPage
  );

  const handleDetailsClick = (
    transactionID: string,
    dateTime: Date,
    status: string
  ) => {
    console.log("Details Clicked:", { transactionID, dateTime, status });
    setSelectedRecord({ transactionID, dateTime, status });
    console.log("Selected Record State:", selectedRecord);
  };

  return (
    <div className={styles["tracking-page"]}>
      <Tabs
        activeTab={activeTab}
        onTabChange={(tabIndex) => {
          setActiveTab(tabIndex);
          setSelectedRecord(null);
        }}
      >
        <div title="Current Records" className="Tabby">
          <section className="tab-content">
            {selectedRecord ? (
              <StatusTracking
                onBack={() => setSelectedRecord(null)}
                transactionID={selectedRecord.transactionID}
                status={selectedRecord.status}
                dateTime={selectedRecord.dateTime}
              />
            ) : (
              <>
                <RecordTable
                  records={pendingCurrentRecords}
                  onDetailsClick={handleDetailsClick}
                />
                <div
                  className="page-buttons-container"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0 20px",
                      transform: "scale(1.1)",
                    }}
                  >
                    <PageButtons
                      currentPage={pendingCurrentPage}
                      totalPages={pendingTotalPages}
                      onPageChange={setPendingCurrentPage}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
        <div title="Completed Records" className="Tabby">
          <section className="tab-content">
            {selectedRecord ? (
              <StatusTracking
                onBack={() => setSelectedRecord(null)}
                transactionID={selectedRecord.transactionID}
                status={selectedRecord.status}
                dateTime={selectedRecord.dateTime}
              />
            ) : (
              <>
                <RecordTable
                  records={previousCurrentRecords}
                  onDetailsClick={handleDetailsClick}
                />
                <div
                  className="page-buttons-container"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0 20px",
                      transform: "scale(1.1)",
                    }}
                  >
                    <PageButtons
                      currentPage={previousCurrentPage}
                      totalPages={previousTotalPages}
                      onPageChange={setPreviousCurrentPage}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
        <div title="For Revision" className="Tabby">
          <section className="tab-content">
            {selectedRecord ? (
              <StatusTracking
                onBack={() => setSelectedRecord(null)}
                transactionID={selectedRecord.transactionID}
                status={selectedRecord.status}
                dateTime={selectedRecord.dateTime}
              />
            ) : (
              <>
                <RecordTable
                  records={revisionCurrentRecords}
                  onDetailsClick={handleDetailsClick}
                />
                <div
                  className="page-buttons-container"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0 20px",
                      transform: "scale(1.1)",
                    }}
                  >
                    <PageButtons
                      currentPage={revisionCurrentPage}
                      totalPages={revisionTotalPages}
                      onPageChange={setRevisionCurrentPage}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </Tabs>
    </div>
  );
};

export default TrackingPage;
