import { useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { TbSearch } from "react-icons/tb";
import Popout from "../../Page Elements/Popout/Popout";
import VerificationPage from "./VerificationPage";
import UserAuditLogs from "./UserAuditLogs";
import AuditLogsPopout from "./AuditLogsPopout";
import UserManagement from "./UserManagement";
import "./AdminSettings.css";

const AdminSettings = () => {
	const [activeTab, setActiveTab] = useState("userManagement");
	const [showPopout, setShowPopout] = useState(false);
	const [showAuditLogsPopout, setShowAuditLogsPopout] = useState(false);

	return (
		<div className="admin-settings-container">
			{/* Tabs & Search */}
			<div className="row align-items-center">
				<div className="tab-cont col-md-6">
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "userManagement" ? "active-tab" : ""
						}`}
						onClick={() => setActiveTab("userManagement")}
					>
						USER MANAGEMENT
					</button>
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "registrationVerification" ? "active-tab" : ""
						}`}
						onClick={() => setActiveTab("registrationVerification")}
					>
						REGISTRATION VERIFICATION
					</button>
				</div>
				<div className="col-md-6">
					<div className="search-container">
						<RxHamburgerMenu className="burger-icon" />
						<input
							type="search"
							placeholder="Search"
							className="ustfu-form-control search-input"
						/>
						<TbSearch className="admin-search-icon" />
					</div>
				</div>
			</div>

			<hr className="ustfu-hr" />

			{activeTab === "userManagement" && <UserManagement />}
			{activeTab === "registrationVerification" && (
				<div className="registration-verification-container">
					<VerificationPage />
				</div>
			)}

			{showPopout && (
				<Popout
					title="Save Changes?"
					message="Do you want to save changes?"
					onConfirm={() => setShowPopout(false)}
					onCancel={() => setShowPopout(false)}
					isOpen={showPopout}
				/>
			)}

			{showAuditLogsPopout && (
				<AuditLogsPopout
					title="User Audit Logs"
					onClose={() => setShowAuditLogsPopout(false)}
					isOpen={showAuditLogsPopout}
				>
					<UserAuditLogs />
				</AuditLogsPopout>
			)}
		</div>
	);
};

export default AdminSettings;
