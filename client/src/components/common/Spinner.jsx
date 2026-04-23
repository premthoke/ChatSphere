/**
 * src/components/common/Spinner.jsx
 */
const Spinner = ({ fullPage = false }) => {
  if (fullPage) {
    return (
      <div
        style={{
          height: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }
  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
};

export default Spinner;
