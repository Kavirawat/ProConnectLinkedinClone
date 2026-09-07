import { createSlice } from '@reduxjs/toolkit';
import { getAllComments, getAllPosts } from '../../action/postAction';

const initialState = {
  posts: [],
  isError: false,
  postFetch: false,
  isLoading: false,
  LoggedIn: false,
  message: '',
  comments: [],
  postId: '',
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    reset: () => initialState,
    resetPostId: (state) => {
      state.postId = '';
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPosts.pending, (state) => {
        state.isLoading = true;
        state.message = 'fetching all the posts...';
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.postFetch = true;
        state.posts = action.payload.posts.reverse();
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message =
          action.payload || action.error.message || 'Failed to fetch posts';
      })
      .addCase(getAllComments.fulfilled, (state, action) => {
        state.postId = action.payload.postId || '';
        state.comments = action.payload.comments;
      });
  },
});

export const { resetPostId } = postSlice.actions;
export default postSlice.reducer;
