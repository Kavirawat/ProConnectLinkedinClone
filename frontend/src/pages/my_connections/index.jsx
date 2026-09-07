import React, { useEffect, useMemo } from 'react';
import UserLayout from '../../layout/UserLayout';
import DashboardLayout from '../../layout/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMyConnectionRequest,
  AcceptConnection,
} from '../../config/redux/action/authAction/index.js';
import styles from './style.module.css';
import { BASE_URL } from '../../config';
import { useRouter } from 'next/router.js';

const SAFE_FALLBACK_AVATAR = 'https://flaticon.com';

export default function MyConnectionsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const authstate = useSelector((state) => state.auth);

  const pendingRequests =
    authstate?.connectionRequest || authstate?.connectionRequests || [];

  const activeConnections =
    authstate?.connection || authstate?.connections || [];

  const loggedInUser = authstate?.user || {};

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch(getMyConnectionRequest());
    }
  }, [dispatch]);

  const getTargetUser = (conn) => {
    const currentUserId = loggedInUser?._id || loggedInUser?.userId?._id;
    if (!conn) return {};

    if (conn?.userId?._id === currentUserId || conn?.userId === currentUserId) {
      return conn?.connectionId || {};
    }
    return conn?.userId || {};
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.7rem' }}
        >
          <h3>Connection Requests ({pendingRequests.length})</h3>

          {pendingRequests.length > 0
            ? pendingRequests.map((conn, index) => {
                const user = getTargetUser(conn);
                if (!user || Object.keys(user).length === 0) return null;

                return (
                  <div
                    onClick={() => {
                      if (user?.username)
                        router.push(`/view_profile/${user.username}`);
                    }}
                    key={conn._id || `pending-${index}`}
                    className={styles.userCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.2rem',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div className={styles.profilePicture}>
                        <img
                          src={
                            user?.profilePicture
                              ? `${BASE_URL}/${user.profilePicture.replace(/\\/g, '/')}`
                              : SAFE_FALLBACK_AVATAR
                          }
                          alt="profile picture"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = SAFE_FALLBACK_AVATAR;
                          }}
                        />
                      </div>

                      <div className={styles.userInfo}>
                        <h4>{user?.name || 'User'}</h4>
                        <p>
                          {user?.username ? `@${user.username}` : 'Unknown'}
                        </p>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();

                          const result = await dispatch(
                            AcceptConnection({
                              connectionId: conn._id,
                              action: 'accept',
                            }),
                          );

                          if (result?.meta?.requestStatus === 'fulfilled') {
                            dispatch(getMyConnectionRequest());
                          }
                        }}
                        className={styles.btnAccept}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })
            : null}

          {pendingRequests.length === 0 && (
            <p style={{ color: 'gray', marginTop: '1rem' }}>
              No connections pending...
            </p>
          )}

          <h4>My Network ({activeConnections.length})</h4>

          {activeConnections.length > 0 ? (
            activeConnections.map((conn, index) => {
              const user = getTargetUser(conn);
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
                    }}
                  >
                    <div className={styles.profilePicture}>
                      <img
                        src={
                          user?.profilePicture
                            ? `${BASE_URL}/${user.profilePicture.replace(/\\/g, '/')}`
                            : SAFE_FALLBACK_AVATAR
                        }
                        alt="profile picture"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = SAFE_FALLBACK_AVATAR;
                        }}
                      />
                    </div>

                    <div className={styles.userInfo}>
                      <h4>{user?.name || 'User'}</h4>
                      <p>{user?.username ? `@${user.username}` : 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'gray' }}>Your network is empty.</p>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
