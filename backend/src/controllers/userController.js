import { supabase } from "../config/database.js";

export const getCurrentUser = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ message: "User not found" });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUserEntry = async (req, res) => {
  try {
    const { id, email, full_name, role, phone } = req.body;
    const { data, error } = await supabase
      .from("users")
      .insert([{ id, email, full_name, role, phone }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, avatar_url, is_active } = req.body;
    const currentUserRole = req.user.role; // Role của người đang thực hiện request

    // Chỉ Admin mới được quyền đổi "role" của người khác.
    // 2. Manager/Staff update thì phải giữ nguyên role cũ
    let updateData = { full_name, phone, avatar_url, updated_at: new Date() };

    if (currentUserRole === "admin") {
      // Admin thì được update tất cả
      updateData.role = role;
      updateData.is_active = is_active;
    } else {
      // Staff/Manager tự sửa profile thì không được sửa role và trạng thái hoạt động
      // Nếu user cố tình gửi role lên, ta bỏ qua hoặc báo lỗi. Ở đây ta bỏ qua
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Update success", user: data[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Set is_active = false thay vì xóa hẳn
    const { error } = await supabase
      .from("users")
      .update({ is_active: false, updated_at: new Date() })
      .eq("id", id);

    if (error) throw error;
    res.status(200).json({ message: "User has been deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
