import 'dotenv/config';
import mongoose from 'mongoose';
import {createApp} from './app.js';
import {runBot} from './integrations.js';
if(!process.env.MONGODB_URI){console.error('MONGODB_URI yo‘q. .env.example ni .env ga nusxalang.');process.exit(1);}
await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
const controller=new AbortController();
const server=createApp().listen(Number(process.env.PORT)||3000,()=>console.log(`TUSHUNDIM: ${process.env.APP_ORIGIN||'http://localhost:3000'}`));
if(process.env.TELEGRAM_BOT_TOKEN)runBot(controller.signal).catch(()=>console.error('Bot to‘xtadi.'));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{controller.abort();server.close(async()=>{await mongoose.disconnect();process.exit(0);});setTimeout(()=>process.exit(0),5000).unref();});
