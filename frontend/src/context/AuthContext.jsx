import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { userService } from "../services/userService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile từ backend API
  const fetchUserProfile = async () => {
    try {
      const profile = await userService.getCurrentUser();
      return profile;
    } catch (error) {
      console.error(
        "Lỗi tìm nạp hồ sơ người dùng:",
        error.response?.data || error.message
      );
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          setUser(session.user);

          const profile = await fetchUserProfile();
          if (profile) {
            setUserProfile(profile);
          } else {
            console.warn("Không thể tìm nạp hồ sơ");
            // Không logout, chỉ set user mà không có profile
            // Để PrivateRoute xử lý
          }
        }
      } catch (error) {
        console.error("Lỗi xác thực khởi tạo:", error);
      } finally {
        if (mounted) {
          isInitializing = false;
          console.log("Xác thực khởi tạo hoàn tất.");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // Bỏ qua event trong quá trình khởi tạo
      if (isInitializing) {
        return;
      }

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile();
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Không cần fetch profile ở đây vì onAuthStateChange sẽ tự động fetch
      return data;
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      throw error;
    }
  };

  // Hàm refresh profile (dùng sau khi update)
  const refreshProfile = async () => {
    const profile = await fetchUserProfile();
    setUserProfile(profile);
    return profile;
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    refreshProfile,
    isAdmin: userProfile?.role === "admin",
    isManager: userProfile?.role === "manager",
    isStaff: userProfile?.role === "staff",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};
