import React, { useEffect } from 'react';
import UserLayout from '../../layout/UserLayout';
import DashboardLayout from '../../layout/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers } from '../../config/redux/action/authAction';
import { BASE_URL } from '../../config';
import styles from './index.module.css';
import { useRouter } from 'next/router';

export default function DiscoverPage({ params }) {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const { username } = params || router.query;

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const usersList = authState?.all_users || authState?.all_profiles || [];

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

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.discoverContainer}>
          <h1>Discover</h1>

          <div className={styles.allUserProfiles}>
            {usersList.length === 0 ? (
              <p className={styles.noUsersText}>No profiles discovered yet.</p>
            ) : (
              usersList.map((user, index) => {
                const imagePath =
                  user?.userId?.profilePicture ||
                  user?.profilePicture ||
                  user?.profile?.profilePicture ||
                  user?.user?.profilePicture;
                const name = user?.userId?.name || user?.name || 'User';
                const rawUsername =
                  user?.userId?.username || user?.username || '';

                const username = String(rawUsername).replace(/\s+/g, '').trim();

                const profileImageSrc = resolveProfileImage(imagePath);

                if (!username) return null;

                return (
                  <div
                    onClick={() => {
                      router.push(`/view_profile/${username}`);
                    }}
                    key={user._id || `user-${index}`}
                    className={styles.userCard}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      className={styles.userCard__image}
                      src={profileImageSrc}
                      alt={`${name}'s Profile`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/default.jpg';
                      }}
                    />
                    <div className={styles.userCard__details}>
                      <h2>{name}</h2>
                      <p>@{username}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
