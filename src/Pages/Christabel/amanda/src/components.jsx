import { ArrowLeft, Search } from "lucide-react";

export function Avatar({ person, size = "" }) {
  return (
    <div className={`avatar ${size}`}>
      {person.photo ? (
        <img src={person.photo} alt={`${person.firstName}'s profile`} />
      ) : (
        `${person.firstName?.[0] || "N"}${person.lastName?.[0] || "S"}`
      )}
    </div>
  );
}

export function Status({ value }) {
  return <span className={`status ${value.toLowerCase()}`}>{value}</span>;
}

export function PageHeader({ title, subtitle, onBack, children }) {
  return (
    <header className="page-header">
      <div className="page-heading">
        {onBack && (
          <button
            className="icon-button back-button"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft />
          </button>
        )}
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <Search size={20} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

// One small component keeps every form label and input consistent.
export function Field({
  label,
  name,
  value = "",
  type = "text",
  options,
  required = false,
  placeholder,
  wide = false,
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && <span className="required"> *</span>}
      </span>
      {options ? (
        <select name={name} defaultValue={value} required={required}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
