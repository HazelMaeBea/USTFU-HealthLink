import "./TrackingPage.css";
import Tabs from "./Tabs";
import RecordTable from "./RecordTable";
const TrackingPage = () => {
    return (
        <section className="TrackingPage">
            <Tabs>
                <div title="PENDING REQUESTS" className="Tabby">
                    <section className="tab-content">
                        <RecordTable />
                    </section>
                </div>
                <div title="PREVIOUS RECORDS" className="Tabby">
                    <section className="tab-content">
                        <RecordTable />
                    </section>
                </div>
            </Tabs>
        </section>
    );
}

export default TrackingPage;