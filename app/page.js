"use client";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generate"); // 'generate' or 'update'
  
  // States for Input fields
  const [targetUrl, setTargetUrl] = useState("");
  const [updateSerial, setUpdateSerial] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  
  // Loading & Result States
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Generate New QR Function
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetUrl) return alert("Kripya Web Link daalein!");
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    setGeneratedQR(null);

    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl }),
      });
      const data = await res.json();

      if (data.success) {
        setGeneratedQR(data);
        setMessage({ type: "success", text: `Serial #${data.serialNumber} Successfully Generated!` });
        setTargetUrl("");
      } else {
        setMessage({ type: "error", text: data.error || "Generation Failed!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error occurred!" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Update Existing QR Function
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateSerial || !updateUrl) return alert("Serial Number aur New Link dono bharein!");

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/qr/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber: updateSerial, newUrl: updateUrl }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setUpdateSerial("");
        setUpdateUrl("");
      } else {
        setMessage({ type: "error", text: data.error || "Update Failed!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error occurred!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dynamic QR Code Tool</h1>
      
      {/* Navigation Tabs */}
      <div style={styles.tabContainer}>
        <button 
          style={{ ...styles.tab, ...(activeTab === "generate" ? styles.activeTab : {}) }} 
          onClick={() => { setActiveTab("generate"); setMessage({type:"", text:""}); }}>
          1. Generate New QR
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === "update" ? styles.activeTab : {}) }} 
          onClick={() => { setActiveTab("update"); setMessage({type:"", text:""}); }}>
          2. Update a QR
        </button>
      </div>

      {/* Notification Message */}
      {message.text && (
        <div style={{
          ...styles.alert,
          backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2",
          color: message.type === "success" ? "#065f46" : "#991b1b"
        }}>
          {message.text}
        </div>
      )}

      {/* OPTION 1: GENERATE NEW QR */}
      {activeTab === "generate" && (
        <form onSubmit={handleGenerate} style={styles.card}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Row 1: Serial Number (Locked)</label>
            <input 
              type="text" 
              value="Auto Generated (Starts from 501)" 
              disabled 
              style={styles.disabledInput} 
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Row 2: Target Web Link</label>
            <input 
              type="url" 
              placeholder="https://example.com/my-page" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
              style={styles.input} 
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? "Generating Image..." : "Generate 2400x2400 QR"}
          </button>
        </form>
      )}

      {/* OPTION 2: UPDATE QR LINK */}
      {activeTab === "update" && (
        <form onSubmit={handleUpdate} style={styles.card}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>QR Serial Number to Update</label>
            <input 
              type="number" 
              placeholder="e.g. 501" 
              value={updateSerial}
              onChange={(e) => setUpdateSerial(e.target.value)}
              required
              style={styles.input} 
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Target Web Link</label>
            <input 
              type="url" 
              placeholder="https://new-destination-link.com" 
              value={updateUrl}
              onChange={(e) => setUpdateUrl(e.target.value)}
              required
              style={styles.input} 
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btnWarning}>
            {loading ? "Updating Link..." : "Update Destination URL"}
          </button>
        </form>
      )}

      {/* RESULT DISPLAY AREA */}
      {generatedQR && activeTab === "generate" && (
        <div style={styles.resultCard}>
          <h3 style={{ margin: "0 0 10px 0" }}>QR Code #{generatedQR.serialNumber} Ready</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>High-Res PNG (2400x2400) with Small Center Serial</p>
          
          <img 
            src={generatedQR.qrImage} 
            alt={`QR ${generatedQR.serialNumber}`} 
            style={styles.qrPreview} 
          />
          
          <br />
          <a href={generatedQR.qrImage} download={`QR_Serial_${generatedQR.serialNumber}.png`}>
            <button style={styles.btnDownload}>
              Download 2400x2400 PNG
            </button>
          </a>
        </div>
      )}
    </div>
  );
}

// Fixed Clean Styles Object
const styles = {
  container: { maxWidth: "550px", margin: "40px auto", padding: "20px", fontFamily: "system-ui, sans-serif" },
  title: { textAlign: "center", marginBottom: "25px", color: "#111827" },
  tabContainer: { display: "flex", gap: "10px", marginBottom: "20px" },
  tab: { flex: 1, padding: "12px", borderWidth: "1px", borderStyle: "solid", borderColor: "#d1d5db", borderRadius: "6px", background: "#f9fafb", cursor: "pointer", fontWeight: "600" },
  activeTab: { background: "#2563eb", color: "#ffffff", borderColor: "#2563eb" },
  card: { background: "#ffffff", padding: "24px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb" },
  fieldGroup: { marginBottom: "16px" },
  label: { display: "block", marginBottom: "6px", fontWeight: "600", color: "#374151" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", borderWidth: "1px", borderStyle: "solid", borderColor: "#d1d5db", fontSize: "15px", boxSizing: "border-box" },
  disabledInput: { width: "100%", padding: "10px", borderRadius: "6px", borderWidth: "1px", borderStyle: "solid", borderColor: "#d1d5db", background: "#f3f4f6", color: "#6b7280", fontSize: "15px", boxSizing: "border-box" },
  btnPrimary: { width: "100%", padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer", fontWeight: "600" },
  btnWarning: { width: "100%", padding: "12px", background: "#d97706", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer", fontWeight: "600" },
  btnDownload: { padding: "10px 20px", background: "#059669", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", fontWeight: "600", marginTop: "12px" },
  alert: { padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", fontWeight: "500" },
  resultCard: { marginTop: "24px", padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", borderWidth: "1px", borderStyle: "solid", borderColor: "#cbd5e1" },
  qrPreview: { width: "220px", height: "220px", margin: "10px 0", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: "4px" },
};