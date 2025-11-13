import React, { useState, useCallback } from "react";
import { useAuth } from "../components/AuthContext";

// URL cơ sở của API, kết thúc bằng /api/
const API_BASE_URL = "https://mealmaker-backend-production.up.railway.app/api/";

// Đường dẫn chung cho các tuyến blog (ví dụ: /api/blogs)
const BLOG_PATH = "blogs";

/**
 * Custom React Hook để quản lý các lệnh gọi API liên quan đến Blog.
 * Cung cấp trạng thái loading, error, và các hàm gọi API cho các endpoint.
 */
export const useBlogAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userId, isLoggedIn, isLoading: isAuthLoading } = useAuth();

  /**
   * Hàm fetch chung để xử lý yêu cầu và bắt lỗi/trạng thái tải.
   * @param {string} endpoint - Phần cuối của URL (ví dụ: 'blogs' hoặc 'blogs/123')
   * @param {object} options - Cấu hình fetch (method, headers, body)
   * @returns {Promise<any>} Dữ liệu phản hồi từ API.
   */
  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Kết hợp API_BASE_URL và endpoint (ví dụ: .../api/blogs)
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Unknown server error or invalid response format",
        }));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      // Nếu phản hồi là thành công nhưng không có nội dung (ví dụ: 204 No Content)
      if (response.status === 204) {
        return { success: true, message: "Operation successful" };
      }

      // Controller của bạn trả về JSON với cấu trúc { success: true, ... }
      return await response.json();
    } catch (err) {
      console.error("API Call Error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- CÁC HÀM GỌI API DÀNH CHO BLOG ---

  // 1. POST /api/blogs (Tạo blog với một file)
  const createBlog = useCallback(
    (blogData, file) => {
      const formData = new FormData();
      // Controller mong đợi data là JSON string trong trường 'data'
      formData.append("data", JSON.stringify(blogData));
      formData.append("file", file); // Tên trường 'file' phải khớp với upload.single('file')

      // Tuyến đường là: BLOG_PATH + / -> blogs/
      return apiCall(`${BLOG_PATH}/`, {
        method: "POST",
        body: formData,
      });
    },
    [apiCall]
  );

  // 2. GET /api/blogs (Lấy tất cả blog có phân trang)
  const getBlogs = useCallback(
    (page, limit) => {
      // Tuyến đường là: BLOG_PATH + /?page=... -> blogs/?page=...
      let endpoint = `${BLOG_PATH}/?page=${page}&limit=${limit}&user_id=${userId}`;

      return apiCall(endpoint, {
        method: "GET",
      });
    },
    [apiCall]
  );

  // 3. GET /api/blogs/user/:user_id (Lấy blog của một user)
  const getBlogsByUser = useCallback(
    (page = 1, limit = 10) => {
      // Tuyến đường là: BLOG_PATH + /user/:user_id?page=... -> blogs/user/:user_id?page=...
      const endpoint = `${BLOG_PATH}/user/${userId}?page=${page}&limit=${limit}`;
      return apiCall(endpoint, {
        method: "GET",
      });
    },
    [apiCall]
  );

  // 4. GET /api/blogs/:id
  const getBlogById = useCallback(
    (id) => {
      // Tuyến đường là: BLOG_PATH + /:id -> blogs/:id
      return apiCall(`${BLOG_PATH}/${id}`, {
        method: "GET",
      });
    },
    [apiCall]
  );

  // 5. DELETE /api/blogs/:id
  const deleteBlog = useCallback(
    (id) => {
      // Tuyến đường là: BLOG_PATH + /:id -> blogs/:id
      return apiCall(`${BLOG_PATH}/${id}`, {
        method: "DELETE",
      });
    },
    [apiCall]
  );

  // 6. PUT /api/blogs/rating
  const createBlogRating = useCallback(
    ({ blogId, isGoodRating, score }) => {
      // Tuyến đường là: BLOG_PATH + /rating -> blogs/rating
      return apiCall(`${BLOG_PATH}/rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          blog_id: blogId,
          isGoodRating,
          score,
        }),
      });
    },
    [apiCall]
  );

  // 7. DELETE /api/blogs/rating
  const undoBlogRating = useCallback(
    ({ blogId }) => {
      // Tuyến đường là: BLOG_PATH + /rating -> blogs/rating
      return apiCall(`${BLOG_PATH}/unrating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Truyền body trong DELETE để backend xác định BlogLike cần xóa
        body: JSON.stringify({ user_id: userId, blog_id: blogId }),
      });
    },
    [apiCall]
  );

  // 8. LIKE
  const blogLike = useCallback(
    ({ blogId, is_liked }) => {
      return apiCall(`${BLOG_PATH}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          user_id: userId,
          blog_id: blogId,
          is_liked: is_liked,
        }),
      });
    },
    [apiCall]
  );

  const getLikedBlogs = useCallback(
    (page = 1, limit = 10) => {
      // Tuyến đường là: BLOG_PATH + /user/:user_id?page=... -> blogs/user/:user_id?page=...
      const endpoint = `${BLOG_PATH}/user/${userId}/liked/?page=${page}&limit=${limit}`;
      return apiCall(endpoint, {
        method: "GET",
      });
    },
    [apiCall]
  );

  // 8. PUT /api/blogs/json (Tạo nhiều blog từ JSON)
  const createAllBlogFromJson = useCallback(() => {
    // Tuyến đường là: BLOG_PATH + /json -> blogs/json
    return apiCall(`${BLOG_PATH}/json`, {
      method: "PUT",
    });
  }, [apiCall]);

  return {
    loading,
    error,
    createBlog,
    getBlogs,
    getBlogById,
    getBlogsByUser,
    deleteBlog,
    createBlogRating,
    undoBlogRating,
    blogLike,
    getLikedBlogs,
    createAllBlogFromJson,
  };
};
