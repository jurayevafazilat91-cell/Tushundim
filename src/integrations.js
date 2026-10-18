import crypto from 'node:crypto';
import {User,Invite,Activity,Outbox,Attempt,BotState} from './models.js';
export const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
export async function record(user,type,text){
 await Activity.create({userId:user._id,type,text});
 if(user.parentId){const p=await User.findById(user.parentId);if(p?.telegramEnabled&&!p.blocked)await Outbox.create({parentId:p._id,childId:user._id,text:`TUSHUNDIM • ${user.name}\n${text}\n${new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent',dateStyle:'short',timeStyle:'short'}).format(new Date())}`});}
}
export async function telegram(method,body){
 const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw new Error('Telegram sozlanmagan');
 const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});const d=await r.json();if(!r.ok||!d.ok)throw new Error('Telegram xizmati javob bermadi');return d.result;
}
export async function handleUpdate(update){
 const m=update.message;if(!m||m.chat.type!=='private')return;const chatId=String(m.chat.id),text=m.text||'';
 if(text.startsWith('/start ')){
  const code=text.split(' ')[1];const invite=await Invite.findOneAndDelete({token:hash(code),kind:'telegram',expires:{$gt:new Date()}});
  if(!invite){await telegram('sendMessage',{chat_id:chatId,text:'Kod eskirgan. Saytdan yangi ulash havolasini oling.'});return;}
  // One Telegram account must not receive a different family's reports.
  await User.updateMany({telegramChat:chatId},{$unset:{telegramChat:1},$set:{telegramEnabled:false}});
  const parent=await User.findOneAndUpdate({_id:invite.userId,role:'parent',blocked:false},{$set:{telegramChat:chatId,telegramEnabled:true}});
  await telegram('sendMessage',{chat_id:chatId,text:parent?'Ulandi! Farzandingizning sayt ichidagi o‘qish faoliyati va test natijalari shu yerga keladi. /report — hisobot, /stop — xabarlarni to‘xtatish.':'Hisob topilmadi.'});return;
 }
 const parent=await User.findOne({telegramChat:chatId,role:'parent',blocked:false}).select('+telegramChat');
 if(text==='/stop'){if(parent)await User.updateOne({_id:parent._id},{$set:{telegramEnabled:false},$unset:{telegramChat:1}});await telegram('sendMessage',{chat_id:chatId,text:'Xabarlar o‘chirildi. Qayta ulash uchun saytdan yangi havola oling.'});return;}
 if(text==='/report'&&parent){const children=await User.find({parentId:parent._id});const lines=await Promise.all(children.map(async c=>{const a=await Attempt.find({userId:c._id,status:'done'}).sort({finishedAt:-1}).limit(1);return `${c.name}: ${a.length?`${a[0].score}/${a[0].total} — oxirgi test`:'hali test topshirmagan'}`;}));await telegram('sendMessage',{chat_id:chatId,text:lines.join('\n')||'Hali farzand ulanmagan.'});return;}
 await telegram('sendMessage',{chat_id:chatId,text:'TUSHUNDIM botiga xush kelibsiz! Ota-ona panelidagi «Telegram ulash» tugmasi orqali ulang. /report — hisobot, /stop — to‘xtatish.'});
}
export async function flushOutbox(){
 const jobs=await Outbox.find({status:'pending',nextAt:{$lte:new Date()}}).sort({createdAt:1}).limit(20);
 for(const job of jobs){const p=await User.findById(job.parentId).select('+telegramChat');if(!p?.telegramEnabled||!p.telegramChat||p.blocked||!await User.exists({_id:job.childId,parentId:job.parentId})){job.status='cancelled';await job.save();continue;}
 try{await telegram('sendMessage',{chat_id:p.telegramChat,text:job.text});job.status='sent';job.error=undefined;}catch{job.tries++;job.error='Telegramga yuborish amalga oshmadi';job.status=job.tries>=5?'failed':'pending';job.nextAt=new Date(Date.now()+Math.min(3600,30*2**job.tries)*1000);}await job.save();}
}
export async function runBot(signal){
 let offset=(await BotState.findById('poll'))?.offset||0;
 while(!signal.aborted){try{const updates=await telegram('getUpdates',{offset,timeout:20,allowed_updates:['message']});for(const u of updates){await handleUpdate(u);offset=u.update_id+1;await BotState.findByIdAndUpdate('poll',{offset},{upsert:true});}await flushOutbox();}catch{console.warn('Telegram ulanishini tekshiring; qayta uriniladi.');await new Promise(r=>setTimeout(r,5000));}}
}
export async function askAI(messages){
 if(!process.env.OPENAI_API_KEY)throw Object.assign(new Error('AI hali ulanmagan. Administrator OPENAI_API_KEY ni sozlashi kerak. Darslar va testlar ishlayveradi.'),{status:503});
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:700,instructions:'Sen Tushundim platformasining o‘zbek tilidagi mehribon matematika ustozisan. Foydalanuvchi maktab o‘quvchisi. Faqat ta’limga yordam ber. Tayyor javobni darrov bermasdan kichik ishoralar va bitta-bitta savol bilan tushuntir. Shaxsiy ma’lumot, telefon yoki manzil so‘rama. Hech qanday vosita yoki hisob boshqarish huquqing yo‘q. O‘zingni inson deb tanishtirma. Noaniq bo‘lsa ayt. Xavfli yoki yoshga mos bo‘lmagan topshiriqlarni bajarma. Savol-javob o‘yinida avval bitta savol ber, javobni kut, keyin muloyim tekshir.',input:messages.map(m=>({role:m.role,content:m.content}))})});
 if(!r.ok)throw Object.assign(new Error('AI xizmati hozir javob bermadi. Keyinroq urinib ko‘ring.'),{status:502});const d=await r.json();const text=(d.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');if(!text)throw Object.assign(new Error('AI javobi bo‘sh keldi.'),{status:502});return text;
}
