import api from "../config/api";

export const userService = {
  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  // Lấy tất cả users (Chỉ Admin/Manager)
  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  // Lấy user theo ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Cập nhật user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Xóa user (Chỉ Admin)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Tạo user mới
  createUser: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },
};
