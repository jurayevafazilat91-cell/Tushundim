import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {User} from '../src/models.js';
const {ADMIN_EMAIL,ADMIN_PASSWORD,MONGODB_URI}=process.env;
if(!MONGODB_URI||!ADMIN_EMAIL||!ADMIN_PASSWORD||ADMIN_PASSWORD.length<12){console.error('.env ichida MONGODB_URI, ADMIN_EMAIL va kamida 12 belgili ADMIN_PASSWORD kerak.');process.exit(1);}
await mongoose.connect(MONGODB_URI);
await User.init();
if(await User.exists({email:ADMIN_EMAIL.toLowerCase()})){console.error('Bu email mavjud. Tasodifiy rol ko‘tarish rad etildi. Boshqa admin email tanlang.');await mongoose.disconnect();process.exit(1);}
await User.create({name:'Administrator',email:ADMIN_EMAIL.toLowerCase(),password:await bcrypt.hash(ADMIN_PASSWORD,12),role:'admin'});
console.log('Admin yaratildi. ADMIN_PASSWORD ni .env dan olib tashlashingiz mumkin.');await mongoose.disconnect();
