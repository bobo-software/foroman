import React from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface AppSelectInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  label: string;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
  name?: string;
}

const AppLabeledSelectInput: React.FC<AppSelectInputProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  className = '',
  placeholder = 'Select an option'
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={label.toLowerCase().replace(/\s+/g, '-')}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <select
          id={label.toLowerCase().replace(/\s+/g, '-')}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2
            bg-white border rounded-lg
            text-slate-700 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            appearance-none
            ${error ? 'border-red-500' : 'border-slate-200'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${label.toLowerCase().replace(/\s+/g, '-')}-error` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option
              key={index}
              value={option}
              className="text-slate-700"
            >
              {option}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          {React.createElement(LuChevronDown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4 text-slate-400' })}
        </div>
      </div>

      {error && (
        <p
          id={`${label.toLowerCase().replace(/\s+/g, '-')}-error`}
          className="text-sm text-red-500 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default AppLabeledSelectInput;
