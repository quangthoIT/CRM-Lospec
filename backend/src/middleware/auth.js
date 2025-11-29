import { supabase } from "../config/database.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization (Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Xác thực token với Supabase Auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user)
      return res
        .status(401)
        .json({ message: "Invalid token or user not found." });

    // Lấy thông tin chi tiết từ bảng users
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError || !userData) {
      return res
        .status(401)
        .json({ message: "Invalid token or user not found." });
    }

    if (!userData.is_active) {
      return res.status(401).json({ message: "User is not active." });
    }
    // Gán thông tin user vào request
    req.user = userData;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
