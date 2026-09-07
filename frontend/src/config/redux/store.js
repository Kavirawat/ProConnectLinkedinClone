/**
 *
 * STEPS for state management
 * Submit action
 * Handle action it's reducer
 * Register here -> Reducer
 *
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReduxer";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
  },
});
