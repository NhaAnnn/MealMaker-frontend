import { useState, useEffect, useCallback } from "react";
// Giả sử AuthContext cung cấp cả isLoggedIn và userId
import { useAuth } from "../components/AuthContext";

// --- Cấu hình API ---
const API_BASE_URL = "https://mealmaker-backend-production.up.railway.app/api/";
const RECIPE_PATH = "recipes"; // Đường dẫn chung cho các tuyến công thức

// --- Hàm Helper: Chọn Ngẫu Nhiên Phía Client (Giữ nguyên) ---
const getRandomItems = (arr, num) => {
  if (!arr || arr.length === 0) return [];
  if (num >= arr.length) return arr;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// --- HOOK CHÍNH: useRecipes (Đã refactor) ---
export const useRecipes = (initialRecipeId = null) => {
  const { userId, isLoggedIn, isLoading: isAuthLoading } = useAuth();

  // State cho List View
  const [recipes, setRecipes] = useState([]);

  // State cho Detail View
  const [recipeDetail, setRecipeDetail] = useState(null);
  const [isLikedDetail, setIsLikedDetail] = useState(false);

  // State chung cho API (của request gần nhất)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Hàm fetch chung để xử lý yêu cầu, bắt lỗi/trạng thái tải và xử lý phản hồi.
   * @param {string} endpoint - Phần cuối của URL (ví dụ: 'recipes' hoặc 'recipes/123')
   * @param {object} options - Cấu hình fetch (method, headers, body)
   * @returns {Promise<any>} Dữ liệu phản hồi từ API.
   */
  const apiCall = useCallback(async (endpoint, options = {}) => {
    // 1. Quản lý trạng thái loading/error chung
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, options);

      const contentType = response.headers.get("content-type");
      let data = {};
      let rawErrorText = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        rawErrorText = await response.text();
      }

      // 2. Xử lý lỗi HTTP
      if (!response.ok) {
        let errorMessage = "Đã xảy ra lỗi không xác định từ máy chủ.";
        if (data.message) {
          errorMessage = data.message;
        } else if (rawErrorText) {
          errorMessage = `Lỗi hệ thống (${response.status}). Endpoint: ${url}`;
          console.error("Phản hồi lỗi dạng HTML/Text:", rawErrorText);
        }
        throw new Error(errorMessage);
      }

      // 3. Trả về dữ liệu (Controller của bạn trả về JSON với cấu trúc { success: true, data: ... })
      return data;
    } catch (err) {
      console.error("API Call Error:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 1. HÀM TẢI DỮ LIỆU CÔNG THỨC CHUNG (QUẢN LÝ TRẠNG THÁI LIKE) ---
  const fetchAllRecipes = useCallback(
    async (limit = 0) => {
      if (isAuthLoading) return [];

      let endpoint;
      if (isLoggedIn && userId) {
        endpoint = `${RECIPE_PATH}/with-like-status/${userId}`;
      } else {
        endpoint = `${RECIPE_PATH}/`;
      }

      try {
        const data = await apiCall(endpoint, { method: "GET" }); // Sử dụng apiCall chung
        const allRecipes = data.data || [];

        setRecipes(allRecipes);

        if (limit > 0) {
          return getRandomItems(allRecipes, limit);
        }

        return allRecipes;
      } catch (err) {
        // Lỗi đã được xử lý trong apiCall, chỉ cần trả về mảng rỗng
        return [];
      }
    },
    [apiCall, isAuthLoading, isLoggedIn, userId] // Dependencies cập nhật
  );

  // --- 2. HÀM TẢI CÔNG THỨC ĐÃ THÍCH CỦA NGƯỜI DÙNG ---
  const fetchLikedRecipes = useCallback(async () => {
    if (!userId) {
      return [];
    }
    const endpoint = `${RECIPE_PATH}/liked/${userId}`;

    try {
      const data = await apiCall(endpoint, { method: "GET" });
      return data.data || [];
    } catch (err) {
      // Lỗi đã được xử lý trong apiCall
      throw err;
    }
  }, [apiCall, userId]);

  // --- 3. HÀM TẢI CHI TIẾT CÔNG THỨC THEO ID ---
  const fetchRecipeById = useCallback(
    async (recipeId) => {
      if (!recipeId) return null;

      const endpoint = `${RECIPE_PATH}/${recipeId}`;

      try {
        // 1. Tải chi tiết công thức
        const data = await apiCall(endpoint, { method: "GET" });
        const recipeData = data.data;

        setRecipeDetail(recipeData);

        let initialIsLiked = false;

        if (isLoggedIn && userId) {
          // 2. Kiểm tra chéo trạng thái Like bằng cách gọi API Liked List
          const likedList = await fetchLikedRecipes();
          initialIsLiked = likedList.some(
            (r) => r._id === recipeId || r.id === recipeId
          );
        }
        setIsLikedDetail(initialIsLiked);

        return recipeData;
      } catch (err) {
        setRecipeDetail(null);
        // Lỗi đã được xử lý trong apiCall
        throw err;
      }
    },
    [apiCall, isLoggedIn, userId, fetchLikedRecipes]
  );

  // --- 4. HÀM THỰC HIỆN LIKE/UNLIKE (Optimistic Update) ---
  const toggleLike = useCallback(
    async (recipeId, currentIsLiked) => {
      if (!userId) {
        console.error("Lỗi", "Vui lòng đăng nhập để thực hiện hành động này.");
        return;
      }

      const action = currentIsLiked ? "unlike" : "like";
      const endpoint = `${RECIPE_PATH}/${action}`;

      const body = { user_id: userId, recipe_id: recipeId };
      const headers = { "Content-Type": "application/json" };
      const options = { method: "PUT", headers, body: JSON.stringify(body) };

      const newIsLiked = !currentIsLiked;
      const countChange = newIsLiked ? 1 : -1;

      // 1. Optimistic Update (Cập nhật giao diện ngay lập tức)
      // Cập nhật List View
      setRecipes((prevRecipes) => {
        if (!Array.isArray(prevRecipes)) return [];
        return prevRecipes.map((recipe) => {
          if (recipe.id === recipeId || recipe._id === recipeId) {
            const newLikeCount = Math.max(
              0,
              (recipe.likeCount || 0) + countChange
            );
            return {
              ...recipe,
              isLiked: newIsLiked,
              liked: newIsLiked,
              likeCount: newLikeCount,
            };
          }
          return recipe;
        });
      });
      // Cập nhật Detail View
      if (
        recipeDetail &&
        (recipeDetail.id === recipeId || recipeDetail._id === recipeId)
      ) {
        const newLikeCountDetail = Math.max(
          0,
          (recipeDetail.likeCount || 0) + countChange
        );
        setRecipeDetail((prev) => ({
          ...prev,
          liked: newIsLiked,
          isLiked: newIsLiked,
          likeCount: newLikeCountDetail,
        }));
        setIsLikedDetail(newIsLiked);
      }

      // 2. Gọi API (Sử dụng apiCall, nhưng bỏ qua quản lý loading/error chung
      // vì đã có Optimistic Update, và không muốn nó ảnh hưởng đến trạng thái chung của hook)
      try {
        await apiCall(endpoint, options);
      } catch (err) {
        // 3. Revert (Hoàn nguyên trạng thái nếu có lỗi API)
        setRecipes((prevRecipes) => {
          if (!Array.isArray(prevRecipes)) return [];
          return prevRecipes.map((recipe) => {
            if (recipe.id === recipeId || recipe._id === recipeId) {
              return {
                ...recipe,
                isLiked: currentIsLiked,
                liked: currentIsLiked,
                likeCount: Math.max(0, (recipe.likeCount || 0) - countChange),
              };
            }
            return recipe;
          });
        });

        setRecipeDetail((prev) => {
          if (!prev || (prev.id !== recipeId && prev._id !== recipeId))
            return prev;
          return {
            ...prev,
            liked: currentIsLiked,
            isLiked: currentIsLiked,
            likeCount: Math.max(0, (prev.likeCount || 0) - countChange),
          };
        });
        setIsLikedDetail(currentIsLiked);

        console.error("Lỗi", `Không thể ${action} công thức: ${err.message}`);
        // Không cần throw err ở đây nếu bạn muốn Optimistic Update vẫn hoạt động
      }
    },
    [apiCall, userId, recipeDetail] // Thêm apiCall vào dependency
  );

  // --- 5. HÀM TÌM KIẾM CÔNG THỨC BẰNG NGUYÊN LIỆU (NEW) ---
  /**
   * Tìm kiếm công thức dựa trên danh sách nguyên liệu và ID người dùng.
   * @param {string[]} ingredients - Mảng các chuỗi nguyên liệu.
   * @param {number} page - Số trang (mặc định 1).
   * @param {number} size - Số lượng trên mỗi trang (mặc định 10).
   * @returns {Promise<object>} Dữ liệu trả về bao gồm { page, size, total, data: recipes }
   */
  const searchRecipesByIngredients = useCallback(
    async (ingredients = [], page = 1, size = 10) => {
      if (isAuthLoading) return { data: [], total: 0 };

      if (!userId) {
        // Không cho phép tìm kiếm nếu chưa đăng nhập (theo yêu cầu của Controller)
        console.error(
          "Lỗi",
          "Vui lòng đăng nhập để tìm kiếm theo nguyên liệu."
        );
        return { data: [], total: 0 };
      }

      const queryParams = `page=${page}&size=${size}`;
      const endpoint = `${RECIPE_PATH}/ingredients?${queryParams}`;

      const headers = { "Content-Type": "application/json" };
      const body = { user_id: userId, ingredients: ingredients };
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      };

      try {
        // apiCall đã bao gồm logic xử lý loading/error
        const data = await apiCall(endpoint, options);

        // Trả về toàn bộ response data (chứa page, size, total, data)
        return data.data || { data: [], total: 0 };
      } catch (err) {
        // Lỗi đã được xử lý trong apiCall
        return { data: [], total: 0 };
      }
    },
    [apiCall, userId, isAuthLoading]
  );

  // --- EFFECTS (Giữ nguyên) ---
  useEffect(() => {
    if (initialRecipeId && !isAuthLoading) {
      fetchRecipeById(initialRecipeId);
    }
  }, [initialRecipeId, fetchRecipeById, isAuthLoading]);

  useEffect(() => {
    if (!initialRecipeId && !isAuthLoading) {
      fetchAllRecipes();
    }
  }, [fetchAllRecipes, isAuthLoading, initialRecipeId]);

  return {
    recipes,
    isLoading,
    error,
    fetchAllRecipes,
    fetchLikedRecipes,
    fetchRecipeById,
    toggleLike,
    searchRecipesByIngredients, // Thêm hàm mới vào return

    recipe: recipeDetail,
    isLiked: isLikedDetail,
    isLoggedIn,
  };
};
