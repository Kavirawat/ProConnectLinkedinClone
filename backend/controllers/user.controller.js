import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import ConnectionRequest from '../models/connection.model.js';
import path from 'path';
import Connection from 'mongoose';
import Post from '../models/posts.model.js';
import fs from 'fs';

const convertUserDataToPDF = async (userData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
      });

      const outputPath = crypto.randomBytes(32).toString('hex') + '.pdf';
      const fullPath = path.join('uploads', outputPath);

      const stream = fs.createWriteStream(fullPath);
      doc.pipe(stream);

      // --- PREMIUM EXECUTIVE COLOR PALETTE ---
      const NAVY_DARK = '#0F172A';
      const ACCENT_GOLD = '#0284C7';
      const TEXT_MAIN = '#1E293B';
      const TEXT_MUTED = '#64748B';
      const BORDER_COLOR = '#E2E8F0';

      // --- TOP HERO HEADER BLOCK ---
      doc.rect(0, 0, 595, 140).fill(NAVY_DARK);

      const leftX = 45;
      const contentWidth = 505;

      // Header Text (Inside Navy Block)
      const name = userData.userId?.name || 'N/A';
      const currentPost = userData.currentPost || 'Professional Developer';
      const username = userData.userId?.username || 'N/A';
      const email = userData.userId?.email || 'N/A';

      doc
        .fillColor('#FFFFFF')
        .fontSize(26)
        .font('Helvetica-Bold')
        .text(name, leftX, 35);
      doc
        .fillColor(ACCENT_GOLD)
        .fontSize(13)
        .font('Helvetica')
        .text(currentPost.toUpperCase(), leftX, 68);

      // FIXED: Emojis hatakar clean visual labels lagaye taaki symbols crash na ho
      doc.fillColor('#94A3B8').fontSize(10).font('Helvetica');
      doc.text(`Email: ${email}   |   Username: @${username}`, leftX, 95);

      // --- PROFILE IMAGE SETUP (With clean alignment) ---
      if (userData.userId && userData.userId.profilePicture) {
        let rawPath = userData.userId.profilePicture;
        let imgPath = rawPath.startsWith('uploads')
          ? path.resolve(rawPath)
          : path.resolve(path.join('uploads', rawPath));

        if (!fs.existsSync(imgPath)) {
          imgPath = path.resolve(path.join('uploads', 'default.jpg'));
        }

        if (fs.existsSync(imgPath)) {
          // Top right corners ke pass photo border background frame ke sath fit kiya
          doc.rect(448, 28, 104, 104).fill('#FFFFFF');
          doc.image(imgPath, 450, 30, { width: 100, height: 100 });
        }
      }

      // Base Y coordinate setup for body contents
      let currentY = 180;

      // --- REUSABLE CLEAN SECTION HEADERS ---
      const createSection = (title) => {
        doc.y = currentY;
        doc
          .fillColor(NAVY_DARK)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(title, leftX, currentY);

        // Dynamic bottom sleek borderline accent
        doc
          .moveTo(leftX, doc.y + 4)
          .lineTo(550, doc.y + 4)
          .strokeColor(BORDER_COLOR)
          .lineWidth(1)
          .stroke();

        doc.moveDown(1.2);
        currentY = doc.y;
      };

      // --- PROFESSIONAL SUMMARY / BIO ---
      if (userData.bio) {
        createSection('PROFILE SUMMARY');
        doc
          .fillColor(TEXT_MAIN)
          .fontSize(10.5)
          .font('Helvetica')
          .text(userData.bio, leftX, currentY, {
            width: contentWidth,
            align: 'justify',
            lineGap: 4,
          });
        doc.moveDown(1);
        currentY = doc.y;
      }

      // --- EXPERIENCE SECTION ---
      createSection('WORK EXPERIENCE');
      if (userData.pastWork && userData.pastWork.length > 0) {
        userData.pastWork.forEach((work) => {
          doc.y = currentY;

          // Company Title (Left Alignment)
          doc
            .fillColor(TEXT_MAIN)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(work.company || 'N/A', leftX, currentY);

          // Duration (Right Alignment)
          const yearText = work.years ? `${work.years} Years` : '';
          doc
            .fillColor(TEXT_MUTED)
            .fontSize(11)
            .font('Helvetica')
            .text(yearText, leftX, currentY, {
              align: 'right',
              width: contentWidth,
            });

          // Job Position Sub-tag
          doc.moveDown(0.2);
          doc
            .fillColor(ACCENT_GOLD)
            .fontSize(10.5)
            .font('Helvetica-Bold')
            .text(work.position || 'N/A', leftX);

          doc.moveDown(1.2);
          currentY = doc.y;
        });
      } else {
        doc
          .fillColor(TEXT_MUTED)
          .fontSize(11)
          .font('Helvetica')
          .text('No past work experience listed.', leftX, currentY);
        doc.moveDown(1);
        currentY = doc.y;
      }

      // --- EDUCATION SECTION ---
      createSection('EDUCATION');
      if (userData.education && userData.education.length > 0) {
        userData.education.forEach((edu) => {
          doc.y = currentY;

          // Institute Name
          doc
            .fillColor(TEXT_MAIN)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(edu.school || 'N/A', leftX, currentY);

          // Field / Years
          const duration = edu.fieldOfStudy || '';
          doc
            .fillColor(TEXT_MUTED)
            .fontSize(11)
            .font('Helvetica')
            .text(duration, leftX, currentY, {
              align: 'right',
              width: contentWidth,
            });

          // Degree Info
          doc.moveDown(0.2);
          doc
            .fillColor(TEXT_MAIN)
            .fontSize(11)
            .font('Helvetica')
            .text(edu.degree || 'N/A', leftX);

          doc.moveDown(1.2);
          currentY = doc.y;
        });
      } else {
        doc
          .fillColor(TEXT_MUTED)
          .fontSize(11)
          .font('Helvetica')
          .text('No education details listed.', leftX, currentY);
      }

      doc.end();

      stream.on('finish', () => resolve(fullPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const profile = new Profile({ userId: newUser._id });
    await profile.save();

    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User Does Not Exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = await crypto.randomBytes(32).toString('hex');

    await User.updateOne({ _id: user._id }, { token });
    return res.status(200).json({ message: 'Login Successful', token });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    const token = req.body.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication token missing!' });
    }

    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    }

    const userId = req.user?._id || req.body?.userId || user._id;
    const updateData = {};

    if (req.files && req.files['profile_picture']) {
      updateData.profilePicture = req.files['profile_picture'][0].path; 
    }

    if (req.files && req.files['cover_picture']) {
      updateData.coverPicture = req.files['cover_picture'][0].path;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded!' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Picture updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { email, username } = newUserData;
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [{ _id: { $ne: user._id } }, { $or: [{ username }, { email }] }],
      });
      if (existingUser)
        return res
          .status(400)
          .json({ message: 'Username or Email already taken' });
    }
    Object.assign(user, newUserData);
    await user.save();
    return res.status(200).json({ message: 'User updated' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const token = req.query?.token;

    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: 'User not found' });

    let userProfile = await Profile.findOneAndUpdate(
      { userId: user._id },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('userId', 'name username email profilePicture coverPicture');

    return res.json({
      success: true,
      profile: userProfile,
      user: {
        ...user.toObject(),
        bio: userProfile?.bio || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile_to_update = await Profile.findOne({ userId: user._id });
    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();
    return res.status(200).json({ message: 'User profile updated' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllUsersProfile = async (req, res) => {
  try {
    const profiles = await Profile.find({}).populate(
      'userId',
      'name username email profilePicture',
    );
    return res.status(200).json({ profiles });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const downloadResume = async (req, res) => {
  const user_id = req.query.id;

  try {
    if (!user_id)
      return res.status(400).json({ message: 'User ID is required' });
    const userProfile = await Profile.findOne({ userId: user_id }).populate(
      'userId',
      'name username email profilePicture',
    );
    if (!userProfile)
      return res.status(404).json({ message: 'Profile data not found' });

    let localSavedFilePath = await convertUserDataToPDF(userProfile);
    const absolutePath = path.resolve(localSavedFilePath);
    return res.download(absolutePath, 'Resume.pdf');
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body || req.query;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const connectionUser = await User.findById(connectionId);
    if (!connectionUser)
      return res
        .status(404)
        .json({ message: 'Connection target user not found' });

    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id,
    });
    if (existingRequest)
      return res
        .status(400)
        .json({ message: 'Connection request already sent' });

    const request = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
    });
    await request.save();
    return res.json({
      message: 'Request sent successfully',
      connection: request,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyConnectionRequest = async (req, res) => {
  const token = req.query?.token || req.body?.token;

  if (!token || token === 'undefined') {
    return res.status(400).json({ message: 'Valid token is required' });
  }
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connection = await ConnectionRequest.find({
      $or: [{ connectionId: user._id }, { userId: user._id }],
    })
      .populate('connectionId', 'name username email profilePicture')
      .populate('userId', 'name username email profilePicture');

    return res.json({ connections: connection });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserConnectionRequest = async (req, res) => {
  try {
    const loggedInUserId = req.user?._id || req.user?.id;

    if (!loggedInUserId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized: Access denied' });
    }

    const requests = await ConnectionRequest.find({
      $or: [{ userId: loggedInUserId }, { connectionId: loggedInUserId }],
      status_accepted: null,
    }).populate('userId connectionId', 'name username profilePicture');

    return res.status(200).json({
      success: true,
      connections: requests,
    });
  } catch (error) {
    console.error('Error in getUserConnectionRequestBackend:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const connection = await ConnectionRequest.findOne({ _id: requestId });
    if (!connection)
      return res.status(404).json({ message: 'Request not found' });

    if (!action_type || action_type === 'accept' || action_type === 'ACCEPT') {
      connection.status_accepted = true;
    } else {
      connection.status_accepted = false;
    }

    await connection.save();
    return res.json({ message: 'Request Updated', connection });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserProfileAndBasedOnUsername = async (req, res) => {
  try {
    const { username } = req.query;

    const loggedInUserId = req.user?._id || req.user?.id;

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: 'Username parameter is required' });
    }

    const targetUser = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
    }).select('-password');

    if (!targetUser) {
      return res.status(200).json({ notFound: true, username });
    }

    const profile = await Profile.findOne({ userId: targetUser._id });

    let connectionStatus = null;
    if (loggedInUserId) {
      connectionStatus = await ConnectionRequest.findOne({
        $or: [
          { userId: loggedInUserId, connectionId: targetUser._id },
          { userId: targetUser._id, connectionId: loggedInUserId },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      user: targetUser,
      profile: profile || null,
      connectionStatus: connectionStatus || null,
    });
  } catch (error) {
    console.error('Error in getUserProfileAndBasedOnUsername:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelConnectionRequest = async (req, res) => {
  try {
    const { connectionId, senderId } = req.body;

    if (!senderId) {
      return res
        .status(400)
        .json({ message: 'Sender ID (Aapki ID) zaroori hai.' });
    }
    if (!connectionId) {
      return res
        .status(400)
        .json({ message: 'Connection ID (Saamne wale ki ID) zaroori hai.' });
    }

    const deletedRequest = await ConnectionRequest.findOneAndDelete({
      userId: senderId,
      connectionId: connectionId,
      status_accepted: null,
    });

    if (!deletedRequest) {
      return res.status(404).json({
        message: 'Koi pending request nahi mili jise cancel kiya ja sake.',
      });
    }

    return res
      .status(200)
      .json({ message: 'Connection request successfully cancel ho gayi.' });
  } catch (error) {
    return res.status(500).json({ message: ' server Error' });
  }
};

export const updateBio = async (req, res) => {
  try {
    const { userId, bio, name, pastWork, education } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID missing.' });
    }

    if (name !== undefined) {
      await User.findByIdAndUpdate(userId, { name: name });
    }

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (pastWork !== undefined) updateData.pastWork = pastWork;
    if (education !== undefined) updateData.education = education;

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Profile collection save error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
