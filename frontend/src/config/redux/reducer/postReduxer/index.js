import { createSlice } from '@reduxjs/toolkit';
import {
  getAllComments,
  getAllPosts,
  createPost,
  deleteComment,
} from '../../action/postAction';

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
        const incomingPosts = action.payload?.posts || action.payload || [];
        state.posts = Array.isArray(incomingPosts)
          ? [...incomingPosts].sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime();
              const timeB = new Date(b.createdAt || 0).getTime();
              if (timeB !== timeA) return timeB - timeA;
              return String(b._id || '').localeCompare(String(a._id || ''));
            })
          : [];
      })
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.message = 'Creating your post...';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.message = action.payload?.message || 'Post Created successfully!';

        if (action.payload?.post) {
          const newPost = action.payload.post;
          const remainingPosts = state.posts.filter(
            (p) => String(p._id) !== String(newPost._id)
          );
          state.posts = [newPost, ...remainingPosts];
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to create post';
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
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const deletedId = action.payload?.commentId;
        if (deletedId) {
          if (Array.isArray(state.comments?.comments)) {
            state.comments.comments = state.comments.comments.filter(
              (c) => String(c._id) !== String(deletedId)
            );
          } else if (Array.isArray(state.comments)) {
            state.comments = state.comments.filter(
              (c) => String(c._id) !== String(deletedId)
            );
          }
        }
      });
  },
});

export const { resetPostId } = postSlice.actions;
export default postSlice.reducer;
