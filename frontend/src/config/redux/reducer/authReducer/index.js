import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getAboutUser,
  updateProfileBio,
  loginUser,
  registerUser,
  updateProfilePictureAction,
  getAllUsers,
  sendConnectionRequest,
  cancelConnectionRequestThunk,
  getUserProfileAndBasedOnUsername,
  getConnectionRequest,
  getMyConnectionRequest,
  AcceptConnection,
} from '../../action/authAction';

const initialState = {
  user: null,
  userProfile: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  loggedIn: false,
  message: '',
  isTokenThere: false,
  profileFetch: false,
  connection: [],
  connectionRequest: [],
  all_users: [],
  all_profiles_fetched: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: () => ({ ...initialState }),
    handleLoginUser: (state) => {
      state.message = { message: 'Hello' };
    },
    emptyMessage: (state) => {
      state.message = '';
    },
    setTokenIsThere: (state) => {
      state.isTokenThere = true;
    },
    setTokenNotThere: (state) => {
      state.isTokenThere = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = { message: 'Knocking the door...' };
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = true;
        state.user = action.payload?.user || action.payload;
        state.message = { message: 'Login is successful' };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.loggedIn = false;
        state.message = { message: action.payload || 'Login failed' };
      })

      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = { message: 'Registering you...' };
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = false;
        state.message = { message: 'Registration is successful, Please login' };
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = { message: action.payload || 'Registration failed' };
      })

      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.profileFetch = true;
        state.user =
          action.payload.user ||
          action.payload?.profile?.userId ||
          action.payload;
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.all_profiles_fetched = true;
        state.all_users = action.payload?.profiles || action.payload || [];
      })

      .addCase('auth/updateProfileBio/fulfilled', (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const incomingPastWork =
          action.payload?.pastWork || action.payload?.profile?.pastWork;
        const incomingEducation =
          action.payload?.education ||
          action.payload?.profile?.education ||
          action.payload?.data?.education;

        if (incomingPastWork && Array.isArray(incomingPastWork)) {
          if (state.userProfile) state.userProfile.pastWork = incomingPastWork;
          if (state.user) state.user.pastWork = incomingPastWork;
        }

        if (incomingEducation && Array.isArray(incomingEducation)) {
          if (state.userProfile)
            state.userProfile.education = incomingEducation;
          if (state.user) state.user.education = incomingEducation;
        }
      })

      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.connectionRequest.push(action.payload.data);
        }
      })

      .addCase(cancelConnectionRequestThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = { message: 'Connection request cancelled' };

        const targetId =
          action.meta.arg?.connectionId ||
          action.meta.arg?.userId ||
          action.meta.arg;

        if (targetId) {
          if (Array.isArray(state.connectionRequest)) {
            state.connectionRequest = state.connectionRequest.filter(
              (conn) =>
                conn._id !== targetId &&
                conn.connectionId !== targetId &&
                conn.userId !== targetId,
            );
          }
          if (Array.isArray(state.connection)) {
            state.connection = state.connection.filter(
              (conn) =>
                conn._id !== targetId &&
                conn.connectionId !== targetId &&
                conn.userId !== targetId,
            );
          }
        }
      })

      .addCase(updateProfilePictureAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = { message: 'Picture uploaded successfully' };

        const incomingUser = action.payload?.user || action.payload;

        if (state.user && incomingUser) {
          const newProfile =
            incomingUser.profilePicture || incomingUser.profile_picture;
          const newCover =
            incomingUser.coverPicture || incomingUser.cover_picture;

          if (newProfile) {
            state.user.profilePicture = newProfile;
            if (state.user.userId)
              state.user.userId.profilePicture = newProfile;
          }
          if (newCover) {
            state.user.coverPicture = newCover;
            if (state.user.userId) state.user.userId.coverPicture = newCover;
          }

          state.user = {
            ...state.user,
            ...incomingUser,
            userId:
              state.user.userId && incomingUser.userId
                ? { ...state.user.userId, ...incomingUser.userId }
                : incomingUser.userId || state.user.userId,
          };
        } else if (incomingUser) {
          state.user = incomingUser;
        }
      })
      .addCase(getUserProfileAndBasedOnUsername.fulfilled, (state, action) => {
        state.userProfile = action.payload;
      })
      .addCase(getMyConnectionRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;

        const incomingData =
          action.payload?.connections ||
          action.payload?.connectionRequest ||
          action.payload ||
          [];

        if (Array.isArray(incomingData)) {
          state.connectionRequest = incomingData.filter(
            (conn) =>
              conn.status_accepted === null ||
              conn.status === 'pending' ||
              (!conn.status_accepted && conn.status !== 'accepted'),
          );

          state.connection = incomingData.filter(
            (conn) =>
              conn.status_accepted === true ||
              conn.status === 'accepted' ||
              conn.status_accepted === 'accepted',
          );
        } else {
          state.connectionRequest = [];
          state.connection = [];
        }
      })

      .addCase(getConnectionRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConnectionRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;

        const incomingData =
          action.payload?.connections ||
          action.payload?.connectionRequest ||
          action.payload ||
          [];

        if (Array.isArray(incomingData)) {
          state.connectionRequest = incomingData.filter(
            (conn) =>
              conn.status_accepted === null ||
              conn.status_accepted === false ||
              conn.status === 'pending' ||
              (!conn.status_accepted && conn.status !== 'accepted'),
          );

          state.connection = incomingData.filter(
            (conn) =>
              conn.status_accepted === true ||
              conn.status === 'accepted' ||
              conn.status_accepted === 'accepted',
          );
        } else {
          state.connectionRequest = [];
          state.connection = [];
        }
      })

      .addCase(getConnectionRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch network connections';
      })

      .addCase(AcceptConnection.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(AcceptConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const updatedRow = action.payload?.connection || action.payload;
        if (updatedRow && updatedRow._id) {
          if (Array.isArray(state.connectionRequest)) {
            state.connectionRequest = state.connectionRequest.filter(
              (conn) => conn._id !== updatedRow._id,
            );
          }

          if (Array.isArray(state.connection)) {
            const alreadyExists = state.connection.some(
              (conn) => conn._id === updatedRow._id,
            );
            if (!alreadyExists) {
              const rowToPush = { ...updatedRow, status_accepted: true };
              state.connection.push(rowToPush);
            }
          }
        }
      })
      .addCase(AcceptConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to accept connection';
      });
  },
});

export const { reset, emptyMessage, setTokenIsThere, setTokenNotThere } =
  authSlice.actions;
export default authSlice.reducer;
