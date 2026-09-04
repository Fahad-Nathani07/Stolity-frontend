import React, { useState, useCallback } from "react";

const SearchUsersPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiurl = "https://stolityuatapi.infomanav.in/api/aws/file-transfer/search-users";
  
  // Fixed: Get token safely - use 'token' key or fallback
  const token = sessionStorage.getItem("token") || sessionStorage.getItem("number");

  const handleSearch = useCallback(async (searchQuery) => {
    if (!token) {
      setError("No auth token found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(apiurl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: searchQuery || "" }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setResults(data.users || data || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch results. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiurl, token]);

  const onButtonClick = useCallback((e) => {
    e.preventDefault();
    handleSearch(query.trim());
  }, [query, handleSearch]);

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
        fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: "#fafafa",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Search Users</h2>

      <input
        type="text"
        placeholder="Enter search term"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 16,
          borderRadius: 4,
          border: "1px solid #bbb",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={onButtonClick}
        disabled={loading || query.trim() === ""}
        style={{
          width: "100%",
          padding: "10px 16px",
          backgroundColor: "#FFAB49",
          border: "none",
          borderRadius: 20,
          color: "white",
          fontWeight: "600",
          fontSize: 16,
          cursor: loading || query.trim() === "" ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease",
        }}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 12,
            color: "#b00020",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <ul
        style={{
          marginTop: 20,
          paddingLeft: 0,
          listStyle: "none",
          maxHeight: 300,
          overflowY: "auto",
          borderTop: "1px solid #ddd",
        }}
      >
        {results.length === 0 && !loading && query && (
          <li style={{ padding: 12, textAlign: "center", color: "#777" }}>
            No results found.
          </li>
        )}

        {results.map((user, index) => (
          <li
            key={user.id || user.email || index}
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              fontSize: 15,
              color: "#333",
            }}
          >
            {user.name || user.username || user.email || JSON.stringify(user)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchUsersPage;
