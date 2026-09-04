// EventEditorModal.jsx
import { useState, useEffect } from "react";
import "../../css/EventEditorModal.css";
import Calender1 from "../../images/Calender1.svg"
import DeleteBin2 from "../../images/DeleteBin2.svg"
import SaveChanges from "../../images/SaveChanges.svg"

const AddNewEventModal = ({ open, onClose, event, onSave, onDelete }) => {
  const [form, setForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "",
    description: "",
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        startTime: event.timeRange?.split(" - ")[0] || "",
        endTime: event.timeRange?.split(" - ")[1] || "",
        location: event.location || "",
        type: event.category || "",
        description: event.subtitle || "",
      });
    }
  }, [event]);

  if (!open || !event) return null;

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  // const handleSubmit = () => {
  //   onSave?.({
  //     ...event,
  //     title: form.title,
  //     timeRange: `${form.startTime} - ${form.endTime}`,
  //     location: form.location,
  //     category: form.type,
  //     subtitle: form.description,
  //   });
  // };
  const handleSubmit = () => {
  // Assume you added a date field in `form.date` as a string "dd-mm-yyyy"
  // or you can just send selectedDate from parent; for now keep simple:

  onSave?.({
    title: form.title,
    timeRange: `${form.startTime} - ${form.endTime}`,
    location: form.location,
    category: form.type || "Meetings",
    subtitle: form.description,
    date: new Date(),   // or pass selectedDate from parent if needed
    type: "meeting",
    color: "orange",
    icon: "📝",
  });
};


  return (
    <div className="event-editor-overlay" onClick={onClose}>
      <div className="event-editor-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="event-editor-header">
          <div className="event-editor-title-wrap">
            <span className="event-editor-icon">
                <img src={Calender1} alt="" />
            </span>
            <h2>Add New Event</h2>
          </div>
          <button className="event-editor-close" onClick={onClose}>×</button>
        </div>

        {/* Form */}
        <div className="event-editor-body">
          <div className="field-group">
            <label>Event Title</label>
            <input
              type="text"
              value={form.title}
              onChange={handleChange("title")}
            />
          </div>

           <div className="field-group">
            <label>Date</label>
            <input
              type="date"
              value={form.location}
              onChange={handleChange("location")}
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Start Time</label>
              <input
                type="text"
                value={form.startTime}
                onChange={handleChange("startTime")}
                placeholder="09:00 AM"
              />
            </div>
            <div className="field-group">
              <label>End Time</label>
              <input
                type="text"
                value={form.endTime}
                onChange={handleChange("endTime")}
                placeholder="09:30 AM"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={handleChange("location")}
            />
          </div>

          <div className="field-group">
            <label>Event Type</label>
            <input
              type="text"
              value={form.type}
              onChange={handleChange("type")}
              placeholder="Meeting"
            />
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="event-editor-footer">
          <button className="btn-secondary1" onClick={onClose}>
            Cancel
        </button>

          <div style={{display: "flex",
    gap: "10px",
    alignItems: "center"}}>
            <button className="btn-danger1" onClick={() => onDelete?.(event.id)}>
            <img src={DeleteBin2} alt="" />
             <span> Delete </span>
          </button>
          <button className="btn-primary1" onClick={handleSubmit}>
            <img src={SaveChanges} alt="" />
             <span> Save Changes </span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewEventModal;
