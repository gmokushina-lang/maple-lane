(() => {
  const root='./';
  const saveKey='teachingjoy:maple-lane:adventure:v1';
  const resultKey='teachingjoy:maple-lane:result:v1';
  const places = {
    library: {name:'Library',person:'Nora · Librarian',x:15, project:'Book Box',
      line:'You can start a free book box. To take books today, you have to show a library card. You don’t have to buy the books.',
      question:'How will you get the books?',
      routes:[
        ['I have to show my library card.','Books today','You can take the books today. Families can borrow them at the weekend.','today'],
        ['I don’t have a card. Can I reserve the books?','Reserved books','Yes. You can reserve them now, but you have to bring a card before pickup.','later'],
        ['I don’t have to show a card to take the books.','','You do have to show a card to take them today. What could you do if you don’t have one?','']
      ]},
    workshop: {name:'Repair shop',person:'Asha · Repair technician',x:39,project:'Digital Skills Club',
      line:'Learners don’t have to bring a laptop. I can lend you mine, but you can’t take them home.',
      question:'Where will people practise?',
      routes:[
        ['We have to keep the laptops here.','Loan laptops','Great. You can run a group session here on Saturday.','today'],
        ['Can we practise at home on our own devices?','Practice guides','Yes. Take these paper guides. People can use their own devices at home.','later'],
        ['Learners can take the loan laptops home.','','The loan laptops have to stay here. What other plan would work?','']
      ]},
    hall: {name:'Community hall',person:'Sam · Caretaker',x:64,project:'Homework Club',
      line:'You can use the main hall for a free club. You have to leave by seven. You can’t charge people to come in.',
      question:'How will you organise the club?',
      routes:[
        ['We have to finish before seven, and we can’t charge.','Hall key','Here’s the key. The main hall is yours for an early session.','today'],
        ['Can we use a smaller room if we need a later session?','Side room pass','Yes. The side room stays open until eight, but you have to keep the group small.','later'],
        ['We can charge people and stay after seven in the main hall.','','The main hall closes at seven, and this club has to be free. Try a different plan.','']
      ]},
    sponsor: {name:'Town square',person:'Ada · Local sponsor',x:87}
  };
  const scene=document.querySelector('#scene');
  const dialogue=document.querySelector('#dialogue');
  const reset=document.querySelector('#reset-dialog');
  const clean=()=>({bag:{},x:8,y:90});
  let state=clean(), room=null, door=null, walk;
  try { state={...state,...JSON.parse(localStorage.getItem(saveKey)||'{}')}; } catch {}
  const record=()=>{try{localStorage.setItem(saveKey,JSON.stringify(state));}catch{}};
  const updateMission=(title,description)=>{
    const tip=document.querySelector('#mission');
    tip.replaceChildren();
    const marker=document.createElement('span');
    marker.className='marker';marker.textContent='→';marker.setAttribute('aria-hidden','true');
    const copy=document.createElement('div');
    const h=document.createElement('strong'); h.textContent=title;
    const p=document.createElement('p');p.textContent=description;
    copy.append(h,p);tip.append(marker,copy);
  };
  function button(label,action,primary=false){
    const control=document.createElement('button');
    control.type='button';control.textContent=label;control.onclick=action;
    if(primary)control.className='primary';
    return control;
  }
  const messages=document.querySelector('#messages');
  const replies=document.querySelector('#replies');
  function closeDialogue(){
    dialogue.hidden=true;
    messages.replaceChildren();
    replies.replaceChildren();
    scene.querySelector('.resident')?.focus();
  }
  document.querySelector('#close-chat').onclick=closeDialogue;
  function message(author,copy,side){
    const bubble=document.createElement('article');
    bubble.className='message '+side;
    const label=document.createElement('strong');
    label.textContent=author;
    const text=document.createElement('p');
    text.textContent=copy;
    bubble.append(label,text);
    messages.append(bubble);
    messages.scrollTop=messages.scrollHeight;
  }
  function speak(person,line,choices){
    dialogue.hidden=false;
    document.querySelector('#speaker').textContent=person;
    message(person.split(' · ')[0],line,'incoming');
    replies.replaceChildren(...choices.map(([label,action])=>button(label,()=>{
      message('You',label,'outgoing');
      action();
    })));
    replies.querySelector('button')?.focus({preventScroll:true});
  }
  const entries=()=>Object.entries(state.bag);
  const firstStep=()=>updateMission('Your goal: launch a free learning project',
    '1. Talk to a neighbour and get a resource. 2. Choose who it will help. 3. Explain your plan to Ada in the town square.');
  function goOutside(){
    closeDialogue();
    room=null;
    door=null;
    draw();
    scene.focus({preventScroll:true});
  }
  function showStreetProgress(id,caption){
    const marker=document.createElement('div');
    marker.className='street-progress'+(id==='sponsor'?' street-finale':'');
    marker.style.setProperty('--x',places[id].x+'%');
    const sign=document.createElement('span');
    sign.className='street-reward';
    sign.textContent=caption;
    const person=document.createElement('img');
    person.className='street-neighbour';
    person.src=root+'street-'+id+'.webp';
    person.alt=id==='sponsor'?'Two neighbours outside the town square':places[id].person.split(' · ')[0]+' outside';
    marker.append(sign,person);
    scene.append(marker);
  }
  function showSidewalkNotice(id,item){
    const notices={
      library:['Free books today','Book reservations'],
      workshop:['Saturday laptop session','Take a practice guide'],
      hall:['Main hall · Before 7','Side room · Until 8']
    };
    const notice=document.createElement('div');
    notice.className='sidewalk-notice';
    notice.style.setProperty('--notice-x',places[id].x-6+'%');
    const board=document.createElement('img');
    board.src=root+'street-notice-board.webp';
    board.alt='';
    const lettering=document.createElement('span');
    lettering.textContent=notices[id][item.route==='later'?1:0];
    notice.append(board,lettering);
    scene.append(notice);
  }
  function showProjectStall(project){
    const stall=document.createElement('div');
    stall.className='project-stall';
    const awning=document.createElement('span');
    awning.className='stall-awning';
    const sign=document.createElement('strong');
    sign.textContent=project;
    const counter=document.createElement('span');
    counter.className='stall-counter';
    counter.textContent='Free to join';
    stall.append(awning,sign,counter);
    scene.append(stall);
  }
  function draw(){
    walk?.cancel();
    scene.classList.toggle('room',Boolean(room));
    scene.replaceChildren();
    const backdrop=document.createElement('img');
    backdrop.src=root+(room?'room-'+room:'maple-street')+'.webp';backdrop.alt='';
    scene.append(backdrop);
    const satchel=document.querySelector('#satchel');
    const title=document.createElement('strong');title.textContent='Your satchel';
    satchel.replaceChildren(title);
    if(!entries().length)satchel.append('Empty');
    entries().forEach(([,item])=>{const chip=document.createElement('span');chip.textContent=item.resource;satchel.append(chip);});
    if(room){
      updateMission('Talk to '+places[room].person.split(' · ')[0],
        room==='sponsor'?'Tell Ada who your project helps and explain a rule aloud.':'Read the question and give your answer aloud before you choose.');
      const resident=button('Talk to '+places[room].person.split(' · ')[0],()=>{
        if(!dialogue.hidden){replies.querySelector('button')?.focus();return;}
        if(room==='sponsor')sponsor();
        else talk(room);
      });
      resident.className='resident';scene.append(resident);
      const exit=button('‹ Back to the street',goOutside);
      exit.className='street-exit';scene.append(exit);
      return;
    }
    if(door)updateMission('You’ve arrived at the '+places[door].name.toLowerCase()+'.','Choose Enter to go inside.');
    else if(state.ending)showEndingMission();
    else if(entries().length)updateMission('Choose your next stop','Visit another building or take your idea to Ada at the town square.');
    else firstStep();
    const destination=document.createElement('span');destination.className='destination';destination.hidden=true;scene.append(destination);
    for(const [id,place] of Object.entries(places)){
      const stop=button(place.name,()=>move(place.x,86,()=>{door=id;draw();scene.querySelector('.enter').focus();}));
      stop.className='door facade-'+id;
      stop.style.setProperty('--x',place.x+'%');
      scene.append(stop);
    }
    entries().forEach(([id,item])=>{
      showStreetProgress(id,item.resource);
      showSidewalkNotice(id,item);
    });
    if(state.ending){
      const volunteers=state.ending.rules.includes('volunteers');
      showStreetProgress('sponsor',volunteers?'Volunteers ready':'Opening planned');
      showProjectStall(state.ending.projects);
    }
    const courier=document.createElement('img');
    courier.src=root+'maple-courier.webp';courier.alt='';courier.className='courier';
    courier.style.left=state.x+'%';courier.style.top=state.y+'%';scene.append(courier);
    if(door){
      const enter=button('Enter '+places[door].name,()=>{room=door;draw();scene.querySelector('.resident').focus();});
      enter.className='enter';enter.style.setProperty('--x',places[door].x+'%');scene.append(enter);
    }
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  async function move(x,y,arrival){
    const courier=scene.querySelector('.courier');
    if(!courier)return;
    const computed=getComputedStyle(courier);
    const from={x:parseFloat(computed.left)/scene.clientWidth*100,y:parseFloat(computed.top)/scene.clientHeight*100};
    walk?.cancel();
    door=null;scene.querySelector('.enter')?.remove();
    const to={x:clamp(x,4,96),y:clamp(y,80,96)};
    const dest=scene.querySelector('.destination');
    dest.style.left=to.x+'%';dest.style.top=to.y+'%';dest.hidden=false;
    courier.classList.toggle('facing-left',to.x<from.x);
    courier.classList.add('walking');
    const animation=courier.animate([
      {left:from.x+'%',top:from.y+'%'},{left:to.x+'%',top:to.y+'%'}
    ],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:clamp(Math.hypot(to.x-from.x,to.y-from.y)*18,140,1450),easing:'linear'});
    walk=animation;
    try{await animation.finished;}catch{return;}
    if(walk!==animation||!courier.isConnected)return;
    walk=null;dest.hidden=true;courier.classList.remove('walking');
    state.x=to.x;state.y=to.y;courier.style.left=to.x+'%';courier.style.top=to.y+'%';record();
    if(arrival)arrival();
    else if(!entries().length)firstStep();
    else if(state.ending)showEndingMission();
    else updateMission('Choose your next stop','Visit another building or take your idea to Ada at the town square.');
  }
  function talk(id){
    const place=places[id];
    speak(place.person,place.line+' '+place.question,place.routes.map(([label,resource,response,route])=>[label,()=>{
      if(!route){speak(place.person,response,[['Try another answer',()=>talk(id)]]);return;}
      speak(place.person,response,[[resource+' → Put it in my satchel',()=>{
        state.bag[id]={resource,rule:label,response,route};
        record();
        speak(place.person,resource+' added to your satchel. Look for your reward outside.',[['See my reward on the street',goOutside]]);
      }]]);
    }]));
  }
  function sponsor(){
    const person=places.sponsor.person;
    if(state.ending?.spoken===false){
      finalReport();
      return;
    }
    if(!entries().length){
      speak(person,'First bring something that can help people learn. The librarian, technician and caretaker all have something to offer.',[['Back to the street',()=>{closeDialogue();room=null;door=null;draw();}]]);
      return;
    }
    speak(person,'Choose a resource and tell me aloud who it will help. Your activity has to be free.',entries().map(([id,item])=>[places[id].project+' · '+item.resource,()=>pitch(id)]));
  }
  function pitch(id){
    const person=places.sponsor.person;
    const item=state.bag[id];
    const later=item.route==='later';
    const prompt=later?'Some learners want to start immediately. You need time to set up your plan. What will you tell them?':'I can announce your activity today. Do learners have to pay to join?';
    const choices=later?[
      ['They don’t have to wait to sign up. I’ll open a free sign-up list now.','Free sign-up is open. The activity starts when the resource is ready.'],
      ['We have to wait for the resource. I’ll set a date and tell everyone.','The project will open on the date you announce.']
    ]:[
      ['They don’t have to pay. We’ll start with a small free group.','The sponsor is funding a small free group first.'],
      ['They don’t have to pay. We’ll ask volunteers to run a free drop-in.','The sponsor is backing a free drop-in run by volunteers.']
    ];
    speak(person,prompt,[
      ...choices.map(([label,resolution])=>[label,()=>approve(id,label,resolution)]),
      ['We can charge everyone before they join.',()=>speak(person,'This fund is for free activities. How can you help people without charging them?',[['Revise the plan',()=>pitch(id)]])]
    ]);
  }
  function approve(id,choice,resolution){
    const item=state.bag[id];
    state.ending={projects:places[id].project,rules:item.rule+' '+choice,resolution,resource:item.resource,spoken:false};
    record();
    finalReport();
  }
  function showEndingMission(){
    if(state.ending.spoken===false){
      updateMission('One last thing: tell Ada your plan','Go to the town square and give your final update aloud.');
      return;
    }
    updateMission(state.ending.projects+' · Project approved',state.ending.resolution);
  }
  function finalReport(){
    const ending=state.ending;
    speak('Ada · Final update',
      ending.resolution+' Before we open, give me a 30–45 second update aloud. Who will your '+ending.projects+
      ' help? How will you use what you collected ('+ending.resource+')? What are the rules, and what will you do first?',
      [['Show speaking prompts',()=>{
        speak('Ada · Speaking prompts','Our project helps … We’ll use … People have to … They don’t have to … They can’t … Finally, we’ll …',
          [['I’ve given my update aloud',finishReport]]);
      }],['I’ve given my update aloud',finishReport]]);
  }
  function finishReport(){
    const ending=state.ending;
    ending.spoken=true;
    record();
    try{localStorage.setItem(resultKey,JSON.stringify(ending));}catch{}
    speak('Ada · Project approved','Thank you for explaining the plan. '+ending.resolution,
      [['See the project on the street',goOutside]]);
  }
  scene.addEventListener('click',event=>{
    if(room||event.target.closest('button'))return;
    const rect=scene.getBoundingClientRect();
    move((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
  });
  scene.addEventListener('keydown',event=>{
    const steps={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-5],ArrowDown:[0,5]};
    if(room||!steps[event.key]||event.target!==scene)return;
    event.preventDefault();const [dx,dy]=steps[event.key];move(state.x+dx,state.y+dy);
  });
  document.querySelector('#restart').onclick=()=>{
    reset.returnValue='cancel';
    reset.showModal();
  };
  reset.onclose=()=>{
    if(reset.returnValue!=='reset')return;
    closeDialogue();state=clean();room=null;door=null;record();
    try{localStorage.removeItem(resultKey);}catch{}
    draw();
  };
  draw();
})();

