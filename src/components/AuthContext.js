import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Giả lập API, bạn sẽ thay thế bằng fetch() thật
const FAKE_API = {
  login: async (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "test" && password === "123") {
          // Backend sẽ trả về token thật
          resolve({ token: "fake-jwt-token-abc123" });
        } else {
          reject(new Error("Sai tên đăng nhập hoặc mật khẩu"));
        }
      }, 1000);
    });
  },
};

// 1. Tạo Context
export const AuthContext = createContext();

// 2. Tạo Provider (Component "bọc" cả ứng dụng)
export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Đang kiểm tra token
  const [error, setError] = useState(null); // Lưu lỗi

  // Hàm đăng nhập
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await FAKE_API.login(username, password);
      setUserToken(token);
      await AsyncStorage.setItem("userToken", token);
    } catch (e) {
      console.error(e);
      setError(e.message); // Lưu lỗi để hiển thị
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    await AsyncStorage.removeItem("userToken");
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token); // Nếu có token, set vào state
    } catch (e) {
      console.error("Lỗi khi lấy token:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy 1 lần duy nhất khi app khởi động
  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, logout, userToken, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 3. (Tiện ích) Tạo 1 hook để dễ dàng sử dụng Context
export const useAuth = () => {
  return useContext(AuthContext);
};
