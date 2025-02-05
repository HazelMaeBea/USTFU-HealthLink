import "./TrackingPage.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
import PendingRequestsPage from "./PendingRequestsPage";

const TrackingPage = () => {
    return (
        <section className="TrackingPage">
            <Tabs>
                <div title="PENDING REQUESTS" className="Tabby">
                    <section className="tab-content">
                        <h3>PENDING REQUESTS</h3>
                        <RecordTable />
                        {/* <PendingRequestsPage /> */}
                    </section>
                </div>
                <div title="PREVIOUS RECORDS" className="Tabby">
                    <section className="tab-content">
                        <h3>PREVIOUS RECORDS</h3>
                        <RecordTable />
                    </section>
                </div>
            </Tabs>
        </section>
    );
}

export default TrackingPage;