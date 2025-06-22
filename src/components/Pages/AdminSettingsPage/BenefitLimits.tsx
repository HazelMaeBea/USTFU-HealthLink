import React, { useState } from "react";
import "./BenefitLimits.css"; // import your manual CSS

const facultyStatuses = ["All", "Tenured", "Tenure-Track", "Probationary", "Part-Time"];
const frequencies = ["Semestral", "Yearly", "Every 2 Years"];

export default function BenefitsConfiguration() {
  const [defaultMaxBenefit, setDefaultMaxBenefit] = useState(100000);
  const [maxAllowableBenefit, setMaxAllowableBenefit] = useState(0);
  const [eyeglassAmount, setEyeglassAmount] = useState(2500);

  const [selectedStatuses1, setSelectedStatuses1] = useState<string[]>([]);
  const [selectedStatuses2, setSelectedStatuses2] = useState<string[]>(["Tenured"]);

  const [startDate1, setStartDate1] = useState("");
  const [startDate2, setStartDate2] = useState("");

  const [frequency1, setFrequency1] = useState("Yearly");
  const [frequency2, setFrequency2] = useState("Every 2 Years");

  // Track last edited timestamps for each card
  const [lastEditedDefault, setLastEditedDefault] = useState<string>("");
  const [lastEditedAllowable, setLastEditedAllowable] = useState<string>("");
  const [lastEditedEyeglass, setLastEditedEyeglass] = useState<string>("");

  const toggleStatus = (
    status: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(status)) {
      setList(list.filter((s) => s !== status));
    } else {
      setList([...list, status]);
    }
  };

  const handleSave = (setLastEdited: React.Dispatch<React.SetStateAction<string>>) => {
    setLastEdited(new Date().toLocaleString());
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
        <button className="benefit-button" onClick={() => handleSave(setLastEditedDefault)}>
          Save
        </button>
        <div className="last-edited">
          {lastEditedDefault && (
            <span>Last edited on: {lastEditedDefault}</span>
          )}
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
          {/* Modified checkboxes to custom toggle buttons */}
          <div className="checkbox-group">
            {facultyStatuses.map((status) => (
              <button 
                key={status} 
                type="button" 
                className={`checkbox-button ${selectedStatuses1.includes(status) ? 'selected' : ''}`}
                onClick={() => toggleStatus(status, selectedStatuses1, setSelectedStatuses1)}
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
        <button className="benefit-button" onClick={() => handleSave(setLastEditedAllowable)}>
          Save
        </button>
        <div className="last-edited">
          {lastEditedAllowable && (
            <span>Last edited on: {lastEditedAllowable}</span>
          )}
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
          {/* Replacing checkbox with toggle buttons */}
          <div className="checkbox-group">
            {facultyStatuses.map((status) => (
              <button 
                key={status} 
                type="button" 
                className={`checkbox-button ${selectedStatuses2.includes(status) ? 'selected' : ''}`}
                onClick={() => toggleStatus(status, selectedStatuses2, setSelectedStatuses2)}
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
        <button className="benefit-button" onClick={() => handleSave(setLastEditedEyeglass)}>
          Save
        </button>
        <div className="last-edited">
          {lastEditedEyeglass && (
            <span>Last edited on: {lastEditedEyeglass}</span>
          )}
        </div>
      </div>
    </div>
  );
}