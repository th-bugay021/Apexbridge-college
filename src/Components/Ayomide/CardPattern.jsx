/* eslint-disable no-unused-vars */
import React from "react";
import "../../Styles/Ayomide/pageStyles.css"; // Your page-specific or shared layout CSS

const StudentList = () => {
  return (
    <div className="page-container">
      {/* 1. Page Header (Title & Action Buttons) */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">View and manage all registered students.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-outline">Export CSV</button>
          <button type="button" className="btn btn-primary">+ Add New Student</button>
        </div>
      </div>

      {/* 2. Optional: Filters / Search Toolbar */}
      <div className="page-toolbar card">
        <input 
          type="text" 
          placeholder="Search students by name or ID..." 
          className="input search-input" 
        />
        <select className="select filter-select">
          <option value="">All Classes</option>
          <option value="js1">JSS 1</option>
          <option value="js2">JSS 2</option>
        </select>
      </div>

      {/* 3. Main Data Content (Tables, Grids, or Cards) */}
      <div className="card page-content-card">
        {/* Table or Grid content goes here */}
        <p>Student table or content layout goes here...</p>
      </div>
    </div>
  );
};

export default StudentList;
