import React from 'react';
import styles from './styles.module.css';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

function NavbarComponent({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  const currentUsername =
    authState?.user?.username || authState?.user?.userId?.username || '';

  const currentName =
    authState?.user?.name || authState?.user?.userId?.name || 'User';

  const isLoggedIn = !!authState?.user;

  const handleProfileRedirect = () => {
    if (currentUsername) {
      router.push(`/view_profile/${currentUsername}`);
    } else {
      router.push('/profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h3
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer'}}
        >
          Pro Connect
        </h3>

        <div className={styles.navbarOptionContainer}>
          {isLoggedIn ? (
            <div
              style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}
            >
              <p>Hey, {currentName}</p>
              <p
                onClick={() => {
                  router.push('/profile');
                }}
                style={{ fontWeight: 'bold', cursor: 'pointer' }}
              >
                Profile
              </p>
              <p
                onClick={handleLogout}
                style={{
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#ef4444',
                }}
              >
                Logout
              </p>
            </div>
          ) : (
            <div
              onClick={() => router.push('/login')}
              className={styles.buttonJoin}
            >
              <p>Be a part</p>
            </div>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}

export default NavbarComponent;
