import React from 'react';
import "./FormTextBox.css";
import "./FormBody.css";

interface FormTextBoxProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
}

const FormTextBox = ({ label, placeholder, value, onChange, name }: FormTextBoxProps) => {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name = { name }
        id = { name }
      />
    </div>
  );
};

export default FormTextBox;