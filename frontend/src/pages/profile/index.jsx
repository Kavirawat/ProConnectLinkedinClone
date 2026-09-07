import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL } from '../../config';
import UserLayout from '../../layout/UserLayout';
import DashboardLayout from '../../layout/DashboardLayout';
import ProfileImageUploader from '../../Components/ProfileImageUploader.jsx';
import BackdropImageUploader from '../../Components/BackdropImageUploader.jsx';
import {
  getAboutUser,
  getAllUsers,
  updateProfileBio,
} from '../../config/redux/action/authAction/index.js';
import { getAllPosts } from '../../config/redux/action/postAction/index.js';
import styles from './style.module.css';
import { reset } from '../../config/redux/reducer/authReducer/index.js';

const DEFAULT_AVATAR = '/images/profile.png';
const DEFAULT_COVER = '/images/nature.jpg';
const STABLE_SVG_COVER = '/images/nature.jpg';

export default function ProfilePage({ userProfile, serverAllPosts = [] }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const authState = useSelector((state) => state?.auth) || {};
  const postReducer = useSelector((state) => state?.posts) || {};

  const [isMounted, setIsMounted] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [activeBio, setActiveBio] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [activeName, setActiveName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workHistoryList, setWorkHistoryList] = useState([]);

  const [educationList, setEducationList] = useState([]);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [educationInput, setEducationInput] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
  });

  const handleEducationInputChange = (e) => {
    const { name, value } = e.target;
    setEducationInput({ ...educationInput, [name]: value });
  };

  const [userProfileState, setUserProfileState] = useState(() => {
    if (
      typeof userProfile !== 'undefined' &&
      userProfile &&
      Object.keys(userProfile).length > 0
    ) {
      return (
        userProfile?.profile || userProfile?.data?.profile || userProfile || {}
      );
    }
    return {};
  });

  const [inputData, setInputData] = useState({
    company: '',
    position: '',
    years: '',
  });

  const handleWorkInputChange = (e) => {
    const { name, value } = e.target;
    setInputData({ ...inputData, [name]: value });
  };

  const profileData = useMemo(() => {
    const serverProfile =
      userProfile?.profile || userProfile?.data?.profile || userProfile;
    const reduxProfile =
      authState?.userProfile?.profile ||
      authState?.userProfile ||
      authState?.user;

    if (serverProfile && Object.keys(serverProfile).length > 0)
      return serverProfile;
    if (reduxProfile && Object.keys(reduxProfile).length > 0)
      return reduxProfile;
    return userProfileState || {};
  }, [userProfileState, userProfile, authState?.user, authState?.userProfile]);

  useEffect(() => {
    if (authState?.isLoading) {
      return;
    }

    const loggedInId =
      authState?.user?._id ||
      authState?.user?.id ||
      authState?.user?.userId?._id ||
      null;

    const rawData =
      authState?.userProfile ||
      authState?.user ||
      profileData ||
      userProfileState ||
      {};

    const profilesArray = authState?.all_users || rawData?.profiles || [];

    let activeProfileObj = null;

    if (
      Array.isArray(profilesArray) &&
      profilesArray.length > 0 &&
      loggedInId
    ) {
      activeProfileObj = profilesArray.find(
        (p) => (p?.userId?._id || p?.userId || p?._id) === loggedInId,
      );
    }

    if (!activeProfileObj) {
      activeProfileObj = rawData?.profile || rawData || {};
    }

    // Work items extraction
    const persistedDatabaseData =
      activeProfileObj?.pastWork ||
      activeProfileObj?.profile?.pastWork ||
      authState?.user?.pastWork ||
      authState?.user?.profile?.pastWork ||
      [];

    // Education items extraction
    const persistedEducationData =
      activeProfileObj?.education ||
      activeProfileObj?.profile?.education ||
      authState?.user?.education ||
      authState?.user?.profile?.education ||
      [];

    if (Array.isArray(persistedDatabaseData)) {
      setWorkHistoryList(persistedDatabaseData);
    }
    if (Array.isArray(persistedEducationData)) {
      setEducationList(persistedEducationData);
    }
  }, [
    authState?.user,
    authState?.userProfile,
    authState?.all_users,
    authState?.isLoading,
    profileData,
    userProfileState,
  ]);

  useEffect(() => {
    const serverSideProfile =
      userProfile?.profile || userProfile?.data?.profile || userProfile;
    const reduxSideProfile =
      authState?.userProfile?.profile ||
      authState?.userProfile ||
      authState?.user;

    if (reduxSideProfile && Object.keys(reduxSideProfile).length > 0) {
      setUserProfileState(reduxSideProfile);
    } else if (serverSideProfile && Object.keys(serverSideProfile).length > 0) {
      setUserProfileState(serverSideProfile);
    }
  }, [userProfile, authState?.userProfile, authState?.user]);

  useEffect(() => {
    setIsMounted(true);
    dispatch(getAllPosts());
    dispatch(getAllUsers());

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch(getAboutUser({ token }));
    }
  }, [dispatch]);

  const displayName = useMemo(() => {
    return (
      profileData?.user?.name ||
      profileData?.profile?.name ||
      profileData?.name ||
      authState?.user?.name ||
      'User'
    );
  }, [profileData, authState?.user]);

  useEffect(() => {
    if (displayName) {
      setActiveName(displayName);
      if (!isEditingName) setNameInput(displayName);
    }
  }, [displayName, isEditingName]);

  const currentUserId = useMemo(() => {
    const activeUser = authState?.user || {};
    return (
      activeUser?._id ||
      activeUser?.id ||
      activeUser?.userId?._id ||
      profileData?.user?._id ||
      profileData?._id ||
      null
    );
  }, [authState, profileData]);

  const handleNameSave = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !nameInput.trim()) return;

    try {
      await dispatch(
        updateProfileBio({
          userId: currentUserId,
          name: nameInput.trim(),
          pastWork: workHistoryList,
          education: educationList,
          token: token,
        }),
      );
      setActiveName(nameInput.trim());
      setIsEditingName(false);
      dispatch(getAboutUser({ token }));
    } catch (error) {
      console.error('Name update failed:', error);
      setIsEditingName(false);
    }
  };

  const targetUsername = useMemo(() => {
    const queryUser = router.query?.username;
    if (queryUser) return String(queryUser).trim().toLowerCase();

    const rawUser = profileData?.user?.username || profileData?.username || '';
    return String(rawUser).trim().toLowerCase();
  }, [router.query?.username, profileData]);

  const loggedInUsername = useMemo(() => {
    const userObj = authState?.user || {};
    const rawUser =
      userObj?.username ||
      userObj?.userId?.username ||
      userObj?.user?.username ||
      null;
    return rawUser ? String(rawUser).trim().toLowerCase() : null;
  }, [authState]);

  const showUploadButtons = useMemo(() => {
    if (!isMounted) return false;
    if (!loggedInUsername || !targetUsername) return false;
    return loggedInUsername === targetUsername;
  }, [loggedInUsername, targetUsername, isMounted]);

  const displayBio = useMemo(() => {
    const rawBio =
      authState?.user?.bio ||
      authState?.user?.profile?.bio ||
      profileData?.user?.bio ||
      profileData?.profile?.bio ||
      profileData?.bio ||
      userProfile?.profile?.bio ||
      userProfile?.bio ||
      '';
    return rawBio && String(rawBio).trim() !== ''
      ? String(rawBio).trim()
      : 'Bio is not available';
  }, [profileData, userProfile, authState?.user]);

  useEffect(() => {
    if (displayBio && displayBio !== 'Bio is not available') {
      setActiveBio(displayBio);
      if (!isEditingBio) {
        setBioInput(displayBio);
      }
    } else {
      setActiveBio('Bio is not available');
      if (!isEditingBio) {
        setBioInput('');
      }
    }
  }, [displayBio, isEditingBio]);

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
    const rawSrc =
      profileData?.user?.profilePicture ||
      profileData?.profilePicture ||
      profileData?.profile?.profilePicture;
    return resolveAssetUrl(rawSrc, DEFAULT_AVATAR);
  }, [profileData, resolveAssetUrl]);

  const coverUrl = useMemo(() => {
    const rawSrc =
      profileData?.user?.coverPicture ||
      profileData?.coverPicture ||
      profileData?.profile?.coverPicture;
    return resolveAssetUrl(rawSrc, DEFAULT_COVER);
  }, [profileData, resolveAssetUrl]);

  const finalDisplayPosts = useMemo(() => {
    const stableRawPosts = postReducer?.posts || postReducer?.post || [];
    if (!Array.isArray(stableRawPosts)) return profileData?.posts || [];

    const filtered = stableRawPosts.filter((post) => {
      const postUsername =
        post?.userId?.username || post?.username || post?.user?.username;
      return (
        postUsername &&
        String(postUsername).trim().toLowerCase() === targetUsername
      );
    });

    return filtered.length > 0
      ? filtered
      : profileData?.profile?.posts || profileData?.posts || [];
  }, [postReducer, targetUsername, profileData]);

  const handleUploadSuccess = useCallback(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch(getAboutUser({ token }));
    }
  }, [dispatch]);

  const handleBioSave = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const baseObj = userProfileState?.profile || userProfileState || {};
    const existingPastWork = Array.isArray(baseObj?.pastWork)
      ? baseObj.pastWork
      : [];

    try {
      await dispatch(
        updateProfileBio({
          userId: currentUserId,
          bio: bioInput,
          pastWork: existingPastWork,
          token: token,
        }),
      );

      setActiveBio(bioInput);
      setIsEditingBio(false);
      dispatch(getAboutUser({ token }));
    } catch (error) {
      console.error('Bio save failed:', error);
      setBioInput(activeBio);
      setIsEditingBio(false);
    }
  };

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
                <BackdropImageUploader
                  userId={currentUserId}
                  onUploadSuccess={handleUploadSuccess}
                />
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
                  {displayName ? displayName.charAt(0) : 'U'}
                </div>
              )}

              {showUploadButtons && (
                <div className={styles.avatarUploadButtonWrapper}>
                  <ProfileImageUploader
                    userId={currentUserId}
                    onUploadSuccess={handleUploadSuccess}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.profilesContainer__details}>
            <div className={styles.profileContainer}>
              <div className={styles.profileContainer__left}>
                <div
                  className={styles.profileContainer__leftPart}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    minHeight: '40px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600',
                      }}
                    >
                      {activeName}
                    </h2>

                    {showUploadButtons && (
                      <span
                        onClick={() => {
                          setNameInput(activeName);
                          setIsEditingName(true);
                        }}
                        style={{
                          color: '#0070f3',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textDecoration: 'underline',
                        }}
                      >
                        ✏️Edit
                      </span>
                    )}
                  </div>
                </div>

                {isEditingName && (
                  <div
                    className={styles.commentsContainer}
                    onClick={() => setIsEditingName(false)}
                  >
                    <div
                      className={styles.allCommentsContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3
                        style={{
                          margin: '0 0 15px 0',
                          fontSize: '18px',
                          color: '#1e293b',
                          textAlign: 'center',
                        }}
                      >
                        Edit Display Name
                      </h3>

                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className={styles.inputField}
                        placeholder="Enter your name"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.8rem',
                          marginTop: '15px',
                          width: '100%',
                        }}
                      >
                        <button
                          onClick={handleNameSave}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#334155',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {targetUsername && (
                  <p
                    style={{
                      color: 'gray',
                    }}
                  >
                    {`@${targetUsername}`}
                  </p>
                )}

                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.8rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        color: '#1e293b',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {activeBio || 'Bio is not available'}
                    </div>

                    {showUploadButtons && (
                      <div
                        onClick={() => {
                          setBioInput(
                            activeBio === 'Bio is not available'
                              ? ''
                              : activeBio,
                          );
                          setIsEditingBio(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0070f3',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: 0,
                          textDecoration: 'underline',
                          fontWeight: '500',
                        }}
                      >
                        ✏️Edit
                      </div>
                    )}
                  </div>
                </div>

                {isEditingBio && (
                  <div
                    className={styles.commentsContainer}
                    onClick={() => setIsEditingBio(false)}
                  >
                    <div
                      className={styles.allCommentsContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3
                        style={{
                          margin: '0 0 15px 0',
                          fontSize: '18px',
                          color: '#1e293b',
                          textAlign: 'center',
                        }}
                      >
                        Edit Profile Bio
                      </h3>

                      <textarea
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        className={styles.inputField}
                        rows={4}
                        placeholder="Write something about yourself..."
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          outline: 'none',
                          boxSizing: 'border-box',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.8rem',
                          marginTop: '15px',
                          width: '100%',
                        }}
                      >
                        <button
                          onClick={handleBioSave}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingBio(false)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#334155',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.profileContainer__right}>
                <h3 style={{ marginBottom: '10px' }}>
                  Recent Activity ({finalDisplayPosts.length})
                </h3>
                <div className={styles.card__profileContainer2}>
                  {finalDisplayPosts.length > 0 ? (
                    finalDisplayPosts.map((post) => (
                      <div
                        key={post._id || Math.random().toString()}
                        className={styles.postCard}
                      >
                        <div className={styles.card}>
                          <div className={styles.card__profileContainer}>
                            {post.media && post.media !== '' ? (
                              <img
                                src={`${BASE_URL}/${post.media.replace(/\\/g, '/')}`}
                                alt="Post info element"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '3.4rem',
                                  height: '3.4rem',
                                  backgroundColor: '#e2e8f0',
                                  borderRadius: '50%',
                                }}
                              />
                            )}
                          </div>
                          <p>{post?.body || 'No text content available'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        textAlign: 'center',
                        color: 'gray',
                        fontSize: '13px',
                      }}
                    >
                      No posts available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.workHistory} style={{ marginTop: '20px' }}>
            <h4>Education</h4>

            <div className={styles.workHistoryContainer}>
              {(() => {
                const finalEduArray =
                  educationList.length > 0
                    ? educationList
                    : profileData?.education ||
                      profileData?.profile?.education ||
                      userProfileState?.education ||
                      userProfileState?.profile?.education ||
                      [];

                if (finalEduArray.length === 0) {
                  return (
                    <p style={{ color: 'gray', fontSize: '13px', margin: 0 }}>
                      No education details available.
                    </p>
                  );
                }

                return finalEduArray.map((edu, index) => (
                  <div
                    key={index}
                    className={styles.workHistorycard}
                    style={{
                      marginBottom: '12px',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        margin: '0 0 4px 0',
                        color: '#0f172a',
                      }}
                    >
                      {edu?.school} - {edu?.degree}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#64748b',
                      }}
                    >
                      {edu?.fieldOfStudy}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {showUploadButtons && (
              <button
                className={styles.addWorkHistory}
                onClick={() => setIsEducationModalOpen(true)}
                style={{
                  marginTop: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                Add Education
              </button>
            )}
          </div>

          {isEducationModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '12px',
                  width: '320px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    color: '#0f172a',
                    textAlign: 'center',
                  }}
                >
                  Add Education
                </h3>

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  School / University
                </label>
                <input
                  type="text"
                  name="school"
                  value={educationInput.school}
                  onChange={handleEducationInputChange}
                  placeholder="e.g. SRITS"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Degree
                </label>
                <input
                  type="text"
                  name="degree"
                  value={educationInput.degree}
                  onChange={handleEducationInputChange}
                  placeholder="e.g. B.TECH"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Years / Field of Study
                </label>
                <input
                  type="text"
                  name="fieldOfStudy"
                  value={educationInput.fieldOfStudy}
                  onChange={handleEducationInputChange}
                  placeholder="e.g. 2022-2026"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '20px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={() => setIsEducationModalOpen(false)}
                    style={{
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#334155',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !educationInput.school ||
                        !educationInput.degree ||
                        !educationInput.fieldOfStudy
                      ) {
                        return alert('Please fill all fields!');
                      }

                      const newEduItem = {
                        school: educationInput.school,
                        degree: educationInput.degree,
                        fieldOfStudy: String(educationInput.fieldOfStudy),
                      };

                      const updatedEduList = [...educationList, newEduItem];
                      setEducationList(updatedEduList);

                      try {
                        const token =
                          typeof window !== 'undefined'
                            ? localStorage.getItem('token')
                            : null;
                        if (!token)
                          return alert('Session expired, please login again.');

                        await dispatch(
                          updateProfileBio({
                            userId: currentUserId,
                            education: updatedEduList,
                            token: token,
                          }),
                        );

                        setUserProfileState((prevState) => ({
                          ...prevState,
                          education: updatedEduList,
                          profile: prevState?.profile
                            ? {
                                ...prevState.profile,
                                education: updatedEduList,
                              }
                            : undefined,
                        }));

                        setEducationInput({
                          school: '',
                          degree: '',
                          fieldOfStudy: '',
                        });
                        setIsEducationModalOpen(false);

                        dispatch(getAboutUser({ token }));
                        dispatch(getAllUsers());
                      } catch (error) {
                        console.error('Database sync error:', error);
                        alert('Database me save nahi ho paya!');
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#0070f3',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    Save Education
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.workHistory} style={{ marginTop: '20px' }}>
            <h4>Work History</h4>

            <div className={styles.workHistoryContainer}>
              {(() => {
                const finalArray =
                  workHistoryList.length > 0
                    ? workHistoryList
                    : profileData?.pastWork ||
                      profileData?.profile?.pastWork ||
                      userProfileState?.pastWork ||
                      userProfileState?.profile?.pastWork ||
                      [];

                if (finalArray.length === 0) {
                  return (
                    <p style={{ color: 'gray', fontSize: '13px', margin: 0 }}>
                      No work history available.
                    </p>
                  );
                }

                return finalArray.map((work, index) => (
                  <div
                    key={index}
                    className={styles.workHistorycard}
                    style={{
                      marginBottom: '12px',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        margin: '0 0 4px 0',
                        color: '#0f172a',
                      }}
                    >
                      {work?.company} - {work?.position}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#64748b',
                      }}
                    >
                      {work?.years}{' '}
                      {parseInt(work?.years) === 1 ? 'Year' : 'Years'}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {showUploadButtons && (
              <button
                className={styles.addWorkHistory}
                onClick={() => setIsModalOpen(true)}
                style={{
                  marginTop: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Add Work
              </button>
            )}
          </div>

          {isModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '12px',
                  width: '320px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    color: '#0f172a',
                  }}
                >
                  Add Work Experience
                </h3>

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={inputData.company}
                  onChange={handleWorkInputChange}
                  placeholder="e.g. Google"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                />

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Position / Title
                </label>
                <input
                  type="text"
                  name="position"
                  value={inputData.position}
                  onChange={handleWorkInputChange}
                  placeholder="e.g. CTO"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                />

                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Years of Experience
                </label>
                <input
                  type="text"
                  name="years"
                  value={inputData.years}
                  onChange={handleWorkInputChange}
                  placeholder="e.g. 3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '20px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#334155',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !inputData.company ||
                        !inputData.position ||
                        !inputData.years
                      ) {
                        return alert('Please fill all fields!');
                      }

                      const newWorkItem = {
                        company: inputData.company,
                        position: inputData.position,
                        years: String(inputData.years),
                      };

                      const updatedList = [...workHistoryList, newWorkItem];
                      setWorkHistoryList(updatedList);

                      try {
                        const token =
                          typeof window !== 'undefined'
                            ? localStorage.getItem('token')
                            : null;
                        if (!token)
                          return alert('Session expired, please login again.');

                        await dispatch(
                          updateProfileBio({
                            userId: currentUserId,
                            pastWork: updatedList,
                            token: token,
                          }),
                        );

                        setUserProfileState((prevState) => {
                          const base = prevState?.profile
                            ? prevState.profile
                            : prevState;
                          return prevState?.profile
                            ? {
                                ...prevState,
                                profile: { ...base, pastWork: updatedList },
                              }
                            : { ...prevState, pastWork: updatedList };
                        });

                        setInputData({ company: '', position: '', years: '' });
                        setIsModalOpen(false);

                        dispatch(getAboutUser({ token }));
                        dispatch(getAllUsers());
                      } catch (error) {
                        console.error('Database sync error:', error);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#0070f3',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    Save Experience
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* {isModalOpen && (
            <div
              onClick={() => {
                setIsModalOpen(false);
              }}
              className={styles.commentsContainer}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={styles.allCommentsContainer}
              >
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '18px',
                    color: '#1e293b',
                    textAlign: 'center',
                  }}
                >
                  Add Work Experience
                </h3>
                <input
                  onChange={handleWorkInputChange}
                  className={styles.inputField}
                  placeholder="Enter Your Company"
                  type="text"
                  name="company"
                />
                <input
                  onChange={handleWorkInputChange}
                  className={styles.inputField}
                  placeholder="Enter Your Position"
                  type="text"
                  name="position"
                />
                <input
                  onChange={handleWorkInputChange}
                  className={styles.inputField}
                  placeholder="Enter Years of Experience"
                  type="number"
                  name="years"
                />
                <button
                  onClick={async () => {
                    const token =
                      typeof window !== 'undefined'
                        ? localStorage.getItem('token')
                        : null;
                    if (!token) return;

                    const newWorkItem = {
                      company: inputData.company,
                      position: inputData.position,
                      years: String(inputData.years),
                    };

                    const currentBase =
                      userProfileState?.profile || userProfileState || {};
                    const previousPastWork = Array.isArray(
                      currentBase?.pastWork,
                    )
                      ? currentBase.pastWork
                      : [];

                    const updatedPastWorkArray = [
                      ...previousPastWork,
                      newWorkItem,
                    ];

                    try {
                      await dispatch(
                        updateProfileBio({
                          userId: currentUserId,
                          pastWork: updatedPastWorkArray,
                          token: token,
                        }),
                      );

                      setUserProfile((prevState) => {
                        if (prevState?.profile) {
                          return {
                            ...prevState,
                            profile: {
                              ...prevState.profile,
                              pastWork: updatedPastWorkArray,
                            },
                          };
                        }
                        return { ...prevState, pastWork: updatedPastWorkArray };
                      });

                      setInputData({ company: '', position: '', years: '' });
                      setIsModalOpen(false);

                      dispatch(getAboutUser({ token }));
                    } catch (error) {
                      console.error(
                        'Database persistence framework sync layer failed:',
                        error,
                      );
                    }
                  }}
                  style={{
                    padding: '10px',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Add Work
                </button>
              </div>
            </div>
          )} */}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
