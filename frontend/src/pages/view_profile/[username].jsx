import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, clientServer } from '../../config';
import UserLayout from '../../layout/UserLayout';
import DashboardLayout from '../../layout/DashboardLayout';
import ProfileImageUploader from '../../Components/ProfileImageUploader.jsx';
import BackdropImageUploader from '../../Components/BackdropImageUploader.jsx';
import {
  sendConnectionRequest,
  getAboutUser,
  cancelConnectionRequestThunk,
  getConnectionRequest,
  getMyConnectionRequest,
  AcceptConnection,
} from '../../config/redux/action/authAction/index.js';
import { getAllPosts } from '../../config/redux/action/postAction/index.js';
import styles from './index.module.css';

const DEFAULT_AVATAR = '/images/default.jpg';
const DEFAULT_COVER = '/images/nature.jpg';

function ConnectionButton({ targetUserId, connectionList, userProfile }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state?.auth) || {};

  const cleanTargetId = useMemo(() => {
    if (!targetUserId) return '';
    if (typeof targetUserId === 'object') {
      return String(targetUserId?._id || targetUserId?.id || '').trim();
    }
    return String(targetUserId).trim();
  }, [targetUserId]);

  const matchedConnection = useMemo(() => {
    if (!Array.isArray(connectionList) || connectionList.length === 0)
      return null;
    if (!cleanTargetId || cleanTargetId === 'undefined') return null;

    return connectionList.find((conn) => {
      if (!conn) return false;

      if (typeof conn === 'string') {
        return conn.trim() === cleanTargetId;
      }

      const sender = String(
        conn?.userId?._id || conn?.userId || conn?.senderId || '',
      ).trim();
      const receiver = String(
        conn?.connectionId?._id || conn?.connectionId || conn?.receiverId || '',
      ).trim();
      const rowId = String(conn?._id || '').trim();

      return (
        sender === cleanTargetId ||
        receiver === cleanTargetId ||
        rowId === cleanTargetId
      );
    });
  }, [connectionList, cleanTargetId]);

  const connectionStatus = useMemo(() => {
    if (!matchedConnection) return 'NOT_CONNECTED';

    if (
      matchedConnection.status_accepted === true ||
      matchedConnection.status_accepted === 'accepted' ||
      matchedConnection.status === 'accepted'
    ) {
      return 'CONNECTED';
    }

    const senderId = String(
      matchedConnection?.userId?._id || matchedConnection?.userId || '',
    ).trim();

    // If target user is the sender (meaning current logged in user is the receiver):
    if (senderId === cleanTargetId) {
      return 'RECEIVED_PENDING';
    }

    // Current logged in user is the sender of this pending request:
    return 'PENDING';
  }, [matchedConnection, cleanTargetId]);

  const handleConnectionClick = async () => {
    if (
      !cleanTargetId ||
      cleanTargetId === 'undefined' ||
      cleanTargetId === ''
    ) {
      return;
    }

    if (connectionStatus === 'CONNECTED') {
      const result = await dispatch(
        cancelConnectionRequestThunk({
          connectionId: cleanTargetId,
          requestId: matchedConnection?._id,
        }),
      );
      if (result?.meta?.requestStatus === 'fulfilled') {
        dispatch(getMyConnectionRequest());
        dispatch(getConnectionRequest());
      }
    } else if (connectionStatus === 'RECEIVED_PENDING') {
      const result = await dispatch(
        AcceptConnection({
          connectionId: matchedConnection?._id,
          action: 'accept',
        }),
      );
      if (result?.meta?.requestStatus === 'fulfilled') {
        dispatch(getMyConnectionRequest());
        dispatch(getConnectionRequest());
      }
    } else if (connectionStatus === 'PENDING') {
      const result = await dispatch(
        cancelConnectionRequestThunk({
          connectionId: cleanTargetId,
          requestId: matchedConnection?._id,
        }),
      );
      if (result?.meta?.requestStatus === 'fulfilled') {
        dispatch(getMyConnectionRequest());
        dispatch(getConnectionRequest());
      }
    } else if (connectionStatus === 'NOT_CONNECTED') {
      const result = await dispatch(
        sendConnectionRequest({ userId: cleanTargetId }),
      );

      if (result?.meta?.requestStatus === 'fulfilled') {
        dispatch(getMyConnectionRequest());
        dispatch(getConnectionRequest());
      }
    }
  };

  const buttonConfig = useMemo(() => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return {
          text: 'Unfriend',
          style: {
            background: '#ffffff',
            color: '#ef4444',
            border: '1px solid #fca5a5',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.08)',
            cursor: 'pointer',
          },
        };
      case 'RECEIVED_PENDING':
        return {
          text: 'Accept Request',
          style: {
            background: '#10b981',
            color: '#ffffff',
            border: '1px solid #059669',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          },
        };
      case 'PENDING':
        return {
          text: 'Pending (Cancel)',
          style: {
            background: '#ffffff',
            color: 'rgba(3, 93, 183, 0.905)',
            border: '1px solid rgba(3, 93, 183, 0.905)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          },
        };
      case 'NOT_CONNECTED':
      default:
        return {
          text: 'Connect',
          style: {
            background: 'rgba(3, 93, 183, 0.905)',
            color: '#ffffff',
            border: '1px solid rgba(3, 93, 183, 0.905)',
            boxShadow: '0 4px 12px rgba(3, 93, 183, 0.2)',
          },
        };
    }
  }, [connectionStatus]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        onClick={handleConnectionClick}
        disabled={false}
        className={`${styles.connectBtn} ${
          connectionStatus === 'PENDING'
            ? styles.pendingBtn
            : connectionStatus === 'CONNECTED'
              ? styles.connectedBtn
              : ''
        }`}
        style={{
          paddingInline: '1rem',
          paddingBlock: '0.4rem',
          margin: '0.5rem 0',
          outline: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontWeight: '400',
          fontSize: '0.9rem',
          transition: 'all 0.3s ease',
          ...buttonConfig.style,
        }}
      >
        {buttonConfig.text}
      </button>

      <div
        onClick={async () => {
          try {
            if (!cleanTargetId || cleanTargetId === 'undefined') return;
            const downloadUrl = `${BASE_URL}/download_resume?id=${cleanTargetId}`;
            window.open(downloadUrl, '_blank');
          } catch (err) {
            console.log(err.message);
          }
        }}
        style={{ width: '1.2em', cursor: 'pointer' }}
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
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      </div>
    </div>
  );
}

export default function ViewProfilePage({ userProfile, serverAllPosts = [] }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const authState = useSelector((state) => state?.auth) || {};
  const postReducer = useSelector((state) => state?.posts) || {};

  const [isCurrentuserInConnection, setIsCurrentuserInConnection] =
    useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const getUsersPost = useCallback(async () => {
    const currentToken =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (currentToken) {
      await dispatch(getAllPosts());
      await dispatch(getConnectionRequest({ token: currentToken }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isMounted) {
      getUsersPost();
    }
  }, [getUsersPost, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, []);

  const normalizedProfile = useMemo(() => {
    if (userProfile) return userProfile;

    if (authState?.user) return authState.user;

    return null;
  }, [userProfile, authState]);

  const targetUsername = useMemo(() => {
    if (!router.isReady) return '';
    const queryUser = router.query?.username;
    if (queryUser) return String(queryUser).trim();

    return (
      normalizedProfile?.user?.username || normalizedProfile?.username || ''
    );
  }, [router.isReady, router.query?.username, normalizedProfile]);

  const loggedInUsername = useMemo(() => {
    const userObj = authState?.user || {};
    return (
      userObj?.username ||
      userObj?.userId?.username ||
      userObj?.user?.username ||
      null
    );
  }, [authState]);

  const isMyOwnProfile = useMemo(() => {
    if (!loggedInUsername || !targetUsername) return false;
    return (
      loggedInUsername.trim().toLowerCase() ===
      targetUsername.trim().toLowerCase()
    );
  }, [loggedInUsername, targetUsername]);

  const showUploadButtons = useMemo(() => isMyOwnProfile, [isMyOwnProfile]);

  useEffect(() => {
    if (!normalizedProfile) return;
    const targetUserObj = normalizedProfile?.user || normalizedProfile || {};
    const targetProfileObj = normalizedProfile?.profile || {};

    const currentName = targetUserObj?.name || targetProfileObj?.name || 'User';
    const rawBio = targetProfileObj?.bio || targetUserObj?.bio || '';

    setEditName(currentName);
    setEditBio(
      rawBio && String(rawBio).trim() !== ''
        ? String(rawBio).trim()
        : 'Bio is not available',
    );
  }, [normalizedProfile, isMyOwnProfile, router.query?.username]);

  const resolveAssetUrl = useCallback((relativeSrc, defaultFallback) => {
    if (
      !relativeSrc ||
      relativeSrc.includes('undefined') ||
      relativeSrc === ''
    ) {
      return defaultFallback;
    }
    if (relativeSrc.startsWith('http')) return relativeSrc;

    let cleanPath = String(relativeSrc).replace(/\\/g, '/');
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = `uploads/${cleanPath}`;
    }
    return `${BASE_URL}/${cleanPath}`;
  }, []);

  const avatarUrl = useMemo(() => {
    const activeUser = authState?.user || {};
    const rawSrc = isMyOwnProfile
      ? activeUser?.profilePicture || activeUser?.profile?.profilePicture
      : normalizedProfile?.user?.profilePicture ||
        normalizedProfile?.profilePicture ||
        normalizedProfile?.profile?.profilePicture;
    return resolveAssetUrl(rawSrc, DEFAULT_AVATAR);
  }, [normalizedProfile, authState, isMyOwnProfile, resolveAssetUrl]);

  const coverUrl = useMemo(() => {
    const activeUser = authState?.user || {};
    const rawSrc = isMyOwnProfile
      ? activeUser?.coverPicture || activeUser?.profile?.coverPicture
      : normalizedProfile?.user?.coverPicture ||
        normalizedProfile?.coverPicture ||
        normalizedProfile?.profile?.coverPicture;
    return resolveAssetUrl(rawSrc, DEFAULT_COVER);
  }, [normalizedProfile, authState, isMyOwnProfile, resolveAssetUrl]);

  const stableRawPosts = useMemo(() => {
    const target = postReducer?.posts || postReducer?.post || [];
    return Array.isArray(target) ? target : [];
  }, [postReducer]);

  const targetId = useMemo(() => {
    return String(
      normalizedProfile?.user?._id ||
      normalizedProfile?.user?.id ||
      normalizedProfile?._id ||
      normalizedProfile?.id ||
      '',
    ).trim();
  }, [normalizedProfile]);

  const filteredLocalPosts = useMemo(() => {
    return stableRawPosts.filter((post) => {
      const postUsername =
        post?.userId?.username || post?.username || post?.user?.username;
      const postUserId = String(
        post?.userId?._id || post?.userId || post?.user?._id || post?.user || '',
      ).trim();

      const matchesUsername =
        targetUsername &&
        postUsername &&
        String(postUsername).trim().toLowerCase() ===
          String(targetUsername).trim().toLowerCase();

      const matchesId =
        targetId && postUserId && String(postUserId) === String(targetId);

      return matchesUsername || matchesId;
    });
  }, [stableRawPosts, targetUsername, targetId]);

  const finalDisplayPosts = useMemo(() => {
    const postsToUse =
      filteredLocalPosts.length > 0
        ? filteredLocalPosts
        : normalizedProfile?.posts || [];
    return [...postsToUse].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b._id || '').localeCompare(String(a._id || ''));
    });
  }, [filteredLocalPosts, normalizedProfile?.posts]);

  const handledPostIdRef = useRef(null);

  useEffect(() => {
    const targetPostId = router.query.postId;
    if (!targetPostId || finalDisplayPosts.length === 0) return;

    const cleanId = String(targetPostId).trim();
    if (handledPostIdRef.current === cleanId) return;

    const el = document.getElementById(`activity-post-${cleanId}`);
    if (el) {
      handledPostIdRef.current = cleanId;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [router.query.postId, finalDisplayPosts]);

  useEffect(() => {
    if (router.isReady && targetUsername) {
      getUsersPost();
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        dispatch(getAboutUser({ token }));
      }
    }
  }, [router.isReady, targetUsername, dispatch, getUsersPost]);

  useEffect(() => {
    const targetId = String(
      normalizedProfile?.user?._id || normalizedProfile?._id || '',
    ).trim();

    if (authState?.connection && targetId !== '') {
      const isConnected = authState.connection.some((conn) => {
        if (!conn) return false;

        const connectionPointer = String(
          conn?.connectionId?._id ||
            conn?.connectionId ||
            conn?.connetionId?._id ||
            conn?._id ||
            '',
        ).trim();

        return connectionPointer === targetId;
      });

      setIsCurrentuserInConnection(isConnected);
    }
  }, [authState?.connection, normalizedProfile, router.query?.username]);

  const handleConnect = useCallback(async () => {
    const targetId = normalizedProfile?.user?._id || normalizedProfile?._id;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (targetId && token) {
      const result = await dispatch(
        sendConnectionRequest({ connectionId: targetId, token }),
      );

      if (result?.meta?.requestStatus === 'fulfilled') {
        dispatch(getConnectionRequest({ token }));
      }
    }
  }, [normalizedProfile, dispatch]);

  const handleUploadSuccess = useCallback(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch(getAboutUser({ token }));
    }
  }, [dispatch]);

  const safeTargetId = useMemo(() => {
    return (
      normalizedProfile?.user?._id ||
      normalizedProfile?.profile?.userId ||
      normalizedProfile?._id ||
      targetUsername ||
      null
    );
  }, [normalizedProfile, targetUsername]);

  if (!isMounted || (!normalizedProfile && !userProfile?.error)) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
          }}
        >
          <h3>Loading Profile Dashboard Data...</h3>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.backDropContainer}>
            <img
              className={styles.backDrop}
              src={coverUrl}
              alt="Cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_COVER;
              }}
            />
            {showUploadButtons && (
              <div className={styles.backdropUploadButtonWrapper}>
                <BackdropImageUploader onUploadSuccess={handleUploadSuccess} />
              </div>
            )}

            <div className={styles.avatarWrapper}>
              {avatarUrl &&
              !avatarUrl.includes('default.jpg') &&
              !avatarUrl.includes('profile.png') ? (
                <img
                  className={styles.mainAvatar}
                  src={avatarUrl}
                  alt="Avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {editName ? editName.charAt(0) : 'U'}
                </div>
              )}
              {showUploadButtons && (
                <div className={styles.avatarUploadButtonWrapper}>
                  <ProfileImageUploader onUploadSuccess={handleUploadSuccess} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.profilesContainer__details}>
            <div className={styles.profileContainer}>
              <div className={styles.profileContainer__left}>
                <div className={styles.profileContainer__leftPart}>
                  <h2>
                    {normalizedProfile?.user?.name ||
                      normalizedProfile?.name ||
                      targetUsername ||
                      'User' ||
                      editName}
                  </h2>
                </div>
                {targetUsername && (
                  <p
                    style={{ color: 'gray' }}
                  >{`@${targetUsername || userProfile?.user?.username}`}</p>
                )}
                <div
                  style={{
                    marginTop: '10px',
                    color: '#1e293b',
                    fontSize: '14px',
                  }}
                >
                  {userProfile?.profile?.bio || editBio}
                </div>

                {!isMyOwnProfile && safeTargetId && (
                  <ConnectionButton
                    targetUserId={safeTargetId}
                    connectionList={[
                      ...(authState?.connections || []),
                      ...(authState?.connectionRequests || []),
                      ...(authState?.connectionRequest || []),
                      ...(authState?.connection || []),
                    ]}
                    userProfile={userProfile || normalizedProfile}
                  />
                )}
              </div>
              <div className={styles.profileContainer__right}>
                <h3>Recent Activity ({finalDisplayPosts.length})</h3>
                <div className={styles.card__profileContainer2}>
                  {finalDisplayPosts.slice(0, 2).map((post) => {
                    const postTitle =
                      post?.title && post.title.trim() !== ''
                        ? post.title
                        : post?.body && post.body.trim() !== ''
                          ? post.body.length > 40
                            ? post.body.slice(0, 40) + '...'
                            : post.body
                          : 'Photo Post';

                    const rawMedia =
                      typeof post.media === 'object' && post.media !== null
                        ? post.media.url || ''
                        : typeof post.media === 'string'
                          ? post.media
                          : '';

                    const mediaSrc = rawMedia
                      ? rawMedia.startsWith('http') || rawMedia.includes('cloudinary')
                        ? rawMedia
                        : `${BASE_URL}/${rawMedia.replace(/\\/g, '/')}`
                      : null;

                    return (
                      <div
                        key={post._id}
                        id={`activity-post-${post._id}`}
                        className={styles.postCard}
                        onClick={() => {
                          if (post._id) {
                            router.push(`/dashboard?postId=${post._id}#post-${post._id}`);
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                        }}
                        title="Click to view post on Dashboard"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#0f172a',
                              lineHeight: '1.3',
                            }}
                          >
                            {postTitle}
                          </h4>
                          {post.createdAt && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                              {new Date(post.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {mediaSrc && (
                          <div
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              maxHeight: '130px',
                              backgroundColor: '#f1f5f9',
                            }}
                          >
                            <img
                              src={mediaSrc}
                              alt="Post thumbnail"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxHeight: '130px',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {post.body && post.body !== postTitle && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '12px',
                              color: '#475569',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {post.body}
                          </p>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            borderTop: '1px solid #f1f5f9',
                            marginTop: 'auto',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#0070f3',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            Jump to post ↗
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            ❤️ {post.likes || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {finalDisplayPosts.length > 2 && (
                  <button
                    onClick={() => setIsActivityModalOpen(true)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0070f3',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View All Activity ({finalDisplayPosts.length}) →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.workHistory}>
            <h4>Education</h4>
            <div className={styles.workHistoryContainer}>
              {!(
                normalizedProfile?.profile?.education ||
                normalizedProfile?.education ||
                normalizedProfile?.user?.education
              ) ||
              (
                normalizedProfile?.profile?.education ||
                normalizedProfile?.education ||
                normalizedProfile?.user?.education
              )?.length === 0 ? (
                <p style={{ color: 'gray', fontSize: '13px', margin: 0 }}>
                  No education details available.
                </p>
              ) : (
                normalizedProfile.profile.education.map((edu, index) => {
                  return (
                    <div
                      key={index}
                      className={styles.workHistorycard}
                      style={{ marginBottom: '12px' }}
                    >
                      <p
                        style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          margin: '0 0 4px 0',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                        }}
                      >
                        {edu?.school} - {edu?.degree || edu?.cource}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#64748b',
                        }}
                      >
                        {edu?.fieldOfStudy || edu?.years}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={styles.workHistory}>
            <h4>Work History</h4>
            <div className={styles.workHistoryContainer}>
              {normalizedProfile?.profile?.pastWork?.map((work, index) => {
                return (
                  <div key={index} className={styles.workHistorycard}>
                    <p
                      style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                      }}
                    >
                      {work.company} - {work.position}
                    </p>
                    <p>{work?.years} years</p>
                  </div>
                );
              })}
            </div>
          </div>

          {isActivityModalOpen && (
            <div
              style={{
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                top: 0,
                left: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onClick={() => setIsActivityModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '560px',
                  maxWidth: '92vw',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '12px',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    All Activity ({finalDisplayPosts.length})
                  </h3>
                  <button
                    onClick={() => setIsActivityModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '22px',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '0 4px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  {finalDisplayPosts.map((post) => {
                    const postTitle =
                      post?.title && post.title.trim() !== ''
                        ? post.title
                        : post?.body && post.body.trim() !== ''
                          ? post.body.length > 40
                            ? post.body.slice(0, 40) + '...'
                            : post.body
                          : 'Photo Post';

                    const rawMedia =
                      typeof post.media === 'object' && post.media !== null
                        ? post.media.url || ''
                        : typeof post.media === 'string'
                          ? post.media
                          : '';

                    const mediaSrc = rawMedia
                      ? rawMedia.startsWith('http') || rawMedia.includes('cloudinary')
                        ? rawMedia
                        : `${BASE_URL}/${rawMedia.replace(/\\/g, '/')}`
                      : null;

                    return (
                      <div
                        key={post._id}
                        className={styles.postCard}
                        onClick={() => {
                          setIsActivityModalOpen(false);
                          if (post._id) {
                            router.push(`/dashboard?postId=${post._id}#post-${post._id}`);
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                        }}
                        title="Click to view post on Dashboard"
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: '700',
                              color: '#0f172a',
                              lineHeight: '1.3',
                            }}
                          >
                            {postTitle}
                          </h4>
                          {post.createdAt && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                whiteSpace: 'nowrap',
                                marginLeft: '6px',
                              }}
                            >
                              {new Date(post.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </span>
                          )}
                        </div>

                        {mediaSrc && (
                          <div
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              maxHeight: '180px',
                              backgroundColor: '#f1f5f9',
                            }}
                          >
                            <img
                              src={mediaSrc}
                              alt="Post thumbnail"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxHeight: '180px',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {post.body && post.body !== postTitle && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#475569',
                              lineHeight: '1.4',
                            }}
                          >
                            {post.body}
                          </p>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9',
                            marginTop: 'auto',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#0070f3',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            Jump to post ↗
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            ❤️ {post.likes || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export async function getServerSideProps(context) {
  context.res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  try {
    const { username } = context.query;
    if (!username) return { props: { userProfile: null, serverAllPosts: [] } };

    const cleanUsername = String(username).trim();
    const cookies = context.req.headers.cookie || '';
    const tokenMatch = cookies.match(/token=([^;]+)/);

    const token = tokenMatch ? tokenMatch[1] : null;

    const BACKEND_PORT = 9080;
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const [profileResponse, postsResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/get_profile_based_on_username?username=${encodeURIComponent(cleanUsername)}&t=${Date.now()}`,
        { method: 'GET', headers },
      ),

      fetch(`${BASE_URL}/get_all_users?t=${Date.now()}`, {
        method: 'GET',
        headers,
      }).catch(() => null),
    ]);

    if (!profileResponse.ok) {
      return {
        props: {
          userProfile: { notFound: true, username: cleanUsername },
          serverAllPosts: [],
        },
      };
    }

    const responseData = await profileResponse.json();

    let postsData = [];
    if (postsResponse && postsResponse.ok) {
      const postsPayload = await postsResponse.json();
      postsData =
        postsPayload?.posts || postsPayload?.data || postsPayload || [];
    }

    return {
      props: {
        userProfile: responseData,
        serverAllPosts: Array.isArray(postsData) ? postsData : [],
      },
    };
  } catch (err) {
    console.error('Server side query execution failed:', err.message);
    return { props: { userProfile: null, serverAllPosts: [] } };
  }
}
