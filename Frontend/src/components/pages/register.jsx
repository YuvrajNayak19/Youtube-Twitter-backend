import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";

function Register({ isDarkMode, onToggleTheme }) {
    const theme = "#7c3aed";
    const darkTheme = "#5b21b6";
    const logoUrl = "https://img.sanishtech.com/u/c3b62f10de75c9ab9af941796327957b.png";
    const pageBg = isDarkMode
        ? "radial-gradient(circle at top, #312e81 0%, #111827 45%, #0f172a 100%)"
        : "radial-gradient(circle at top, #c4b5fd 0%, #f5f3ff 40%, #ffffff 100%)";
    const cardBg = isDarkMode ? "#111827" : "#ffffff";
    const textMain = isDarkMode ? "#f9fafb" : "#111827";
    const textSub = isDarkMode ? "#cbd5e1" : "#4b5563";
    const borderColor = isDarkMode ? "#374151" : "#e9d5ff";
    const inputBg = isDarkMode ? "#0b1220" : "#ffffff";
    const toggleTrack = isDarkMode ? "#1f2937" : "#ede9fe";
    const toggleThumb = isDarkMode ? "#0f172a" : "#ffffff";
    const toggleBorder = isDarkMode ? "#475569" : "#c4b5fd";

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!avatar) {
            alert("Avatar is required.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("username", username);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("avatar", avatar);
            if (coverImage) {
                formData.append("coverImage", coverImage);
            }

            await api.post("/users/register", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Registration successful. Please login.");
            navigate("/login");
        } catch (error) {
            console.error(error);
            const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
            alert(serverMessage ? `Registration failed: ${serverMessage}` : "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "0.85rem",
        borderRadius: "10px",
        border: "1px solid #d8b4fe",
        backgroundColor: inputBg,
        color: textMain,
        marginBottom: "0.9rem",
        outline: "none"
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: pageBg,
                padding: "1rem"
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "460px",
                    backgroundColor: cardBg,
                    borderRadius: "20px",
                    boxShadow: "0 20px 40px rgba(124, 58, 237, 0.22)",
                    border: `1px solid ${borderColor}`,
                    overflow: "hidden"
                }}
            >
                <div
                    style={{
                        background: `linear-gradient(135deg, ${theme}, ${darkTheme})`,
                        color: "#ffffff",
                        padding: "1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem"
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Create Account</h2>
                        <p style={{ margin: "0.45rem 0 0", opacity: 0.92 }}>Register to get started.</p>
                    </div>
                    <img
                        src={logoUrl}
                        alt="Logo"
                        style={{ width: "64px", height: "64px", borderRadius: "12px", backgroundColor: "#fff" }}
                    />
                </div>

                <div style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.9rem" }}>
                        <button
                            type="button"
                            onClick={onToggleTheme}
                            aria-label="Toggle theme"
                            style={{
                                width: "68px",
                                height: "34px",
                                borderRadius: "999px",
                                border: `1px solid ${toggleBorder}`,
                                backgroundColor: toggleTrack,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: isDarkMode ? "flex-end" : "flex-start",
                                padding: "4px",
                                boxSizing: "border-box"
                            }}
                        >
                            <span
                                style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    backgroundColor: toggleThumb,
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: "13px"
                                }}
                            >
                                {isDarkMode ? "🌙" : "☀️"}
                            </span>
                        </button>
                    </div>

                    <p style={{ marginTop: 0, marginBottom: "1rem", color: textSub, fontSize: "0.95rem" }}>
                        Fill your details below.
                    </p>

                    <form onSubmit={handleRegister}>
                        <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
                        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

                        <label style={{ display: "block", marginBottom: "0.35rem", color: textSub, fontSize: "0.88rem" }}>
                            Avatar (required)
                        </label>
                        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} required style={{ marginBottom: "0.9rem", color: textSub }} />

                        <label style={{ display: "block", marginBottom: "0.35rem", color: textSub, fontSize: "0.88rem" }}>
                            Cover Image (optional)
                        </label>
                        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} style={{ marginBottom: "1rem", color: textSub }} />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                border: "none",
                                borderRadius: "10px",
                                padding: "0.85rem",
                                backgroundColor: theme,
                                color: "#ffffff",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            {loading ? "Creating account..." : "Register"}
                        </button>
                    </form>

                    <p style={{ margin: "1rem 0 0", color: textSub, textAlign: "center", fontSize: "0.9rem" }}>
                        Already have an account?{" "}
                        <Link to="/login" style={{ color: theme, fontWeight: 700, textDecoration: "none" }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
