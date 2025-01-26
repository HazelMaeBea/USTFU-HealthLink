import React from 'react';

interface FormDropdownProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
  options: string[];
}

const FormDropdown = ({ label, value, onChange, name, options }: FormDropdownProps) => {

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={name}>{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={onChange}
        name={name}
        id={name}
      >
        <option value="" disabled selected hidden>Select here</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormDropdown;