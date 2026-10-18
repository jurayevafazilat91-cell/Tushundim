import {test,before,after} from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import {createApp} from '../src/app.js';
import {User,Attempt,Session,Outbox,Chat,Order,Usage} from '../src/models.js';
import {handleUpdate,flushOutbox} from '../src/integrations.js';
import {makeQuestions,grade,dayKey} from '../src/learning.js';
let dbPath,mongo,app,student,parent,other,admin,studentId,parentId,tokenLink;
const headers={'X-Requested-With':'Tushundim','Origin':'http://localhost:3000'};
const send=(agent,url,body)=>agent.post('/api'+url).set(headers).send(body);
before(async()=>{process.env.APP_ORIGIN='http://localhost:3000';dbPath=await mkdtemp(path.resolve('.test-mongo-'));mongo=await MongoMemoryServer.create({instance:{dbPath,args:['--nounixsocket']}});await mongoose.connect(mongo.getUri());app=createApp();await Promise.all(Object.values(mongoose.models).map(m=>m.init()));student=request.agent(app);parent=request.agent(app);other=request.agent(app);admin=request.agent(app);});
after(async()=>{await mongoose.disconnect();await mongo?.stop();if(dbPath)await rm(dbPath,{recursive:true,force:true});});
test('registration, hashed passwords and protected admin creation',async()=>{
 let r=await send(student,'/auth/register',{name:'Fazliddin',email:'child@example.test',password:'StrongTest123!',role:'student',grade:6});assert.equal(r.status,201);studentId=r.body.user.id;assert.match(r.headers['set-cookie'][0],/HttpOnly/);assert.match(r.headers['set-cookie'][0],/SameSite=Strict/);
 const u=await User.findById(studentId).select('+password');assert.notEqual(u.password,'StrongTest123!');assert.equal(await bcrypt.compare('StrongTest123!',u.password),true);
 r=await send(parent,'/auth/register',{name:'Ota ona',email:'parent@example.test',password:'StrongTest123!',role:'parent'});assert.equal(r.status,201);parentId=r.body.user.id;
 assert.equal((await send(other,'/auth/register',{name:'Other',email:'other@example.test',password:'StrongTest123!',role:'parent'})).status,201);
 assert.equal((await send(request(app),'/auth/register',{name:'Intruder',email:'bad@example.test',password:'StrongTest123!',role:'admin'})).status,400);
 assert.equal((await request(app).get('/api/admin/stats')).status,401);
 assert.equal((await student.get('/api/admin/stats')).status,403);
 assert.equal((await send(student,'/auth/register',{name:'Again',email:'child@example.test',password:'StrongTest123!',role:'student'})).status,409);
});
test('reject CSRF, bad origin and invalid input',async()=>{
 assert.equal((await student.post('/api/family/code').send({})).status,403);
 assert.equal((await student.post('/api/family/code').set({...headers,Origin:'https://evil.example'}).send({})).status,403);
 assert.equal((await send(student,'/tests/start',{kind:'daily',topic:{$ne:''},level:1})).status,400);
 assert.equal((await send(request(app),'/auth/login',{email:'child@example.test',password:'bad'})).status,401);
});
test('single-use family pairing and ownership isolation',async()=>{
 const r=await send(student,'/family/code',{});assert.equal(r.status,200);
 assert.equal((await send(parent,'/family/link',{code:r.body.code})).status,200);
 assert.equal((await send(other,'/family/link',{code:r.body.code})).status,400);
 const family=await parent.get('/api/family');assert.equal(family.body[0].user.id,studentId);
 assert.deepEqual((await other.get('/api/family')).body,[]);
 assert.equal((await send(student,'/family/code',{})).status,409);
});
test('daily test hides answers, grades server-side and is idempotent',async()=>{
 const body={kind:'daily',topic:'fractions',level:1};const r=await send(student,'/tests/start',body);assert.equal(r.status,200);assert.equal(r.body.questions.length,10);assert.ok(!('answer'in r.body.questions[0]));assert.ok(!('explanation'in r.body.questions[0]));
 const again=await send(student,'/tests/start',{...body,topic:'equations'});assert.equal(again.body.id,r.body.id);
 const a=await Attempt.findById(r.body.id);const answers=a.questions.map(q=>q.answer);answers[0]+=100;
 const out=await send(student,`/tests/${r.body.id}/submit`,{answers});assert.equal(out.status,200);assert.equal(out.body.score,9);assert.equal(out.body.review[0].correct,false);
 assert.equal((await send(student,`/tests/${r.body.id}/submit`,{answers:a.questions.map(q=>q.answer)})).body.score,9);
 const d=await student.get('/api/dashboard');assert.equal(d.body.xp,90);assert.equal(d.body.tests,1);assert.equal(d.body.dailyDone,true);assert.equal(d.body.streak,1);
 assert.equal((await send(student,'/tests/start',body)).body.done,true);
 const family=await parent.get('/api/family');assert.equal(family.body[0].summary.xp,90);
 assert.equal((await parent.get('/api/tests/'+r.body.id)).status,403);
});
test('practice submissions cannot add points twice under concurrency',async()=>{
 const r=await send(student,'/tests/start',{kind:'practice',topic:'equations',level:3});const a=await Attempt.findById(r.body.id);const answers=a.questions.map(q=>q.answer);
 const results=await Promise.all([send(student,`/tests/${a._id}/submit`,{answers}),send(student,`/tests/${a._id}/submit`,{answers})]);assert.ok(results.every(x=>[200,409].includes(x.status)));assert.equal((await student.get('/api/dashboard')).body.xp,190);
});
test('lessons verify exercises and preference update is restricted',async()=>{
 assert.equal((await send(student,'/lessons/fractions/complete',{answer:2})).status,400);
 assert.equal((await send(student,'/lessons/fractions/complete',{answer:3})).status,200);
 const r=await student.patch('/api/me').set(headers).send({name:'Fazliddin',grade:7,topic:'percent',role:'admin'});assert.equal(r.status,200);assert.equal(r.body.user.role,'student');assert.equal(r.body.user.topic,'percent');
});
test('AI disabled mode is honest; enabled AI stores owner-only messages with quota',async()=>{
 let r=await send(student,'/chats',{title:'Test chat'});const cid=r.body._id;assert.equal(r.status,201);assert.equal((await send(student,`/chats/${cid}/messages`,{message:'Salom'})).status,503);assert.equal((await parent.get('/api/chats/'+cid)).status,403);
 const original=global.fetch;process.env.OPENAI_API_KEY='test-key';let count=0;
 global.fetch=async(url,opts)=>{assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(opts.body);assert.equal(body.store,false);assert.equal(body.input.at(-1).role,'user');count++;return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'Keling, avval 2 + 2 ni topamiz.'}]}]})};};
 try{for(let i=0;i<5;i++)assert.equal((await send(student,`/chats/${cid}/messages`,{message:'Savol '+i})).status,200);assert.equal((await send(student,`/chats/${cid}/messages`,{message:'Limit'})).status,429);assert.equal(count,5);assert.equal((await Chat.findById(cid)).messages.length,10);const acts=(await parent.get('/api/activities')).body;assert.ok(acts.some(a=>a.type==='ai'));assert.ok(!JSON.stringify(acts).includes('Keling, avval'));}finally{global.fetch=original;delete process.env.OPENAI_API_KEY;}
});
test('order approval enables correct family plan and cannot approve twice',async()=>{
 const au=await User.create({name:'Admin',email:'admin@example.test',password:await bcrypt.hash('AdminStrong123!',12),role:'admin'});await send(admin,'/auth/login',{email:au.email,password:'AdminStrong123!'});
 const r=await send(parent,'/orders',{plan:'family',reference:'test-transaction'});assert.equal(r.status,201);assert.equal((await parent.get('/api/me')).body.effectivePlan,'free');
 assert.equal((await send(parent,`/admin/orders/${r.body._id}/review`,{action:'approve'})).status,403);
 assert.equal((await send(admin,`/admin/orders/${r.body._id}/review`,{action:'approve'})).status,200);
 assert.equal((await parent.get('/api/me')).body.effectivePlan,'family');assert.equal((await student.get('/api/me')).body.entitlements.ai,60);
 assert.equal((await send(admin,`/admin/orders/${r.body._id}/review`,{action:'approve'})).status,409);
 assert.equal((await admin.get('/api/admin/stats')).body.revenue,79000);
});
test('Telegram deep link, queued activity and /stop with mocked provider',async()=>{
 process.env.TELEGRAM_BOT_TOKEN='test-token';process.env.TELEGRAM_BOT_USERNAME='TestTushundimBot';
 const r=await send(parent,'/telegram/link',{});assert.equal(r.status,200);tokenLink=new URL(r.body.url).searchParams.get('start');const sent=[];const original=global.fetch;
 global.fetch=async(url,opts)=>{sent.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>({ok:true,result:{message_id:1}})};};try{
 await handleUpdate({message:{chat:{id:123,type:'private'},text:'/start '+tokenLink}});assert.equal((await User.findById(parentId)).telegramEnabled,true);
 await send(student,'/auth/login',{email:'child@example.test',password:'StrongTest123!'});assert.equal(await Outbox.countDocuments({status:'pending'}),1);await flushOutbox();assert.equal(await Outbox.countDocuments({status:'sent'}),1);assert.ok(sent.at(-1).body.text.includes('Saytga kirdi'));
 await handleUpdate({message:{chat:{id:123,type:'private'},text:'/report'}});assert.ok(sent.at(-1).body.text.includes('Fazliddin'));
 await handleUpdate({message:{chat:{id:123,type:'private'},text:'/stop'}});assert.equal((await User.findById(parentId)).telegramEnabled,false);
 }finally{global.fetch=original;delete process.env.TELEGRAM_BOT_TOKEN;delete process.env.TELEGRAM_BOT_USERNAME;}
});
test('password rotation invalidates old sessions; blocked accounts lose access',async()=>{
 const stale=request.agent(app);await send(stale,'/auth/login',{email:'child@example.test',password:'StrongTest123!'});
 assert.equal((await send(student,'/me/password',{current:'StrongTest123!',password:'NewStrong123!'})).status,200);
 assert.equal((await stale.get('/api/me')).status,401);assert.equal((await student.get('/api/me')).status,200);
 assert.equal((await admin.patch('/api/admin/users/'+studentId).set(headers).send({blocked:true})).status,200);
 assert.equal((await student.get('/api/me')).status,401);
 assert.equal((await send(student,'/auth/login',{email:'child@example.test',password:'NewStrong123!'})).status,401);
 await admin.patch('/api/admin/users/'+studentId).set(headers).send({blocked:false});
});
test('question generators are deterministic, correct and date boundary is Tashkent',()=>{
 for(const topic of ['fractions','percent','equations','arithmetic']){const a=makeQuestions('seed',topic,3);assert.deepEqual(a,makeQuestions('seed',topic,3));assert.equal(grade(a,a.map(q=>q.answer)).filter(r=>r.correct).length,10);for(const q of a){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}}
 assert.equal(dayKey(new Date('2026-10-18T19:01:00Z')),'2026-10-19');
});
test('frontend DOM smoke: login, role pages, dark/light and interactive lesson',async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const {readFile}=await import('node:fs/promises');const source=await readFile('public/app.js','utf8');
 async function waitFor(check){const end=Date.now()+7000;while(Date.now()<end){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('DOM condition timed out');}
 async function openUI(email,password){const agent=request.agent(app),errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));const dom=new JSDOM('<!doctype html><html data-theme="dark"><body><div id="app"></div><div id="toast"></div><div id="modal"></div></body></html>',{url:'http://localhost:3000/#/login',runScripts:'outside-only',virtualConsole:vc});const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async(url,opts={})=>{const method=(opts.method||'GET').toLowerCase();let req=agent[method](url).set(opts.headers||{});if(opts.body)req=req.send(JSON.parse(opts.body));const r=await req;return {ok:r.status<400,status:r.status,json:async()=>r.body};};w.eval(source);await waitFor(()=>w.document.querySelector('#auth-form'));const f=w.document.querySelector('#auth-form');f.email;f.querySelector('[name=email]').value=email;f.querySelector('[name=password]').value=password;f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await waitFor(()=>w.document.querySelector('#view h1'));return {dom,w,errors};}
 const studentUI=await openUI('child@example.test','NewStrong123!');let {w}=studentUI;assert.match(w.document.querySelector('#view').textContent,/Salom/);w.document.querySelector('.theme').click();assert.equal(w.document.documentElement.dataset.theme,'light');
 const studentRoutes=['learn','map','history','test','family','plans','settings','ai'];for(const page of studentRoutes){w.location.hash='/app/'+page;await waitFor(()=>w.document.querySelector('#view')&&!w.document.querySelector('#view .loading')&&w.document.querySelector('.sidenav a.active')?.getAttribute('href')==='#/app/'+page);assert.ok(!w.document.querySelector('#view').textContent.includes('Ma’lumotni yuklab bo‘lmadi'),page);}
 w.location.hash='/app/learn/fractions';await waitFor(()=>w.document.querySelector('.segment'));const seg=w.document.querySelectorAll('.segment');seg[0].click();seg[1].click();seg[2].click();w.document.querySelector('#lesson-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await waitFor(()=>w.document.querySelector('#lesson-feedback')?.textContent.includes('To‘g‘ri'));assert.deepEqual(studentUI.errors,[]);studentUI.dom.window.close();
 for(const [email,password,pages] of [['parent@example.test','StrongTest123!',['family','activity','telegram','plans','settings']],['admin@example.test','AdminStrong123!',['users','orders','system','settings']]]){const ui=await openUI(email,password);for(const page of pages){ui.w.location.hash='/app/'+page;await waitFor(()=>ui.w.document.querySelector('#view')&&!ui.w.document.querySelector('#view .loading')&&ui.w.document.querySelector('.sidenav a.active')?.getAttribute('href')==='#/app/'+page);assert.ok(!ui.w.document.querySelector('#view').textContent.includes('Ma’lumotni yuklab bo‘lmadi'),page);}assert.deepEqual(ui.errors,[]);ui.dom.window.close();}
});
