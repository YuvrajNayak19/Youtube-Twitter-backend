import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { authHeaders } from "../services/api.js";

function Home({ isDarkMode, onToggleTheme }) {
    const navigate = useNavigate();
    const logoUrl = "https://img.sanishtech.com/u/c3b62f10de75c9ab9af941796327957b.png";
    const bg = isDarkMode ? "#0f172a" : "#f9fafb";
    const card = isDarkMode ? "#111827" : "#ffffff";
    const panel = isDarkMode ? "#0b1220" : "#f8fafc";
    const text = isDarkMode ? "#f9fafb" : "#111827";
    const muted = isDarkMode ? "#cbd5e1" : "#6b7280";
    const border = isDarkMode ? "#334155" : "#e5e7eb";
    const active = "#7c3aed";

    const [mobile, setMobile] = useState(() => window.innerWidth < 960);
    const [collapsed, setCollapsed] = useState(false);
    const [section, setSection] = useState("home");
    const [search, setSearch] = useState("");
    const [sortMine, setSortMine] = useState("latest");
    const [showMoreSubs, setShowMoreSubs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tweetInput, setTweetInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDescription, setUploadDescription] = useState("");
    const [uploadVideoFile, setUploadVideoFile] = useState(null);
    const [uploadThumbnail, setUploadThumbnail] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [channelVideos, setChannelVideos] = useState([]);
    const [channelLoading, setChannelLoading] = useState(false);
    const [channelTweets, setChannelTweets] = useState([]);
    const [channelSubsCount, setChannelSubsCount] = useState(0);
    const [tweetLiked, setTweetLiked] = useState({});
    const [settingsName, setSettingsName] = useState("");
    const [settingsEmail, setSettingsEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalVideo: 0, totalViews: 0, totalSubscribers: 0, totalLikes: 0 });
    const [videos, setVideos] = useState([]);
    const [myVideos, setMyVideos] = useState([]);
    const [history, setHistory] = useState([]);
    const [tweets, setTweets] = useState([]);
    const [likedVideos, setLikedVideos] = useState([]);
    const [subscribedChannels, setSubscribedChannels] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [playlistName, setPlaylistName] = useState("");
    const [playlistDesc, setPlaylistDesc] = useState("");
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [playlistVideos, setPlaylistVideos] = useState([]);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editThumbnail, setEditThumbnail] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [creatorProfiles, setCreatorProfiles] = useState({});
    const [playlistPicker, setPlaylistPicker] = useState({ open: false, video: null });
    const [pickerPlaylistName, setPickerPlaylistName] = useState("");
    const [pickerPlaylistDesc, setPickerPlaylistDesc] = useState("");
    const [playlistPickerLoading, setPlaylistPickerLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "info" });

    useEffect(() => {
        const onResize = () => setMobile(window.innerWidth < 960);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (!snackbar.open) return undefined;
        const timer = setTimeout(() => {
            setSnackbar((prev) => ({ ...prev, open: false }));
        }, 2800);
        return () => clearTimeout(timer);
    }, [snackbar.open, snackbar.message]);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
    const formatViews = (n) => {
        const v = Number(n || 0);
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M views`;
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K views`;
        return `${v} views`;
    };

    const showSnackbar = (message, type = "info") => {
        setSnackbar({ open: true, message, type });
    };

    const isOwnTweet = (tweet) => {
        const ownerId = typeof tweet?.owner === "string" ? tweet.owner : tweet?.owner?._id;
        return Boolean(ownerId && user?._id && String(ownerId) === String(user._id));
    };

    const loadData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");
        setLoading(true);
        setError("");
        try {
            const headers = { headers: authHeaders() };
            const [u, s, v, mv, h, twFeed] = await Promise.all([
                api.get("/users/current-user", headers),
                api.get("/dashboards/stats", headers),
                api.get("/videos?limit=40&sortBy=createdAt&sortType=desc", headers),
                api.get("/dashboards/videos", headers),
                api.get("/users/history", headers),
                api.get("/tweets?limit=80", headers)
            ]);

            const me = u?.data?.data || null;
            const feed = Array.isArray(v?.data?.data) ? v.data.data : [];
            setUser(me);
            setSettingsName(me?.fullName || "");
            setSettingsEmail(me?.email || "");
            setStats(s?.data?.data || { totalVideo: 0, totalViews: 0, totalSubscribers: 0, totalLikes: 0 });
            setVideos(feed);
            setMyVideos(Array.isArray(mv?.data?.data) ? mv.data.data : []);
            setHistory(Array.isArray(h?.data?.data) ? h.data.data : []);
            setTweets(Array.isArray(twFeed?.data?.data) ? twFeed.data.data : []);

            if (me?._id) {
                const [liked, subs, pls] = await Promise.all([
                    api.get("/likes/videos", { headers: authHeaders() }),
                    api.get(`/subscriptions/u/${me._id}`, { headers: authHeaders() }),
                    api.get(`/playlists/user/${me._id}`, { headers: authHeaders() })
                ]);
                setLikedVideos(Array.isArray(liked?.data?.data) ? liked.data.data : []);
                setSubscribedChannels(Array.isArray(subs?.data?.data) ? subs.data.data : []);
                setPlaylists(Array.isArray(pls?.data?.data) ? pls.data.data : []);
            }

            const usernames = [...new Set(feed.map((x) => x?.owner?.username).filter(Boolean))];
            const prof = {};
            await Promise.all(usernames.map(async (name) => {
                try {
                    const r = await api.get(`/users/c/${name}`, { headers: authHeaders() });
                    prof[name] = r?.data?.data || null;
                } catch {
                    prof[name] = null;
                }
            }));
            setCreatorProfiles(prof);
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to load home");
            if (e?.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const filteredVideos = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return videos;
        return videos.filter((x) => `${x?.title || ""} ${x?.description || ""} ${x?.owner?.username || ""}`.toLowerCase().includes(q));
    }, [videos, search]);

    const sortedMine = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = [...myVideos];
        if (q) list = list.filter((x) => `${x?.title || ""} ${x?.description || ""}`.toLowerCase().includes(q));
        list.sort((a, b) => {
            const av = new Date(a?.createdAt || 0).getTime();
            const bv = new Date(b?.createdAt || 0).getTime();
            return sortMine === "latest" ? bv - av : av - bv;
        });
        return list;
    }, [myVideos, search, sortMine]);

    const likedIds = useMemo(() => new Set((likedVideos || []).map((l) => l?.video?._id).filter(Boolean)), [likedVideos]);
    const subscribedIds = useMemo(() => new Set((subscribedChannels || []).map((s) => s?.channel?._id).filter(Boolean)), [subscribedChannels]);

    const logout = async () => {
        try { await api.post("/users/logout", {}, { headers: authHeaders() }); } catch {}
        localStorage.removeItem("token");
        navigate("/login");
    };

    const toggleLike = async (videoId) => {
        await api.post(`/likes/toggle/v/${videoId}`, {}, { headers: authHeaders() });
        const liked = await api.get("/likes/videos", { headers: authHeaders() });
        setLikedVideos(Array.isArray(liked?.data?.data) ? liked.data.data : []);
    };

    const toggleSubscribe = async (channelId) => {
        await api.post(`/subscriptions/c/${channelId}`, {}, { headers: authHeaders() });
        if (user?._id) {
            const subs = await api.get(`/subscriptions/u/${user._id}`, { headers: authHeaders() });
            setSubscribedChannels(Array.isArray(subs?.data?.data) ? subs.data.data : []);
        }
    };

    const togglePublish = async (id) => {
        const r = await api.patch(`/videos/toggle/publish/${id}`, {}, { headers: authHeaders() });
        const updated = r?.data?.data;
        setMyVideos((p) => p.map((x) => (x?._id === id ? updated : x)));
    };

    const deleteVideo = async (id) => {
        await api.delete(`/videos/${id}`, { headers: authHeaders() });
        setMyVideos((p) => p.filter((x) => x?._id !== id));
        setVideos((p) => p.filter((x) => x?._id !== id));
    };
    const createPlaylist = async (e) => {
        e.preventDefault();
        if (!playlistName.trim()) return;
        try {
            const r = await api.post("/playlists", { name: playlistName.trim(), description: playlistDesc.trim() }, { headers: authHeaders() });
            const created = r?.data?.data;
            if (created) setPlaylists((p) => [created, ...p]);
            setPlaylistName("");
            setPlaylistDesc("");
            showSnackbar("Playlist created.", "success");
        } catch (err) {
            showSnackbar(err?.response?.data?.message || "Failed to create playlist.", "error");
        }
    };

    const addToPlaylist = async (videoId, playlistId) => {
        try {
            await api.patch(`/playlists/add/${videoId}/${playlistId}`, {}, { headers: authHeaders() });
            const target = playlists.find((p) => p?._id === playlistId);
            showSnackbar(`Added to "${target?.name || "playlist"}".`, "success");
            if (selectedPlaylist?._id === playlistId) {
                await openPlaylist(selectedPlaylist);
            }
        } catch (err) {
            showSnackbar(err?.response?.data?.message || "Failed to add to playlist.", "error");
            throw err;
        }
    };

    const openPlaylistPicker = (video) => {
        if (!video?._id) return;
        setPlaylistPicker({ open: true, video });
        setPickerPlaylistName("");
        setPickerPlaylistDesc("");
    };

    const closePlaylistPicker = () => {
        setPlaylistPicker({ open: false, video: null });
        setPickerPlaylistName("");
        setPickerPlaylistDesc("");
    };

    const addVideoToExistingPlaylist = async (playlistId) => {
        if (!playlistPicker?.video?._id || !playlistId) return;
        setPlaylistPickerLoading(true);
        try {
            await addToPlaylist(playlistPicker.video._id, playlistId);
            closePlaylistPicker();
        } finally {
            setPlaylistPickerLoading(false);
        }
    };

    const createPlaylistAndAddVideo = async (e) => {
        e.preventDefault();
        if (!playlistPicker?.video?._id) return;
        if (!pickerPlaylistName.trim()) {
            showSnackbar("Playlist name is required.", "error");
            return;
        }

        setPlaylistPickerLoading(true);
        try {
            const r = await api.post(
                "/playlists",
                { name: pickerPlaylistName.trim(), description: pickerPlaylistDesc.trim() },
                { headers: authHeaders() }
            );
            const created = r?.data?.data;
            if (!created?._id) {
                throw new Error("Playlist was not created.");
            }
            setPlaylists((prev) => [created, ...prev.filter((p) => p?._id !== created._id)]);
            await addToPlaylist(playlistPicker.video._id, created._id);
            closePlaylistPicker();
        } catch (err) {
            showSnackbar(err?.response?.data?.message || err?.message || "Failed to create playlist.", "error");
        } finally {
            setPlaylistPickerLoading(false);
        }
    };

    const openPlaylist = async (playlist) => {
        if (!playlist?._id) return;
        setSelectedPlaylist(playlist);
        setPlaylistLoading(true);
        try {
            const r = await api.get(`/playlists/${playlist._id}`, { headers: authHeaders() });
            const pl = r?.data?.data;
            setPlaylistVideos(Array.isArray(pl?.videos) ? pl.videos : []);
        } catch {
            setPlaylistVideos([]);
        } finally {
            setPlaylistLoading(false);
        }
    };

    const openEditVideo = (video) => {
        setEditingVideo(video);
        setEditTitle(video?.title || "");
        setEditDescription(video?.description || "");
        setEditThumbnail(null);
    };

    const saveEditVideo = async (e) => {
        e.preventDefault();
        if (!editingVideo?._id) return;
        setEditLoading(true);
        try {
            const formData = new FormData();
            if (editTitle.trim()) formData.append("title", editTitle.trim());
            if (editDescription.trim()) formData.append("description", editDescription.trim());
            if (editThumbnail) formData.append("thumbnail", editThumbnail);

            const r = await api.patch(`/videos/${editingVideo._id}`, formData, {
                headers: { ...authHeaders(), "Content-Type": "multipart/form-data" }
            });
            const updated = r?.data?.data;
            if (updated) {
                setMyVideos((prev) => prev.map((x) => (x?._id === updated._id ? updated : x)));
                setVideos((prev) => prev.map((x) => (x?._id === updated._id ? { ...x, ...updated } : x)));
                if (selectedChannel?._id === user?._id) {
                    setChannelVideos((prev) => prev.map((x) => (x?._id === updated._id ? updated : x)));
                }
            }
            setEditingVideo(null);
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to update video.");
        } finally {
            setEditLoading(false);
        }
    };

    const postTweet = async (e) => {
        e.preventDefault();
        if (!tweetInput.trim()) return;
        const r = await api.post("/tweets", { content: tweetInput.trim() }, { headers: authHeaders() });
        const t = r?.data?.data;
        if (t) setTweets((p) => [t, ...p]);
        setTweetInput("");
    };

    const removeTweet = async (id) => {
        await api.delete(`/tweets/${id}`, { headers: authHeaders() });
        setTweets((p) => p.filter((x) => x?._id !== id));
    };

    const toggleTweetLike = async (tweetId) => {
        await api.post(`/likes/toggle/t/${tweetId}`, {}, { headers: authHeaders() });
        setTweetLiked((prev) => ({ ...prev, [tweetId]: !prev[tweetId] }));
    };

    const uploadVideo = async (e) => {
        e.preventDefault();
        if (!uploadTitle.trim() || !uploadDescription.trim() || !uploadVideoFile) {
            return alert("Title, description and video file are required.");
        }
        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", uploadTitle.trim());
            formData.append("description", uploadDescription.trim());
            formData.append("videoFile", uploadVideoFile);
            if (uploadThumbnail) formData.append("thumbnail", uploadThumbnail);

            await api.post("/videos", formData, {
                headers: { ...authHeaders(), "Content-Type": "multipart/form-data" }
            });

            setShowUpload(false);
            setUploadTitle("");
            setUploadDescription("");
            setUploadVideoFile(null);
            setUploadThumbnail(null);
            await loadData();
        } catch (err) {
            alert(err?.response?.data?.message || "Video upload failed.");
        } finally {
            setUploadLoading(false);
        }
    };

    const openChannel = async (channelObj) => {
        if (!channelObj?._id) return;
        setSelectedChannel(channelObj);
        setSection("channel");
        setChannelLoading(true);
        try {
            const [res, tweetsRes, subsRes] = await Promise.all([
                api.get(`/videos?userId=${channelObj._id}&limit=50&sortBy=createdAt&sortType=desc`, { headers: authHeaders() }),
                api.get(`/tweets/user/${channelObj._id}`, { headers: authHeaders() }),
                api.get(`/subscriptions/c/${channelObj._id}`, { headers: authHeaders() })
            ]);
            setChannelVideos(Array.isArray(res?.data?.data) ? res.data.data : []);
            setChannelTweets(Array.isArray(tweetsRes?.data?.data) ? tweetsRes.data.data : []);
            const subs = Array.isArray(subsRes?.data?.data) ? subsRes.data.data : [];
            setChannelSubsCount(subs.length);
        } catch {
            setChannelVideos([]);
            setChannelTweets([]);
            setChannelSubsCount(0);
        } finally {
            setChannelLoading(false);
        }
    };

    const updateAccount = async (e) => {
        e.preventDefault();
        await api.patch("/users/update-details", { fullName: settingsName, email: settingsEmail }, { headers: authHeaders() });
        await loadData();
        alert("Account details updated.");
    };

    const changePassword = async (e) => {
        e.preventDefault();
        await api.post("/users/change-password", { oldPassword, newPassword }, { headers: authHeaders() });
        setOldPassword("");
        setNewPassword("");
        alert("Password changed.");
    };

    const startVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return alert("Voice search not supported in this browser.");
        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        setIsListening(true);
        rec.onresult = (event) => {
            const textResult = event.results?.[0]?.[0]?.transcript || "";
            setSearch(textResult);
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        rec.start();
    };

    const Icon = ({ name, size = 16 }) => {
        const style = { width: size, height: size, display: "inline-block", verticalAlign: "middle" };
        switch (name) {
            case "home":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3z" /></svg>;
            case "subs":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M4 6h16v12H4zM2 4v16h20V4z" /></svg>;
            case "you":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5m0 2c-4.4 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.6-4.5-8-4.5" /></svg>;
            case "history":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5zM12 8h2v5h4v2h-6z" /></svg>;
            case "like":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M2 10h4v10H2zm7 10h9a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-5l1-4-1-2-6 6z" /></svg>;
            case "video":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M3 5h14v14H3zM19 8l3-2v12l-3-2z" /></svg>;
            case "playlist":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M3 6h12v2H3zm0 5h12v2H3zm0 5h8v2H3zm14-3V9l6 3z" /></svg>;
            case "tweet":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.7 1A4.2 4.2 0 0 0 11.5 9a12 12 0 0 1-8.7-4.4 4.2 4.2 0 0 0 1.3 5.6A4.2 4.2 0 0 1 2 9.6v.1a4.2 4.2 0 0 0 3.3 4.1 4.3 4.3 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.6a11.9 11.9 0 0 0 6.5 1.9c7.8 0 12.1-6.5 12.1-12.1v-.5A8.7 8.7 0 0 0 22 5.8" /></svg>;
            case "settings":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M19.4 12.9a7.8 7.8 0 0 0 0-1.8l2.1-1.6-2-3.4-2.5 1a7.3 7.3 0 0 0-1.6-.9L15 3h-4l-.4 3.2a7.3 7.3 0 0 0-1.6.9l-2.5-1-2 3.4 2.1 1.6a7.8 7.8 0 0 0 0 1.8l-2.1 1.6 2 3.4 2.5-1a7.3 7.3 0 0 0 1.6.9L11 21h4l.4-3.2a7.3 7.3 0 0 0 1.6-.9l2.5 1 2-3.4zM13 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>;
            case "mic":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3m5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" /></svg>;
            case "menu":
                return <svg viewBox="0 0 24 24" style={style}><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" /></svg>;
            default:
                return <span style={{ ...style, display: "inline-grid", placeItems: "center" }}>*</span>;
        }
    };

    const SkeletonCard = () => (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", background: panel }} />
            <div style={{ padding: "0.7rem" }}>
                <div className="skeleton" style={{ height: "12px", borderRadius: "6px", marginBottom: "0.4rem", background: panel }} />
                <div className="skeleton" style={{ height: "12px", width: "60%", borderRadius: "6px", background: panel }} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: bg, color: text, padding: "1rem" }}>
                <style>{`@keyframes pulseFade {0%{opacity:.55}50%{opacity:1}100%{opacity:.55}} .skeleton{animation:pulseFade 1.2s ease-in-out infinite;}`}</style>
                <div style={{ maxWidth: "1360px", margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: "1rem" }}>
                    <div className="skeleton" style={{ height: "80vh", borderRadius: "16px", background: card, border: `1px solid ${border}` }} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                        {Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)}
                    </div>
                </div>
            </div>
        );
    }

    const showSubs = showMoreSubs ? subscribedChannels : subscribedChannels.slice(0, 7);
    const topActionLabel = section === "tweets" ? "Post" : "Create";
    const snackBg = snackbar.type === "error" ? "#b91c1c" : snackbar.type === "success" ? "#166534" : active;

    const navItem = (id, label, icon) => (
        <button
            key={id}
            onClick={() => setSection(id)}
            style={{
                width: "100%",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem",
                marginBottom: "0.35rem",
                textAlign: collapsed && !mobile ? "center" : "left",
                background: section === id ? active : panel,
                color: section === id ? "#fff" : text,
                cursor: "pointer",
                fontWeight: 700
            }}
        >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", justifyContent: collapsed && !mobile ? "center" : "flex-start", width: "100%" }}>
                <span>{icon}</span>
                {collapsed && !mobile ? null : <span>{label}</span>}
            </span>
        </button>
    );

    return (
        <div style={{ minHeight: "100vh", background: bg, color: text }}>
            <header style={{ position: "sticky", top: 0, zIndex: 12, borderBottom: `1px solid ${border}`, background: card }}>
                <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0.65rem 1rem", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "0.7rem", alignItems: "center" }}>
                    <button onClick={() => { setSection("home"); navigate("/"); }} style={{ border: "none", background: "transparent", color: text, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img src={logoUrl} alt="Logo" style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#fff" }} />
                        <strong>Youtube + Twitter</strong>
                    </button>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search"
                            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "999px", padding: "0.62rem 1rem", background: panel, color: text, outline: "none" }}
                        />
                        <button onClick={startVoice} style={{ border: `1px solid ${border}`, borderRadius: "999px", padding: "0.62rem 0.8rem", background: isListening ? "#fee2e2" : panel, color: text, cursor: "pointer", display: "grid", placeItems: "center" }}>
                            <Icon name="mic" />
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            onClick={() => {
                                if (section === "tweets") return postTweet({ preventDefault: () => {} });
                                setShowUpload(true);
                            }}
                            style={{ border: "none", borderRadius: "999px", padding: "0.58rem 0.9rem", background: "#7c3aed", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                        >
                            {topActionLabel}
                        </button>
                        <button onClick={() => setSection("you")} style={{ border: `1px solid ${border}`, borderRadius: "999px", padding: "0.2rem", background: panel, cursor: "pointer", width: "36px", height: "36px" }}>
                            <img src={user?.avatar || logoUrl} alt="Me" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        </button>
                        <button onClick={onToggleTheme} style={{ border: `1px solid ${border}`, borderRadius: "999px", padding: "0.58rem 0.8rem", background: panel, color: text, cursor: "pointer" }}>
                            {isDarkMode ? "\u2600\uFE0F" : "\u{1F319}"}
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "1rem", display: "grid", gridTemplateColumns: mobile ? "1fr" : collapsed ? "96px 1fr" : "300px 1fr", gap: "1rem" }}>
                <aside style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "0.7rem", height: "fit-content", position: mobile ? "static" : "sticky", top: "80px" }}>
                    <div style={{ display: "flex", justifyContent: collapsed && !mobile ? "center" : "space-between", marginBottom: "0.5rem" }}>
                        {!collapsed || mobile ? <strong>Sidebar</strong> : null}
                        <button onClick={() => setCollapsed((p) => !p)} style={{ border: "none", background: panel, color: text, borderRadius: "8px", cursor: "pointer", padding: "0.35rem 0.5rem" }}>
                            {collapsed ? ">" : "<"}
                        </button>
                    </div>

                    {navItem("home", "Home", <Icon name="home" />)}
                    {navItem("subs", "Subscriptions", <Icon name="subs" />)}

                    {!collapsed || mobile ? (
                        <div style={{ margin: "0.35rem 0 0.5rem" }}>
                            {showSubs.map((s) => (
                                <button key={s?._id} onClick={() => openChannel(s?.channel)} style={{ width: "100%", border: "none", background: "transparent", color: text, cursor: "pointer", padding: "0.35rem 0.2rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <img src={s?.channel?.avatar || logoUrl} alt="c" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                    <span style={{ fontSize: "0.82rem", textAlign: "left" }}>@{s?.channel?.username || "channel"}</span>
                                </button>
                            ))}
                            {subscribedChannels.length > 7 ? (
                                <button onClick={() => setShowMoreSubs((p) => !p)} style={{ border: "none", background: "transparent", color: "#7c3aed", cursor: "pointer", padding: "0.2rem 0" }}>
                                    {showMoreSubs ? "Show less" : "Show more"}
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    <hr style={{ border: "none", borderTop: `1px solid ${border}`, margin: "0.6rem 0" }} />
                    {navItem("you", "You", <Icon name="you" />)}
                    {navItem("history", "History", <Icon name="history" />)}
                    {navItem("liked", "Liked Videos", <Icon name="like" />)}
                    {navItem("myVideos", "Your Videos", <Icon name="video" />)}
                    {navItem("playlists", "Playlists", <Icon name="playlist" />)}
                    <hr style={{ border: "none", borderTop: `1px solid ${border}`, margin: "0.6rem 0" }} />
                    {navItem("tweets", "Tweets", <Icon name="tweet" />)}
                    {navItem("settings", "Settings", <Icon name="settings" />)}
                </aside>

                <main>
                    {error ? <div style={{ marginBottom: "0.8rem", border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", padding: "0.65rem" }}>{error}</div> : null}
                    {section === "home" ? (
                        <section>
                            <h2 style={{ marginTop: 0 }}>Home</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                {filteredVideos.map((v) => {
                                    const creator = creatorProfiles[v?.owner?.username] || null;
                                    const chId = creator?._id;
                                    const isLiked = likedIds.has(v?._id);
                                    const isSub = chId ? subscribedIds.has(chId) : false;
                                    return (
                                        <article key={v?._id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden" }}>
                                            <button
                                                onClick={() => navigate(`/watch/${v?._id}`, { state: { video: v, creator } })}
                                                style={{ width: "100%", border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
                                            >
                                                <div style={{ width: "100%", aspectRatio: "16/9", background: panel, backgroundImage: v?.thumbnail ? `url(${v.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                            </button>
                                            <div style={{ padding: "0.72rem" }}>
                                                <div style={{ display: "flex", gap: "0.55rem" }}>
                                                    <button onClick={() => openChannel(creator)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
                                                        <img src={creator?.avatar || logoUrl} alt="creator" style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                                    </button>
                                                    <div style={{ cursor: "pointer" }} onClick={() => openChannel(creator)}>
                                                        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{v?.title || "Untitled video"}</h3>
                                                        <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.8rem" }}>@{v?.owner?.username || "channel"}</p>
                                                        <p style={{ margin: "0.2rem 0 0", color: muted, fontSize: "0.75rem" }}>{formatViews(v?.views)} - {formatDate(v?.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                                    <button onClick={() => toggleLike(v?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.32rem 0.55rem", background: isLiked ? "#dcfce7" : panel, color: isLiked ? "#166534" : text, cursor: "pointer", fontSize: "0.77rem" }}>{isLiked ? "Liked" : "Like"}</button>
                                                    {chId ? <button onClick={() => toggleSubscribe(chId)} style={{ border: "none", borderRadius: "8px", padding: "0.32rem 0.55rem", background: isSub ? "#dbeafe" : panel, color: isSub ? "#1d4ed8" : text, cursor: "pointer", fontSize: "0.77rem" }}>{isSub ? "Subscribed" : "Subscribe"}</button> : null}
                                                    <button onClick={() => openPlaylistPicker(v)} style={{ border: "none", borderRadius: "8px", padding: "0.32rem 0.55rem", background: panel, color: text, cursor: "pointer", fontSize: "0.77rem" }}>Add to Playlist</button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ) : null}

                    {section === "subs" ? (
                        <section>
                            <h2 style={{ marginTop: 0 }}>Subscriptions</h2>
                            <div style={{ display: "grid", gap: "0.7rem" }}>
                                {subscribedChannels.map((s) => (
                                    <button key={s?._id} onClick={() => openChannel(s?.channel)} style={{ border: `1px solid ${border}`, borderRadius: "10px", background: card, color: text, cursor: "pointer", padding: "0.65rem", display: "flex", gap: "0.6rem", alignItems: "center", textAlign: "left" }}>
                                        <img src={s?.channel?.avatar || logoUrl} alt="channel" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700 }}>{s?.channel?.fullName || "Channel"}</p>
                                            <p style={{ margin: "0.2rem 0 0", color: muted, fontSize: "0.8rem" }}>@{s?.channel?.username || "username"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {section === "channel" ? (
                        <section>
                            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "0.9rem" }}>
                                <div style={{ width: "100%", height: "180px", background: panel, backgroundImage: selectedChannel?.coverImage ? `url(${selectedChannel.coverImage})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                <div style={{ padding: "0.8rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                    <img src={selectedChannel?.avatar || logoUrl} alt="channel" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                    <div>
                                        <h2 style={{ margin: 0 }}>{selectedChannel?.fullName || "Channel"}</h2>
                                        <p style={{ margin: "0.25rem 0 0", color: muted }}>@{selectedChannel?.username || "channel"} - {channelSubsCount} subscribers</p>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ marginTop: 0 }}>Videos</h3>
                            {channelLoading ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                                    {Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={`c-${idx}`} />)}
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                                    {channelVideos.map((v) => (
                                        <article key={v?._id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden" }}>
                                            <button onClick={() => navigate(`/watch/${v?._id}`, { state: { video: v, creator: selectedChannel } })} style={{ width: "100%", border: "none", padding: 0, background: "transparent", cursor: "pointer" }}>
                                                <div style={{ width: "100%", aspectRatio: "16/9", background: panel, backgroundImage: v?.thumbnail ? `url(${v.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                            </button>
                                            <div style={{ padding: "0.7rem" }}>
                                                <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{v?.title || "Untitled video"}</h3>
                                                <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.8rem" }}>{formatViews(v?.views)} - {formatDate(v?.createdAt)}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            <h3 style={{ marginTop: 0 }}>Tweets</h3>
                            <div style={{ display: "grid", gap: "0.6rem" }}>
                                {channelTweets.map((t) => (
                                    <div key={t?._id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.65rem" }}>
                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <img src={t?.owner?.avatar || selectedChannel?.avatar || logoUrl} alt="owner" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{t?.owner?.fullName || selectedChannel?.fullName || "Creator"}</span>
                                        </div>
                                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{t?.content || ""}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {(section === "you" || section === "myVideos") ? (
                        <section>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                                <h2 style={{ marginTop: 0, marginBottom: 0 }}>Your Channel</h2>
                                <select value={sortMine} onChange={(e) => setSortMine(e.target.value)} style={{ border: `1px solid ${border}`, borderRadius: "8px", padding: "0.45rem 0.6rem", background: card, color: text }}>
                                    <option value="latest">Latest</option>
                                    <option value="oldest">Oldest</option>
                                </select>
                            </div>

                            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "0.8rem" }}>
                                <div style={{ width: "100%", height: "170px", background: panel, backgroundImage: user?.coverImage ? `url(${user.coverImage})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                <div style={{ padding: "0.8rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                    <img src={user?.avatar || logoUrl} alt="me" style={{ width: "68px", height: "68px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{user?.fullName || "User"}</p>
                                        <p style={{ margin: "0.2rem 0 0", color: muted }}>@{user?.username || "username"} - {stats.totalSubscribers || 0} subscribers</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.7rem", margin: "0.8rem 0" }}>
                                {[ ["Total Videos", stats.totalVideo], ["Total Views", stats.totalViews], ["Subscribers", stats.totalSubscribers], ["Likes", stats.totalLikes] ].map(([k, v]) => (
                                    <div key={k} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem" }}>
                                        <p style={{ margin: 0, color: muted, fontSize: "0.8rem" }}>{k}</p>
                                        <h3 style={{ margin: "0.3rem 0 0" }}>{v || 0}</h3>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "grid", gap: "0.75rem" }}>
                                {sortedMine.map((v) => (
                                    <div key={v?._id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.72rem", display: "grid", gridTemplateColumns: mobile ? "1fr" : "140px 1fr auto", gap: "0.7rem" }}>
                                        <button onClick={() => navigate(`/watch/${v?._id}`, { state: { video: v } })} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
                                            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "8px", background: panel, backgroundImage: v?.thumbnail ? `url(${v.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                        </button>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{v?.title || "Untitled video"}</h3>
                                            <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.8rem" }}>{v?.description || "No description"}</p>
                                            <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.78rem" }}>{formatViews(v?.views)} - {formatDate(v?.createdAt)}</p>
                                        </div>
                                        <div style={{ display: "grid", gap: "0.4rem" }}>
                                            <button onClick={() => openEditVideo(v)} style={{ border: "none", borderRadius: "8px", padding: "0.38rem 0.55rem", background: panel, color: text, cursor: "pointer" }}>Edit</button>
                                            <button onClick={() => togglePublish(v?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.38rem 0.55rem", background: v?.isPublished ? "#dcfce7" : "#fee2e2", color: v?.isPublished ? "#166534" : "#991b1b", cursor: "pointer" }}>{v?.isPublished ? "Published" : "Unpublished"}</button>
                                            <button onClick={() => deleteVideo(v?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.38rem 0.55rem", background: "#fecaca", color: "#7f1d1d", cursor: "pointer" }}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {section === "history" ? (
                        <section><h2 style={{ marginTop: 0 }}>History</h2><div style={{ display: "grid", gap: "0.65rem" }}>{history.map((v) => (<button key={v?._id} onClick={() => navigate(`/watch/${v?._id}`, { state: { video: v } })} style={{ border: `1px solid ${border}`, borderRadius: "10px", background: card, color: text, cursor: "pointer", padding: "0.6rem", display: "grid", gridTemplateColumns: mobile ? "1fr" : "130px 1fr", gap: "0.7rem", textAlign: "left" }}><div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "8px", background: panel, backgroundImage: v?.thumbnail ? `url(${v.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} /><div><p style={{ margin: 0, fontWeight: 700 }}>{v?.title || "Untitled video"}</p><p style={{ margin: "0.24rem 0 0", color: muted, fontSize: "0.8rem" }}>{v?.owner?.fullname || v?.owner?.username || "Unknown"}</p></div></button>))}</div></section>
                    ) : null}

                    {section === "liked" ? (
                        <section><h2 style={{ marginTop: 0 }}>Liked Videos</h2><div style={{ display: "grid", gap: "0.65rem" }}>{likedVideos.map((l) => (<button key={l?._id} onClick={() => navigate(`/watch/${l?.video?._id}`, { state: { video: l?.video } })} style={{ border: `1px solid ${border}`, borderRadius: "10px", background: card, color: text, cursor: "pointer", padding: "0.6rem", display: "grid", gridTemplateColumns: mobile ? "1fr" : "130px 1fr", gap: "0.7rem", textAlign: "left" }}><div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "8px", background: panel, backgroundImage: l?.video?.thumbnail ? `url(${l.video.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} /><div><p style={{ margin: 0, fontWeight: 700 }}>{l?.video?.title || "Untitled video"}</p><p style={{ margin: "0.24rem 0 0", color: muted, fontSize: "0.8rem" }}>@{l?.video?.owner?.username || "channel"}</p></div></button>))}</div></section>
                    ) : null}
                    {section === "playlists" ? (
                        <section>
                            <h2 style={{ marginTop: 0 }}>Playlists</h2>
                            <form onSubmit={createPlaylist} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem", marginBottom: "0.7rem" }}>
                                <input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="Playlist name" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                <input value={playlistDesc} onChange={(e) => setPlaylistDesc(e.target.value)} placeholder="Description" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                <button type="submit" style={{ border: "none", borderRadius: "8px", padding: "0.45rem 0.7rem", background: active, color: "#fff", cursor: "pointer" }}>Create</button>
                            </form>
                            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "0.8rem" }}>
                                {playlists.map((p) => (
                                    <button key={p?._id} onClick={() => openPlaylist(p)} style={{ border: `1px solid ${border}`, borderRadius: "10px", background: card, color: text, cursor: "pointer", padding: "0.65rem", textAlign: "left" }}>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{p?.name || "Playlist"}</p>
                                        <p style={{ margin: "0.24rem 0 0", color: muted, fontSize: "0.8rem" }}>{p?.description || "No description"}</p>
                                    </button>
                                ))}
                            </div>

                            {selectedPlaylist?._id ? (
                                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem" }}>
                                    <h3 style={{ marginTop: 0 }}>{selectedPlaylist?.name} Videos</h3>
                                    {playlistLoading ? (
                                        <div style={{ display: "grid", gap: "0.6rem" }}>
                                            {Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="skeleton" style={{ height: "68px", borderRadius: "8px", background: panel }} />)}
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gap: "0.6rem" }}>
                                            {playlistVideos.map((v, idx) => (
                                                <button key={v?._id} onClick={() => navigate(`/watch/${v?._id}`, { state: { video: v, playlistVideos } })} style={{ border: `1px solid ${border}`, borderRadius: "8px", background: panel, color: text, cursor: "pointer", padding: "0.55rem", display: "grid", gridTemplateColumns: "32px 100px 1fr", gap: "0.55rem", alignItems: "center", textAlign: "left" }}>
                                                    <strong>{idx + 1}</strong>
                                                    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "6px", background: card, backgroundImage: v?.thumbnail ? `url(${v.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 700 }}>{v?.title || "Untitled video"}</p>
                                                        <p style={{ margin: "0.2rem 0 0", color: muted, fontSize: "0.78rem" }}>{formatViews(v?.views)}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </section>
                    ) : null}

                    {section === "tweets" ? (
                        <section>
                            <h2 style={{ marginTop: 0 }}>Tweets</h2>
                            <form onSubmit={postTweet} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem", marginBottom: "0.7rem" }}>
                                <textarea value={tweetInput} onChange={(e) => setTweetInput(e.target.value)} rows={3} placeholder="Post something..." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                <button type="submit" style={{ border: "none", borderRadius: "8px", padding: "0.45rem 0.7rem", background: active, color: "#fff", cursor: "pointer" }}>Post</button>
                            </form>
                            <div style={{ display: "grid", gap: "0.6rem" }}>
                                {tweets.map((t) => (
                                    <div key={t?._id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.65rem" }}>
                                        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <img src={t?.owner?.avatar || user?.avatar || logoUrl} alt="owner" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", background: panel }} />
                                            <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>{t?.owner?.fullName || user?.fullName || "Creator"}</span>
                                        </div>
                                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{t?.content || ""}</p>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", alignItems: "center", gap: "0.4rem" }}>
                                            <span style={{ color: muted, fontSize: "0.78rem" }}>{formatDate(t?.createdAt)}</span>
                                            <div style={{ display: "flex", gap: "0.35rem" }}>
                                                <button onClick={() => toggleTweetLike(t?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.3rem 0.55rem", background: tweetLiked[t?._id] ? "#dcfce7" : panel, color: tweetLiked[t?._id] ? "#166534" : text, cursor: "pointer" }}>
                                                    {tweetLiked[t?._id] ? "Liked" : "Like"}
                                                </button>
                                                {isOwnTweet(t) ? (
                                                    <button onClick={() => removeTweet(t?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.3rem 0.55rem", background: "#fecaca", color: "#7f1d1d", cursor: "pointer" }}>Delete</button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {section === "settings" ? (
                        <section>
                            <h2 style={{ marginTop: 0 }}>Settings</h2>
                            <div style={{ display: "grid", gap: "0.8rem" }}>
                                <form onSubmit={updateAccount} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem" }}>
                                    <h3 style={{ marginTop: 0 }}>Profile</h3>
                                    <input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Full name" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                    <input value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} placeholder="Email" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                    <button type="submit" style={{ border: "none", borderRadius: "8px", padding: "0.42rem 0.65rem", background: active, color: "#fff", cursor: "pointer" }}>Save Profile</button>
                                </form>

                                <form onSubmit={changePassword} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.7rem" }}>
                                    <h3 style={{ marginTop: 0 }}>Security</h3>
                                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Old password" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }} />
                                    <button type="submit" style={{ border: "none", borderRadius: "8px", padding: "0.42rem 0.65rem", background: active, color: "#fff", cursor: "pointer", marginRight: "0.5rem" }}>Change Password</button>
                                    <button type="button" onClick={logout} style={{ border: "none", borderRadius: "8px", padding: "0.42rem 0.65rem", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Sign out</button>
                                </form>
                            </div>
                        </section>
                    ) : null}
                </main>
            </div>

            {playlistPicker.open ? (
                <div onClick={closePlaylistPicker} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 32, padding: "1rem" }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "1rem" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Add to Playlist</h3>
                        <p style={{ margin: 0, color: muted, fontSize: "0.9rem" }}>
                            {playlistPicker?.video?.title || "Selected video"}
                        </p>

                        <div style={{ marginTop: "0.8rem", marginBottom: "0.8rem" }}>
                            <p style={{ margin: "0 0 0.45rem", fontWeight: 700, fontSize: "0.88rem" }}>Choose existing playlist</p>
                            <div style={{ display: "grid", gap: "0.5rem", maxHeight: "190px", overflowY: "auto", paddingRight: "0.2rem" }}>
                                {playlists.length ? playlists.map((p) => (
                                    <button
                                        key={p?._id}
                                        onClick={() => addVideoToExistingPlaylist(p?._id)}
                                        disabled={playlistPickerLoading}
                                        style={{ border: `1px solid ${border}`, borderRadius: "9px", background: panel, color: text, cursor: "pointer", padding: "0.55rem", textAlign: "left" }}
                                    >
                                        <p style={{ margin: 0, fontWeight: 700 }}>{p?.name || "Playlist"}</p>
                                        <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.78rem" }}>{p?.description || "No description"}</p>
                                    </button>
                                )) : (
                                    <div style={{ border: `1px solid ${border}`, borderRadius: "9px", background: panel, color: muted, padding: "0.55rem" }}>
                                        No playlist yet. Create one below.
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={createPlaylistAndAddVideo} style={{ borderTop: `1px solid ${border}`, paddingTop: "0.8rem" }}>
                            <p style={{ margin: "0 0 0.45rem", fontWeight: 700, fontSize: "0.88rem" }}>Or create new playlist</p>
                            <input
                                value={pickerPlaylistName}
                                onChange={(e) => setPickerPlaylistName(e.target.value)}
                                placeholder="Playlist name"
                                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.45rem" }}
                            />
                            <input
                                value={pickerPlaylistDesc}
                                onChange={(e) => setPickerPlaylistDesc(e.target.value)}
                                placeholder="Description (optional)"
                                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.5rem", background: panel, color: text, outline: "none", marginBottom: "0.55rem" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                <button type="button" onClick={closePlaylistPicker} disabled={playlistPickerLoading} style={{ border: `1px solid ${border}`, borderRadius: "8px", padding: "0.42rem 0.65rem", background: panel, color: text, cursor: "pointer" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={playlistPickerLoading} style={{ border: "none", borderRadius: "8px", padding: "0.42rem 0.65rem", background: active, color: "#fff", cursor: "pointer" }}>
                                    {playlistPickerLoading ? "Saving..." : "Create & Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {snackbar.open ? (
                <div style={{ position: "fixed", left: "50%", bottom: "1.1rem", transform: "translateX(-50%)", zIndex: 40, background: snackBg, color: "#fff", padding: "0.62rem 0.9rem", borderRadius: "10px", fontWeight: 700, boxShadow: "0 14px 30px rgba(0,0,0,0.25)" }}>
                    {snackbar.message}
                </div>
            ) : null}

            {showUpload ? (
                <div onClick={() => setShowUpload(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 30, padding: "1rem" }}>
                    <form onSubmit={uploadVideo} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "540px", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "1rem" }}>
                        <h3 style={{ marginTop: 0 }}>Create Video</h3>
                        <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Title" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel, color: text, outline: "none", marginBottom: "0.5rem" }} />
                        <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Description" rows={3} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel, color: text, outline: "none", marginBottom: "0.5rem" }} />
                        <label style={{ display: "block", marginBottom: "0.35rem", color: muted }}>Video File</label>
                        <input type="file" accept="video/*" onChange={(e) => setUploadVideoFile(e.target.files?.[0] || null)} style={{ marginBottom: "0.55rem" }} />
                        <label style={{ display: "block", marginBottom: "0.35rem", color: muted }}>Thumbnail (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setUploadThumbnail(e.target.files?.[0] || null)} style={{ marginBottom: "0.75rem" }} />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowUpload(false)} style={{ border: `1px solid ${border}`, borderRadius: "8px", padding: "0.45rem 0.7rem", background: panel, color: text, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={uploadLoading} style={{ border: "none", borderRadius: "8px", padding: "0.45rem 0.7rem", background: active, color: "#fff", cursor: "pointer" }}>
                                {uploadLoading ? "Uploading..." : "Upload"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {editingVideo ? (
                <div onClick={() => setEditingVideo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 31, padding: "1rem" }}>
                    <form onSubmit={saveEditVideo} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "1rem" }}>
                        <h3 style={{ marginTop: 0 }}>Edit Video</h3>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel, color: text, outline: "none", marginBottom: "0.5rem" }} />
                        <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={3} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel, color: text, outline: "none", marginBottom: "0.5rem" }} />
                        <label style={{ display: "block", marginBottom: "0.3rem", color: muted }}>New Thumbnail (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setEditThumbnail(e.target.files?.[0] || null)} style={{ marginBottom: "0.7rem" }} />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setEditingVideo(null)} style={{ border: `1px solid ${border}`, borderRadius: "8px", padding: "0.45rem 0.7rem", background: panel, color: text, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={editLoading} style={{ border: "none", borderRadius: "8px", padding: "0.45rem 0.7rem", background: active, color: "#fff", cursor: "pointer" }}>
                                {editLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
}

export default Home;

