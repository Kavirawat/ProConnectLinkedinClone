import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './index.module.css';
import { useRouter } from 'next/router';
import { setTokenIsThere } from '../../config/redux/reducer/authReducer/index.js';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL } from '../../config/index.jsx';
import {
  getAllUsers,
  getConnectionRequest,
} from '../../config/redux/action/authAction/index.js';
import { getAllPosts } from '../../config/redux/action/postAction/index.js';

const DEFAULT_AVATAR = '/images/profile.png';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  const [isClient, setIsClient] = useState(false);

  const targetUsername = useMemo(() => {
    return String(router.query?.username || '').trim();
  }, [router.query?.username]);

  useEffect(() => {
    setIsClient(true);
    const publicPages = ['/login', '/register'];
    const isPublicPage = publicPages.includes(router.pathname);
    const token = localStorage.getItem('token');

    if (token === null) {
      if (!isPublicPage) {
        router.push('/login');
      }
    } else {
      if (!authState?.isTokenThere) {
        dispatch(setTokenIsThere());
      }

      if (isPublicPage) {
        router.push('/dashboard');
      }
    }
  }, [router.pathname, router, dispatch, authState?.isTokenThere]);

  const getUsersPost = useCallback(async () => {
    const currentToken =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (currentToken) {
      await dispatch(getAllPosts());
      await dispatch(getConnectionRequest({ token: currentToken }));
      await dispatch(getAllUsers());
    }
  }, [dispatch]);

  useEffect(() => {
    if (isClient) {
      getUsersPost();
    }
  }, [isClient, getUsersPost]);

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

  if (!isClient) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;
  }

  return (
    <div>
      <div className="container">
        <div className={styles.homeContainer}>
          <div className={styles.homeContainer__leftBar}>
            <div
              onClick={() => router.push('/dashboard')}
              className={styles.sideBarOption}
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
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <p>Scroll</p>
            </div>

            <div
              onClick={() => router.push('/discover')}
              className={styles.sideBarOption}
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <p>Discover</p>
            </div>

            <div
              onClick={() => router.push('/my_connections')}
              className={styles.sideBarOption}
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
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <p>My Connections</p>
            </div>
          </div>

          <div className={styles.homeContainer__feedContainer}>{children}</div>

          <div className={styles.homeContainer__extraContainer}>
            <h3>Top Profiles</h3>

            <div className={styles.topProfilesListContainer}>
              <div className={styles.topProfilesListContainer}>
                {authState?.all_users && authState.all_users.length > 0 ? (
                  authState.all_users
                    .filter((u) => {
                      const idCheck = u?.userId?._id || u?._id;
                      const activeLoginId =
                        authState?.user?._id || authState?.user?.id;
                      const uNameCheck =
                        u?.userId?.username || u?.username || '';

                      return (
                        idCheck !== activeLoginId &&
                        uNameCheck !== targetUsername
                      );
                    })
                    .slice(0, 5)
                    .map((userObj, index) => {
                      const profileUser = userObj?.userId || userObj;
                      const currentProfileId = userObj?._id || index;

                      const miniAvatar = resolveAssetUrl(
                        profileUser?.profilePicture || userObj?.profilePicture,
                        DEFAULT_AVATAR,
                      );

                      return (
                        <div
                          key={currentProfileId}
                          className={styles.miniProfileCard}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            paddingBlock: '0.4rem',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <div
                            className={styles.miniProfileCard__left}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              flex: 1,
                            }}
                          >
                            <img
                              src={miniAvatar}
                              alt="Mini Profile Avatar"
                              className={styles.miniAvatarImg}
                              style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                            <div className={styles.miniProfileCard__info}>
                              <p
                                className={styles.miniProfileName}
                                style={{
                                  fontWeight: '600',
                                  margin: 0,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {profileUser?.name || 'LinkedIn User'}
                              </p>
                              <p
                                className={styles.miniProfileBio}
                                style={{
                                  color: 'gray',
                                  margin: 0,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {userObj?.bio ||
                                  '@' + (profileUser?.username || 'user')}
                              </p>
                            </div>
                          </div>

                          <div
                            onClick={() =>
                              router.push(
                                `/view_profile/${profileUser?.username}`,
                              )
                            }
                            style={{
                              color: '#0284c7',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p
                    style={{
                      color: 'gray',
                      fontSize: '0.85rem',
                      margin: '0.5rem 0',
                    }}
                  >
                    No profiles available at the moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileNavbarView}>
        <div
          onClick={() => router.push('/dashboard')}
          className={styles.mobileNavbarView__icon}
        >
          <svg
            onClick={() => router.push('/dashboard')}
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
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
            onClick={() => router.push('/discover')}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>

          <svg
            onClick={() => router.push('/my_connections')}
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
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
