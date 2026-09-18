/* ES-Interviu — reference content: pronunciation, grammar, survival phrases,
   the 18 interview questions, the model story and the final exam.
   Source: Teacher's Guide & Answer Bank + Final Mock Exam marking guide. */
window.REF = {
pron: [
 ["a","'a' in father","casă (house)","KA-suh"],
 ["ă","'a' in about, 'uh'","bună (hello)","BOO-nuh"],
 ["â / î","a deeper 'uh', tongue pulled back","în (in), câine (dog)","un, KUY-neh"],
 ["c","'k', but 'ch' as in church before e/i","ce? cine?","cheh, CHEE-neh"],
 ["che / chi","hard 'k'","chelner (waiter)","KEL-nehr"],
 ["e","'e' in bed; 'ye' at the start of este, el, ea","este (is)","YES-teh"],
 ["g","'g' in go, but 'j' as in gem before e/i","ger (frost)","jehr"],
 ["ghe / ghi","hard 'g'","ghid (guide)","geed"],
 ["i","'ee'; a final short i is barely whispered","ani (years)","ahn(y)"],
 ["j","'s' in measure","jos (down)","zhos"],
 ["o","'o' in sort","opt (eight)","ohpt"],
 ["r","lightly rolled, like Spanish","repede (fast)","REH-peh-deh"],
 ["ș","'sh'","și (and)","shee"],
 ["ț","'ts' in cats","țară (country)","TSA-ruh"],
 ["u","'oo' in food","unu (one)","OO-noo"]
],
pronRules: ["Every letter is pronounced.","Stress usually falls on the next-to-last syllable.","CAPITALS in this app mark the stressed syllable."],

survival: [
 {ro:"Nu am înțeles.", pr:"noo ahm un-tseh-LES", en:"I didn't understand."},
 {ro:"Puteți repeta, vă rog?", pr:"poo-TETS reh-peh-TA vuh rohg", en:"Can you repeat, please?"},
 {ro:"Mai încet, vă rog.", pr:"my un-CHET vuh rohg", en:"Slower, please."},
 {ro:"Ce înseamnă …?", pr:"cheh un-SYAM-nuh", en:"What does … mean?"},
 {ro:"Cum se spune … în română?", pr:"koom seh SPOO-neh … un ro-MU-nuh", en:"How do you say … in Romanian?"},
 {ro:"Un moment, vă rog.", pr:"oon mo-MENT vuh rohg", en:"One moment, please."},
 {ro:"Da / Nu / Poate", pr:"dah / noo / PWA-teh", en:"Yes / No / Maybe"},
 {ro:"Mulțumesc frumos.", pr:"mool-tsoo-MESK froo-MOS", en:"Thank you very much."},
 {ro:"Vorbesc puțin românește, dar înțeleg destul de bine.", pr:"vor-BESK poo-TSEEN ro-mu-NESH-teh dar un-tseh-LEG des-TOOL deh BEE-neh", en:"I speak a little Romanian, but I understand quite well."}
],

grammar: [
 {title:"The two essential verbs", rows:[
   ["","a fi — to be","a avea — to have"],
   ["I","eu sunt (soont)","eu am (ahm)"],
   ["you (informal)","tu ești (yesht)","tu ai (eye)"],
   ["he / she","el / ea este (YES-teh)","el / ea are (AH-reh)"],
   ["we","noi suntem (SOON-tem)","noi avem (ah-VEM)"],
   ["you (formal)","dumneavoastră sunteți (SOON-tets)","aveți (ah-VETS)"],
   ["they","ei / ele sunt","ei / ele au (ow)"]]},
 {title:"Verbs of daily life", rows:[
   ["","I …","you (formal) …"],
   ["a lucra — to work","lucrez (loo-KREZ)","lucrați (loo-KRATS)"],
   ["a locui — to live","locuiesc (lo-koo-YESK)","locuiți (lo-koo-EETS)"],
   ["a mânca — to eat","mănânc (muh-NUNK)","mâncați (mun-KATS)"],
   ["a bea — to drink","beau (byow)","beți (bets)"],
   ["a vorbi — to speak","vorbesc (vor-BESK)","vorbiți (vor-BEETS)"],
   ["a se trezi — to wake up","mă trezesc (muh treh-ZESK)","vă treziți (vuh treh-ZEETS)"],
   ["a se culca — to go to bed","mă culc (muh koolk)","vă culcați (vuh kool-KATS)"]]},
 {title:"Past tense in one move", note:"Everyday past = am + participle. Reflexive verbs take m-am + participle. Leaving out the m- is marked zero in the exam.", rows:[
   ["am lucrat","I worked",""],["am mâncat","I ate",""],["am băut","I drank",""],
   ["am dormit","I slept",""],["am venit","I came",""],["am fost","I was",""],
   ["m-am trezit","I woke up","reflexive"],["m-am culcat","I went to bed","reflexive"],
   ["m-am uitat","I watched","reflexive"],["m-am mutat","I moved house or country","reflexive"]]},
 {title:"'I like' — place or plac", note:"Singular thing or a verb takes place. Plural things take plac. Getting this wrong is an automatic zero in the exam.", rows:[
   ["Îmi place cafeaua.","I like coffee.","singular"],
   ["Îmi place să gătesc.","I like to cook.","verb"],
   ["Îmi plac sarmalele.","I like sarmale.","plural"],
   ["Nu-mi place peștele.","I don't like fish.","negative"],
   ["Îmi place foarte mult…","I really like…","stronger"]]},
 {title:"Gender endings", note:"Adjectives and participles agree with the speaker. Set yours in Settings and the app will use them everywhere.", rows:[
   ["man","căsătorit · necăsătorit · divorțat · singur · obosit · englez",""],
   ["woman","căsătorită · necăsătorită · divorțată · singură · obosită · englezoaică",""]]},
 {title:"Time: de, din, acum", note:"Length of time takes de. A start date, month or year takes din. 'Ago' takes acum. A wrong choice is an automatic zero.", rows:[
   ["Locuiesc în România de șase ani.","for six years","de + duration"],
   ["Sunt aici din două mii douăzeci.","since 2020","din + start point"],
   ["M-am mutat la Cluj acum un an.","a year ago","acum + duration"]]},
 {title:"Age: the de ani rule", note:"From 20 upwards Romanian inserts de before ani. Under 20 it does not. Both mistakes are an automatic zero.", rows:[
   ["Am treizeci și cinci de ani.","I'm 35","20+ takes de"],
   ["Am nouăsprezece ani.","I'm 19","under 20, no de"],
   ["Sunt douăzeci și cinci de grade.","it's 25 degrees","same rule for degrees"]]},
 {title:"Formal or informal you", note:"The officer will almost certainly use dumneavoastră. Use it back.", rows:[
   ["dumneavoastră + plural verb","formal you","Aveți copii?"],
   ["tu","informal you","Ai copii?"]]}
],

numbers: [
 ["unu","1"],["doi","2"],["trei","3"],["patru","4"],["cinci","5"],["șase","6"],["șapte","7"],["opt","8"],["nouă","9"],["zece","10"],
 ["unsprezece","11"],["doisprezece","12"],["treisprezece","13"],["paisprezece","14"],["cincisprezece","15"],["șaisprezece","16"],
 ["șaptesprezece","17"],["optsprezece","18"],["nouăsprezece","19"],["douăzeci","20"],["treizeci","30"],["patruzeci","40"],
 ["cincizeci","50"],["șaizeci","60"],["șaptezeci","70"],["optzeci","80"],["nouăzeci","90"],["o sută","100"]
],

/* The 18 interview questions, with what a full-credit answer sounds like */
interview: [
 {ro:"Bună ziua! Ce mai faceți?", pr:"BOO-nuh ZEE-wah, cheh my FA-chets", en:"Hello! How are you?", model:"Bună ziua! Foarte bine, mulțumesc. Dumneavoastră?", day:"1A"},
 {ro:"Cum vă numiți?", pr:"koom vuh noo-MEETS", en:"What is your name?", model:"Mă numesc… / Numele meu este… / Mă cheamă…", day:"1A"},
 {ro:"De unde sunteți?", pr:"deh OON-deh SOON-tets", en:"Where are you from?", model:"Sunt din… și sunt englez / englezoaică.", day:"1A"},
 {ro:"Câți ani aveți?", pr:"kuts ahn ah-VETS", en:"How old are you?", model:"Am … de ani. — the officer is listening for the de.", day:"1B"},
 {ro:"Unde locuiți? Cu cine locuiți?", pr:"OON-deh lo-koo-EETS", en:"Where do you live? Who with?", model:"Locuiesc în…, la apartament. Locuiesc cu… / singur(ă).", day:"1B"},
 {ro:"De cât timp locuiți în România?", pr:"deh kut teemp lo-koo-EETS", en:"How long have you lived in Romania?", model:"Locuiesc aici de … ani. / Sunt aici din 20… / M-am mutat acum … ani.", day:"2A"},
 {ro:"De ce ați venit în România?", pr:"deh cheh ats veh-NEET", en:"Why did you come to Romania?", model:"Am venit pentru muncă / pentru familie / pentru studii.", day:"2A"},
 {ro:"Cu ce vă ocupați? Unde lucrați?", pr:"koo cheh vuh o-koo-PATS", en:"What do you do? Where do you work?", model:"Sunt… / Lucrez ca… / Lucrez la…", day:"2B"},
 {ro:"Vă place munca dumneavoastră?", pr:"vuh PLA-cheh MOON-ka", en:"Do you like your job?", model:"Da, îmi place foarte mult, pentru că este interesantă.", day:"2B"},
 {ro:"Sunteți căsătorit(ă)? Aveți copii?", pr:"SOON-tets kuh-suh-to-REET(uh)", en:"Are you married? Do you have children?", model:"Sunt căsătorit(ă). / Sunt singur(ă). Am / Nu am copii.", day:"5A"},
 {ro:"Aveți familie sau rude în România?", pr:"ah-VETS fa-MEE-lee-eh sow ROO-deh", en:"Do you have family or relatives in Romania?", model:"Familia … locuiește în… / Nu am rude aici; părinții mei locuiesc în…", day:"5A"},
 {ro:"Care este mâncarea dumneavoastră preferată? Vă place mâncarea românească?", pr:"KA-reh YES-teh mun-KA-rya", en:"Favourite food? Do you like Romanian food?", model:"Mâncarea mea preferată este… Îmi plac sarmalele și papanașii.", day:"3A"},
 {ro:"Ce beți de obicei dimineața?", pr:"cheh bets deh o-bee-CHAY", en:"What do you usually drink in the morning?", model:"Beau cafea cu lapte, fără zahăr.", day:"3B"},
 {ro:"Cum este vremea astăzi?", pr:"koom YES-teh VREH-mya as-TUZZ", en:"How is the weather today?", model:"Astăzi este… / Plouă. / Sunt … de grade. — use the real weather.", day:"4A"},
 {ro:"Cum a fost dimineața dumneavoastră? La ce oră v-ați trezit?", pr:"koom a fost dee-mee-NYA-tsa", en:"How was your morning? What time did you wake up?", model:"M-am trezit la ora…, am făcut un duș, am băut o cafea și am venit aici.", day:"4B"},
 {ro:"Cum ați dormit azi-noapte?", pr:"koom ats dor-MEET az NWAP-teh", en:"How did you sleep last night?", model:"Am dormit bine. M-am culcat la ora…", day:"4B"},
 {ro:"Vă place în România?", pr:"vuh PLA-cheh un ro-MU-nee-ah", en:"Do you like it in Romania?", model:"Da, îmi place foarte mult. Oamenii sunt prietenoși și mă simt ca acasă.", day:"2A / 5B"},
 {ro:"Mulțumesc frumos. La revedere!", pr:"mool-tsoo-MESK froo-MOS", en:"Thank you very much. Goodbye!", model:"Mulțumesc frumos! La revedere! O zi bună!", day:"5B"}
],

conduct: [
 "Greeting and closing handled naturally, without being prompted.",
 "Never switched to English.",
 "Used a repair phrase instead of freezing, or was never stuck.",
 "Hesitations stayed under about five seconds."
],

story: {
 title:"Despre mine — the model",
 note:"Read it aloud twice, then rebuild it with your own details. This paragraph alone answers half the interview before it is asked.",
 lines:[
  ["Bună ziua! Mă numesc David Miller.","Hello! My name is David Miller."],
  ["Sunt din Anglia și am treizeci și cinci de ani.","I'm from England and I'm 35 years old."],
  ["Locuiesc în România de patru ani, în București, în sectorul doi.","I've lived in Romania for four years, in Bucharest, Sector 2."],
  ["Am venit pentru muncă. Lucrez ca profesor de engleză la o școală privată.","I came for work. I work as an English teacher at a private school."],
  ["Îmi place foarte mult munca mea.","I really like my job."],
  ["Sunt căsătorit. Soția mea este româncă și se numește Elena.","I'm married. My wife is Romanian and her name is Elena."],
  ["Familia ei locuiește în Brașov.","Her family lives in Brașov."],
  ["Îmi place foarte mult mâncarea românească — mai ales sarmalele și papanașii.","I really like Romanian food, especially sarmale and papanași."],
  ["Beau cafea în fiecare dimineață.","I drink coffee every morning."],
  ["Îmi place viața în România. Oamenii sunt prietenoși și mă simt ca acasă.","I like life in Romania. People are friendly and I feel at home."]
 ],
 /* prompts for the student's own version */
 builder:[
  {k:"greet", label:"Greeting and name", hint:"Bună ziua! Mă numesc …", tpl:"Bună ziua! Mă numesc {name}."},
  {k:"origin", label:"Where you are from", hint:"Sunt din Anglia și sunt englezoaică.", tpl:"Sunt din {country} și sunt {nat}."},
  {k:"age", label:"Your age", hint:"Am treizeci și cinci de ani.", tpl:"Am {age} ani."},
  {k:"home", label:"Where you live and how long", hint:"Locuiesc în București de patru ani.", tpl:"Locuiesc în {city} de {years}."},
  {k:"why", label:"Why you came", hint:"Am venit pentru muncă.", tpl:"Am venit pentru {reason}."},
  {k:"work", label:"Your work", hint:"Lucrez ca … la …", tpl:"Lucrez ca {job}."},
  {k:"family", label:"Marital status and family", hint:"Sunt căsătorită. Soțul meu este român.", tpl:"Sunt {status}."},
  {k:"food", label:"Food and drink", hint:"Îmi plac sarmalele. Beau cafea în fiecare dimineață.", tpl:"Îmi plac {food}. Beau {drink} în fiecare dimineață."},
  {k:"close", label:"Why you like Romania", hint:"Îmi place viața aici. Mă simt ca acasă.", tpl:"Îmi place viața în România. Mă simt ca acasă."}
 ]
},

tips: [
 "Arrive with three sentences ready for that exact day: today's weather, this morning's story, and how you slept.",
 "Short answer plus one detail is the winning format. Don't improvise long sentences.",
 "If you are lost, say Nu am înțeles. Puteți repeta, vă rog? and then answer. Never freeze, never switch fully to English.",
 "Greet, thank and close: Bună ziua, Mulțumesc frumos, La revedere. Politeness formulas are free points.",
 "A wrong ending said confidently beats a perfect sentence you never finish."
],

/* ---------------- The final mock exam ---------------- */
exam: {
 intro:"The strictest assessment of the course. Written part: 60 minutes, hard stop. Oral part: about 15 minutes, after a short break. The zero rules below are applied exactly as an officer would notice them.",
 zeroRules:[
  "An age sentence without de (20 and over) or with de (under 20) scores zero.",
  "place or plac used for the wrong number scores zero.",
  "A reflexive past tense without m- scores zero.",
  "The wrong choice of de, din or acum scores zero.",
  "An oral answer given in English scores zero for that question."
 ],
 forgiven:"Missing diacritics, small spelling slips and minor word-order wobbles that don't change the meaning are forgiven.",
 A1:{title:"A1 · Age sentences", pts:4, items:[
   {n:35, a:"Am treizeci și cinci de ani.", zero:"missing de"},
   {n:19, a:"Am nouăsprezece ani.", zero:"adds de — under 20 takes none"},
   {n:21, a:"Am douăzeci și unu de ani.", zero:"missing de; check douăzeci și unu"},
   {n:68, a:"Am șaizeci și opt de ani.", zero:"missing de; number wrong"}]},
 A2:{title:"A2 · de / din / acum", pts:6, items:[
   {text:"Locuiesc în România {0} șase ani.", a:"de"},
   {text:"Sunt aici {0} două mii douăzeci.", a:"din"},
   {text:"M-am mutat la Cluj {0} un an.", a:"acum"},
   {text:"Lucrez la această companie {0} opt luni.", a:"de"},
   {text:"{0} martie locuiesc în alt apartament.", a:"din"},
   {text:"Am venit în România {0} patru ani.", a:"acum"}],
   rule:"Length of time → de. Start date, month or year → din. 'Ago' → acum."},
 A3:{title:"A3 · place / plac", pts:6, items:[
   {text:"Îmi {0} ciorba de legume.", a:"place", why:"singular"},
   {text:"Îmi {0} sarmalele.", a:"plac", why:"plural"},
   {text:"Îmi {0} să gătesc acasă.", a:"place", why:"verb"},
   {text:"Nu-mi {0} peștele.", a:"place", why:"singular"},
   {text:"Îmi {0} micii cu muștar.", a:"plac", why:"plural"},
   {text:"Îmi {0} foarte mult mâncarea românească.", a:"place", why:"singular"}]},
 A4:{title:"A4 · Gender endings", pts:4, items:[
   {text:"(a man says) Sunt {0}.", a:"căsătorit", en:"married"},
   {text:"(a woman says) Sunt {0}.", a:"singură", en:"single"},
   {text:"(a woman says) Sunt {0} astăzi.", a:"obosită", en:"tired"},
   {text:"(a woman says) Sunt {0}.", a:"englezoaică", en:"English"}]},
 B:{title:"Section B · Past tense", pts:8, note:"am + participle. Reflexives take m-am.", items:[
   {v:"a se trezi", a:"M-am trezit la ora șapte.", refl:true},
   {v:"a face", a:"Am făcut un duș."},
   {v:"a bea", a:"Am băut o cafea.", watch:"băut, not beat"},
   {v:"a mânca", a:"Am mâncat micul dejun."},
   {v:"a veni", a:"Am venit aici cu metroul."},
   {v:"a se uita", a:"Aseară m-am uitat la un film.", refl:true},
   {v:"a se culca", a:"M-am culcat la ora unsprezece.", refl:true},
   {v:"a dormi", a:"Am dormit bine."}]},
 C1:{title:"C1 · Weather match", pts:6, items:[
   {ro:"Plouă", en:"It's raining"},{ro:"Ninge", en:"It's snowing"},{ro:"Este înnorat", en:"It's cloudy"},
   {ro:"Bate vântul", en:"It's windy"},{ro:"Este frig", en:"It's cold"},{ro:"Este soare", en:"It's sunny"}]},
 C2:{title:"C2 · Romanian to English", pts:6, note:"Marked for meaning. Any natural English wording earns the point if the key elements are there.", items:[
   {ro:"La prânz mănânc de obicei o ciorbă sau o salată.", a:"For lunch I usually eat a soup or a salad.", keys:["lunch","usually","soup|salad"]},
   {ro:"Beau cafeaua cu lapte, fără zahăr.", a:"I drink my coffee with milk, without sugar.", keys:["coffee","milk","without sugar|no sugar"]},
   {ro:"Preferatele mele sunt sarmalele și papanașii.", a:"My favourites are sarmale and papanași.", keys:["favourite|favorite","sarmale|cabbage","papanas|doughnut"]},
   {ro:"Nu mănânc micul dejun, beau doar o cafea.", a:"I don't eat breakfast, I only drink a coffee.", keys:["breakfast","only|just","coffee"]},
   {ro:"La cină mănânc ceva ușor, acasă.", a:"For dinner I eat something light, at home.", keys:["dinner","light","home"]},
   {ro:"Nu beau alcool, dar îmi place limonada.", a:"I don't drink alcohol, but I like lemonade.", keys:["alcohol","lemonade"]}]},
 D:{title:"Section D · Strict translation", pts:8, items:[
   {en:"I have lived in Romania for five years.", a:"Locuiesc în România de cinci ani.", must:[["locuiesc"],["de"],["cinci"]], reject:["am locuit"], rule:"de + present tense, not am locuit"},
   {en:"I moved to Bucharest two years ago.", a:"M-am mutat la București acum doi ani.", must:[["m-am mutat","mam mutat"],["acum"],["doi"]], rule:"acum + m-am mutat"},
   {en:"I like sarmale.", a:"Îmi plac sarmalele.", must:[["plac"],["sarmale"]], reject:["place"], rule:"plural takes plac"},
   {en:"I like Romanian food very much.", a:"Îmi place foarte mult mâncarea românească.", must:[["place"],["mancarea","mâncarea"],["romaneasca","românească"]], rule:"singular takes place"},
   {en:"Yesterday it was cold and it rained.", a:"Ieri a fost frig și a plouat.", must:[["ieri"],["a fost"],["frig"],["a plouat"]], rule:"a fost + a plouat"},
   {en:"I woke up at seven and I drank a coffee.", a:"M-am trezit la ora șapte și am băut o cafea.", must:[["m-am trezit","mam trezit"],["sapte","șapte"],["am baut","am băut"]], rule:"m-am trezit + am băut"},
   {en:"(a woman says) I am married.", a:"Sunt căsătorită.", must:[["casatorita","căsătorită"]], reject:["casatorit "], rule:"the -ă ending"},
   {en:"Do you have children? (formal)", a:"Aveți copii?", must:[["aveti","aveți"],["copii"]], reject:["ai copii"], rule:"formal aveți"}]},
 E:{title:"Section E · Despre mine", pts:12, note:"Your own truthful version is the target, not the model.",
   grid:[
     {c:"Topic coverage", p:6, how:"One point each: greeting and name, age, home and how long and why, work, food and drink, family and liking Romania."},
     {c:"Signature structures", p:4, how:"One point each, used correctly somewhere: … de ani · de/din/acum · place/plac · the correct gender ending."},
     {c:"Length and flow", p:2, how:"Two points for 10–12 sentences reading naturally. One for 10+ but choppy. Zero under 10 sentences, and the section caps at 8."}
   ]},
 F:{title:"Section F · Oral interview", pts:40, note:"All 18 questions in order, then 4 to 6 re-asked shuffled, including every one that scored below 2. Score each 0, 1 or 2: 2 = correct and fluent within about three seconds · 1 = understandable but with errors or heavy hesitation · 0 = not understandable, English, or a freeze of ten seconds or more.", conductPts:4,
   shuffleRule:"If a re-asked question scores lower the second time, the lower score counts. Stability under pressure is the standard."},
 bands:[
  {min:90, label:"Interview-ready", advice:"Run the 18 questions daily for ten minutes until interview day."},
  {min:80, label:"Nearly there", advice:"Re-drill every flagged item daily, and re-ask the flagged oral questions until three clean answers in a row."},
  {min:70, label:"Weak sections showing", advice:"Full re-drill sessions on the weak sections, then re-run the oral section only."},
  {min:0, label:"Not ready", advice:"Repeat the course days named on your feedback sheet, then re-sit the whole exam. Don't book the interview yet."}
 ]
}
};
