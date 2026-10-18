import crypto from 'node:crypto';
export const topics={fractions:'Kasrlar',percent:'Foizlar',equations:'Tenglamalar',arithmetic:'Arifmetika'};
export function dayKey(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export const plans={free:{name:'Boshlang‘ich',price:0,children:1,ai:5},plus:{name:'O‘sish',price:39000,children:1,ai:40},family:{name:'Oila',price:79000,children:4,ai:60}};
export function activePlan(u){return u.plan!=='free'&&u.planUntil&&new Date(u.planUntil)>new Date()?u.plan:'free';}
export function makeQuestions(seed,topic,level=1,count=10){
 let n=crypto.createHash('sha256').update(seed).digest().readUInt32LE(0);const rand=(min,max)=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return min+n%(max-min+1);};
 return Array.from({length:count},(_,i)=>{let prompt,answer,explanation;const a=rand(2,7+level*3),b=rand(2,9),c=rand(2,5);
 if(topic==='fractions'){prompt=`${a}/${b} + ${c}/${b} = ? (suratini yozing, maxraj ${b})`;answer=a+c;explanation=`Maxrajlar bir xil: suratlarni qo‘shamiz. ${a} + ${c} = ${answer}. Natija ${answer}/${b}.`;}
 else if(topic==='percent'){const p=[10,20,25,50][rand(0,3)],base=a*20;prompt=`${base} ning ${p}% i nechaga teng?`;answer=base*p/100;explanation=`Foiz — yuzdan bir ulush. ${base} × ${p} ÷ 100 = ${answer}.`;}
 else if(topic==='equations'){const x=rand(1,10+level*5);prompt=`${a}x + ${b} = ${a*x+b}. x = ?`;answer=x;explanation=`Avval ikkala tomondan ${b} ni ayiramiz, keyin ${a} ga bo‘lamiz. x = ${x}.`;}
 else {prompt=`${a} × ${b} + ${c} = ?`;answer=a*b+c;explanation=`Avval ko‘paytirish: ${a} × ${b} = ${a*b}. Keyin ${c} ni qo‘shamiz: ${answer}.`;}
 const set=new Set([answer]);while(set.size<4)set.add(answer+rand(-8,9));const options=[...set];for(let j=3;j>0;j--){const k=rand(0,j);[options[j],options[k]]=[options[k],options[j]];}
 return {id:i,prompt,options,answer,explanation,skill:topic};
 });
}
export function grade(questions,answers){return questions.map((q,i)=>({prompt:q.prompt,answer:q.answer,given:answers[i],correct:answers[i]===q.answer,explanation:q.explanation}));}
export const lessons=[
 {id:'fractions',title:'Kasrlar bilan do‘stlashamiz',duration:'5 daqiqa',tag:'Poydevor',text:'Kasr butunning bir qismini bildiradi. 3/8 degani — 8 ta teng bo‘lakning 3 tasi. Maxrajlar bir xil bo‘lsa, suratlar qo‘shiladi, maxraj o‘zgarmaydi.',example:'2/8 + 3/8 = 5/8',task:'Bo‘laklarni bosib 3/8 ni ko‘rsating.',target:3,denominator:8},
 {id:'percent',title:'Foizlar hayotda qayerda kerak?',duration:'6 daqiqa',tag:'Hayotiy matematika',text:'Foiz yuzdan bir ulushdir. 20% = 20/100. Narxning foizini topish uchun narxni foizga ko‘paytirib, 100 ga bo‘lamiz.',example:'200 000 so‘mning 20% i = 40 000 so‘m. Chegirmadan keyin: 160 000 so‘m.',task:'Foizni o‘zgartirib, chegirmadan keyingi narxni kuzating.'},
 {id:'equations',title:'Tenglama — muvozanat',duration:'7 daqiqa',tag:'Keyingi qadam',text:'Tenglikning ikki tomoni tarozi kabi teng turadi. Bir tomondan son ayirsak, ikkinchi tomondan ham aynan shu sonni ayiramiz.',example:'3x + 6 = 21 → 3x = 15 → x = 5',task:'3x + 6 = 21 tenglamasi uchun x ni tanlang.'},
 {id:'arithmetic',title:'Amallar tartibini eslaymiz',duration:'4 daqiqa',tag:'Boshlanish',text:'Avval qavs ichidagi amallar, keyin ko‘paytirish va bo‘lish, oxirida qo‘shish va ayirish bajariladi.',example:'4 + 3 × 2 = 4 + 6 = 10',task:'4 + 3 × 2 javobini kiriting.'}
];
