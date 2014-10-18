var menus = {
    allMenus : [],
    isAnyMenuEnabled : function() {
        var returnValue = false
        for(var _menu in this.allMenus) {
            if(this.allMenus[_menu].enabled) {
                returnValue = true;
            }
        }
        return returnValue;
    },
    updateMenuEnabled : function() {
        var returnValue = null
        for(var _menu in this.allMenus) {
            if(this.allMenus[_menu].enabled) {
                this.allMenus[_menu].update();
            }
        }
        return returnValue;
    },
    setParent : function(o){
        if(o.items != undefined){
            for(n in o.items){
                o.items[n].parent = o;
                this.setParent(o.items[n]);
            }
        }
    },
    setDrawables : function(menuToDraw) {
        if (menuToDraw.parent == null) {
            menuToDraw['drawx'] = 16 ;
            menuToDraw['drawy'] = 16 ;
            menuToDraw['height'] = menuToDraw.itemsLength*32+32 ;
            menuToDraw['width'] =  menuToDraw.maxItemStringSize()*13+32 ;
        } else {
            menuToDraw['drawx'] = menuToDraw.parent.drawx+menuToDraw.parent.width ;
            menuToDraw['drawy'] = menuToDraw.parent.drawy ;
            menuToDraw['height'] = menuToDraw.itemsLength*32+32 ;
            menuToDraw['width'] =  menuToDraw.maxItemStringSize()*13+32 ;
        }
    },
    setAllDrawables : function() {
        for( var anotherMenu in this.allMenus ) {
            for( var aMenu in this.allMenus ) {
                this.setDrawables(this.allMenus[aMenu]);
            }
        }
    }
};

function menu(_items, _index) {

    var tempArray = [];

    _index = (typeof _index === "undefined") ? null : _index;
    this.items=_items;
    
    this.parent = null
    this.index = _index
    this.enabled=false;
    this.selectedItem=null;
    this.wait = false
    this.isMenu = true;

    for (var i = 0; i < Object.keys(this.items).length; i++) {
        var _itemKey = Object.keys(this.items)[i];

        tempArray[i] = [_itemKey, this.items[_itemKey].index]

    }
    tempArray.sort(function(a, b) {return a[1] - b[1]})

    this.selectedItem = this.items[tempArray[0][0]]

    for (var i = 0; i < tempArray.length; i++) {

        if ( i == 0) {
           this.items[tempArray[i][0]].previous = tempArray[0][0]
           this.items[tempArray[i][0]].next = tempArray[i+1][0]
        } else if (i == tempArray.length-1) {
           this.items[tempArray[i][0]].previous = tempArray[i-1][0]
           this.items[tempArray[i][0]].next = tempArray[i][0]            
        } else {
           this.items[tempArray[i][0]].previous = tempArray[i-1][0]
           this.items[tempArray[i][0]].next = tempArray[i+1][0] 
        }

        this.items[tempArray[i][0]].itemy = 32+i*32

    }

    if(this.selectedItem == null)
        this.selectedItem = this.items[Object.keys(this.items)[0]]

    this.selectedItem.selected = true

    this.maxItemStringSize = function() {
        var returnValue = 0

        for (var i = 0; i < Object.keys(this.items).length; i++) {
            var _itemKey = Object.keys(this.items)[i];


            if ( returnValue < _itemKey.length) {
                returnValue = _itemKey.length;
            }
        }

        return returnValue
    };

    this.itemsLength = Object.keys(_items).length 

    this.exit= function(){ 
        this._counter = 0; 
        this.enabled = false; 
        HID.inputs["cancel"].active = false; 
        if(this.parent!=null) {this.parent.wait = false; this.parent.menuKeyWasPressed=32} 
    };
    this.activate= function(){ this.enabled = true ; if(this.parent!=null) {this.parent.wait = true; } };
    this._counter=0; //this counter is here to solve a bug with the gamepad cancel button
    this.menuKeyWasPressed=0;
    this.update= function(){
        if(this._counter < 20)
            this._counter+=1;

        if(this.menuKeyWasPressed==0) {
            if(!this.wait) {
                if(HID.inputs["up"].active){
                    this.selectedItem.selected = false
                    this.selectedItem = this.items[this.selectedItem.previous]
                    this.selectedItem.selected = true
                    HID.inputs["up"].active = false
                    this.menuKeyWasPressed=32
                }else if(HID.inputs["left"].active){


                }else if(HID.inputs["right"].active){


                }else if(HID.inputs["down"].active){
                    this.selectedItem.selected = false
                    this.selectedItem = this.items[this.selectedItem.next]
                    this.selectedItem.selected = true
                    HID.inputs["down"].active = false
                    this.menuKeyWasPressed=32
                }else if(HID.inputs["accept"].active){

                    HID.inputs["accept"].active = false
                    if (this.selectedItem.action == 'exit') {
                        this.exit();
                    } else if ( Object.prototype.toString.call(this.selectedItem.action) === '[object Array]') {
                        for(var i=0; i < this.selectedItem.action.length; i++) {
                            if ( this.selectedItem.action[i] == 'exit') {
                                this.exit();
                            } else if ( this.selectedItem.action[i] == 'goWait') {
                                engine.atomStack.push([function(){this.wait = true;},'']);
                            } else if ( this.selectedItem.action[i] == 'stopWait') {
                                engine.atomStack.push([function(){this.wait = false;},'']);                            
                            } else {
                                this.selectedItem.action[i]();
                            }
                        }
                    } else {
                        if( typeof this.selectedItem.isMenu === "undefined") {
                            this.selectedItem.action();
                        } else {
                            this.selectedItem.menuKeyWasPressed=32
                            this.selectedItem.action();
                        }
                    }
                    this.menuKeyWasPressed=32
                }else if(HID.inputs["cancel"].active){
                    if(this._counter >= 20) {
                        HID.inputs["cancel"].active = false
                        this.exit()
                        engine.waitTime(200)
                        this.menuKeyWasPressed=32
                    }
                }
            }
        } else {
            this.menuKeyWasPressed-=4
        }
    };

    this.action = this.activate;

    menus.allMenus.push(this);

};

var mapMenu =  new menu({
        status: {
            action: function(){
                   actions.showText("the player is fine, thanks!") },
            index: 0
            },
        test: new menu({
                test2: new menu({
                    yes: {
                        action: ['goWait',function(){
                            actions.showText("this is a yes!") }, 'stopWait', 'exit'],
                        index: 0,
                        icon: 'icon1'
                        },

                    no: {
                        action: [function(){
                            actions.showText("this is a no!") }, 'exit'],
                        index: 1,
                        icon: 'icon0'
                        }
                },0),

                yes1: {
                    action: [function(){
                        actions.showText("this is a yes1!") }, 'exit'],
                    index: 1
                    },

                no1: {
                    action: [function(){
                        actions.showText("this is a no1!") }, 'exit'],
                    index: 2
                    }
            },1),
        item1: {
            action: function(){
                   actions.showText("the player is fine, thanks!") },
            index: 2
            },
        item2: {
            action: function(){
                   actions.showText("the player is fine, thanks!") },
            index: 3
            },
        item3: {
            action: function(){
                   actions.showText("the player is fine, thanks!") },
            index: 4
            },
        options: new menu({
                showFPS: new menu({
                    yes: {
                        action: [function(){ debug.FPS.show = true }, 'exit'],
                        index: 0
                        },

                    no: {
                        action: [function(){ debug.FPS.show = false }, 'exit'],
                        index: 1
                        }
                },0),

                back: {
                    action: 'exit',
                    index: 2
                    }
            },5),
        exit: {
            action: 'exit',
            index: 6
            }
    });
    //I was here!!!!

menus.setParent(mapMenu);




var engine = {};

engine.currentLevel = null;
engine.levels = null;
engine.paused = false;
engine.frameCount = 0;
engine.timer = null;
engine.waitKey = false;
engine.waitTimeSwitch = false;
engine.minimumWait = false;
engine.atomStack=new Array();

window.ondevicemotion = function(event) {  
    if (event.accelerationIncludingGravity.y > 4) {
        player['running'] = false;
    }else{
        player['running'] = true;
    }
};

feedbackEng = {
    once: false,
    timer: null,
    vibrationOn: false,
    soundOn: false,
    sounds: { stop: "audioStop", text: "audioText", word: "audioWord"
    },
    vibration: { stop: [10,5,10], text: [25], word: [10]
    },
    loadedSounds: {},
    vibrate: null,
    setup: function() {
        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
        if (navigator.vibrate) {
            // vibration API supported
            this.vibrationOn = true ;     
        }
        if(window.isFirefox()) {
            this.soundOn = true;
        }
        for (var sound in this.sounds) {
            this.loadedSounds[sound] =  document.getElementById(this.sounds[sound])
        }

    },
    play: function(feedback) {
        if (this.once == false) {
            if(this.vibrationOn)
                navigator.vibrate(this.vibration[feedback]);
            if(this.soundOn) {
                this.loadedSounds[feedback].cloneNode(true).play();
            }
            //this.once = true;
            //this.turnOnceOffTime();
        }
    },
    turnOnceOffTime: function() {
        this.timer = setTimeout(function() {
                                    feedbackEng.once = false;
                                    }, 100.0);
    }
};



var player = {};
player.setup = function() {
    player = resources.playerCharaset;
    player['mapx'] = init['Player']['initPosX'];
    player['mapy'] = init['Player']['initPosY'];
    player['facing'] = init['Player']['facing'];
    player['steps'] = 0;
    player['running'] = false;
    player['update'] = function(){
	
        if(printer.isShown) return;

        var px = Math.floor(player.mapx/32), 
	        py = Math.floor(player.mapy/32)+1;
	
        if(player.steps == 0){


	        if(HID.inputs["up"].active){
		        player.facing = "up";
                if(py> 0){7
		            if(engine.currentLevel["Level"]["colision"][py-1][px] == 0){
			            player.steps = 32;
                        if(engine.currentLevel["Level"]["events"][py-1][px] != 0)
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py-1][px],[0,1],[py-1,px])
		            } else {
                        feedbackEng.play('stop');
                    }
                } else {
                        feedbackEng.play('stop');
                }
	        }else if(HID.inputs["left"].active){
		        player.facing = "left";
                if(px>0){
		            if(engine.currentLevel["Level"]["colision"][py][px-1] == 0){
			            player.steps = 32;
                        if(engine.currentLevel["Level"]["events"][py][px-1] != 0)
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py][px-1],[0,1],[py,px-1])
		            } else {
                        feedbackEng.play('stop');
                    }
                } else {
                        feedbackEng.play('stop');
                }
	        }else if(HID.inputs["right"].active){
		        player.facing = "right";
		        if(px< engine.currentLevel["Level"]["colision"].length){
		            if(engine.currentLevel["Level"]["colision"][py][px+1] == 0){
			            player.steps = 32;
                        if(engine.currentLevel["Level"]["events"][py][px+1] != 0)
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py][px+1],[0,1],[py,px+1])
		            } else {
                        feedbackEng.play('stop');
                    }
                } else {
                        feedbackEng.play('stop');
                }
	        }else if(HID.inputs["down"].active){
		        player.facing = "down";
                if(py< engine.currentLevel["Level"]["colision"][0].length -1){
		            if(engine.currentLevel["Level"]["colision"][py+1][px] == 0){
			            player.steps = 32;
                        if(engine.currentLevel["Level"]["events"][py+1][px] != 0)
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py+1][px],[0,1],[py+1,px])
		            } else {
                        feedbackEng.play('stop');
                    }
                } else {
                        feedbackEng.play('stop');
                }
	        }else if(HID.inputs["accept"].active){
                if(player.facing == "up"){
                    if(py-1> 0)
                        if(engine.currentLevel["Level"]["events"][py-1][px] != 0) {
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py-1][px],[1,0],[py-1,px])
                            HID.inputs["accept"].active = false
                            engine.waitTime(400);
                            }
                }else if(player.facing == "left"){
                    if(px-1>0)
                        if(engine.currentLevel["Level"]["events"][py][px-1] != 0) {
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py][px-1],[1,0],[py,px-1]) 
                            HID.inputs["accept"].active = false
                            engine.waitTime(400);
                            }
                }else if(player.facing == "right"){
                    if(px+1< engine.currentLevel["Level"]["events"].length)
                        if(engine.currentLevel["Level"]["events"][py][px+1] != 0) {
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py][px+1],[1,0],[py,px+1])
                            HID.inputs["accept"].active = false
                            engine.waitTime(400);
                            }
                }else if(player.facing = "down"){
                    if(py+1< engine.currentLevel["Level"]["events"][0].length -1)
                        if(engine.currentLevel["Level"]["events"][py+1][px] != 0) {
                            eventInMap(engine.currentLevel["Level"],engine.currentLevel["Level"]["events"][py+1][px],[1,0],[py+1,px])
                            HID.inputs["accept"].active = false
                            engine.waitTime(400);
                            }
                }   
	        }else if(HID.inputs["cancel"].active){
                HID.inputs["cancel"].active = false
                mapMenu.activate()
            }

		
	
        }else{
	        player.steps -= 2;
	        if(player.facing == "up"){
		        player.mapy -= 2;
	        }else if(player.facing == "left"){
		        player.mapx -= 2;
	        }else if(player.facing == "right"){
		        player.mapx += 2;
	        }else if(player.facing = "down"){
		        player.mapy += 2;
	        }	

	        if(player.running)  
                if (!(player.steps==0)) {
	                player.steps -= 2;
	                if(player.facing == "up"){
		                player.mapy -= 2;
	                }else if(player.facing == "left"){
		                player.mapx -= 2;
	                }else if(player.facing == "right"){
		                player.mapx += 2;
	                }else if(player.facing = "down"){
		                player.mapy += 2;
	                }
                }
        }
    };
}

engine.testWaitForKey = function(){
    if(HID.inputs["accept"].active){
        engine.waitKey = false;
        HID.inputs["accept"].active = false;
        engine.minimumWait = false;
    } else if(HID.inputs["cancel"].active){
        engine.waitKey = false;
        HID.inputs["cancel"].active = false;
        engine.minimumWait = false;
    }
};

engine.waitForKey = function( state){
	engine.waitKey = state;
    engine.minimumWait = false;
    setTimeout(function(){engine.minimumWait = true;}, 300);
};

engine.waitTime = function(time){
    engine.waitTimeSwitch = true;
    engine.minimumWait = false;
    setTimeout(function(){engine.waitTimeSwitch = false;}, time);
} 


engine.loop = function(){
	try{
		if(!this.paused){
		
			// update

            HID.processGamepad();

            if(!engine.waitKey && !engine.waitTimeSwitch) { 
                if(menus.isAnyMenuEnabled()){
                    menus.updateMenuEnabled();
                    engine.runatomStack(); 
                } else {    
                    player.update();
                    engine.runatomStack(); 
                }
            } else if (this.minimumWait) {
                this.testWaitForKey();
            }
 

		}
		
		HID.clearInputs();
		engine.timer = setTimeout("engine.loop()", 1000/46.0);
	
	}catch(err){
		alert("engine loop error: "+err);
	}
};

engine.runatomStack = function(){
    if(engine.atomStack.length > 0) {
        while(engine.atomStack.length > 0){
            eventToRun = engine.atomStack.shift();
            if(eventToRun[0]=="block") {
                break
            } else {
            eventToRun[0](eventToRun[1]);
            }
        } 
    } 
};

eventInMap = function(level,event,evType,position) {
    if (level['eventsType'][event.toString()][0] == evType[0] && level['eventsType'][event.toString()][1] == evType[1]) {
        var aNmb, action, actionAndParam;
        for (aNmb = 0; aNmb < level['eventsActions'][event.toString()].length ; aNmb++) {
            actionAndParam = level['eventsActions'][event.toString()][aNmb];
            translateActions(actionAndParam[0],actionAndParam[1],position);
        }
    }
};

engine.teleport = function(param) {
    //param = [positionX,positionY,level]
    engine.currentLevel = resources['levels'][param[2]];
    player.mapx = parseInt(param[0],10)*32 ;
	player.mapy = (parseInt(param[1],10)-1)*32;
    player.steps = 32;
    player.facing = "down";
    HID.cleanInputs()
    HID.clearInputs()
}

engine.changeTile = function(param) {
    //param = [tileType,layer,colision,event,positionY,positionX,level]
    //          0      , 1   , 2      , 3   , 4       , 5       , 6
    ///////////////////////////////////////////////////////////////////

    if(param[6]==null || param[6]=="this") {
        var levelToChange = engine.currentLevel
    } else {
        var levelToChange = resources['levels'][param[6]];
    }
    if(param[2]!=-1) {
        levelToChange["Level"]["colision"][param[4]][param[5]]=param[2]
    }
    if(param[3]!=-1) {
        levelToChange["Level"]["events"][param[4]][param[5]]=param[3]
    }
    
    levelToChange["Level"][param[1]][param[4]][param[5]]=param[0]
}
    
translateActions = function(action, param, position) {    
    actions[action](param,position)    
};

var actions = {};

actions.showText = function(param,position) {
        engine.atomStack.push([printer.showText,param]);
        var linesTotal = printer.textLines(param)
        var lineNumber ;
        for (lineNumber = 0 ; lineNumber < linesTotal; lineNumber+=2) {
            engine.atomStack.push([engine.waitForKey,true]);
            engine.atomStack.push(["block",null]);
            engine.atomStack.push([function(){printer.nextLine();engine.waitTime(400);},'']);
        }
};

actions.teleport = function(param,position) {
        var params = param.split(';')
        engine.atomStack.push([function(){screen.paused = true;},'']);
        engine.atomStack.push([engine.teleport,params]);
        engine.atomStack.push([function(){screen.paused = false;},'']);
};

actions.changeTile = function(param,position) {
    //param[4] location (current or x,y,level)        
        var colisionDict = { keep: -1, noColision: 0 , collidable: 1 }
        var params3Value
        var params = param.split(';')

        var aTileType = params[0]
        var aLayer = params[1]
        var aColision = colisionDict[params[2]];
        if(params[3]=="keep") {
            params3Value = -1;
        } else if(params[3]=="remove") {
            params3Value = 0;
        } else {
            params3Value = parseInt(params[3],10);
        }

        var aEvent = params3Value;
        var aPositionX
        var aPositionY
        var aLevel

        if(params[4]=="current") {
            aPositionY=parseInt(position[0],10)
            aPositionX=position[1]
            aLevel=null            
        } else {
            aPositionX=params[4]
            aPositionY=params[5]
            aLevel=params[6]
        }

        engine.atomStack.push([engine.changeTile,[aTileType,
            aLayer, aColision, aEvent, aPositionY, aPositionX,
            aLevel ] ]);
};

actions.fadeIn = function(param,position) {
        var params = param.split(';')
        engine.atomStack.push([screen.effects.fadeIn,params]);
        for(var i=0; i < 8; i++) {
            engine.atomStack.push(["block",null]);
        }
};


actions.fadeOut = function(param,position) {
        var params = param.split(';')
        engine.atomStack.push([screen.effects.fadeOut,params]);
        for(var i=0; i < 8; i++) {
            engine.atomStack.push(["block",null]);
        }
};

actions.noEffect = function(param,position) {
        engine.atomStack.push([screen.effects.noEffect,'']);
};

engine.update = function(frameCount){
    engine.frameCount = frameCount;
};

