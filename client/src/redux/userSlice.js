import { createSlice } from "@reduxjs/toolkit";
import { user } from "../assets/data";

const initialState = {
  user: JSON.parse(window?.localStorage.getItem("user")) ?? {},
  edit: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login(state, action) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    logout(state) {
      state.user = {};
      localStorage?.removeItem("user");
    },
    updateProfile(state, action) {
      state.edit = action.payload;
    },
  },
});

export const { login, logout, updateProfile} = userSlice.actions;

export default userSlice.reducer;

// export function UserLogin(user) {
//   dispatch(userSlice.actions.login(user));
// }
// export function UpdateProfile(val) {
//   console.log("val:", val);
//   dispatch(userSlice.actions.updateProfile(val));
// }
