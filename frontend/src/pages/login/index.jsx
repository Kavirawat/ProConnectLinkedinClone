import React, { useEffect, useState } from 'react';
import UserLayout from '../../layout/UserLayout/index.jsx';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import styles from './style.module.css';
import { emptyMessage, reset } from '../../config/redux/reducer/authReducer/index.js';
import {
  registerUser,
  loginUser,
} from '../../config/redux/action//authAction/index.js';

function LoginComponent() {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const [isLogginMethod, setIsLogginMethod] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token && (authState?.loggedIn || authState?.user)) {
      router.replace('/dashboard');
    } else if (!token && (authState?.user || authState?.loggedIn)) {
      dispatch(reset());
    }
  }, [authState?.loggedIn, authState?.user, router, dispatch]);

  useEffect(() => {
    dispatch(emptyMessage());
  }, [isLogginMethod, dispatch]);

  const handleRegister = () => {
    console.log('Registering...');
    if (!email || !password || !username || !name) return;
    dispatch(registerUser({ username, name, email, password }));
  };

  const handleLogin = () => {
    console.log('Login user...');
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isLogginMethod) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  if (!isMounted) return null;

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <p className={styles.cardLeft_heading}>
              {isLogginMethod ? 'Sign In' : 'Sign Up'}
            </p>
            <p
              style={{
                color: authState?.isError ? 'red' : 'green',
                marginTop: '15px',
              }}
            >
              {typeof authState?.message?.message === 'object'
                ? authState?.message?.message?.message || 'An error occurred'
                : authState?.message?.message || ''}
            </p>
            <form onSubmit={handleSubmit} className={styles.inputContainer}>
              {!isLogginMethod && (
                <div className={styles.inputRow}>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.inputField}
                    placeholder="Enter Your Username"
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.inputField}
                    placeholder="Enter Your Name"
                  />
                </div>
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.inputField}
                placeholder="Enter Your Email"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputField}
                placeholder="Enter Your Password"
                type="password"
              />
              <button
                type="submit"
                className={styles.buttonOutLine}
                style={{
                  border: 'none',
                  font: 'inherit',
                  color: 'inherit',
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <p>{isLogginMethod ? 'Sign In' : 'Sign Up'}</p>
              </button>
            </form>
          </div>
          <div className={styles.cardContainer_right}>
            {isLogginMethod ? (
              <p>Don't Have An Account?</p>
            ) : (
              <p>Already Have An Account?</p>
            )}
            <div
              onClick={() => setIsLogginMethod(!isLogginMethod)}
              className={styles.buttonOutLine}
              style={{ color: 'black', textAlign: 'center' }}
            >
              <p>{isLogginMethod ? 'Sign Up' : 'Sign In'}</p>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default LoginComponent;
