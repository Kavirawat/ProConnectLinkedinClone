import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPosts,
  createPost,
  deletePost,
  incrementLike,
  getAllComments,
  postComment,
  deleteComment,
} from '../../config/redux/action/postAction/index.js';
import { resetPostId } from '../../config/redux/reducer/postReduxer/index.js';
import {
  getAboutUser,
  getAllUsers,
} from '../../config/redux/action/authAction/index.js';
import UserLayout from '../../layout/UserLayout/index.jsx';
import DashboardLayout from '../../layout/DashboardLayout/index.jsx';
import styles from './index.module.css';
import { BASE_URL } from '../../config/index.jsx';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { userId } = router.query;

  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.posts);

  const [postContent, setPostContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [activeShareMenu, setActiveShareMenu] = useState(null);

  const allPosts = useMemo(() => {
    const data = postState?.posts || postState?.post || [];
    const postsArray = Array.isArray(data) ? data : [];

    const sortedPosts = [...postsArray].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b._id || '').localeCompare(String(a._id || ''));
    });

    if (userId && sortedPosts.length > 0) {
      return sortedPosts.filter(
        (post) =>
          post?.user?._id === userId ||
          post?.userId?._id === userId ||
          post?.userId === userId ||
          post?.user === userId,
      );
    }

    return sortedPosts;
  }, [postState, userId]);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      dispatch(getAboutUser({ token }));

      if (!authState?.all_profiles_fetched) {
        dispatch(getAllUsers());
      }

      dispatch(getAllPosts());
    }
  }, []);

  useEffect(() => {
    if (!postState?.comments) return;
    const incomingComments =
      postState.comments.comments ||
      postState.comments.data ||
      postState.comments;
    if (Array.isArray(incomingComments)) {
      setCommentsList(incomingComments);
    }
  }, [postState?.comments]);

  const handledPostIdRef = useRef(null);

  useEffect(() => {
    const targetPostId = router.query.postId;
    if (!targetPostId || allPosts.length === 0) return;

    const cleanId = String(targetPostId).trim();
    if (handledPostIdRef.current === cleanId) return;

    const el = document.getElementById(`post-${cleanId}`);
    if (el) {
      handledPostIdRef.current = cleanId;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [router.query.postId, allPosts]);

  const handleUpload = async () => {
    const textSnapshot = postContent ? postContent.trim() : '';
    const fileSnapshot = fileContent;

    if (!textSnapshot && !fileSnapshot) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('body', textSnapshot);

      if (fileSnapshot) {
        formData.append('media', fileSnapshot);
      }

      formData.append('token', token);

      const resultAction = await dispatch(createPost(formData));

      if (createPost.fulfilled.match(resultAction)) {
        setPostContent('');
        setFileContent(null);
        dispatch(getAllPosts());
      }
    } catch (error) {
      console.error('UI Upload Error:', error);
    }
  };

  const handleShare = useCallback((platform, post) => {
    if (!post?._id) return;
    const text = post.body || '';
    const authorUsername =
      post?.userId?.username ||
      post?.user?.username ||
      post?.username ||
      '';

    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : '';

    const profileUrl = authorUsername
      ? `${origin}/view_profile/${authorUsername}?postId=${post._id}`
      : `${origin}/dashboard?postId=${post._id}`;

    const authorDisplay = authorUsername ? `@${authorUsername}` : 'User';
    const shareTitle = `${authorDisplay}'s Post on Pro Connect`;

    const shareBody = text
      ? `"${text}"\n\nCheck out ${authorDisplay}'s post on their profile: ${profileUrl}`
      : `Check out ${authorDisplay}'s post on their profile: ${profileUrl}`;

    const encodedText = encodeURIComponent(
      text
        ? `"${text}" - View on ${authorDisplay}'s profile:`
        : `Check out this post on ${authorDisplay}'s profile:`,
    );
    const encodedUrl = encodeURIComponent(profileUrl);

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
          '_blank',
        );
        break;
      case 'facebook':
        window.open(
          `https://facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          '_blank',
        );
        break;
      case 'whatsapp':
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(shareBody)}`,
          '_blank',
        );
        break;
      case 'youtube':
      case 'native':
      default:
        if (navigator.share) {
          navigator
            .share({
              title: shareTitle,
              text: text || shareTitle,
              url: profileUrl,
            })
            .catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard
            .writeText(profileUrl)
            .then(() => {
              alert(`Profile link copied to clipboard:\n${profileUrl}`);
            })
            .catch(() => {});
        }
        break;
    }
    setActiveShareMenu(null);
  }, []);

  const resolveProfileImage = (rawPath) => {
    if (!rawPath || typeof rawPath !== 'string') return '/images/default.jpg';
    const clean = rawPath.trim();
    if (
      !clean ||
      clean === 'default.jpg' ||
      clean === '/images/default.jpg' ||
      clean.includes('undefined') ||
      clean.includes('null')
    ) {
      return '/images/default.jpg';
    }

    if (
      clean.startsWith('http://') ||
      clean.startsWith('https://') ||
      clean.includes('cloudinary')
    ) {
      return clean;
    }

    let cleanPath = clean.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = `uploads/${cleanPath}`;
    }
    return `${BASE_URL}/${cleanPath}`;
  };

  const currentUserProfilePicture =
    authState?.user?.profilePicture ||
    authState?.user?.userId?.profilePicture ||
    authState?.user?.profile?.profilePicture ||
    authState?.user?.profile?.userId?.profilePicture ||
    authState?.userProfile?.profilePicture ||
    authState?.userProfile?.userId?.profilePicture ||
    '';

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.scrollComponent}>
          <div className={styles.wrapper}>
            <div className={styles.createPostContainer}>
              <img
                className={styles.userProfile}
                src={resolveProfileImage(currentUserProfilePicture)}
                alt="Profile Picture"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/default.jpg';
                }}
              />

              <textarea
                onChange={(e) => setPostContent(e.target.value)}
                value={postContent || ''}
                placeholder={"What's in your mind?"}
                className={styles.textAreaOfContent}
              ></textarea>

              <label htmlFor="fileUpload">
                <div className={styles.fab}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
              </label>
              <input
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFileContent(e.target.files[0]);
                  }
                }}
                type="file"
                hidden
                id="fileUpload"
                accept="image/*"
              />
              {((postContent && postContent.trim().length > 0) ||
                fileContent) && (
                <div onClick={handleUpload} className={styles.uploadsButton}>
                  Post
                </div>
              )}
            </div>

            <div className={styles.postContainer}>
              {Array.isArray(allPosts) &&
                allPosts
                  .filter((post) => post?.userId && post?.userId?.name)
                  .map((post) => {
                    const postAuthorId = post?.userId?._id || post?.userId;

                    const loggedInUserId =
                      authState?.user?.profile?.userId?._id ||
                      authState?.user?.profile?.userId ||
                      authState?.user?._id;

                    const isAuthor =
                      postAuthorId &&
                      loggedInUserId &&
                      String(postAuthorId).trim() ===
                        String(loggedInUserId).trim();

                    return (
                      <div
                        key={post._id}
                        id={`post-${post._id}`}
                        className={styles.singleCard}
                      >
                        <div className={styles.singleCard__profileContainer}>
                          <img
                            src={resolveProfileImage(
                              post?.userId?.profilePicture ||
                                post?.user?.profilePicture ||
                                post?.profilePicture,
                            )}
                            className={styles.userProfile}
                            alt="Profile"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              const uName =
                                post?.userId?.username || post?.user?.username;
                              if (uName) router.push(`/view_profile/${uName}`);
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/default.jpg';
                            }}
                          />

                          <div style={{ width: '100%' }}>
                            <div
                              style={{
                                display: 'flex',
                                gap: '1.2rem',
                                justifyContent: 'space-between',
                              }}
                            >
                              <p
                                style={{ fontWeight: 'bold', cursor: 'pointer' }}
                                onClick={() => {
                                  const uName =
                                    post?.userId?.username ||
                                    post?.user?.username;
                                  if (uName)
                                    router.push(`/view_profile/${uName}`);
                                }}
                              >
                                {post.userId.name}
                              </p>

                              {isAuthor && (
                                <div
                                  onClick={async () => {
                                    try {
                                      await dispatch(deletePost(post._id));
                                      dispatch(getAllPosts());
                                    } catch (error) {
                                      console.error(
                                        'Error deleting post:',
                                        error,
                                      );
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <svg
                                    style={{ height: '1.4rem', color: 'red' }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            <p style={{ color: 'gray' }}>
                              @{post.userId.username}
                            </p>
                            {post.title && (
                              <h4
                                style={{
                                  margin: '8px 0 2px 0',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold',
                                  color: '#0f172a',
                                }}
                              >
                                {post.title}
                              </h4>
                            )}
                            <p style={{ paddingTop: '5px' }}>{post.body}</p>

                            <div className={styles.singleCard__image}>
                              {(() => {
                                const mediaUrl =
                                  typeof post.media === 'object' && post.media !== null
                                    ? post.media.url || ''
                                    : typeof post.media === 'string'
                                      ? post.media
                                      : '';

                                if (!mediaUrl || !mediaUrl.trim()) return null;

                                const fullSrc =
                                  mediaUrl.startsWith('http') || mediaUrl.includes('cloudinary')
                                    ? mediaUrl
                                    : `${BASE_URL}/${mediaUrl}`;

                                return (
                                  <img
                                    src={fullSrc}
                                    alt="Post Asset"
                                    style={{
                                      width: '100%',
                                      borderRadius: '8px',
                                      marginTop: '10px',
                                      display: 'block',
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                );
                              })()}
                            </div>

                            <div className={styles.optionsContainer}>
                              {(() => {
                                const currentUserId =
                                  authState?.user?.profile?.userId?._id ||
                                  authState?.user?.profile?.userId ||
                                  authState?.user?._id;

                                const isLiked =
                                  Array.isArray(post.likedBy) &&
                                  post.likedBy.some(
                                    (id) =>
                                      String(id?._id || id) ===
                                      String(currentUserId),
                                  );

                                return (
                                  <div
                                    onClick={async () => {
                                      await dispatch(
                                        incrementLike({ postId: post._id }),
                                      );
                                      dispatch(getAllPosts());
                                    }}
                                    className={styles.single__optionsContainer}
                                    style={{
                                      cursor: 'pointer',
                                      color: isLiked ? '#0070f3' : 'inherit',
                                    }}
                                    title={isLiked ? 'Unlike' : 'Like'}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill={isLiked ? '#0070f3' : 'none'}
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke={isLiked ? '#0070f3' : 'currentColor'}
                                      className="size-6"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                                      />
                                    </svg>
                                    <p
                                      style={{
                                        color: isLiked ? '#0070f3' : 'inherit',
                                        fontWeight: isLiked ? '600' : 'normal',
                                      }}
                                    >
                                      {post.likes}{' '}
                                    </p>
                                  </div>
                                );
                              })()}
                              <div
                                onClick={() => {
                                  dispatch(
                                    getAllComments({ postId: post._id }),
                                  );
                                  dispatch(resetPostId());
                                }}
                                className={styles.single__optionsContainer}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                                  />
                                </svg>
                              </div>

                              <div
                                onClick={() =>
                                  setActiveShareMenu(
                                    activeShareMenu === post._id
                                      ? null
                                      : post._id,
                                  )
                                }
                                className={styles.single__optionsContainer}
                                style={{ cursor: 'pointer' }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-6 h-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                                  />
                                </svg>
                              </div>

                              {activeShareMenu === post._id && (
                                <div
                                  onMouseLeave={() => setActiveShareMenu(null)}
                                  style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    right: '30px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    minWidth: '70px',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <button
                                    onClick={() => handleShare('twitter', post)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      borderRadius: '4px',
                                      width: '100%',
                                      color: '#333',
                                    }}
                                  >
                                    <img
                                      src="/images/twitter.png"
                                      alt="Twitter"
                                      style={{ height: '30px', color: 'black' }}
                                    />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleShare('facebook', post)
                                    }
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      borderRadius: '4px',
                                      width: '100%',
                                      color: '#333',
                                    }}
                                  >
                                    <img
                                      src="/images/facebook.png"
                                      alt="Facebook"
                                      style={{ height: '30px' }}
                                    />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleShare('whatsapp', post)
                                    }
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      borderRadius: '4px',
                                      width: '100%',
                                      color: '#333',
                                    }}
                                  >
                                    <img
                                      src="/images/whatsapp.png"
                                      alt="WhatsApp"
                                      style={{ height: '30px' }}
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleShare('youtube', post)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      borderRadius: '4px',
                                      width: '100%',
                                      color: '#333',
                                    }}
                                  >
                                    <img
                                      src="/images/youtube.png"
                                      alt="YouTube"
                                      style={{
                                        height: '30px',
                                        objectFit: 'contain',
                                      }}
                                    />
                                  </button>

                                  <button
                                    onClick={() => handleShare('native', post)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      borderRadius: '4px',
                                      width: '100%',
                                      color: '#333',
                                    }}
                                  >
                                    <img
                                      src="/images/instagram.png"
                                      alt="Instagram"
                                      style={{ height: '30px' }}
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
        {postState.postId != '' && (
          <div
            onClick={() => {
              if (typeof resetPostId === 'function') {
                dispatch(resetPostId());
              } else {
                dispatch({ type: 'RESET_POST_ID' });
              }
            }}
            className={styles.commentsContainer}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={styles.allCommentsContainer}
            >
              <div className={styles.commentsListWrapper}>
                {(() => {
                  const list = commentsList || [];
                  if (list.length === 0) return <h2>No Comments</h2>;

                  return (
                    <div>
                      {[...list].map((comment, index) => {
                        const commentAuthorId =
                          comment?.userId?._id || comment?.userId;
                        const loggedInUserId =
                          authState?.user?.profile?.userId?._id ||
                          authState?.user?.profile?.userId ||
                          authState?.user?._id;
                        const loggedInUsername =
                          authState?.user?.username ||
                          authState?.user?.profile?.userId?.username;
                        const commentUsername = comment?.userId?.username;

                        const isCommentAuthor = Boolean(
                          (commentAuthorId &&
                            loggedInUserId &&
                            String(commentAuthorId).trim() ===
                              String(loggedInUserId).trim()) ||
                          (loggedInUsername &&
                            commentUsername &&
                            loggedInUsername === commentUsername),
                        );

                        return (
                          <div
                            className={styles.singleComment}
                            key={comment._id || index}
                          >
                            <div
                              className={styles.singleComment__profileContainer}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    margin: 0,
                                  }}
                                  onClick={() => {
                                    if (commentUsername) {
                                      router.push(
                                        `/view_profile/${commentUsername}`,
                                      );
                                    }
                                  }}
                                >
                                  @{commentUsername}
                                </p>
                              </div>

                              {isCommentAuthor && (
                                <div
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await dispatch(
                                        deleteComment({
                                          commentId: comment._id,
                                        }),
                                      );
                                      dispatch(
                                        getAllComments({
                                          postId: postState.postId,
                                        }),
                                      );
                                    } catch (err) {
                                      console.error(
                                        'Error deleting comment:',
                                        err,
                                      );
                                    }
                                  }}
                                  title="Delete comment"
                                  style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#ef4444',
                                    padding: '2px',
                                  }}
                                >
                                  <svg
                                    style={{
                                      height: '1.2rem',
                                      width: '1.2rem',
                                    }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p
                              style={{
                                margin: '4px 0 0 0',
                                wordBreak: 'break-word',
                              }}
                            >
                              {comment.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  await dispatch(
                    postComment({
                      postId: postState.postId,
                      body: commentText,
                    }),
                  );

                  await dispatch(
                    getAllComments({ postId: postState.postId }),
                  );
                  setCommentText('');
                }}
                className={styles.postCommentsContainer}
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Comment (Press Enter to post)"
                />

                <button
                  type="submit"
                  className={styles.postCommentsContainer__commentBtn}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  <p>Submit</p>
                </button>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
}
