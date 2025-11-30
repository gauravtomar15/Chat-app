import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

// Log backend URL to help with debugging (always log in production too)
console.log("🔗 Backend URL:", backendUrl);

// Warn if backend URL looks like Vercel (which doesn't support WebSockets)
if (backendUrl.includes('vercel.app') && !backendUrl.includes('localhost')) {
  console.error("⚠️ WARNING: Backend URL appears to be a Vercel URL!");
  console.error("⚠️ Vercel does NOT support WebSocket connections!");
  console.error("⚠️ Please deploy your backend to Railway, Render, or another platform that supports WebSockets.");
  console.error("⚠️ Then update VITE_BACKEND_URL in your Vercel environment variables.");
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // check if user is authenticated
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  // login
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);

        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
        console.log(error.message)
      toast.error(error.message);
    }
  };

  // logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

// update profile
  const updateProfile = async (body)=>{
    try {
        const {data} = await axios.put("/api/auth/update-profile",body);
        if(data.success){
            setAuthUser(data.user);
            toast.success("Profile updated successfully")
        }
    } catch (error) {
        console.log(error.message)
        toast.error(error.message)
        
    }
  }


  // connect socket
  const connectSocket = (userData) => {
    if (!userData) return;
    
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    // Ensure backendUrl is properly formatted
    const socketUrl = backendUrl.replace(/\/$/, ''); // Remove trailing slash
    
    console.log("🔌 Attempting to connect Socket.io to:", socketUrl);
    console.log("🔌 User ID:", userData._id);
    
    const newSocket = io(socketUrl, {
      query: { userId: userData._id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      // Only show toast in development
      if (import.meta.env.DEV) {
        toast.success("Connected to chat server");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        type: error.type,
        description: error.description,
        backendUrl: socketUrl
      });
      
      // Check if it's a WebSocket-specific error
      if (error.message && error.message.includes("websocket")) {
        console.error("❌ WebSocket connection failed. Possible causes:");
        console.error("   1. Backend is deployed on Vercel (doesn't support WebSockets)");
        console.error("   2. Backend URL is incorrect:", socketUrl);
        console.error("   3. Backend server is not running");
        console.error("   4. CORS configuration issue");
        toast.error("WebSocket connection failed. Check console for details.");
      } else if (error.message && !error.message.includes("xhr poll error")) {
        toast.error("Connection error. Trying to reconnect...");
      }
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      // Only show toast in development
      if (import.meta.env.DEV) {
        toast.success("Reconnected to chat server");
      }
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt", attemptNumber);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Failed to reconnect after all attempts");
      toast.error("Connection failed. Please refresh the page.");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected the socket, need to manually reconnect
        newSocket.connect();
      }
    });

    // Handle errors
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log("🧪 Testing backend connection to:", backendUrl);
      const response = await axios.get("/api/status");
      console.log("✅ Backend is accessible:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
      console.error("❌ Backend URL:", backendUrl);
      console.error("❌ Make sure:");
      console.error("   1. Backend is deployed to Railway/Render (NOT Vercel)");
      console.error("   2. VITE_BACKEND_URL is set correctly in Vercel");
      console.error("   3. Backend server is running");
      toast.error("Cannot connect to backend server. Check console for details.");
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    }
    
    // Test backend connection first
    testBackendConnection().then((isConnected) => {
      if (isConnected) {
        checkAuth();
      }
    });
    
    // Cleanup function to disconnect socket on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>);
};
