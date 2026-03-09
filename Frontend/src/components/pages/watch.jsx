import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api, { authHeaders } from "../services/api.js";

function Watch({ isDarkMode, onToggleTheme }) {
    const { videoId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const bg = isDarkMode ? "#0f172a" : "#f9fafb";
    const card = isDarkMode ? "#111827" : "#ffffff";
    const panel = isDarkMode ? "#0b1220" : "#f8fafc";
    const text = isDarkMode ? "#f9fafb" : "#111827";
    const muted = isDarkMode ? "#cbd5e1" : "#6b7280";
    const border = isDarkMode ? "#334155" : "#e5e7eb";

    const [video, setVideo] = useState(location.state?.video || null);
    const [creator, setCreator] = useState(location.state?.creator || null);
    const [suggested, setSuggested] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState("");
    const [replyOpen, setReplyOpen] = useState({});
    const [replyText, setReplyText] = useState({});
    const [likedComments, setLikedComments] = useState({});
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showDesc, setShowDesc] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
    const formatViews = (n) => {
        const v = Number(n || 0);
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M views`;
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K views`;
        return `${v} views`;
    };

    const fetchAll = async () => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");
        setLoading(true);
        try {
            const [vRes, likeRes, cRes, feedRes, meRes] = await Promise.all([
                api.get(`/videos/${videoId}`, { headers: authHeaders() }),
                api.get("/likes/videos", { headers: authHeaders() }),
                api.get(`/comments/${videoId}`, { headers: authHeaders() }),
                api.get("/videos?limit=20&sortBy=createdAt&sortType=desc", { headers: authHeaders() }),
                api.get("/users/current-user", { headers: authHeaders() })
            ]);

            const v = vRes?.data?.data || null;
            setVideo(v);
            setComments(Array.isArray(cRes?.data?.data) ? cRes.data.data : []);

            const orderedPlaylist = Array.isArray(location.state?.playlistVideos) ? location.state.playlistVideos : [];
            if (orderedPlaylist.length) {
                const idx = orderedPlaylist.findIndex((x) => x?._id === videoId);
                const ordered = idx >= 0
                    ? [...orderedPlaylist.slice(idx + 1), ...orderedPlaylist.slice(0, idx)]
                    : orderedPlaylist;
                setSuggested(ordered);
            } else {
                setSuggested((Array.isArray(feedRes?.data?.data) ? feedRes.data.data : []).filter((x) => x?._id !== videoId));
            }

            const liked = Array.isArray(likeRes?.data?.data) ? likeRes.data.data : [];
            setIsLiked(liked.some((item) => item?.video?._id === videoId));

            const username = location.state?.video?.owner?.username;
            if (username) {
                const profileRes = await api.get(`/users/c/${username}`, { headers: authHeaders() });
                const profile = profileRes?.data?.data || null;
                setCreator(profile);
                const me = meRes?.data?.data;
                if (profile?._id && me?._id) {
                    const subsRes = await api.get(`/subscriptions/u/${me._id}`, { headers: authHeaders() });
                    const channels = Array.isArray(subsRes?.data?.data) ? subsRes.data.data : [];
                    setIsSubscribed(channels.some((s) => s?.channel?._id === profile._id));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [videoId]);

    const toggleVideoLike = async () => {
        await api.post(`/likes/toggle/v/${videoId}`, {}, { headers: authHeaders() });
        setIsLiked((p) => !p);
        if (!isLiked && isDisliked) setIsDisliked(false);
    };

    const toggleCommentLike = async (commentId) => {
        await api.post(`/likes/toggle/c/${commentId}`, {}, { headers: authHeaders() });
        setLikedComments((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const toggleSubscribe = async () => {
        if (!creator?._id) return;
        await api.post(`/subscriptions/c/${creator._id}`, {}, { headers: authHeaders() });
        setIsSubscribed((p) => !p);
    };

    const addComment = async (e) => {
        e.preventDefault();
        if (!commentInput.trim()) return;
        await api.post(`/comments/${videoId}`, { content: commentInput.trim() }, { headers: authHeaders() });
        setCommentInput("");
        const r = await api.get(`/comments/${videoId}`, { headers: authHeaders() });
        setComments(Array.isArray(r?.data?.data) ? r.data.data : []);
    };

    const addReply = async (comment) => {
        const textValue = (replyText[comment?._id] || "").trim();
        if (!textValue) return;
        await api.post(`/comments/${videoId}`, { content: `@${comment?.owner?.username || "user"} ${textValue}` }, { headers: authHeaders() });
        setReplyText((prev) => ({ ...prev, [comment?._id]: "" }));
        setReplyOpen((prev) => ({ ...prev, [comment?._id]: false }));
        const r = await api.get(`/comments/${videoId}`, { headers: authHeaders() });
        setComments(Array.isArray(r?.data?.data) ? r.data.data : []);
    };

    const descText = useMemo(() => {
        const d = video?.description || "";
        if (showDesc) return d;
        return d.length > 220 ? `${d.slice(0, 220)}...` : d;
    }, [video?.description, showDesc]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: bg, color: text, padding: "1rem" }}>
                <style>{`@keyframes pulseFade {0%{opacity:.55}50%{opacity:1}100%{opacity:.55}} .skeleton{animation:pulseFade 1.2s ease-in-out infinite;}`}</style>
                <div className="skeleton" style={{ maxWidth: "1280px", margin: "0 auto", height: "80vh", borderRadius: "12px", background: card, border: `1px solid ${border}` }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: bg, color: text }}>
            <header style={{ position: "sticky", top: 0, zIndex: 20, background: card, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0.7rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ border: "none", background: "transparent", color: text, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" /></svg>
                        <img src="https://img.sanishtech.com/u/c3b62f10de75c9ab9af941796327957b.png" alt="logo" style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#fff" }} />
                        <strong>Youtube + Twitter</strong>
                    </button>
                    <button onClick={onToggleTheme} style={{ border: `1px solid ${border}`, borderRadius: "999px", padding: "0.4rem 0.7rem", background: panel, color: text, cursor: "pointer" }}>
                        {isDarkMode ? "\u2600\uFE0F" : "\u{1F319}"}
                    </button>
                </div>
            </header>

            {sidebarOpen ? (
                <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "280px", height: "100%", background: card, borderRight: `1px solid ${border}`, padding: "1rem" }}>
                        <button onClick={() => { navigate("/"); setSidebarOpen(false); }} style={{ width: "100%", border: "none", background: panel, color: text, borderRadius: "10px", padding: "0.6rem", textAlign: "left", cursor: "pointer", marginBottom: "0.45rem" }}>Home</button>
                        <button onClick={() => { navigate("/"); setSidebarOpen(false); }} style={{ width: "100%", border: "none", background: panel, color: text, borderRadius: "10px", padding: "0.6rem", textAlign: "left", cursor: "pointer", marginBottom: "0.45rem" }}>Subscriptions</button>
                        <button onClick={() => { navigate("/"); setSidebarOpen(false); }} style={{ width: "100%", border: "none", background: panel, color: text, borderRadius: "10px", padding: "0.6rem", textAlign: "left", cursor: "pointer", marginBottom: "0.45rem" }}>You</button>
                        <button onClick={() => { navigate("/"); setSidebarOpen(false); }} style={{ width: "100%", border: "none", background: panel, color: text, borderRadius: "10px", padding: "0.6rem", textAlign: "left", cursor: "pointer", marginBottom: "0.45rem" }}>Tweets</button>
                    </div>
                </div>
            ) : null}

            <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "1rem", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <section>
                    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "0.8rem" }}>
                        <video
                            ref={videoRef}
                            src={video?.videoFile || ""}
                            controls
                            style={{ width: "100%", borderRadius: "10px", background: "#000" }}
                            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                                const t = Number(e.target.value);
                                setCurrentTime(t);
                                if (videoRef.current) videoRef.current.currentTime = t;
                            }}
                            style={{ width: "100%", marginTop: "0.6rem" }}
                        />

                        <h2 style={{ margin: "0.7rem 0 0.45rem" }}>{video?.title || "Untitled video"}</h2>
                        <p style={{ margin: 0, color: muted, fontSize: "0.85rem" }}>{formatViews(video?.views)} - {formatDate(video?.createdAt)}</p>

                        <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                            <button onClick={toggleVideoLike} style={{ border: "none", borderRadius: "999px", padding: "0.45rem 0.8rem", background: isLiked ? "#dcfce7" : panel, color: isLiked ? "#166534" : text, cursor: "pointer" }}>
                                {isLiked ? "Liked" : "Like"}
                            </button>
                            <button onClick={() => setIsDisliked((p) => !p)} style={{ border: "none", borderRadius: "999px", padding: "0.45rem 0.8rem", background: isDisliked ? "#fee2e2" : panel, color: isDisliked ? "#991b1b" : text, cursor: "pointer" }}>
                                Dislike
                            </button>
                        </div>

                        <div style={{ marginTop: "0.8rem", border: `1px solid ${border}`, borderRadius: "10px", padding: "0.65rem", background: panel }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
                                    <img src={creator?.avatar || "https://img.sanishtech.com/u/c3b62f10de75c9ab9af941796327957b.png"} alt="creator" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>@{creator?.username || "creator"}</p>
                                        <p style={{ margin: 0, color: muted, fontSize: "0.78rem" }}>{creator?.subscriberCount || 0} subscribers</p>
                                    </div>
                                </div>
                                <button onClick={toggleSubscribe} style={{ border: "none", borderRadius: "999px", padding: "0.45rem 0.8rem", background: isSubscribed ? "#dbeafe" : "#7c3aed", color: isSubscribed ? "#1d4ed8" : "#fff", cursor: "pointer" }}>
                                    {isSubscribed ? "Subscribed" : "Subscribe"}
                                </button>
                            </div>
                            <p style={{ margin: "0.65rem 0 0", color: text }}>{descText}</p>
                            {(video?.description || "").length > 220 ? (
                                <button onClick={() => setShowDesc((p) => !p)} style={{ border: "none", background: "transparent", color: "#7c3aed", padding: 0, cursor: "pointer", marginTop: "0.35rem" }}>
                                    {showDesc ? "Show less" : "Show more"}
                                </button>
                            ) : null}
                        </div>

                        <div style={{ marginTop: "0.8rem", background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "0.65rem" }}>
                            <h3 style={{ marginTop: 0 }}>Comments ({comments.length})</h3>
                            <form onSubmit={addComment} style={{ marginBottom: "0.7rem" }}>
                                <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel, color: text, outline: "none" }} />
                            </form>
                            <div style={{ display: "grid", gap: "0.6rem" }}>
                                {comments.map((c) => (
                                    <div key={c?._id} style={{ border: `1px solid ${border}`, borderRadius: "8px", padding: "0.55rem", background: panel }}>
                                        <p style={{ margin: 0 }}>{c?.content || ""}</p>
                                        <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.78rem" }}>@{c?.owner?.username || "user"}</p>
                                        <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.35rem" }}>
                                            <button onClick={() => toggleCommentLike(c?._id)} style={{ border: "none", borderRadius: "8px", padding: "0.3rem 0.55rem", background: likedComments[c?._id] ? "#dcfce7" : card, color: likedComments[c?._id] ? "#166534" : text, cursor: "pointer" }}>
                                                {likedComments[c?._id] ? "Liked" : "Like"}
                                            </button>
                                            <button onClick={() => setReplyOpen((p) => ({ ...p, [c?._id]: !p[c?._id] }))} style={{ border: "none", borderRadius: "8px", padding: "0.3rem 0.55rem", background: card, color: text, cursor: "pointer" }}>
                                                Reply
                                            </button>
                                        </div>
                                        {replyOpen[c?._id] ? (
                                            <div style={{ marginTop: "0.45rem", display: "flex", gap: "0.35rem" }}>
                                                <input value={replyText[c?._id] || ""} onChange={(e) => setReplyText((p) => ({ ...p, [c?._id]: e.target.value }))} placeholder="Write a reply..." style={{ flex: 1, border: `1px solid ${border}`, borderRadius: "8px", padding: "0.4rem", background: card, color: text, outline: "none" }} />
                                                <button onClick={() => addReply(c)} style={{ border: "none", borderRadius: "8px", padding: "0.35rem 0.55rem", background: "#7c3aed", color: "#fff", cursor: "pointer" }}>Send</button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <aside>
                    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "0.7rem" }}>
                        <h3 style={{ marginTop: 0 }}>Suggested Videos</h3>
                        <div style={{ display: "grid", gap: "0.65rem" }}>
                            {suggested.map((s) => (
                                <button key={s?._id} onClick={() => navigate(`/watch/${s?._id}`, { state: { video: s } })} style={{ border: `1px solid ${border}`, borderRadius: "10px", background: panel, color: text, cursor: "pointer", padding: "0.5rem", display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.6rem", textAlign: "left" }}>
                                    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "8px", background: card, backgroundImage: s?.thumbnail ? `url(${s.thumbnail})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{s?.title || "Untitled video"}</p>
                                        <p style={{ margin: "0.25rem 0 0", color: muted, fontSize: "0.78rem" }}>@{s?.owner?.username || "channel"}</p>
                                        <p style={{ margin: "0.2rem 0 0", color: muted, fontSize: "0.75rem" }}>{formatViews(s?.views)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default Watch;
