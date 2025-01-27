import React from 'react';

interface FormDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  name: string;
  options: string[]; //options for the dropdown
}

const FormDropdown = ({ label, placeholder, value, onChange, name, options }: FormDropdownProps) => {

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
        <option value="" disabled selected hidden>{placeholder}</option>
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