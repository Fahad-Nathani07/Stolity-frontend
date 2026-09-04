const RoleBadge = ({ role }) => {
  if (!role) {
    return <span style={{ color: "#999" }}>No Access</span>;
  }

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "999px",
        background: role === "SUPER_ADMIN" ? "#FFAB49" : "#FFE3CA",
        color: role === "SUPER_ADMIN" ? "#fff" : "#494949",
        fontSize: "12px",
        fontWeight: 500,
      }}
    >
      {role}
    </span>
  );
};

export default RoleBadge;
