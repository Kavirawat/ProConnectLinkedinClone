import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
} from '../../config/redux/action/authAction/index.js';
import { getAllPosts } from '../../config/redux/action/postAction/index.js';
import styles from './index.module.css';

const DEFAULT_AVATAR = '/images/profile.png';
const DEFAULT_COVER = '/images/nature.jpg';

function ConnectionButton({ targetUserId, connectionList, userProfile }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const cleanTargetId = useMemo(() => {
    if (!targetUserId) return '';
    if (typeof targetUserId === 'object') {
      return String(targetUserId?._id || targetUserId?.id || '').trim();
    }
    return String(targetUserId).trim();
  }, [targetUserId]);

  const connectionStatus = useMemo(() => {
    if (!Array.isArray(connectionList) || connectionList.length === 0)
      return 'NOT_CONNECTED';
    if (!cleanTargetId || cleanTargetId === 'undefined') return 'NOT_CONNECTED';

    const matchedConnection = connectionList.find((conn) => {
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

    if (!matchedConnection) return 'NOT_CONNECTED';

    if (
      matchedConnection.status_accepted === true ||
      matchedConnection.status_accepted === 'accepted' ||
      matchedConnection.status === 'accepted'
    ) {
      return 'CONNECTED';
    }

    return 'PENDING';
  }, [connectionList, cleanTargetId]);

  const handleConnectionClick = async () => {
    if (
      !cleanTargetId ||
      cleanTargetId === 'undefined' ||
      cleanTargetId === ''
    ) {
      return;
    }

    if (connectionStatus === 'PENDING') {
      const result = await dispatch(
        cancelConnectionRequestThunk({ connectionId: cleanTargetId }),
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
          text: 'Connected',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            cursor: 'not-allowed',
          },
        };
      case 'PENDING':
        return {
          text: 'Pending...',
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
        disabled={connectionStatus === 'CONNECTED'}
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

  const userPosts = stableRawPosts.filter((post) => {
    const postUsername = post?.userId?.username;
    post?.username;
    post?.user?.username;

    return (
      postUsername &&
      String(postUsername).trim().toLowerCase() ===
        String(targetUsername).trim().toLowerCase()
    );
  });

  const filteredLocalPosts = useMemo(() => {
    return stableRawPosts.filter((post) => {
      const postUsername =
        post?.userId?.username || post?.username || post?.user?.username;
      return (
        postUsername &&
        String(postUsername).trim().toLowerCase() ===
          String(targetUsername).trim().toLowerCase()
      );
    });
  }, [stableRawPosts, targetUsername]);

  const finalDisplayPosts = useMemo(() => {
    if (filteredLocalPosts.length > 0) return filteredLocalPosts;
    return normalizedProfile?.posts || [];
  }, [filteredLocalPosts, normalizedProfile?.posts]);

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

  if (!isMounted || !normalizedProfile) {
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
                e.currentTarget.src = STABLE_SVG_COVER;
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
                  {finalDisplayPosts.map((post) => {
                    return (
                      <div key={post._id} className={styles.postCard}>
                        <div className={styles.card}>
                          <div className={styles.card__profileContainer}>
                            {post.media !== '' ? (
                              <img
                                src={`${BASE_URL}/${post.media.replace(/\\/g, '/')}`}
                                alt="Post Media Element"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                style={{ width: '3.4rem', height: '3.4rem' }}
                              />
                            )}
                          </div>
                          <p>{post?.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.workHistory}>
            <h4>Education</h4>
            <div className={styles.workHistoryContainer}>
              {!normalizedProfile?.profile?.education ||
              normalizedProfile?.profile?.education?.length === 0 ? (
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
                        fontWeight: '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                      }}
                    >
                      {work.company} - {work.position}
                    </p>
                    <p>{work?.years}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export async function getServerSideProps(context) {
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
        `http://127.0.0.1:${BACKEND_PORT}/get_profile_based_on_username?username=${encodeURIComponent(cleanUsername)}`,
        { method: 'GET', headers },
      ),
      fetch(`http://127.0.0.1:${BACKEND_PORT}/get_all_users`, {
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
