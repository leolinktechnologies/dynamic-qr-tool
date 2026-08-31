"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generate");
  const [nextSerial, setNextSerial] = useState("Loading...");
  
  // States
  const [targetUrl, setTargetUrl] = useState("");
  const [updateSerial, setUpdateSerial] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch Next Serial Number on Load & Change
  const fetchNextSerial = async () => {
    try {
      const res = await fetch("/api/qr/next-serial");
      const data = await res.json();
      if (data.success) {
        setNextSerial(`#${data.nextSerial}`);
      }
    } catch (e) {
      setNextSerial("#501");
    }
  };

  useEffect(() => {
    fetchNextSerial();
  }, []);

  // 1. Generate QR Function
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetUrl) return alert("Please enter target URL!");
    
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
        setMessage({ type: "success", text: `QR Code #${data.serialNumber} Successfully Generated!` });
        setTargetUrl("");
        fetchNextSerial(); // Refresh for next serial
      } else {
        setMessage({ type: "error", text: data.error || "Generation Failed!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server Connection Error!" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Update QR Function
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateSerial || !updateUrl) return alert("Enter both Serial and New URL!");

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
      setMessage({ type: "error", text: "Server Connection Error!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>PRODUCTION READY</div>
          <h1 style={styles.title}>Dynamic QR Manager</h1>
          <p style={styles.subtitle}>Generate High-Res (2400x2400) QR Codes with embedded serial tags and instant URL updates.</p>
        </div>

        {/* Tab Selection */}
        <div style={styles.tabContainer}>
          <button 
            style={{ ...styles.tab, ...(activeTab === "generate" ? styles.activeTab : {}) }} 
            onClick={() => { setActiveTab("generate"); setMessage({type:"", text:""}); }}>
            ⚡ 1. Generate New QR
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === "update" ? styles.activeTab : {}) }} 
            onClick={() => { setActiveTab("update"); setMessage({type:"", text:""}); }}>
            🔄 2. Update Destination Link
          </button>
        </div>

        {/* Alerts */}
        {message.text && (
          <div style={{
            ...styles.alert,
            backgroundColor: message.type === "success" ? "#ecfdf5" : "#fef2f2",
            borderColor: message.type === "success" ? "#10b981" : "#ef4444",
            color: message.type === "success" ? "#065f46" : "#991b1b"
          }}>
            {message.type === "success" ? "✓ " : "⚠️ "}{message.text}
          </div>
        )}

        {/* TAB 1: GENERATE FORM */}
        {activeTab === "generate" && (
          <form onSubmit={handleGenerate} style={styles.card}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Assigned Serial Number
                <span style={styles.tag}>AUTO-INCREMENT</span>
              </label>
              <input 
                type="text" 
                value={nextSerial} 
                disabled 
                style={styles.disabledInput} 
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Target Destination Web Link</label>
              <input 
                type="url" 
                placeholder="https://example.com/destination" 
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                style={styles.input} 
              />
            </div>

            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading ? "Processing High-Res Image..." : "Generate 2400x2400 QR Code"}
            </button>
          </form>
        )}

        {/* TAB 2: UPDATE FORM */}
        {activeTab === "update" && (
          <form onSubmit={handleUpdate} style={styles.card}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>QR Code Serial Number</label>
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
              <label style={styles.label}>New Target Destination Web Link</label>
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

        {/* RESULT CARD */}
        {generatedQR && activeTab === "generate" && (
          <div style={styles.resultCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>QR Code #{generatedQR.serialNumber} Ready</h3>
              <span style={{ fontSize: "12px", background: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>2400 x 2400 px</span>
            </div>
            
            <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 16px 0" }}>
              High Resolution PNG generated with embedded center serial #{generatedQR.serialNumber}.
            </p>
            
            <div style={styles.previewContainer}>
              <img 
                src={generatedQR.qrImage} 
                alt={`QR ${generatedQR.serialNumber}`} 
                style={styles.qrPreview} 
              />
            </div>
            
            <a href={generatedQR.qrImage} download={`QR_Serial_${generatedQR.serialNumber}.png`}>
              <button style={styles.btnDownload}>
                ⬇ Download High-Res PNG (2400x2400)
              </button>
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

// Professional Modern Dark/Light Theme Styles
const styles = {
  pageBackground: { backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px 16px", fontFamily: "'Inter', -apple-system, sans-serif" },
  container: { maxWidth: "600px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "32px" },
  badge: { display: "inline-block", background: "#dbeafe", color: "#1d4ed8", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px", tracking: "1px", marginBottom: "8px" },
  title: { margin: "4px 0 8px 0", color: "#0f172a", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", fontSize: "14px", margin: 0, lineHeight: "1.5" },
  
  tabContainer: { display: "flex", gap: "8px", background: "#e2e8f0", padding: "6px", borderRadius: "10px", marginBottom: "24px" },
  tab: { flex: 1, padding: "12px", border: "none", borderRadius: "8px", background: "transparent", color: "#64748b", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s" },
  activeTab: { background: "#ffffff", color: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  
  card: { background: "#ffffff", padding: "28px", borderRadius: "14px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0" },
  fieldGroup: { marginBottom: "20px" },
  label: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" },
  tag: { fontSize: "10px", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "4px" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "8px", borderWidth: "1px", borderStyle: "solid", borderColor: "#cbd5e1", fontSize: "15px", boxSizing: "border-box", outline: "none" },
  disabledInput: { width: "100%", padding: "12px 14px", borderRadius: "8px", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", background: "#f8fafc", color: "#0284c7", fontWeight: "700", fontSize: "16px", boxSizing: "border-box" },
  
  btnPrimary: { width: "100%", padding: "14px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer", fontWeight: "600" },
  btnWarning: { width: "100%", padding: "14px", background: "#d97706", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer", fontWeight: "600" },
  btnDownload: { width: "100%", padding: "12px", background: "#059669", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontWeight: "600" },
  
  alert: { padding: "14px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "500", borderWidth: "1px", borderStyle: "solid" },
  resultCard: { marginTop: "28px", padding: "24px", background: "#ffffff", borderRadius: "14px", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" },
  previewContainer: { background: "#f8fafc", padding: "20px", borderRadius: "10px", textAlign: "center", marginBottom: "16px", borderWidth: "1px", borderStyle: "solid", borderColor: "#f1f5f9" },
  qrPreview: { width: "220px", height: "220px", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
};