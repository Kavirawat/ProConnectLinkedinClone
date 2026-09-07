import { clientServer } from '@/config';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const getAllPosts = createAsyncThunk(
  'post/getAllPosts',
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');

      const response = await clientServer.get('/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);

export const createPost = createAsyncThunk(
  'post/createPost',
  async (userData, thunkAPI) => {
    const { file, body } = userData;

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('token', token);
      formData.append('body', body);
      formData.append('media', file);

      if (file) {
        formData.append('media', file); 
      }

      const response = await clientServer.post('/post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        return thunkAPI.fulfillWithValue('Post Uploaded');
      } else {
        return thunkAPI.rejectWithValue('Post not uploaded');
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);

export const deletePost = createAsyncThunk(
  'post/deletePost',
  async (postId, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');

      const response = await clientServer.delete(`/delete_post`, {
        headers: {
          Authorization: `Bearer ${token}`,
          postId: postId,
        },
      });

      if (response.status === 200 || response.status === 201) {
        return thunkAPI.fulfillWithValue('Post Deleted');
      } else {
        return thunkAPI.rejectWithValue('Post not deleted');
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);

export const incrementLike = createAsyncThunk(
  'post/incrementLike',
  async (postId, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');

      const response = await clientServer.post(
        '/increment_post_like',
        { post_id: postId.postId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return thunkAPI.fulfillWithValue(response.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  },
);

export const getAllComments = createAsyncThunk(
  'post/getAllComments',
  async (postData, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');

      const response = await clientServer.get('/get_comments', {
        headers: {
          Authorization: `Bearer ${token}`,
          postId: postData.postId,
        },
      });

      return thunkAPI.fulfillWithValue({
        comments: response.data,
        postId: postData.postId,
      });
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);

export const postComment = createAsyncThunk(
  'post/postComment',
  async (commentData, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');

      console.log({
        postId: commentData.postId,
        body: commentData.body,
      });

      const responce = await clientServer.post(
        '/comment',
        {
          post_id: commentData.postId,
          commentBody: commentData.body,
          token: token,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            token: token,
          },
        },
      );
      return thunkAPI.fulfillWithValue(responce.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);
