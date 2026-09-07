import { createAsyncThunk } from '@reduxjs/toolkit';
import { clientServer } from '../../../index.jsx';
import axios from 'axios';
import { BASE_URL } from '../../../index.jsx';

const getAuthConfig = (extraHeaders = {}) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      ...extraHeaders,
    },
  };
};

export const loginUser = createAsyncThunk(
  'user/login',
  async (user, thunkAPI) => {
    try {
      const response = await clientServer.post('/login', {
        email: user.email,
        password: user.password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      return thunkAPI.rejectWithValue('Token missing');
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (user, thunkAPI) => {
    try {
      const response = await clientServer.post('/register', {
        username: user.username,
        name: user.name,
        email: user.email,
        password: user.password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      return thunkAPI.rejectWithValue(
        response.data?.message || 'Registration mismatch',
      );
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const updateProfilePictureAction = createAsyncThunk(
  'user/updateProfilePicture',
  async (payload, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const currentUserId = state.auth?.user?.id || state.auth?.user?._id;
      const formData = new FormData();
      if (payload.purpose === 'cover') {
        formData.append('cover_picture', payload.file);
      } else {
        formData.append('profile_picture', payload.file);
      }
      formData.append('userId', currentUserId);

      const response = await clientServer.post(
        '/update_profile_picture',
        formData,
        getAuthConfig({ 'Content-Type': 'multipart/form-data' }),
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const getAllUsers = createAsyncThunk(
  'user/getAllUsers',
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get(
        '/get_all_users',
        getAuthConfig(),
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const getAboutUser = createAsyncThunk(
  'user/getAboutUser',
  async (_, thunkAPI) => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.get('/get_user_and_profile', {
        params: { token: token },
        ...getAuthConfig(),
      });
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const sendConnectionRequest = createAsyncThunk(
  'auth/sendConnectionRequest',
  async ({ userId }, thunkAPI) => {
    try {
      const activeSessionToken =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.post(
        '/send_connection_request',
        {
          token: activeSessionToken,
          userId: userId,
          connectionId: userId,
        },
        getAuthConfig(),
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.response?.data || error.message,
      );
    }
  },
);

export const AcceptConnection = createAsyncThunk(
  'user/acceptConnection',
  async (user, thunkAPI) => {
    try {
      const activeSessionToken =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.post(
        '/accept_connection_request',
        {
          token: activeSessionToken,
          requestId: user?.connectionId,
          action_type: user?.action,
        },
        getAuthConfig(),
      );

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.response?.data || err.message,
      );
    }
  },
);

export const getConnectionRequest = createAsyncThunk(
  'user/getConnectionRequest',
  async (_, thunkAPI) => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.get('/getConnectionRequests', {
        params: { token: token },
        ...getAuthConfig(),
      });
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const getMyConnectionRequest = createAsyncThunk(
  'user/getMyConnectionRequest',
  async (_, thunkAPI) => {
    try {
      const activeSessionToken =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.get('/getConnectionRequests', {
        params: {
          token: activeSessionToken,
        },
        ...getAuthConfig(),
      });

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.response?.data || err.message,
      );
    }
  },
);

export const cancelConnectionRequestThunk = createAsyncThunk(
  'user/cancelConnectionRequest',
  async (payload, thunkAPI) => {
    try {
      const targetId = payload?.connectionId || payload?.userId;

      const state = thunkAPI.getState();
      const currentUserId =
        state.auth?.user?._id ||
        state.auth?.user?.id ||
        state.auth?.user?.user?._id;

      if (!currentUserId) {
        return thunkAPI.rejectWithValue(
          'User session nahi mila. Please login karein.',
        );
      }

      const activeSessionToken =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await clientServer.post(
        '/cancel_connection_request',
        {
          token: activeSessionToken,
          connectionId: targetId,
          senderId: currentUserId,
        },
        getAuthConfig(),
      );

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.response?.data || err.message,
      );
    }
  },
);

export const getUserProfileAndBasedOnUsername = createAsyncThunk(
  'auth/getUserProfileAndBasedOnUsername',
  async ({ username }, thunkAPI) => {
    try {
      const response = await clientServer.get(
        `/get_profile_based_on_username?username=${username}`,
        getAuthConfig(),
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const updateProfileBio = (payload) => async (dispatch) => {
  try {
    const { userId, bio, name, pastWork, education, token } = payload;

    const response = await axios.put(
      `${BASE_URL}/update-bio`,
      { userId, bio, name, pastWork, education },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
};
