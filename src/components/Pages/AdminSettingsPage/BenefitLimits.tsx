import React, { useState } from "react";
import "./BenefitLimits.css";
import { addBenefitLimit } from "./BenefitLimitsBackend";

const facultyStatuses = ["All", "Tenured", "Tenured-Track", "Lecturer Before 2001", "Extendee", "Retiree"];
const frequencies = ["Semestral", "Yearly", "Every 2 Years"];

export default function BenefitsConfiguration() {
  const [defaultMaxBenefit, setDefaultMaxBenefit] = useState(100000);
  const [maxAllowableBenefit, setMaxAllowableBenefit] = useState(0);
  const [eyeglassAmount, setEyeglassAmount] = useState(2500);

  const [selectedStatus1, setSelectedStatus1] = useState<string>("");
  const [selectedStatus2, setSelectedStatus2] = useState<string>("Tenured");

  const [startDate1, setStartDate1] = useState("");
  const [startDate2, setStartDate2] = useState("");

  const [frequency1, setFrequency1] = useState("Yearly");
  const [frequency2, setFrequency2] = useState("Every 2 Years");

  const [lastEditedDefault, setLastEditedDefault] = useState<string>("");
  const [lastEditedAllowable, setLastEditedAllowable] = useState<string>("");
  const [lastEditedEyeglass, setLastEditedEyeglass] = useState<string>("");

  const handleSave = (setLastEdited: React.Dispatch<React.SetStateAction<string>>) => {
    setLastEdited(new Date().toLocaleString());
  };

  const resolveStatuses = (selected: string): string[] => {
    return selected === "All" ? facultyStatuses.filter((s) => s !== "All") : [selected];
  };

  return (
    <div className="benefits-container">
      {/* Card 1: Default Max Benefits */}
      <div className="benefit-card">
        <h2 className="card-title">Default Max Benefits Upon Registration</h2>
        <div className="form-group">
          <label htmlFor="defaultMax">Amount (PHP)</label>
          <input
            id="defaultMax"
            type="number"
            className="benefit-input"
            value={defaultMaxBenefit}
            onChange={(e) => setDefaultMaxBenefit(Number(e.target.value))}
          />
        </div>
        <button
          className="benefit-button"
          onClick={async () => {
            if (!defaultMaxBenefit || defaultMaxBenefit <= 0) {
              alert("Please enter a valid amount for Default Max Benefits.");
              return;
            }
            handleSave(setLastEditedDefault);
            try {
              await addBenefitLimit("UponRegistration", {
                amount: defaultMaxBenefit,
                createdAt: new Date().toISOString(),
              });
              console.log("Document added to UponRegistration");
            } catch (err) {
              console.error("Failed to save to UponRegistration:", err);
            }
          }}
        >
          Save
        </button>
        <div className="last-edited">
          {lastEditedDefault && <span>Last edited on: {lastEditedDefault}</span>}
        </div>
      </div>

      {/* Card 2: Max Allowable Benefits */}
      <div className="benefit-card">
        <h2 className="card-title">Max Allowable Benefits</h2>
        <div className="form-group">
          <label>Amount (PHP)</label>
          <input
            type="number"
            className="benefit-input"
            value={maxAllowableBenefit}
            onChange={(e) => setMaxAllowableBenefit(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Apply to:</label>
          <div className="checkbox-group">
            {facultyStatuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`checkbox-button ${selectedStatus1 === status ? "selected" : ""}`}
                onClick={() => setSelectedStatus1(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="benefit-input"
              value={startDate1}
              onChange={(e) => setStartDate1(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select
              className="benefit-input"
              value={frequency1}
              onChange={(e) => setFrequency1(e.target.value)}
            >
              {frequencies.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="benefit-button"
          onClick={async () => {
            if (!maxAllowableBenefit || maxAllowableBenefit <= 0 || !selectedStatus1 || !startDate1 || !frequency1) {
              alert("Please complete all fields in Max Allowable Benefits.");
              return;
            }
            handleSave(setLastEditedAllowable);
            try {
              await addBenefitLimit("MaxAllowable", {
                amount: maxAllowableBenefit,
                applicableTo: resolveStatuses(selectedStatus1),
                startDate: startDate1,
                frequency: frequency1,
                createdAt: new Date().toISOString(),
              });
              console.log("Document added to MaxAllowable");
            } catch (err) {
              console.error("Failed to save to MaxAllowable:", err);
            }
          }}
        >
          Save
        </button>
        <div className="last-edited">
          {lastEditedAllowable && <span>Last edited on: {lastEditedAllowable}</span>}
        </div>
      </div>

      {/* Card 3: Eyeglasses Reimbursement */}
      <div className="benefit-card">
        <h2 className="card-title">Eyeglasses Reimbursement</h2>
        <div className="form-group">
          <label>Amount (PHP)</label>
          <input
            type="number"
            className="benefit-input"
            value={eyeglassAmount}
            onChange={(e) => setEyeglassAmount(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Apply to:</label>
          <div className="checkbox-group">
            {facultyStatuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`checkbox-button ${selectedStatus2 === status ? "selected" : ""}`}
                onClick={() => setSelectedStatus2(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="benefit-input"
              value={startDate2}
              onChange={(e) => setStartDate2(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select
              className="benefit-input"
              value={frequency2}
              onChange={(e) => setFrequency2(e.target.value)}
            >
              {frequencies.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="benefit-button"
          onClick={async () => {
            if (!eyeglassAmount || eyeglassAmount <= 0 || !selectedStatus2 || !startDate2 || !frequency2) {
              alert("Please complete all fields in Eyeglasses Reimbursement.");
              return;
            }
            handleSave(setLastEditedEyeglass);
            try {
              await addBenefitLimit("Eyeglasses", {
                amount: eyeglassAmount,
                applicableTo: resolveStatuses(selectedStatus2),
                startDate: startDate2,
                frequency: frequency2,
                createdAt: new Date().toISOString(),
              });
              console.log("Document added to Eyeglasses");
            } catch (err) {
              console.error("Failed to save to Eyeglasses:", err);
            }
          }}
        >
          Save
        </button>
        <div className="last-edited">
          {lastEditedEyeglass && <span>Last edited on: {lastEditedEyeglass}</span>}
        </div>
      </div>
    </div>
  );
}
