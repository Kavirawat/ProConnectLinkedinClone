import React, { useEffect, useMemo } from 'react';
import UserLayout from '../../layout/UserLayout';
import DashboardLayout from '../../layout/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMyConnectionRequest,
  getConnectionRequest,
  AcceptConnection,
  cancelConnectionRequestThunk,
} from '../../config/redux/action/authAction/index.js';
import styles from './style.module.css';
import { BASE_URL } from '../../config';
import { useRouter } from 'next/router.js';

const DEFAULT_AVATAR = '/images/default.jpg';

export default function MyConnectionsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const authstate = useSelector((state) => state.auth);

  const pendingRequests =
    authstate?.connectionRequest || authstate?.connectionRequests || [];

  const activeConnections =
    authstate?.connection || authstate?.connections || [];

  const loggedInUser = authstate?.user || {};

  const currentUserId = useMemo(() => {
    return String(
      loggedInUser?._id ||
        loggedInUser?.userId?._id ||
        loggedInUser?.id ||
        authstate?.user?._id ||
        '',
    ).trim();
  }, [loggedInUser, authstate?.user]);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch(getMyConnectionRequest());
    }
  }, [dispatch]);

  const resolveAvatar = (rawPath) => {
    if (
      !rawPath ||
      rawPath === 'undefined' ||
      rawPath === 'null' ||
      rawPath === 'default.jpg' ||
      rawPath === 'profile.png'
    ) {
      return DEFAULT_AVATAR;
    }
    if (typeof rawPath === 'string') {
      if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
        return rawPath;
      }
      const clean = rawPath.replace(/\\/g, '/');
      return clean.startsWith('/') ? clean : `${BASE_URL}/${clean}`;
    }
    return DEFAULT_AVATAR;
  };

  // 1. INCOMING Requests (Someone sent a request to me -> I can Accept)
  const incomingRequests = useMemo(() => {
    return (pendingRequests || []).filter((conn) => {
      const receiverId = String(
        conn?.connectionId?._id || conn?.connectionId || '',
      ).trim();
      return receiverId && currentUserId && receiverId === currentUserId;
    });
  }, [pendingRequests, currentUserId]);

  // 2. OUTGOING Requests (I sent a request to someone -> I can Cancel/Withdraw)
  const outgoingRequests = useMemo(() => {
    return (pendingRequests || []).filter((conn) => {
      const senderId = String(
        conn?.userId?._id || conn?.userId || '',
      ).trim();
      return senderId && currentUserId && senderId === currentUserId;
    });
  }, [pendingRequests, currentUserId]);

  const getPartnerUser = (conn) => {
    if (!conn) return {};
    const senderId = String(conn?.userId?._id || conn?.userId || '').trim();
    if (senderId === currentUserId) {
      return typeof conn?.connectionId === 'object' ? conn.connectionId : {};
    }
    return typeof conn?.userId === 'object' ? conn.userId : {};
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECTION 1: INCOMING INVITATIONS */}
          <div>
            <h3>Invitations Received ({incomingRequests.length})</h3>
            {incomingRequests.length > 0 ? (
              incomingRequests.map((conn, index) => {
                const user = typeof conn?.userId === 'object' ? conn.userId : {};
                if (!user || Object.keys(user).length === 0) return null;

                return (
                  <div
                    onClick={() => {
                      if (user?.username)
                        router.push(`/view_profile/${user.username}`);
                    }}
                    key={conn._id || `incoming-${index}`}
                    className={styles.userCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.2rem',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <div className={styles.profilePicture}>
                        <img
                          src={resolveAvatar(user?.profilePicture)}
                          alt="profile picture"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>

                      <div className={styles.userInfo} style={{ flex: 1 }}>
                        <h4>{user?.name || 'User'}</h4>
                        <p>{user?.username ? `@${user.username}` : 'Unknown'}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(
                            AcceptConnection({
                              connectionId: conn._id,
                              action: 'accept',
                            }),
                          ).then((result) => {
                            if (result?.meta?.requestStatus === 'fulfilled') {
                              dispatch(getMyConnectionRequest());
                            }
                          });
                        }}
                        className={styles.btnAccept}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'gray', marginTop: '0.6rem' }}>
                No pending invitations received.
              </p>
            )}
          </div>

          {/* SECTION 2: SENT REQUESTS (OUTGOING) */}
          <div>
            <h3>Sent Requests ({outgoingRequests.length})</h3>
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((conn, index) => {
                const targetUser =
                  typeof conn?.connectionId === 'object' ? conn.connectionId : {};
                const targetId = targetUser?._id || conn?.connectionId;

                return (
                  <div
                    onClick={() => {
                      if (targetUser?.username)
                        router.push(`/view_profile/${targetUser.username}`);
                    }}
                    key={conn._id || `outgoing-${index}`}
                    className={styles.userCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.2rem',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <div className={styles.profilePicture}>
                        <img
                          src={resolveAvatar(targetUser?.profilePicture)}
                          alt="profile picture"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>

                      <div className={styles.userInfo} style={{ flex: 1 }}>
                        <h4>{targetUser?.name || 'User'}</h4>
                        <p>
                          {targetUser?.username ? `@${targetUser.username}` : 'Unknown'}{' '}
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            (Awaiting response)
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(
                            cancelConnectionRequestThunk({
                              connectionId: targetId,
                              requestId: conn._id,
                            }),
                          ).then((result) => {
                            if (result?.meta?.requestStatus === 'fulfilled') {
                              dispatch(getMyConnectionRequest());
                            }
                          });
                        }}
                        className={styles.btnCancel}
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'gray', marginTop: '0.6rem' }}>
                No outgoing requests awaiting response.
              </p>
            )}
          </div>

          {/* SECTION 3: MY NETWORK (ACCEPTED CONNECTIONS) */}
          <div>
            <h4>My Network ({activeConnections.length})</h4>
            {activeConnections.length > 0 ? (
              activeConnections.map((conn, index) => {
                const user = getPartnerUser(conn);
                if (!user || Object.keys(user).length === 0) return null;

                return (
                  <div
                    onClick={() => {
                      if (user?.username)
                        router.push(`/view_profile/${user.username}`);
                    }}
                    key={conn._id || `active-${index}`}
                    className={styles.userCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.2rem',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <div className={styles.profilePicture}>
                        <img
                          src={resolveAvatar(user?.profilePicture)}
                          alt="profile picture"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>

                      <div className={styles.userInfo} style={{ flex: 1 }}>
                        <h4>{user?.name || 'User'}</h4>
                        <p>{user?.username ? `@${user.username}` : 'Unknown'}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId =
                            user?._id ||
                            conn?.userId?._id ||
                            conn?.connectionId?._id;
                          dispatch(
                            cancelConnectionRequestThunk({
                              connectionId: targetId,
                              requestId: conn._id,
                            }),
                          ).then((result) => {
                            if (result?.meta?.requestStatus === 'fulfilled') {
                              dispatch(getMyConnectionRequest());
                              dispatch(getConnectionRequest());
                            }
                          });
                        }}
                        style={{
                          paddingInline: '0.9rem',
                          paddingBlock: '0.4rem',
                          color: '#ef4444',
                          border: '1px solid #fca5a5',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          fontWeight: '500',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Unfriend
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'gray', marginTop: '0.6rem' }}>
                Your network is empty.
              </p>
            )}
          </div>

        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
