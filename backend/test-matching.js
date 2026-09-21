import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

import Project from './models/Project.js';
import Student from './models/Student.js';
import { getRecommendations } from './services/aiService.js';

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Get any real project
    const project = await Project.findOne();
    if (!project) {
      console.log('No projects found in DB.');
      process.exit(0);
    }
    console.log(`Found Project: ${project.title}`);

    // 2. Get students excluding creator
    const students = await Student.find({ firebaseUid: { $ne: project.creatorFirebaseUid } });
    if (!students || students.length === 0) {
      console.log('No eligible students found in DB.');
      process.exit(0);
    }
    console.log(`Found ${students.length} eligible students.`);

    // 3. Prepare payload
    const projectPayload = {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      requiredSkills: project.requiredSkills,
      category: project.category,
      teamSize: project.teamSize,
      duration: project.duration || 'Not specified'
    };

    const studentsPayload = students.map(s => ({
      id: s.firebaseUid,
      name: s.name,
      skills: s.skills || [],
      interests: s.interests || [],
      experience: s.experience || 'Not specified',
      availability: s.availability || 'Not specified'
    }));

    console.log('Sending payload to AI Service...');
    const result = await getRecommendations(projectPayload, studentsPayload);
    
    console.log('--- AI Service Result ---');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

runTest();
