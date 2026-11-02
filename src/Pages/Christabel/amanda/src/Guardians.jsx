import { useState } from "react";
import { Mail, Phone, Plus } from "lucide-react";
import { Avatar, PageHeader, SearchBox } from "./components";

export default function Guardians({ guardians, onAdd, onView }) {
  const [search, setSearch] = useState("");
  const filtered = guardians.filter((person) =>
    `${person.firstName} ${person.lastName} ${person.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Guardians" subtitle={`${guardians.length} guardians`}>
        <button className="button primary" onClick={onAdd}>
          <Plus size={20} />
          Add guardian
        </button>
      </PageHeader>
      <div className="page-content">
        <div className="guardian-search">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search guardians..."
          />
        </div>
        <div className="guardian-grid">
          {filtered.map((person) => (
            <button
              className="panel guardian-card"
              key={person.id}
              onClick={() => onView(person)}
            >
              <div className="guardian-name">
                <Avatar person={person} size="medium" />
                <div>
                  <h2>
                    {person.firstName} {person.lastName}
                  </h2>
                  <small>{person.relationship}</small>
                </div>
              </div>
              <p>
                <Mail size={18} />
                {person.email || "No email added"}
              </p>
              <p>
                <Phone size={18} />
                {person.phone || "No phone added"}
              </p>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="empty-state">
            No guardians found. Try a different search.
          </p>
        )}
      </div>
    </>
  );
}
