import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../services/api.js";

function Login({ isDarkMode, onToggleTheme }) {
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

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const buildGooglePassword = (seedValue) => {
        const seed = String(seedValue || "googleuser");
        let encoded = "";
        try {
            encoded = btoa(seed);
        } catch {
            encoded = seed;
        }
        const normalized = encoded.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
        return `GAuth#${normalized || "googleuser"}`;
    };

    const normalizeUsername = (value) => value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    const fetchGoogleImageAsFile = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to read Google profile image.");
        }
        const blob = await response.blob();
        return new File([blob], "google-avatar.jpg", { type: blob.type || "image/jpeg" });
    };

    const buildFallbackAvatarFile = (profile) => {
        const baseText = profile?.name || profile?.email || "Google User";
        const initials = baseText
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "GU";

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<rect width="256" height="256" fill="#7c3aed" />
<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="96" font-family="Arial, sans-serif" fill="#ffffff">${initials}</text>
</svg>`;

        return new File([svg], "google-avatar.svg", { type: "image/svg+xml" });
    };

    const loginWithCredentials = async ({ email, username, password: pass }) => {
        const payload = email ? { email, password: pass } : { username, password: pass };
        const response = await api.post("/users/login", payload);
        const token = response?.data?.data?.accessToken;
        if (!token) {
            throw new Error("Token not received");
        }
        localStorage.setItem("token", token);
        navigate("/");
    };

    const registerGoogleUser = async (profile, generatedPassword) => {
        const formData = new FormData();
        const baseUsername = normalizeUsername(profile.email?.split("@")[0] || profile.name || "googleuser");
        const username = `${baseUsername || "googleuser"}_${Date.now().toString().slice(-4)}`;

        formData.append("fullName", profile.name || "Google User");
        formData.append("username", username);
        formData.append("email", (profile.email || "").trim().toLowerCase());
        formData.append("password", generatedPassword);

        let avatarFile = null;
        if (profile.picture) {
            try {
                avatarFile = await fetchGoogleImageAsFile(profile.picture);
            } catch {
                avatarFile = null;
            }
        }
        if (!avatarFile) {
            avatarFile = buildFallbackAvatarFile(profile);
        }

        // Backend expects avatar and coverImage upload fields.
        formData.append("avatar", avatarFile, avatarFile.name || "google-avatar.jpg");
        formData.append("coverImage", avatarFile, avatarFile.name || "google-cover.jpg");

        await api.post("/users/register", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setGoogleLoading(true);
        try {
            const accessToken = tokenResponse?.access_token;
            if (!accessToken) {
                throw new Error("Google access token not received.");
            }

            const googleProfileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!googleProfileResponse.ok) {
                throw new Error("Failed to fetch Google profile.");
            }

            const profile = await googleProfileResponse.json();
            const email = (profile?.email || "").trim().toLowerCase();
            const generatedPassword = buildGooglePassword(profile?.sub || email);

            if (!email) {
                throw new Error("Google account data is incomplete.");
            }

            try {
                await loginWithCredentials({ email, password: generatedPassword });
            } catch (loginError) {
                try {
                    await registerGoogleUser(profile, generatedPassword);
                } catch (registerError) {
                    if (registerError?.response?.status === 409) {
                        throw new Error("This email already exists. Use email/password login for this account.");
                    }
                    throw registerError;
                }
                await loginWithCredentials({ email, password: generatedPassword });
            }
        } catch (error) {
            console.error(error);
            const serverMessage = error?.response?.data?.message;
            alert(serverMessage || error?.message || "Google login failed.");
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        scope: "openid profile email",
        onError: () => {
            alert("Google login popup failed. Please allow popups and try again.");
        }
    });

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const cleanIdentifier = identifier.trim();
            const cleanPassword = password;
            const isEmail = cleanIdentifier.includes("@");

            await loginWithCredentials({
                email: isEmail ? cleanIdentifier.toLowerCase() : undefined,
                username: isEmail ? undefined : cleanIdentifier.toLowerCase(),
                password: cleanPassword
            });
        } catch (error) {
            console.error(error);
            const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
            alert(serverMessage ? `Login failed: ${serverMessage}` : "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
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
                    maxWidth: "430px",
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
                        <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Welcome Back</h2>
                        <p style={{ margin: "0.45rem 0 0", opacity: 0.92 }}>Sign in to continue.</p>
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
                                {isDarkMode ? "\u{1F319}" : "\u2600\uFE0F"}
                            </span>
                        </button>
                    </div>

                    <p style={{ marginTop: 0, marginBottom: "1rem", color: textSub, fontSize: "0.95rem" }}>
                        Use email or continue with a trusted provider.
                    </p>

                    <button
                        type="button"
                        onClick={() => handleGoogleLogin()}
                        disabled={googleLoading}
                        style={{
                            width: "100%",
                            border: `1px solid ${borderColor}`,
                            borderRadius: "10px",
                            padding: "0.85rem",
                            backgroundColor: inputBg,
                            color: textMain,
                            fontWeight: "700",
                            cursor: "pointer",
                            marginBottom: "0.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.55rem"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.6 39.5 16.2 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.1 7.3l6.2 5.2C39.2 36.6 44 30.9 44 24c0-1.3-.1-2.4-.4-3.5z" />
                        </svg>
                        {googleLoading ? "Signing in with Google..." : "Continue with Google"}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", margin: "1rem 0" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: borderColor }} />
                        <span style={{ margin: "0 0.65rem", color: textSub, fontSize: "0.85rem" }}>
                            or continue with email
                        </span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: borderColor }} />
                    </div>

                    <form onSubmit={handleEmailLogin}>
                        <input
                            type="text"
                            placeholder="Email or username"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "0.85rem",
                                borderRadius: "10px",
                                border: "1px solid #d8b4fe",
                                backgroundColor: inputBg,
                                color: textMain,
                                marginBottom: "0.9rem",
                                outline: "none"
                            }}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "0.85rem",
                                borderRadius: "10px",
                                border: "1px solid #d8b4fe",
                                backgroundColor: inputBg,
                                color: textMain,
                                marginBottom: "1rem",
                                outline: "none"
                            }}
                        />

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
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p style={{ margin: "1rem 0 0", color: textSub, textAlign: "center", fontSize: "0.9rem" }}>
                        Don&apos;t have an account?{" "}
                        <Link to="/register" style={{ color: theme, fontWeight: 700, textDecoration: "none" }}>
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

