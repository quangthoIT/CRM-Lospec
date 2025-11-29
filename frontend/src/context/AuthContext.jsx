import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase"; // Đường dẫn tới file config supabase của bạn ở frontend

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User của Supabase Auth
  const [userProfile, setUserProfile] = useState(null); // User Info từ bảng users
  const [loading, setLoading] = useState(true);

  // Hàm lấy profile từ bảng .users
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Lỗi lấy thông tin user:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("Lỗi lấy thông tin user:", err);
      return null;
    }
  };

  useEffect(() => {
    // Kiểm tra session hiện tại khi load trang
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }
      setLoading(false);
    };

    checkSession();

    // Đăng nhập/Đăng xuất
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Chỉ fetch lại nếu chưa có profile hoặc user thay đổi
        if (!userProfile || userProfile.id !== session.user.id) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
      } else {
        // Nếu logout
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hàm đăng nhập
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // Hàm đăng xuất
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user, // Thông tin Auth (email, id)
    userProfile, // Thông tin chi tiết (role, full_name, avatar...)
    loading,
    login,
    logout,
    isAdmin: userProfile?.role === "admin", // Helper check nhanh
    isManager: userProfile?.role === "manager", // Helper check nhanh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook để dùng ở mọi nơi
export const useAuth = () => useContext(AuthContext);
