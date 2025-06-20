import { useState } from "react";
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import VerificationPage from "./VerificationPage";
import UserManagement from "./UserManagement";
import BenefitLimits from "./BenefitLimits"; // new import
import "./AdminSettings.css";

const AdminSettings = () => {
	const [activeTab, setActiveTab] = useState("userManagement");
	const [searchQuery, setSearchQuery] = useState("");

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
							activeTab === "registrationVerification"
								? "active-tab"
								: ""
						}`}
						onClick={() => setActiveTab("registrationVerification")}
					>
						REGISTRATION VERIFICATION
					</button>
					<button
						className={`ustfu-as-btn tab-btn ${
							activeTab === "benefitLimits" ? "active-tab" : ""
						}`}
						onClick={() => setActiveTab("benefitLimits")}
					>
						BENEFIT LIMITS
					</button>
				</div>
				<div className="col-md-6">
					<div className="search-container">
						<RxHamburgerMenu className="burger-icon" />
						<input
							type="search"
							placeholder="Search"
							className="ustfu-form-control search-input"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<TbSearch className="admin-search-icon" />
					</div>
				</div>
			</div>
			<hr className="ustfu-hr" />
			{activeTab === "userManagement" ? (
				<UserManagement searchQuery={searchQuery} />
			) : activeTab === "registrationVerification" ? (
				<VerificationPage searchQuery={searchQuery} />
			) : activeTab === "benefitLimits" ? (
				<BenefitLimits />
			) : null}
		</div>
	);
};

export default AdminSettings;