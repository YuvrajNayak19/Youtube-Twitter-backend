import axios from "axios";

const api = axios.create({
  baseURL: "https://youtube-twitter-fullstack.onrender.com/api/v1",
  withCredentials: true
});

// helper for endpoints that require authentication
export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default api;
