const express = require('express');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const storage = new Storage();
const firestore = new Firestore();

// Set project ID
const PROJECT_ID = 'streamshare-1dbdf';

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Video processor is running!');
});

// Process video endpoint (called by Pub/Sub)
app.post('/process-video', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    // Parse Pub/Sub message
    const message = req.body.message;
    if (!message) {
      console.log('No message found in request');
      return res.status(400).send('No message found');
    }
    
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    console.log('Parsed message data:', data);
    
    const { videoId, filePath, bucketName, userId } = data;
    
    if (!videoId || !filePath || !bucketName) {
      console.log('Missing required fields:', { videoId, filePath, bucketName });
      return res.status(400).send('Missing required fields');
    }
    
    // Download video from Cloud Storage
    console.log('Downloading video from:', bucketName, filePath);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const tempInputPath = `/tmp/${videoId}-input`;
    
    await file.download({ destination: tempInputPath });
    console.log('Video downloaded to:', tempInputPath);
    
    // Process video to different resolutions
    const resolutions = [
      { name: '360p', scale: '640:360' },
      { name: '720p', scale: '1280:720' }
    ];
    
    const processedVideos = [];
    
    for (const resolution of resolutions) {
      const outputPath = `/tmp/${videoId}_${resolution.name}.mp4`;
      
      console.log(`Processing ${resolution.name}...`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions([
            `-vf scale=${resolution.scale}`,
            '-c:v libx264',
            '-preset fast',
            '-c:a aac',
            '-b:a 128k'
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log(`Processing ${resolution.name}: ${progress.percent}% done`);
          })
          .on('end', () => {
            console.log(`Finished processing ${resolution.name}`);
            resolve();
          })
          .on('error', (err) => {
            console.error(`Error processing ${resolution.name}:`, err);
            reject(err);
          })
          .run();
      });
      
      // Upload processed video to processed bucket
      console.log(`Uploading ${resolution.name} to storage...`);
      const processedBucket = storage.bucket(`${PROJECT_ID}-processed-videos`);
      const processedFileName = `${videoId}_${resolution.name}.mp4`;
      const processedFile = processedBucket.file(processedFileName);
      
      await processedFile.save(fs.readFileSync(outputPath));
      console.log(`Uploaded ${resolution.name} successfully`);
      
      processedVideos.push({
        resolution: resolution.name,
        url: `https://storage.googleapis.com/${PROJECT_ID}-processed-videos/${processedFileName}`,
        fileName: processedFileName
      });
      
      // Clean up temp file
      fs.unlinkSync(outputPath);
    }
    
    // Update Firestore with processed video info
    console.log('Updating Firestore document...');
    await firestore.collection('videos').doc(videoId).update({
      status: 'processed',
      processedVideos: processedVideos,
      processedAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Video processing completed successfully');
    
    // Clean up original temp file
    fs.unlinkSync(tempInputPath);
    
    res.status(200).send({
      success: true,
      message: 'Video processed successfully',
      videoId: videoId,
      processedVideos: processedVideos
    });
    
  } catch (error) {
    console.error('Error processing video:', error);
    
    // Try to update Firestore with error status
    try {
      const message = req.body.message;
      if (message) {
        const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
        const { videoId } = data;
        
        if (videoId) {
          await firestore.collection('videos').doc(videoId).update({
            status: 'error',
            error: error.message,
            updatedAt: new Date()
          });
        }
      }
    } catch (firestoreError) {
      console.error('Error updating Firestore with error status:', firestoreError);
    }
    
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Video processor server running on port ${PORT}`);
  console.log('Ready to process videos!');
});