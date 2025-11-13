import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Tạo Context
const AuthContext = createContext();

// --- Cấu hình API ---
const API_URL = "https://mealmaker-backend-production.up.railway.app/api/";
const USER_ID_KEY = "@user_id"; // Khóa lưu trữ
const USER_PATH = "users"; // Endpoint lấy dữ liệu chi tiết

// 2. Tạo Hook sử dụng Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 3. Tạo Provider
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedHabits, setHasCompletedHabits] = useState(false); // Đặt mặc định là FALSE
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  // --- Hàm xử lý Phản hồi API chung ---
  const processResponse = useCallback(async (response, url) => {
    const contentType = response.headers.get("content-type");
    let data = {};
    let rawErrorText = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      rawErrorText = await response.text();
    }

    if (!response.ok) {
      let errorMessage = "Đã xảy ra lỗi không xác định từ máy chủ.";
      if (data.message) {
        errorMessage = data.message;
      } else if (rawErrorText) {
        errorMessage = `Lỗi hệ thống (${response.status}). Endpoint sai: ${url}`;
        console.error("Phản hồi lỗi dạng HTML/Text:", rawErrorText);
      }
      throw new Error(errorMessage);
    }
    return data;
  }, []);

  // --- Hàm Lưu/Xóa ID khỏi AsyncStorage (Giữ nguyên) ---
  const saveUserIdToStorage = useCallback(async (id) => {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, id);
    } catch (e) {
      console.error("Lỗi khi lưu userId vào AsyncStorage:", e);
    }
  }, []);

  const removeUserIdFromStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_ID_KEY);
    } catch (e) {
      console.error("Lỗi khi xóa userId khỏi AsyncStorage:", e);
    }
  }, []);

  // --- Hàm kiểm tra tính hợp lệ của ai_profile (Logic mới) ---
  const checkAiProfileCompletion = useCallback((userObject) => {
    const aiProfile = userObject?.ai_profile;
    // Hồ sơ được coi là hoàn thành nếu có ai_profile VÀ có ít nhất 1 khu vực HOẶC cấp độ kỹ năng > 0
    return (
      aiProfile &&
      (aiProfile.region?.length > 0 || aiProfile.cooking_skill_level > 0)
    );
  }, []);

  // --- HÀM FETCH DỮ LIỆU USER CHI TIẾT THEO ID (ĐÃ SỬA LOGIC KIỂM TRA) ---
  const fetchUserData = useCallback(
    async (id) => {
      if (!id) return;

      const url = `${API_URL}${USER_PATH}/${id}`;

      try {
        const response = await fetch(url);
        const apiResponse = await processResponse(response, url);

        const userObject = apiResponse.data || apiResponse; // Cập nhật state chi tiết người dùng

        setUserData(userObject);
        console.log(userObject);
        // --- LOGIC MỚI: KIỂM TRA SỰ TỒN TẠI VÀ HỢP LỆ CỦA AI_PROFILE ---
        const isProfileValid = checkAiProfileCompletion(userObject);
        setHasCompletedHabits(isProfileValid);
        // -------------------------------------------------------------
        console.log(
          "Fetch dữ liệu người dùng thành công. Habit completed:",
          isProfileValid
        );
        return userObject;
      } catch (error) {
        console.error(
          "Lỗi khi fetch dữ liệu người dùng chi tiết:",
          error.message
        );
        throw error;
      }
    },
    [processResponse, checkAiProfileCompletion] // Thêm dependency checkAiProfileCompletion
  );

  // --- Hàm Tải Trạng Thái Ban Đầu (useEffect) ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
        if (storedUserId) {
          setUserId(storedUserId);
          setIsLoggedIn(true);
          // GỌI: Lấy dữ liệu user chi tiết ngay sau khi tải ID
          await fetchUserData(storedUserId);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu AsyncStorage hoặc fetch:", e);
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    };

    loadInitialData();
  }, [fetchUserData]);

  // ----------------------------------------------------
  // Đăng nhập (Đã thêm fetchUserData)
  const signIn = useCallback(
    async (user_name, password) => {
      setIsLoading(true);
      setUserData(null);
      const endpoint = "users/login";
      const url = `${API_URL}${endpoint}`;

      const config = {
        // Thêm cấu hình fetch bị thiếu trong code gốc để hoàn thiện
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name, password }),
      };

      try {
        const response = await fetch(url, config);
        const apiResponse = await processResponse(response, url);
        const userDataResponse = apiResponse.data || apiResponse;
        const id = userDataResponse.id || userDataResponse._id;

        if (!id) {
          throw new Error("Không tìm thấy ID người dùng trong phản hồi.");
        }

        setUserId(id);
        await saveUserIdToStorage(id);
        setIsLoggedIn(true);

        // GỌI: Lấy dữ liệu user chi tiết ngay sau khi đăng nhập
        await fetchUserData(id);

        console.log("Đăng nhập thành công.");
      } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        Alert.alert("Lỗi Đăng nhập", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      processResponse,
      saveUserIdToStorage,
      // removeUserIdFromStorage, // Không cần thiết cho signIn
      fetchUserData,
    ]
  );

  // Đăng ký (Đã sửa setHasCompletedHabits mặc định là false)
  const signUp = useCallback(
    async (user_name, full_name, password) => {
      setIsLoading(true);
      setUserData(null);

      const endpoint = "users/";
      const url = `${API_URL}${endpoint}`;

      // 🛑 LỖI ĐÃ SỬA: Phải khởi tạo FormData trước khi sử dụng
      const formData = new FormData();

      // 1. Tạo đối tượng JSON chứa dữ liệu người dùng
      const dataObject = {
        user_name: user_name,
        full_name: full_name,
        password: password,
      };

      // Chuyển đối tượng data thành chuỗi JSON
      const dataJson = JSON.stringify(dataObject);

      // 2. Thêm chuỗi JSON vào khóa "data" của FormData
      formData.append("data", dataJson);

      const config = {
        method: "POST",
        // Headers Content-Type được tự động đặt là multipart/form-data
        // khi dùng FormData.
        body: formData,
      };

      try {
        const response = await fetch(url, config);

        const apiResponse = await processResponse(response, url);
        const userDataResponse = apiResponse.data || apiResponse;
        const id = userDataResponse.id || userDataResponse._id;

        if (!id) {
          throw new Error("Không tìm thấy ID người dùng trong phản hồi.");
        }

        setUserId(id);
        await saveUserIdToStorage(id);
        setIsLoggedIn(true);

        setUserData(userDataResponse);
        setHasCompletedHabits(false); // <--- ĐẶT LẠI LÀ FALSE CHO USER MỚI

        console.log("Đăng ký thành công.");
      } catch (error) {
        console.error("Lỗi đăng ký:", error.message);
        Alert.alert("Lỗi Đăng ký", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [processResponse, saveUserIdToStorage]
  );

  // Đăng xuất (Đã sửa setHasCompletedHabits mặc định là false)
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setIsLoggedIn(false);
    setHasCompletedHabits(false); // <--- ĐẶT LẠI LÀ FALSE ĐỂ KHI LOGIN LẠI CŨNG CHECK TỪ ĐẦU
    setUserId(null);
    setUserData(null);
    await removeUserIdFromStorage();
    setIsLoading(false);
  }, [removeUserIdFromStorage]);

  const value = {
    isLoggedIn,
    isLoading,
    hasCompletedHabits,
    userId,
    userData,

    setIsLoading,
    setHasCompletedHabits,
    processResponse,
    fetchUserData, // Cần thiết cho useUserUpdateAPI

    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
