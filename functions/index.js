const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onObjectFinalized} = require('firebase-functions/v2/storage');
const {beforeUserCreated} = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');
const {Storage} = require('@google-cloud/storage');
const {PubSub} = require('@google-cloud/pubsub');

admin.initializeApp();
const storage = new Storage();
const pubsub = new PubSub();

// Get project ID
const PROJECT_ID = process.env.GCLOUD_PROJECT;

// Simple test function
exports.helloWorld = onCall((request) => {
  return {message: "Hello from Firebase!"};
});

// Create user document when user signs up
exports.createUserDocument = beforeUserCreated(async (event) => {
  const user = event.data;
  const userDoc = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await admin.firestore().collection('users').doc(user.uid).set(userDoc);
  return;
});

// Generate signed URL for video upload
exports.generateUploadUrl = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const {fileName, contentType} = request.data;
  
  if (!fileName || !contentType) {
    throw new HttpsError('invalid-argument', 'fileName and contentType are required');
  }
  
  const bucket = storage.bucket(`${PROJECT_ID}-raw-videos`);
  const file = bucket.file(`${request.auth.uid}/${Date.now()}-${fileName}`);
  
  try {
    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });
    
    return {uploadUrl: signedUrl, filePath: file.name};
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new HttpsError('internal', 'Failed to generate upload URL');
  }
});

// Get all processed videos
exports.getVideos = onCall(async (request) => {
  try {
    const videosSnapshot = await admin.firestore()
      .collection('videos')
      .where('status', '==', 'processed')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    return videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new HttpsError('internal', 'Failed to fetch videos');
  }
});

// Get single video
exports.getVideo = onCall(async (request) => {
  const {videoId} = request.data;
  
  if (!videoId) {
    throw new HttpsError('invalid-argument', 'videoId is required');
  }
  
  try {
    const videoDoc = await admin.firestore().collection('videos').doc(videoId).get();
    
    if (!videoDoc.exists) {
      throw new HttpsError('not-found', 'Video not found');
    }
    
    return {id: videoDoc.id, ...videoDoc.data()};
  } catch (error) {
    console.error('Error fetching video:', error);
    throw new HttpsError('internal', 'Failed to fetch video');
  }
});

// Trigger when video is uploaded to Cloud Storage
exports.onVideoUpload = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const bucketName = event.data.bucket;
  
  // Only process videos from raw bucket
  if (bucketName !== `${PROJECT_ID}-raw-videos`) {
    console.log('Ignoring upload to non-raw bucket:', bucketName);
    return;
  }
  
  if (!filePath) {
    console.log('No file path found');
    return;
  }
  
  console.log('Processing video upload:', filePath);
  
  try {
    // Extract user ID and create video ID
    const pathParts = filePath.split('/');
    const userId = pathParts[0];
    const fileName = pathParts[pathParts.length - 1];
    const videoId = fileName.split('.')[0];
    
    // Create video document in Firestore
    const videoDoc = {
      id: videoId,
      fileName: fileName,
      filePath: filePath,
      userId: userId,
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      rawVideoPath: filePath,
      title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
      description: ''
    };
    
    await admin.firestore().collection('videos').doc(videoId).set(videoDoc);
    console.log('Created video document:', videoId);
    
    // Publish message to Pub/Sub for processing
    const topic = pubsub.topic('video-uploaded');
    const messageData = {
      videoId,
      filePath,
      bucketName,
      userId
    };
    
    await topic.publish(Buffer.from(JSON.stringify(messageData)));
    console.log('Published message to Pub/Sub:', messageData);
    
  } catch (error) {
    console.error('Error processing video upload:', error);
  }
});