'use strict';
mode.tafang={
	canvasUpdates2:[],
	hiddenCharacters:[],
	start:function(){
		"step 0"

		"step 1"
		for(var i in lib.skill){
			if(lib.skill[i].changeSeat){
				lib.skill[i]={};
				if(lib.translate[i+'_info']){
					lib.translate[i+'_info']='此模式下不可用';
				}
			}
		}
		lib.init.css(lib.assetURL+'layout/mode','chess');
		ui.chesssheet=document.createElement('style');
		document.head.appendChild(ui.chesssheet);
		var playback=localStorage.getItem(lib.configprefix+'playback');
		lib.mechlist=[];
        for(var i in lib.characterPack.mode_tafang){
            if(i.indexOf('chess_mech_')==0){
                lib.mechlist.push(i);
            }
            lib.character[i]=lib.characterPack.mode_tafang[i];
            if(!lib.character[i][4]){
                lib.character[i][4]=[];
            }
        }
		ui.create.cards();
		game.finishCards();
		ui.chessContainer=ui.create.div('#chess-container',ui.arena);
		lib.setScroll(ui.chessContainer);
		ui.chess=ui.create.div('#chess',ui.chessContainer);
		ui.canvas2=document.createElement('canvas');
		ui.canvas2.id='canvas2';
		ui.chess.appendChild(ui.canvas2);
		ui.ctx2=ui.canvas2.getContext('2d');
		game.me=ui.create.player();
		if(playback){
			for(var i in lib.characterPack){
				for(var j in lib.characterPack[i]){
					lib.character[j]=lib.character[j]||lib.characterPack[i][j];
				}
			}
			game.pause();
			ui.system.style.display='none';
			_status.playback=playback;
			localStorage.removeItem(lib.configprefix+'playback');
			var store=lib.db.transaction(['video'],'readwrite').objectStore('video');
			store.get(parseInt(playback)).onsuccess=function(e){
				if(e.target.result){
					event.video=e.target.result.video;
					game.resume();
				}
				else{
					alert('播放失败：找不到录像');
					game.reload();
				}
			}
		}
		_status.mylist=[];
        _status.enemylist=[];
		"step 2"
		ui.arena.classList.add('chess');
		var mylistmap,enemylistmap;
		if(event.video){
			var videocontent;
			for(var ii=0;ii<event.video.length;ii++){
				if(event.video[ii].type=='init'){
					videocontent=event.video[ii].content;
					break;
				}
			}
			mylistmap=[];
			enemylistmap=[];
			for(var i=0;i<videocontent.length;i++){
				if(videocontent[i].lord){
					_status.lord=videocontent[i].name;
				}
				if(videocontent[i].identity=='friend'){
					_status.mylist.push(videocontent[i].name);
					mylistmap.push(videocontent[i].position);
				}
				else{
					_status.enemylist.push(videocontent[i].name);
					enemylistmap.push(videocontent[i].position);
				}
			}
			game.playerMap=lib.posmap;
		}
		ui.chesswidth=parseInt(get.config('tafang_size'));
		ui.chessheight=11;
		ui.chess.style.height=148*ui.chessheight+'px';
		ui.chess.style.width=148*ui.chesswidth+'px';
		if(!lib.config.touchscreen){
			ui.chess.addEventListener('mousedown',function(e){
				if(Array.isArray(e.path)){
					for(var i=0;i<e.path.length;i++){
						var itemtype=get.itemtype(e.path[i]);
						if(itemtype=='button'||itemtype=='card'||itemtype=='player'){
							return;
						}
					}
				}
				this._chessdrag=[e,this.parentNode.scrollLeft,this.parentNode.scrollTop];
			});
			ui.chess.addEventListener('mouseleave',function(){
				this._chessdrag=null;
			});
			ui.chess.addEventListener('mouseup',function(){
				if(this._chessdrag){
					this._chessdrag=null;
				}
			});
			ui.chess.addEventListener('mousemove',function(e){
				if(this._chessdrag){
					this.parentNode.scrollLeft=this._chessdrag[1]-e.x+this._chessdrag[0].x;
					this.parentNode.scrollTop=this._chessdrag[2]-e.y+this._chessdrag[0].y;
					_status.clicked=true;
				}
				e.preventDefault();
			});
			ui.chessContainer.addEventListener('mousewheel',function(){
				if(_status.currentChessFocus){
					clearInterval(_status.currentChessFocus);
					delete _status.currentChessFocus;
				}
			});
		}

		ui.chessscroll1=ui.create.div('.chessscroll.left',ui.chessContainer);
		ui.chessscroll2=ui.create.div('.chessscroll.right',ui.chessContainer);
		var chessscroll=function(){
			if(lib.config.touchscreen) return;
			var direction=this.direction;
			var speed=parseInt(get.config('chessscroll_speed'));
			if(!speed) return;
			var interval=setInterval(function(){
				ui.chessContainer.scrollLeft+=speed*direction;
			},16);
			_status.chessscrolling=interval;
		};
		var leavescroll=function(){
			if(_status.chessscrolling){
				clearInterval(_status.chessscrolling);
				delete _status.chessscrolling;
			}
		};
		ui.chessscroll1.direction=-1;
		ui.chessscroll1.addEventListener('mouseenter',chessscroll);
		ui.chessscroll1.addEventListener('mouseleave',leavescroll);

		ui.chessscroll2.direction=1;
		ui.chessscroll2.addEventListener('mouseenter',chessscroll);
		ui.chessscroll2.addEventListener('mouseleave',leavescroll);

		for(var i=0;i<ui.chesswidth;i++){
			for(var j=0;j<ui.chessheight;j++){
				var pos='[data-position="'+(i+j*ui.chesswidth)+'"]';
				ui.chesssheet.sheet.insertRule('#arena.chess #chess>.player'+pos+
				'{left:'+(14+i*148)+'px;top:'+(14+j*148)+'px}',0);
				ui.chesssheet.sheet.insertRule('#arena.chess #chess>.card'+pos+
				'{left:'+(22+i*148)+'px;top:'+(22+j*148)+'px}',0);
				ui.chesssheet.sheet.insertRule('#arena.chess #chess>.popup'+pos+
				'{left:'+(19+i*148)+'px;top:'+(142+j*148)+'px}',0);
			}
		}

		var grids=[];
		var gridnum=ui.chessheight*ui.chesswidth;
		for(var i=0;i<gridnum;i++){
			grids.push(i);
		}
		event.obs=[];
		if(!event.video){
			var tafanglist=[0,2,3,5,6,8,9,11,12];
			for(var i=0;i<ui.chessheight-1;i++){
				for(var j=0;j<ui.chesswidth;j++){
					if(i>=8&&j!=0&&j!=ui.chesswidth-1) continue;
					if(tafanglist.contains(j)){
						var cg=i*ui.chesswidth+j;
						grids.remove(cg);
						game.addObstacle(cg.toString(),false);
						event.obs.push(cg.toString());
					}
				}
			}
			for(var i=0;i<ui.chesswidth;i++){
				switch(ui.chesswidth){
					case 6:if(i==2||i==3) continue;break;
					case 9:if(i==3||i==4||i==5) continue;break;
					case 12:if(i==4||i==5||i==6||i==7) continue;break;
				}
				var cg=(ui.chessheight-1)*ui.chesswidth+i;
				grids.remove(cg);
				game.addObstacle(cg.toString(),false);
				event.obs.push(cg.toString());
			}
		}
		_status.enemyCount=0;
		_status.friendCount=0;

		lib.setPopped(ui.create.system('手牌',null,true),function(){
			var uiintro=ui.create.dialog('hidden');
			var added=false;
			for(var i=0;i<game.players.length;i++){
				if(game.players[i].side==game.me.side&&game.players[i]!=game.me){
					added=true;
					uiintro.add(get.translation(game.players[i]));
					var cards=game.players[i].get('h');
					if(cards.length){
						uiintro.addSmall(cards,true);
					}
					else{
						uiintro.add('（无）');
					}
				}
			}
			if(!added){
				uiintro.add('无队友');
			}
			return uiintro;
		},220);

		ui.create.me();
		ui.create.fakeme();

		ui.chessinfo=ui.create.div('.fakeme.player',ui.me,function(e){
			e.stopPropagation();
		});
		lib.setScroll(ui.chessinfo);

		game.arrangePlayers();
		"step 3"
		ui.control.style.display='';
		if(event.video){
			game.playVideoContent(event.video);
			game.setChessInfo();
			return;
		}
		_status.videoInited=true;
		game.addVideo('init',null,[]);
		if(game.friendZhu){
			game.addVideo('identityText',game.friendZhu,'将');
			game.addVideo('identityText',game.enemyZhu,'帅');
			if(game.friendViceZhu){
				game.addVideo('identityText',game.friendViceZhu,'仕');
				game.addVideo('identityText',game.enemyViceZhu,'士');
			}
		}
		if(event.obs){
			game.addVideo('initobs',null,event.obs);
		}

		ui.me.querySelector('.fakeme.player').hide();
		ui.me.querySelector('.fakeme.avatar').hide();

		var list=[];
		for(i in lib.character){
			if(i.indexOf('treasure_')==0) continue;
			if(i.indexOf('chess_mech_')==0) continue;
			if(lib.character[i][4].contains('minskin')) continue;
			if(lib.config.forbidchess.contains(i)) continue;
			if(lib.character[i][4].contains('boss')) continue;
			if(lib.filter.characterDisabled(i)) continue;
			list.push(i);
		}
		list.randomSort();
		_status.characterList=list;
		_status.friends=[];
		_status.enemies=[];
		_status.turnCount=0;
		_status.turnTotal=parseInt(get.config('tafang_turn'));
		ui.turnCount=ui.create.system('',null,true);
		_status.remainingCount=0;
		game.me.side=true;

		_status.tafangend=[];
		for(var i=0;i<ui.chesswidth;i++){
			var tafangdes=ui.chesswidth*(ui.chessheight-1)+i;
			if(!lib.posmap[tafangdes]){
				_status.tafangend.push(tafangdes.toString());
			}
		}
        _status.gameStarted=true;
		game.phaseLoopTafang();
	},
	element:{
		card:{
			moveTo:function(player,method){
				this.fixed=true;
				if(this.parentNode==ui.arena){
					var rect=player.getBoundingClientRect();
					this.style.left=(rect.left+8)+'px';
					this.style.top=(rect.top+8)+'px';
				}
				else{
					this.style.left='';
					this.style.top='';
					this.dataset.position=player.dataset.position;
				}
				if(method=='flip'){
					this.style.transition='all 0.5s';
					this.style.transform='rotate'+(Math.random()<0.5?'X':'Y')+'(180deg) perspective(1000px)';
				}
				else if(method=='rotate'){
					this.style.transition='all 0.5s';
					this.style.transform='rotate(180deg)';
				}
				else{
					this.style.transition='all 0.5s';
					this.style.transform='';
				}
				return this;
			},
		},
		player:{
			createRangeShadow:function(num,move){
				num++;
				var shadows=this.parentNode.getElementsByClassName('playergrid');
				while(shadows.length){
					shadows[0].remove();
				}
				var grids=[];
				for(var i=1-num;i<num;i++){
					for(var j=1-num+Math.abs(i);j<num-Math.abs(i);j++){
						if(this.movable(i,j)){
							var grid=ui.create.playergrid(this,i,j);
							if(grid){
								grids.push(grid);
								if(typeof move=='function'){
									grid.listen(move);
								}
								else if(move){
									grid.listen(ui.click.playergrid);
									ui.movegrids.push(grid);
								}
								else{
									grid.classList.add('temp');
								}
							}
						}
					}
				}
				return grids;
			},
			chooseToMove:function(num,prompt){
				var next=game.createEvent('chooseToMove');
				next.num=num||1;
				next.player=this;
				next.setContent('chooseToMove');
				next.prompt=prompt;
				return next;
			},
			move:function(x,y){
				var xy=this.getXY();
				return this.moveTo(x+xy[0],y+xy[1]);
			},
			moveTo:function(x,y){
				game.addVideo('moveTo',this,[x,y]);
				if(x>=ui.chesswidth){
					x=ui.chesswidth-1;
				}
				if(y>=ui.chessheight){
					y=ui.chessheight-1;
				}

				var pos=y*ui.chesswidth+x;
				if(!lib.posmap[pos]){
					delete lib.posmap[this.dataset.position];
					this.dataset.position=pos;
					lib.posmap[pos]=this;
					this.chessFocus();
				}

				if(_status.mode=='tafang'&&!_status.video){
					if(_status.tafangend.contains(this.dataset.position)){
						if(_status.enemies.contains(this)){
							game.over(false);
						}
						else{
							this.delete();
							delete lib.posmap[this];
							game.players.remove(this);
							_status.friends.remove(this);
							this.classList.add('dead');
							if(this==game.me){
								if(_status.friends.length==0){
									ui.fakeme.hide();
									this.node.handcards1.delete();
									this.node.handcards2.delete();
									game.me=ui.create.player();
									game.me.side=true;
								}
								else{
									game.modeSwapPlayer(_status.friends[0]);
								}
							}
							for(var i=0;i<ui.phasequeue.length;i++){
								if(ui.phasequeue[i].link==this){
									ui.phasequeue[i].remove();
									ui.phasequeue.splice(i,1);
									break;
								}
							}
							game.addVideo('deleteChessPlayer',this);
						}
					}
				}
				return this;
			},
			canMoveTowards:function(target){
				var fxy=this.getXY();
				var txy=target.getXY();
				var dx=txy[0]-fxy[0];
				var dy=txy[1]-fxy[1];
				if(dx<0&&this.movable(-1,0)) return true;
				if(dx>0&&this.movable(1,0)) return true;
				if(dy<0&&this.movable(0,-1)) return true;
				if(dy>0&&this.movable(0,1)) return true;
				return false;
			},
			moveTowards:function(target){
				var fxy=this.getXY();
				var txy;
				if(Array.isArray(target)){
					txy=target;
				}
				else if(typeof target=='string'){
					var pos=parseInt(target);
					txy=[pos%ui.chesswidth,Math.floor(pos/ui.chesswidth)];
				}
				else{
					txy=target.getXY();
				}
				var dx=txy[0]-fxy[0];
				var dy=txy[1]-fxy[1];
				if(Math.abs(dx)>Math.abs(dy)){
					if(dx<0){
						if(this.movable(-1,0)){
							this.moveLeft();
							return true;
						}
					}
					else if(dx>0){
						if(this.movable(1,0)){
							this.moveRight();
							return true;
						}
					}
					if(dy<0){
						if(this.movable(0,-1)){
							this.moveUp();
							return true;
						}
					}
					else if(dy>0){
						if(this.movable(0,1)){
							this.moveDown();
							return true;
						}
					}
				}
				else{
					if(dy<0){
						if(this.movable(0,-1)){
							this.moveUp();
							return true;
						}
					}
					else if(dy>0){
						if(this.movable(0,1)){
							this.moveDown();
							return true;
						}
					}
					if(dx<0){
						if(this.movable(-1,0)){
							this.moveLeft();
							return true;
						}
					}
					else if(dx>0){
						if(this.movable(1,0)){
							this.moveRight();
							return true;
						}
					}
				}
				return false;
			},
			chessFocus:function(){
				game.addVideo('chessFocus',this);
				if(ui.chess._chessdrag) return;
				if(_status.chessscrolling) return;
				var player=this;
				var dx=0,dy=0;

				if(player.offsetLeft-ui.chessContainer.scrollLeft<14){
					dx=player.offsetLeft-ui.chessContainer.scrollLeft-14;
				}
				else if(player.offsetLeft-ui.chessContainer.scrollLeft>ui.chessContainer.offsetWidth-134){
					dx=player.offsetLeft-ui.chessContainer.scrollLeft-ui.chessContainer.offsetWidth+134;
				}
				if(player.offsetTop-ui.chessContainer.scrollTop<14){
					dy=player.offsetTop-ui.chessContainer.scrollTop-14;
				}
				else if(player.offsetTop+ui.chess.offsetTop-ui.chessContainer.scrollTop>ui.chessContainer.offsetHeight-134){
					dy=player.offsetTop+ui.chess.offsetTop-ui.chessContainer.scrollTop-ui.chessContainer.offsetHeight+134;
				}
				if(_status.currentChessFocus){
					clearInterval(_status.currentChessFocus);
				}
				var count=12;
				var ddx=Math.floor(dx/12);
				var ddy=Math.floor(dy/12);
				if(dx||dy){
					_status.currentChessFocus=setInterval(function(){
						if(count--){
							ui.chessContainer.scrollLeft+=ddx;
							ui.chessContainer.scrollTop+=ddy;
						}
						else{
							ui.chessContainer.scrollLeft+=dx%12;
							ui.chessContainer.scrollTop+=dy%12;
							clearInterval(_status.currentChessFocus);
							delete _status.currentChessFocus;
						}
					},16);
				}
			},
			getXY:function(){
				var pos=parseInt(this.dataset.position);
				var x=pos%ui.chesswidth;
				var y=Math.floor(pos/ui.chesswidth);
				return [x,y];
			},
			getDataPos:function(x,y){
				var xy=this.getXY();
				if(typeof x!='number') x=0;
				if(typeof y!='number') y=0;
				x+=xy[0];
				y+=xy[1];
				return x+y*ui.chesswidth;
			},
			getNeighbour:function(x,y){
				var xy=this.getXY();
				if(xy[0]+x<0) return null;
				if(xy[1]+y<0) return null;
				if(xy[0]+x>=ui.chesswidth) return null;
				if(xy[1]+y>=ui.chessheight) return null;
				return lib.posmap[this.getDataPos(x,y)]||null;
			},
			movable:function(x,y){
				var xy=this.getXY();
				if(xy[0]+x<0) return false;
				if(xy[1]+y<0) return false;
				if(xy[0]+x>=ui.chesswidth) return false;
				if(xy[1]+y>=ui.chessheight) return false;
				return !this.getNeighbour(x,y);
			},
			moveRight:function(){
				if(this.movable(1,0)){
					this.move(1,0);
					return true;
				}
				return false;
			},
			moveLeft:function(){
				if(this.movable(-1,0)){
					this.move(-1,0);
					return true;
				}
				return false;
			},
			moveUp:function(){
				if(this.movable(0,-1)){
					this.move(0,-1);
					return true;
				}
				return false;
			},
			moveDown:function(){
				if(this.movable(0,1)){
					this.move(0,1);
					return true;
				}
				return false;
			},
			dieAfter:function(source){
				var player=this;
				if(_status.friends){
					_status.friends.remove(this);
				}
				if(_status.enemies){
					_status.enemies.remove(this);
				}
				if(ui.friendDied&&player.side==game.me.side){
					ui.friendDied.innerHTML='阵亡: '+get.cnNumber(++_status.friendDied,true);
				}
				if(ui.enemyDied&&player.side!=game.me.side){
					ui.enemyDied.innerHTML='杀敌: '+get.cnNumber(++_status.enemyDied,true);
				}
				delete lib.posmap[player.dataset.position];
				setTimeout(function(){
					player.delete();
				},500);
				for(var i=0;i<ui.phasequeue.length;i++){
					if(ui.phasequeue[i].link==player){
						ui.phasequeue[i].remove();
						ui.phasequeue.splice(i,1);
						break;
					}
				}
				if(player==game.friendZhu){
					if(game.friendViceZhu&&game.friendViceZhu.isAlive()){
						game.friendZhu=game.friendViceZhu;
						delete game.friendViceZhu;
						game.friendZhu.node.identity.lastChild.innerHTML='将';
						game.addVideo('identityText',game.friendZhu,'将');
					}
					else{
						game.over(false);
						return;
					}
				}
				else if(player==game.enemyZhu){
					if(game.enemyViceZhu&&game.enemyViceZhu.isAlive()){
						game.enemyZhu=game.enemyViceZhu;
						delete game.enemyViceZhu;
						game.enemyZhu.node.identity.lastChild.innerHTML='帅';
						game.addVideo('identityText',game.enemyZhu,'帅');
					}
					else{
						game.over(true);
						return;
					}
				}
				if(player==game.me){
					for(var i=0;i<game.players.length;i++){
						if(game.players[i].side==player.side){
							game.modeSwapPlayer(game.players[i]);
						}
					}
				}
				var notend=false;
				for(var i=1;i<game.players.length;i++){
					if(game.players[i].side!=game.players[0].side){
						if(source&&game.players.contains(source)){
							if(_status.mode=='combat'){
								if(source.side!=player.side){
									source.draw(get.config('reward'));
								}
								else{
									switch(get.config('punish')){
										case '弃牌':
											var he=source.get('he');
											if(he.length){
												source.discard(he);
											}
											break;
										case '摸牌':
											source.draw(get.config('reward'));
											break;
									}
								}
							}
							else if(source.side!=player.side){
								source.draw();
							}
						}
						if(_status.mode!='combat'||_status.vsboss){
							return;
						}
						else{
							notend=true;
							break;
						}
					}
				}
				if(_status.mode=='combat'&&!_status.vsboss){
					if(game.players.length==1&&get.config('additional_player')&&
					_status.additionallist.length&&source==game.players[0]){
						source.draw(get.config('reward'));
					}
					if(player.side==game.me.side){
						if(get.config('additional_player')&&_status.additionallist.length){
							game.replaceChessPlayer();
							return;
						}
						else if(_status.replacelist.length){
							if(game.players.length==1&&source==game.players[0]){
								source.draw(get.config('reward'));
							}
							game.replaceChessPlayer(_status.replacelist.randomRemove());
							return;
						}
						else if(get.config('noreplace_end')){
							game.over(player.side!=game.me.side);
							return;
						}
						else if(notend){
							return;
						}
					}
					else{
						if(get.config('additional_player')&&_status.additionallist.length){
							game.replaceChessPlayer(null,true);
							return;
						}
						else if(_status.enemyreplacelist.length){
							if(game.players.length==1&&source==game.players[0]){
								source.draw(get.config('reward'));
							}
							game.replaceChessPlayer(_status.enemyreplacelist.randomRemove(),true);
							return;
						}
						else if(get.config('noreplace_end')){
							game.over(player.side!=game.me.side);
							return;
						}
						else if(notend){
							return;
						}
					}
				}
				if(_status.mode=='tafang'){
					if(_status.friends.length==0&&ui.fakeme){
						ui.fakeme.hide();
						this.node.handcards1.delete();
						this.node.handcards2.delete();
						game.me=ui.create.player();
						game.me.side=true;
					}
					return;
				}
				game.over(game.me.side==game.players[0].side);
			},
			$draw_old:function(num){
				var cards;
				if(get.itemtype(num)=='cards'){
					cards=num;
				}
				else if(get.itemtype(num)=='card'){
					cards=[num];
				}
				if(cards){
					game.addVideo('chessgainmod',this,get.cardsInfo(num));
				}
				else if(!num||typeof num=='number'){
					game.addVideo('chessgainmod',this,num);
				}

				return this.$gainmod(num);
			},
			$gainmod:function(num){
				var cards,node;
				if(get.itemtype(num)=='cards'){
					cards=num;
					num=cards.length;
				}
				else if(get.itemtype(num)=='card'){
					cards=[num];
					num=1;
				}
				if(cards){
					cards=cards.slice(0);
					node=cards.shift().copy('thrown','hidden');
				}
				else{
					node=ui.create.div('.card.thrown.hidden');
				}
				node.fixed=true;
				this.$randomMove(node,130,0);
				var ot=node.style.transform;
				if(node.style.transform&&node.style.transform!='none'){
					node.style.transform+=' scale(0.6)';
				}
				else{
					node.style.transform='scale(0.6)';
				}
				node.dataset.position=this.dataset.position;
				this.parentNode.appendChild(node);
				ui.refresh(node);
				node.show();
				node.style.transform=ot;
				setTimeout(function(){
					node.style.transform='';
					node.delete();
				},500);
				var that=this;
				if(num&&num>1){
					if(cards){
						that.$gain(cards,null,false)
					}
					else{
						that.$gain(num-1,null,false)
					}
				}
			},
			$throw:function(card,time,init){
				if(init!==false){
					if(get.itemtype(card)!='cards'){
						if(get.itemtype(card)=='card'){
							card=[card];
						}
						else{
							return;
						}
					}
					game.addVideo('throw',this,[get.cardsInfo(card),time]);
				}
				this.chessFocus();
				if(get.itemtype(card)=='cards'){
					for(var i=0;i<card.length;i++){
						this.$throw(card[i],time,false);
					}
				}
				else{
					if(card==undefined||card.length==0) return;
					var node=card.copy('thrown','hidden');
					node.dataset.position=this.dataset.position;
					this.parentNode.appendChild(node);
					ui.refresh(node);
					node.show();
					this.$randomMove(node,130,0);
					if(time!=undefined){
						node.fixed=true;
						setTimeout(function(){node.delete()},time);
					}
				}
			},
			$givemod:function(card,player){
				this.chessFocus();
				var from=this;
				if(get.itemtype(card)=='cards'){
					for(var i=0;i<card.length;i++){
						from.$givemod(card[i],player);
					}
				}
				else if(typeof card=='number'&&card>=0){
					for(var i=0;i<card;i++){
						from.$givemod('',player);
					}
				}
				else{
					var node;
					if(get.itemtype(card)=='card'){
						node=card.copy('card','thrown',false);
					}
					else{
						node=ui.create.div('.card.thrown');
					}

					node.dataset.position=this.dataset.position;
					node.fixed=true;
					node.hide();

					this.parentNode.appendChild(node);
					ui.refresh(node);
					node.show();

					this.$randomMove(node,130,0);

					setTimeout(function(){
						node.removeAttribute('style');
						node.dataset.position=player.dataset.position;
						node.delete();
					},700);
				}
			},
			$throwxy:function(card,left,top,transform){
				var node=card.copy('thrown','thrownhighlight');
				var rect=this.getBoundingClientRect();
				node.style.left=(rect.left+8)+'px';
				node.style.top=(rect.top+8)+'px';
				node.hide();
				node.style.transitionProperty='left,top,opacity';
				if(transform){
					node.style.transform='rotate('+(Math.random()*16-8)+'deg)';
				}
				ui.arena.appendChild(node);
				ui.refresh(node);
				node.show();
				node.style.left=left;
				node.style.top=top;
				return node;
			},
			$phaseJudge:function(card){
				game.addVideo('phaseJudge',this,get.cardInfo(card));
				var clone=card.copy('thrown',this.parentNode).animate('judgestart');
				var player=this;
				clone.style.opacity=0.6;
				clone.style.left=(Math.random()*100-50+ui.chessContainer.scrollLeft+ui.chessContainer.offsetWidth/2-52)+'px';
				clone.style.top=(Math.random()*80-40+ui.chessContainer.scrollTop+ui.chessContainer.offsetHeight/2-52-ui.chessContainer.offsetTop)+'px';
				game.delay();
				game.linexy([
					clone.offsetLeft+clone.offsetWidth/2,
					clone.offsetTop+clone.offsetHeight/2,
					player.offsetLeft+player.offsetWidth/2,
					player.offsetTop+player.offsetHeight/2
				],{opacity:0.5,dashed:true},true);
			},
			$randomMove:function(node,length,rand){
				if(!this.node.chessthrown){
					this.node.chessthrown=[];
				}
				var thrown=this.node.chessthrown;
				for(var i=0;i<thrown.length;i++){
					if(thrown[i].parentNode!=this.parentNode||
						thrown[i].classList.contains('removing')){
						thrown.splice(i--,1);
					}
				}
				thrown.push(node);

				var rect=this.getBoundingClientRect();
				var amax,amin;
				if(rect.left<=80){
					if(rect.top<=80){
						amin=-90;
						amax=0;
					}
					else if(rect.top+rect.height+80>=ui.chessContainer.offsetHeight){
						amin=0;
						amax=90;
					}
					else{
						amin=-90;
						amax=90;
					}
				}
				else if(rect.left+rect.width+80>=ui.chessContainer.offsetWidth){
					if(rect.top<=80){
						amin=180;
						amax=270;
					}
					else if(rect.top+rect.height+80>=ui.chessContainer.offsetHeight){
						amin=90;
						amax=180;
					}
					else{
						amin=90;
						amax=270;
					}
				}
				else if(rect.top<=80){
					amin=180;
					amax=360;
				}
				else if(rect.top+rect.height+80>=ui.chessContainer.offsetHeight){
					amin=0;
					amax=180;
				}
				else{
					var dx=ui.chessContainer.offsetWidth/2-(rect.left+rect.width/2);
					var dy=-ui.chessContainer.offsetHeight/2+(rect.top+rect.height/2);
					var ang=Math.abs(Math.atan(dy/dx))*180/Math.PI;
					if(dx<0){
						if(dy>0){
							ang=180-ang;
						}
						else{
							ang+=180;
						}
					}
					else if(dy<0){
						ang=360-ang;
					}
					amin=ang-180;
					amax=ang+180;
				}
				var da=(amax-amin)/(thrown.length*2);
				if(da>30&&thrown.length>1){
					amin+=(da-30)*thrown.length;
					da=30;
				}
				for(var i=0;i<thrown.length;i++){
					var lengthi=length+Math.random()*rand;
					var ang=amin+da*(2*i+1);
					ang*=Math.PI/180;
					var tx=lengthi*Math.cos(ang);
					var ty=-lengthi*Math.sin(ang);
					if(Math.abs(tx)<0.1){
						tx=0;
					}
					if(Math.abs(ty)<0.1){
						ty=0;
					}
					thrown[i].style.transform='translate('+tx+'px,'+ty+'px)';
				}
			},
		},
		content:{
			replaceChessPlayer:function(){
				'step 0'
				if(get.config('additional_player')){
					if(!event.enemy&&!_status.auto){
						event.dialog=ui.create.dialog('选择替补角色',[_status.additionallist.randomGets(parseInt(get.config('choice_number'))),'character']);
						event.filterButton=function(){return true;};
						event.player=game.me;
						event.forced=true;
						event.forceDie=true;
						event.custom.replace.confirm=function(){
							event.playername=ui.selected.buttons[0].link;
							event.dialog.close();
							_status.additionallist.remove(event.playername);
							if(ui.confirm) ui.confirm.close();
							game.resume();
						}
						game.check();
						game.pause();
					}
					else{
						event.playername=_status.additionallist.randomRemove();
					}
				}
				else if(!event.enemy&&get.config('seat_order')=='指定'&&!_status.auto&&_status.replacelist.length){
					_status.replacelist.add(event.playername);
					event.dialog=ui.create.dialog('选择替补角色',[_status.replacelist,'character']);
					event.filterButton=function(){return true;};
					event.player=game.me;
					event.forced=true;
					event.forceDie=true;
					event.custom.replace.confirm=function(){
						event.playername=ui.selected.buttons[0].link;
						event.dialog.close();
						_status.replacelist.remove(event.playername);
						if(ui.confirm) ui.confirm.close();
						game.resume();
					}
					game.check();
					game.pause();
				}
				else{
					game.delay();
				}
				if(game.me.isDead()){
					event.swapNow=true;
				}
				'step 1'
				var player=game.addChessPlayer(event.playername,event.enemy);
				game.log(player,'加入游戏');
				player.chessFocus();
				player.playerfocus(1000);
				game.delay(2);
				if(event.swapNow&&player.side==game.me.side){
					game.modeSwapPlayer(player);
				}
			},
			chooseToMove:function(){
				"step 0"
				if(!player.movable(0,1)&&!player.movable(0,-1)&&
					!player.movable(1,0)&&!player.movable(-1,0)){
					return;
				}
				event.switchToAuto=function(){
					if(ui.movegrids){
						while(ui.movegrids.length){
							ui.movegrids.shift().delete();
						}
					}
					var list=[];
					var randomMove=['moveUp','moveDown','moveLeft','moveRight'];
					for(var iwhile=0;iwhile<num;iwhile++){
						var targets=[];
						if(_status.mode=='tafang'&&_status.enemies.contains(player)){
							var targets2=[];
							for(var i=0;i<ui.chesswidth;i++){
								var tafangdes=ui.chesswidth*(ui.chessheight-1)+i;
								if(!lib.posmap[tafangdes]){
									targets2.push(tafangdes);
								}
							}
							targets2.sort(function(a,b){
								return Math.abs(a%ui.chesswidth-player.getXY()[0])-Math.abs(b%ui.chesswidth-player.getXY()[0]);
							});
							var tafangmoved=false;
							for(var i=0;i<targets2.length;i++){
								if(player.moveTowards(targets2[i].toString())){
									tafangmoved=true;
									break;
								}
							}
							if(tafangmoved){
								event.moved=true;
							}
							continue;
						}
						for(var i=0;i<game.players.length;i++){
							if(game.players[i].side!=player.side){
								targets.push(game.players[i]);
							}
						}
						targets.sort(function(a,b){
							return get.distance(player,a)-get.distance(player,b);
						});
						while(targets.length){
							var target=targets.shift();
							if(player.moveTowards(target)){
								event.moved=true;break;
							}
							if(targets.length==0){
								if(randomMove.length){
									var list=randomMove.slice(0);
									while(list.length){
										var thismove=list.randomRemove();
										if(player[thismove]()){
											event.moved=true;
											switch(thismove){
												case 'moveUp':randomMove.remove('moveDown');break;
												case 'moveDown':randomMove.remove('moveUp');break;
												case 'moveLeft':randomMove.remove('moveRight');break;
												case 'moveRight':randomMove.remove('moveLeft');break;
											}
											break;
										}
									}
									if(!event.moved) return;
								}
								else{
									return;
								}
							}
						}
						if(lib.skill._chessmove.ai.result.player(player)<=0) break;
					}
				};
				if(event.isMine()){
					if(event.prompt){
						event.dialog=ui.create.dialog(event.prompt);
					}
					var resume=function(){
						if(ui.movegrids){
							while(ui.movegrids.length){
								ui.movegrids.shift().delete();
							}
						}
						event.result={bool:false};
						game.resume();
					};
					if(event.phasing){
						event.custom.replace.confirm=resume;
					}
					else{
						event.control=ui.create.control('取消',resume);
					}
					game.pause();
					_status.imchoosing=true;
					ui.movegrids=[];
					player.createRangeShadow(num,true);
					for(var i=0;i<ui.movegrids.length;i++){
						var grid=ui.movegrids[i];
						if(game.isChessNeighbour(grid,player)) continue;
						for(var j=0;j<ui.movegrids.length;j++){
							if(game.isChessNeighbour(grid,ui.movegrids[j])) break;
						}
						if(j==ui.movegrids.length) grid.remove();
					}
				}
				else{
					event.switchToAuto();
				}
				"step 1"
				_status.imchoosing=false;
				if(event.moved){
					game.delay();
					event.result={
						bool:true,
						move:player.dataset.position
					}
				}
				if(!event.result){
					event.result={
						bool:false
					}
				}
				if(event.control){
					event.control.close();
				}
				if(event.dialog){
					event.dialog.close();
				}
			}
		}
	},
	game:{
		minskin:true,
		singleHandcard:true,
		chess:true,
		treasures:[],
		obstacles:[],
		getVideoName:function(){
			var str='战棋'+get.translation(_status.mode)+' - '+_status.friendCount+'v'+_status.enemyCount;
			if(_status.mode=='tafang'){
				str='战棋 - 塔防';
			}
			var name=[get.translation(game.me.name),str];
			return name;
		},
		addChessPlayer:function(name,enemy,num,pos){
			if(typeof num!='number'){
				num=4;
			}
			var player=ui.create.player();
			player.getId();
			if(enemy=='treasure'){
				player.animate('judgestart');
				player.side=null;
				player.identity='neutral';
				player.setIdentity();
				player.node.identity.dataset.color='zhong';
				player.classList.add('treasure');
				player.life=6+Math.floor(Math.random()*6);
				game.treasures.add(player);
			}
			else{
				player.animate('start');
				if(enemy){
					player.side=!game.me.side;
					player.setIdentity('enemy');
					player.identity='enemy';
				}
				else{
					player.side=game.me.side;
					player.setIdentity('friend');
					player.identity='friend';
				}
				player.node.identity.dataset.color=get.translation(player.side+'Color');
				game.players.push(player);
				// if(lib.config.animation){
				// 	setTimeout(function(){
				// 		player.$rare2();
				// 	},300);
				// }
			}
			ui.chess.appendChild(player);
			if(_status.video||(pos&&!lib.posmap[pos])){
				player.dataset.position=pos;
			}
			else{
				var grids=[];
				var gridnum=ui.chessheight*ui.chesswidth;
				for(var i=0;i<gridnum;i++){
					grids.push(i);
				}
				for(var i=0;i<game.players.length;i++){
					grids.remove(parseInt(game.players[i].dataset.position));
				}
				for(var i=0;i<game.obstacles.length;i++){
					grids.remove(parseInt(game.obstacles[i].dataset.position));
				}
				for(var i=0;i<game.treasures.length;i++){
					grids.remove(parseInt(game.treasures[i].dataset.position));
				}
				player.dataset.position=grids.randomGet();
			}
			lib.posmap[player.dataset.position]=player;
			game.addVideo('addChessPlayer',null,[name,enemy,num,player.dataset.position]);
			player.init(name);
			if(num&&!_status.video){
				player.directgain(get.cards(num));
			}
			game.arrangePlayers();
			player.chessFocus();
			if(game.me&&game.me.name){
				game.setChessInfo();
			}
			else if(game.players.length){
				game.setChessInfo(game.players[0]);
			}

			return player;
		},
		replaceChessPlayer:function(name,enemy){
			var next=game.createEvent('replaceChessPlayer');
			next.playername=name;
			next.enemy=enemy;
			next.setContent('replaceChessPlayer');
		},
		removeTreasure:function(player){
			game.addVideo('removeTreasure',null,player.dataset.position);
			player.delete();
			delete lib.posmap[player.dataset.position];
			game.treasures.remove(player);
		},
		addObstacle:function(x,y){
			if(y!==false){
				game.addVideo('addObstacle',null,[x,y]);
			}
			var pos;
			if(typeof x=='string'){
				pos=x;
			}
			else{
				if(x>=ui.chesswidth){
					x=ui.chesswidth-1;
				}
				if(y>=ui.chessheight){
					y=ui.chessheight-1;
				}

				pos=y*ui.chesswidth+x;
			}
			if(!lib.posmap[pos]){
				var grid=ui.create.div('.player.minskin.obstacle',ui.chess).animate('start');
				grid.dataset.position=pos;
				grid.listen(ui.click.obstacle);
				lib.posmap[pos]=grid;
				game.obstacles.push(grid);
			}
		},
		removeObstacle:function(pos){
			var node=lib.posmap[pos];
			if(node&&game.obstacles.contains(node)){
				game.addVideo('removeObstacle',null,pos);
				game.obstacles.remove(node);
				delete lib.posmap[pos];
				node.delete();
			}
		},
		addOverDialog:function(dialog,result){
			if(ui.finishGame){
				ui.finishGame.remove();
			}
			dialog.classList.add('center');
			if(_status.mode!='leader') return;
			if(result=='战斗胜利'){
				_status.victory=true;
				if(!_status.enterArena){
					var div=ui.create.div();
					div.innerHTML='获得'+game.reward+'金';
					dialog.add(div);
					if(_status.challenge&&_status.challengeMoney<=game.data.dust){
						var div2=ui.create.div();
						div2.style.display='block';
						div2.innerHTML='招降所需招募令：'+_status.challengeMoney+'/'+game.data.dust;
						dialog.add(div2);
					}
					game.changeMoney(game.reward);
					game.saveData();
				}
			}
			else if(_status.zhaoxiang){
				var div=ui.create.div();
				div.innerHTML='招降'+get.translation(_status.zhaoxiang)+'成功';
				dialog.add(div);
			}
		},
		controlOver:function(){
			ui.create.control('返回',game.reload);
			if(_status.mode!='leader') return;
			if(_status.enterArena){
				game.data.arena.acted.length=0;
				if(_status.victory){
					game.data.arena.win++;
					for(var i=0;i<game.players.length;i++){
						if(_status.arenaAdd&&_status.arenaAdd.contains(game.players[i].name)){
							continue;
						}
						if(game.data.arena.dead.contains(game.players[i].name)){
							game.data.arena.dead.remove(game.players[i].name);
							game.data.arena.acted.push(game.players[i].name);
						}
					}
				}
				game.saveData();
			}
			else{
				if(_status.challenge&&(_status.zhaoxiang||_status.victory)){
					game.data.challenge=game.getLeaderList();
					game.saveData();
				}
				if(_status.challenge&&!_status.zhaoxiang&&_status.victory){
					var money=_status.challengeMoney;
					if(game.data.dust>=money){
						ui.create.control('招降'+get.translation(_status.challenge),function(){
							game.data.character.add(_status.challenge);
							game.data.challenge=game.getLeaderList();
							game.changeDust(-money);
							game.reload();
						});
					}
				}
			}
		},
		phaseLoopTafang:function(){
			var next=game.createEvent('phaseLoop');
			next.setContent(function(){
				'step 0'
				_status.turnCount++;
				ui.turnCount.innerHTML='回合'+get.cnNumber(_status.turnCount,true);
				var dialog=ui.create.dialog('剩余行动点：'+(10+_status.remainingCount),'hidden');
				dialog.style.height='260px';
				dialog.style.top='calc(50% - 140px)';
				dialog.classList.add('center');
				dialog.classList.add('noupdate');
				event.dialog=dialog;
				var list=_status.characterList.splice(0,6);
				var map={};
				map.bufang=ui.create.buttons(lib.mechlist,'character',dialog.content);
				var difficulty=parseInt(get.config('tafang_difficulty'));
				for(var i=0;i<map.bufang.length;i++){
					var button=map.bufang[i];
					button.node.name.style.top='8px';
					button.node.intro.classList.add('showintro');
					button.node.intro.classList.add('tafang');
					if(button.link=='chess_mech_nengliangqiu'||
						button.link=='chess_mech_guangmingquan'||
						button.link=='chess_mech_jiguanren'){
						button.count=difficulty+1;
						button.node.intro.innerHTML=get.cnNumber(button.count,true);
					}
					else{
						button.count=difficulty+2;
						button.node.intro.innerHTML=get.cnNumber(button.count,true);
					}
					button._link='布防';
				}
				map.zhaomu=ui.create.buttons(list,'character',dialog.content);
				for(var i=0;i<map.zhaomu.length;i++){
					var button=map.zhaomu[i];
					button.node.intro.classList.add('showintro');
					button.node.intro.classList.add('tafang');
					button.count=difficulty+4;
					button.node.intro.innerHTML=get.cnNumber(button.count,true);
					button._link='招募';
				}
				if(_status.friends.length){
					map.xingdong=ui.create.buttons(_status.friends,'player',dialog.content);
					for(var i=0;i<map.xingdong.length;i++){
						var button=map.xingdong[i];
						button.node.intro.classList.add('showintro');
						button.node.intro.classList.add('tafang');
						if(difficulty<2){
							button.count=1;
						}
						else{
							button.count=2;
						}
						button.node.intro.innerHTML=get.cnNumber(button.count,true);
						button._link='行动';
					}
				}
				else{
					map.xingdong=[];
				}
				var updateSelected=function(){
					var count=10+_status.remainingCount;
					var selected=dialog.querySelectorAll('.button.selected');
					var selectedZhaomu=0;
					for(var i=0;i<selected.length;i++){
						count-=selected[i].count;
						if(selected[i]._link=='招募'){
							selectedZhaomu++;
						}
					}
					for(var i in map){
						for(var j=0;j<map[i].length;j++){
							map[i][j].classList.remove('unselectable');
							if(map[i][j].count>count){
								map[i][j].classList.add('unselectable');
							}
							else if(i=='zhaomu'&&_status.friends.length+selectedZhaomu>=ui.chesswidth){
								map[i][j].classList.add('unselectable');
							}
							else if(i=='bufang'){
								var numbufang=0;
								for(var k=0;k<game.treasures.length;k++){
									if(game.treasures[k].name==map[i][j].link){
										numbufang++;
									}
									if(numbufang>=3){
										map[i][j].classList.add('unselectable');
										break;
									}
								}
							}
						}
					}
					ui.dialog.content.firstChild.innerHTML='剩余行动点：'+count;
				}
				var clickOrder=0;
				event.custom.replace.button=function(button){
					if(!button.classList.contains('unselectable')||
						button.classList.contains('selected')){
						button.classList.toggle('selected');
						button._clickOrder=clickOrder++;
					}
					updateSelected();
				}
				event.custom.add.window=function(clicked){
					if(clicked) return;
					if(event.step>1) return;
					for(var i in map){
						for(var j=0;j<map[i].length;j++){
							map[i][j].classList.remove('selected');
							map[i][j].classList.remove('unselectable');
						}
					}
					updateSelected();
				}
				var update=function(link){
					for(var i in map){
						for(var j=0;j<map[i].length;j++){
							if(map[i][j]._link!=link){
								map[i][j].style.display='none';
							}
							else{
								map[i][j].style.display='';
							}
						}
					}
					for(var i=0;i<event.control.childNodes.length;i++){
						if(event.control.childNodes[i].innerHTML==link){
							event.control.childNodes[i].classList.add('thundertext');
						}
					}
					_status.lastTafangCommand=link;
				}
				event.control=ui.create.control('布防','招募','行动',function(link,node){
					if(link=='行动'&&_status.friends.length==0) return;
					if(link=='招募'&&_status.friends.length>=ui.chesswidth) return;
					var current=node.parentNode.querySelector('.thundertext');
					if(current==node) return;
					if(current){
						current.classList.remove('thundertext');
					}
					update(link);
				});
				if(!_status.friends.length){
					event.control.lastChild.style.opacity=0.5;
					if(_status.lastTafangCommand=='行动'){
						_status.lastTafangCommand='招募';
					}
				}
				if(_status.friends.length>=ui.chesswidth){
					event.control.childNodes[1].style.opacity=0.5;
					if(_status.lastTafangCommand=='招募'){
						_status.lastTafangCommand='行动';
					}
				}
				_status.imchoosing=true;
				ui.auto.hide();
				var eventdong=function(){
					var selected=dialog.querySelectorAll('.button.selected');
					event.bufang=[];
					event.zhaomu=[];
					event.xingdong=[];
					var xingdongs=[];
					_status.remainingCount+=10;
					for(var i=0;i<selected.length;i++){
						switch(selected[i]._link){
							case '布防':event.bufang.push(selected[i].link);break;
							case '招募':event.zhaomu.push(selected[i].link);break;
							case '行动':xingdongs.push(selected[i]);break;
						}
						_status.remainingCount-=selected[i].count;
					}
					_status.remainingCount=Math.ceil(_status.remainingCount/2);
					xingdongs.sort(function(a,b){
						return a._clickOrder-b._clickOrder;
					});
					for(var i=0;i<xingdongs.length;i++){
						event.xingdong.push(xingdongs[i].link);
					}
					game.resume();
				};
				event.done=ui.create.control('完成',eventdong);
				if(_status.lastTafangCommand){
					update(_status.lastTafangCommand);
				}
				else{
					update('招募');
				}
				if(_status.characterList.length<6){
					game.over(true);
					event.done.close();
					event.control.close();
					return;
				}
				setTimeout(function(){
					dialog.open();
					updateSelected();
				},50);
				event.switchToAuto=eventdong;
				if(!_status.auto){
					game.pause();
				}
				else{
					eventdong();
				}
				'step 1'
				event.dialog.close();
				event.control.close();
				event.done.close();
				delete event.dialog;
				delete event.control;
				delete event.done;
				'step 2'
				event.chooseObstacle=false;
				if(event.bufang.length){
					event.obstacles=game.obstacles.slice(0);
					for(var i=0;i<event.obstacles.length;i++){
						event.obstacles[i].classList.add('glow');
					}
					event.chooseObstacle=true;
					event.currentBufang=event.bufang.shift();
					event.dialog=ui.create.dialog('选择一个位置放置【'+get.translation(event.currentBufang)+'】');
					if(!_status.auto){
						game.pause();
					}
					else{
						event.obstacle=event.obstacles.randomGet();
					}
					event.switchToAuto=function(){
						event.obstacle=event.obstacles.randomGet();
						game.resume();
					};
				}
				else{
					delete event.bufang;
				}
				'step 3'
				if(event.dialog){
					event.dialog.close();
					delete event.dialog;
				}
				if(event.chooseObstacle){
					game.removeObstacle(event.obstacle.dataset.position);
					game.addChessPlayer(event.currentBufang,'treasure',0,event.obstacle.dataset.position).life=3;
					event.chooseObstacle=false;
					event.goto(2);
				}
				else{
					if(event.obstacles){
						for(var i=0;i<event.obstacles.length;i++){
							event.obstacles[i].classList.remove('glow');
						}
						delete event.obstacles;
					}
					delete event.obstacle;
					delete event.currentBufang;
				}
				'step 4'
				if(event.dialog){
					event.dialog.close();
					delete event.dialog;
				}
				if(event.zhaomu.length){
					event.currentZhaomu=event.zhaomu.shift();
					event.dialog=ui.create.dialog('选择一个位置安排【'+get.translation(event.currentZhaomu)+'】');
					var size=ui.chesswidth*(ui.chessheight-1);
					var clickGrid=function(){
						var player=game.addChessPlayer(event.currentZhaomu,false,4,this.dataset.position);
						_status.friends.push(player);
						if(!game.me.name){
							game.me=player;
							game.me.classList.add('current_action');
							ui.me.querySelector('.fakeme.avatar').show();
							ui.me.querySelector('.fakeme.player').show();
							ui.create.fakeme();
							ui.handcards1=player.node.handcards1.animate('start').fix();
							ui.handcards2=player.node.handcards2.animate('start').fix();
							ui.handcards1Container.appendChild(ui.handcards1);
							ui.handcards2Container.appendChild(ui.handcards2);
							ui.updatehl();
							game.setChessInfo();
							game.addVideo('tafangMe',player);
						}
						this.delete();
						event.redo();
						game.resume();
					}
					if(!event.playergrids){
						event.playergrids=[]
						for(var i=ui.chesswidth;i<size;i++){
							if(!lib.posmap[i.toString()]){
								var grid=ui.create.div('.player.minskin.playerblank.glow',clickGrid,ui.chess);
								grid.animate('start');
								grid.dataset.position=i;
								event.playergrids.push(grid);
							}
						}
					}
					game.pause();
					if(_status.auto){
						setTimeout(function(){
							clickGrid.call(event.playergrids.randomGet());
						},50);
					}
					event.switchToAuto=function(){
						clickGrid.call(event.playergrids.randomGet());
					}
				}
				else{
					delete event.zhaomu;
				}
				'step 5'
				_status.imchoosing=false;
				ui.auto.show();
				game.delay();
				if(event.dialog){
					event.dialog.close();
					delete event.dialog;
				}
				if(event.playergrids){
					for(var i=0;i<event.playergrids.length;i++){
						event.playergrids[i].delete();
					}
					delete event.playergrids;
				}
				delete event.currentZhaomu;
				'step 6'
				var shalldelay=false;
				for(var i=0;i<ui.chesswidth;i++){
					if(lib.posmap[i]&&game.players.contains(lib.posmap[i])){
						for(var j=0;j<ui.chessheight;j++){
							var pos=i+j*ui.chesswidth;
							if(lib.posmap[pos]&&lib.posmap[pos].movable(0,1)){
								break;
							}
						}
						if(j<ui.chessheight){
							shalldelay=true;
							for(var k=j;k>=0;k--){
								var pos=i+k*ui.chesswidth;
								if(lib.posmap[pos]){
									lib.posmap[pos].moveDown();
								}
							}
						}
					}
				}
				if(shalldelay) game.delay();
				'step 7'
				event.justadded=[];
				if(_status.characterList.length){
					if(_status.enemies.length<ui.chesswidth*2){
						var list1=[];
						for(var i=0;i<ui.chesswidth;i++){
							if(!lib.posmap[i]){
								list1.push(i);
							}
						}
						if(list1.length){
							var enemy=game.addChessPlayer(_status.characterList.shift(),true,4,list1.randomRemove());
							_status.enemies.push(enemy);
							event.justadded.push(enemy.name);
							if(game.players.length==1){
								ui.me.querySelector('.fakeme.player').show();
								game.setChessInfo(game.players[0]);
							}
							game.delay();
						}
						// var difficulty=get.config('tafang_difficulty');
						// if(_status.turnCount>=10&&list1.length&&difficulty>1){
						// 	var enemy=game.addChessPlayer(_status.characterList.shift(),true,4,list1.randomRemove());
						// 	_status.enemies.push(enemy);
						// 	event.justadded.push(enemy.name);
						// }
						// if(_status.turnCount>=20&&list1.length&&difficulty>1){
						// 	var enemy=game.addChessPlayer(_status.characterList.shift(),true,4,list1.randomRemove());
						// 	_status.enemies.push(enemy);
						// 	event.justadded.push(enemy.name);
						// }
						// if(list1.length&&difficulty>2){
						// 	var enemy=game.addChessPlayer(_status.characterList.shift(),true,4,list1.randomRemove());
						// 	_status.enemies.push(enemy);
						// 	event.justadded.push(enemy.name);
						// }
					}
				}
				else{
					game.over(true);
				}
				'step 8'
				if(event.xingdong.length){
					var toact=event.xingdong.shift();
					if(game.players.contains(toact)){
						toact.phase();
					}
					event.redo();
				}
				else{
					event.xingdong=_status.enemies.slice(0);
				}
				'step 9'
				if(event.xingdong.length){
					var enemy=event.xingdong.shift();
					if(!event.justadded.contains(enemy.name)&&game.players.contains(enemy)){
						enemy.phase();
					}
					event.redo();
				}
				else{
					event.mechlist=game.treasures.slice(0);
				}
				'step 10'
				if(event.mechlist.length){
					var mech=event.mechlist.shift();
					var info=lib.skill[mech.name+'_skill'];
					if(!info.filter||info.filter(mech)){
						var next=game.createEvent('chessMech');
						next.player=mech;
						next.setContent(info.content);
						mech.chessFocus();
						if(lib.config.animation&&!lib.config.low_performance){
							mech.$epic2();
						}
						game.delay();
					}
					if(mech.life--<=0){
						game.treasures.remove(mech);
						setTimeout(function(){
							mech.delete();
						},500);
						delete lib.posmap[mech.dataset.position];
						game.addVideo('deleteChessPlayer',mech);
						game.addObstacle(mech.dataset.position);
						game.log(get.translation(mech)+'使用期限已到');
					}
					event.redo();
				}
				'step 11'
				delete event.xingdong;
				delete event.mechlist;
				if(_status.turnCount>=_status.turnTotal){
					game.over(true);
				}
				else{
					event.goto(0);
					game.delay();
				}
			});
		},
		phaseLoopOrdered:function(player){
			var next=game.createEvent('phaseLoop');
			next.player=player;
			next.setContent(function(){
				"step 0"
				var passed=false;
				for(var i=0;i<game.players.length;i++){
					if(!game.players[i].classList.contains('acted')){
						if(game.players[i].side==player.side){
							passed=true;break;
						}
					}
				}
				if(!passed){
					var num1=0;
					var next=null;
					for(var i=0;i<game.players.length;i++){
						if(game.players[i].side==player.side){
							game.players[i].classList.remove('acted');
							num1++;
						}
						else if(!next){
							next=game.players[i];
						}
					}
					var num2=game.players.length-num1;
					if(num2>num1){
						if(next.side==game.me.side){
							next=game.me;
						}
						var str;
						if(num2-num1>1){
							str='选择至多'+get.cnNumber(num2-num1)+'个已方角色各摸一张牌'
						}
						else{
							str='选择一个已方角色摸一张牌'
						}
						var nevt=next.chooseTarget(str,function(card,player,target){
							return target.side==next.side;
						},[1,num2-num1]);
						nevt.ai=function(target){
							return Math.max(1,10-target.num('h'));
						};
						nevt.chessForceAll=true;
					}
					else{
						event.goto(2);
					}
				}
				else{
					event.goto(2);
				}
				"step 1"
				if(result.bool){
					game.asyncDraw(result.targets);
				}
				"step 2"
				var players=[];
				if(player.side==game.me.side){
					player=game.me;
				}
				if(player.isDead()){
					for(var i=0;i<game.players.length;i++){
						if(game.players[i].side==player.side){
							player=game.players[i];
						}
					}
				}
				for(var i=0;i<game.players.length;i++){
					if(game.players[i].side==player.side){
						if(!game.players[i].classList.contains('acted')){
							players.push(game.players[i]);
						}
					}
				}
				if(players.length>1){
					var nevt=player.chooseTarget('选择下一个行动的角色',function(card,player,target){
						return target.side==player.side&&!target.classList.contains('acted');
					},true);
					nevt.chessForceAll=true;
					nevt.ai=function(target){
						var nj=target.num('j');
						if(nj){
							return -nj;
						}
						return Math.max(0,10-target.hp);
					}
				}
				else{
					event.decided=players[0];
				}
				"step 3"
				if(event.decided){
					event.decided.phase();
					event.justacted=event.decided;
					delete event.decided;
				}
				else{
					var current=result.targets[0];
					current.phase();
					event.justacted=current;
				}
				"step 4"
				event.justacted.classList.add('acted');
				event.goto(0);
				for(var i=0;i<game.players.length;i++){
					if(game.players[i].side!=event.justacted.side){
						event.player=game.players[i];
						break;
					}
				}
				if(Math.random()<parseFloat(get.config('chess_treasure'))){
					var list=[];
					for(var i=0;i<game.treasures.length;i++){
						list.push(game.treasures[i].name);
					}
					if(list.length<lib.treasurelist.length){
						var name=Array.prototype.randomGet.apply(lib.treasurelist,list);
						var treasure=game.addChessPlayer(name,'treasure',0);
						treasure.playerfocus(1500);
						if(lib.config.animation&&!lib.config.low_performance){
							setTimeout(function(){
								treasure.$rare2();
							},500);
						}
						game.delay(3);
					}
				}
				for(var i=0;i<game.treasures.length;i++){
					game.treasures[i].life--;
					if(game.treasures[i].life<=0){
						game.removeTreasure(game.treasures[i--]);
					}
				}
			});
		},
		isChessNeighbour:function(a,b){
			if(a&&a.dataset){
				a=a.dataset.position;
			}
			if(b&&b.dataset){
				b=b.dataset.position;
			}
			var ax=a%ui.chesswidth;
			var ay=Math.floor(a/ui.chesswidth);

			var bx=b%ui.chesswidth;
			var by=Math.floor(b/ui.chesswidth);

			if(ax==bx&&Math.abs(ay-by)==1) return true;
			if(ay==by&&Math.abs(ax-bx)==1) return true;

			return false;
		},
		draw2:function(func){
			lib.canvasUpdates2.push(func);
			if(!lib.status.canvas2){
				lib.status.canvas2=true;
				game.update(game.updateCanvas2);
			}
		},
		updateCanvas2:function(time){
			if(lib.canvasUpdates2.length===0){
				lib.status.canvas2=false;
				return false;
			}
			ui.canvas2.width=ui.chess.offsetWidth;
			ui.canvas2.height=ui.chess.offsetHeight;
			ui.canvas2.style.left=0;
			ui.canvas2.style.top=0;
			var ctx=ui.ctx2;
			ctx.shadowBlur=5;
			ctx.shadowColor='rgba(0,0,0,0.3)';
			ctx.fillStyle='white';
			ctx.strokeStyle='white';
			ctx.lineWidth=3;
			ctx.save();
			for(var i=0;i<lib.canvasUpdates2.length;i++){
				ctx.restore();
				ctx.save();
				var update=lib.canvasUpdates2[i];
				if(!update.starttime){
					update.starttime=time;
				}
				if(update(time-update.starttime,ctx)===false){
					lib.canvasUpdates2.splice(i--,1);
				}
			}
		},
		setChessInfo:function(p){
			if(!p){
				if(ui.phasequeue&&ui.phasequeue.length){
					p=ui.phasequeue[0].link;
				}
				else{
					p=game.me;
				}
			}
			ui.chessinfo.innerHTML='';
			ui.phasequeue=[];
			for(var i=0;i<game.players.length;i++){
				var node=ui.create.div('.avatar',ui.chessinfo);
				node.style.backgroundImage=p.node.avatar.style.backgroundImage;
				node.link=p;
				node.listen(ui.click.chessInfo);
				p.instance=node;
				if(_status.currentPhase==p){
					node.classList.add('glow2');
				}
				ui.phasequeue.push(node);
				p=p.next;
			}
		},
		initLeaderSave:function(save){
			game.save(save,{
				money:300,
				dust:0,
				legend:0,
				character:[]
			});
		},
		leaderView:function(){
			var next=game.createEvent('leaderView',false);
			next.setContent(function(){
				'step 0'
				var save=get.config('chess_leader_save');
				if(!save){
					save='save1';
				}
				if(!lib.storage[save]){
					game.initLeaderSave(save);
				}
				game.data=lib.storage[save];
				ui.wuxie.hide();
				ui.auto.hide();
				ui.money=ui.create.div(ui.window);
				ui.money.innerHTML='<span>⚑</span><span>'+game.data.dust+'</span>'+
					'<span>㉤</span><span>'+game.data.money+'</span>';
				ui.money.style.top='auto';
				ui.money.style.left='auto';
				ui.money.style.right='20px';
				ui.money.style.bottom='15px';
				ui.money.childNodes[0].style.color='rgb(111, 198, 255)';
				ui.money.childNodes[1].style.fontFamily='huangcao';
				ui.money.childNodes[1].style.marginRight='10px';
				ui.money.childNodes[2].style.color='#FFE600';
				ui.money.childNodes[3].style.fontFamily='huangcao';
				ui.money.style.letterSpacing='4px';
				for(var i in lib.rank){
					if(Array.isArray(lib.rank[i])){
						for(var j=0;j<lib.rank[i].length;j++){
							if(!lib.character[lib.rank[i][j]]){
								lib.rank[i].splice(j--,1);
							}
						}
					}
				}
				for(var i in lib.rank.rarity){
					if(Array.isArray(lib.rank.rarity[i])){
						for(var j=0;j<lib.rank.rarity[i].length;j++){
							if(!lib.character[lib.rank.rarity[i][j]]){
								lib.rank.rarity[i].splice(j--,1);
							}
						}
					}
				}
				'step 1'
				lib.rank.all=lib.rank.s.
					concat(lib.rank.ap).
					concat(lib.rank.a).
					concat(lib.rank.am).
					concat(lib.rank.bp).
					concat(lib.rank.b).
					concat(lib.rank.bm).
					concat(lib.rank.c).
					concat(lib.rank.d);
				lib.rank.rarity.common=[];
				for(var i=0;i<lib.rank.all.length;i++){
					if(!lib.rank.rarity.legend.contains(lib.rank.all[i])&&
						!lib.rank.rarity.epic.contains(lib.rank.all[i])&&
						!lib.rank.rarity.rare.contains(lib.rank.all[i])){
						lib.rank.rarity.common.push(lib.rank.all[i]);
					}
				}
				delete window.characterRank;

				ui.control.style.transition='all 0s';
				if(lib.config.layout=='mobile'||lib.config.layout=='default'){
					ui.control.style.top='calc(100% - 70px)';
				}
				else if(lib.config.layout=='phone'){
					ui.control.style.top='calc(100% - 80px)';
				}
				else{
					ui.control.style.top='calc(100% - 30px)';
				}
				var cardNode=function(i,name,load){
					var node=ui.create.player(ui.window);
					node.style.transition='all 0.7s';
					node.style.opacity=0;
					node.style.zIndex=4;

					var kaibao=false;
					if(!name||typeof i=='string'){
						if(!name){
							name=game.getLeaderCharacter();
							event.cardnodes.push(node);
						}
						else{
							node.classList.add('minskin')
						}
						kaibao=true;
						node.style.left='calc(50% - 75px)';
						node.style.top='calc(50% - 90px)';
						ui.refresh(node);
					}
					else if(!load){
						node.style.transform='perspective(1200px) rotateY(180deg) translate(0,-200px)';
					}
					node.name=name;
					if(!load){
						switch(i){
							case 0:{
								node.style.left='calc(50% - 75px)';
								node.style.top='calc(25% - 90px)';
								break;
							}
							case 1:{
								node.style.left='calc(30% - 90px)';
								node.style.top='calc(75% - 90px)';
								break;
							}
							case 2:{
								node.style.left='calc(70% - 60px)';
								node.style.top='calc(75% - 90px)';
								break;
							}
							case '51':{
								node.style.left='calc(50% - 60px)';
								node.style.top='calc(25% - 75px)';
								break;
							}
							case '52':{
								node.style.left='calc(35% - 55px)';
								node.style.top='calc(75% - 25px)';
								break;
							}
							case '53':{
								node.style.left='calc(65% - 65px)';
								node.style.top='calc(75% - 25px)';
								break;
							}
							case '54':{
								node.style.left='calc(25% - 75px)';
								node.style.top='calc(50% - 70px)';
								break;
							}
							case '55':{
								node.style.left='calc(75% - 45px)';
								node.style.top='calc(50% - 70px)';
								break;
							}
						}
						if(!kaibao){
							node.style.top='calc(50% - 180px)';
							ui.refresh(node);
						}
						node.style.opacity=1;
					}
					node.node.count.remove();
					node.node.marks.remove();
					var rarity=game.getRarity(name);
					if(rarity!='common'){
						node.rarity=rarity;
						node.node.intro.style.left='14px';
						if(node.classList.contains('minskin')){
							node.node.intro.style.top='84px';
						}
						else{
							node.node.intro.style.top='145px';
						}
						node.node.intro.style.fontSize='20px';
						node.node.intro.style.fontFamily='huangcao';
						switch(rarity){
							case 'rare':node.node.intro.dataset.nature='waterm';break;
							case 'epic':node.node.intro.dataset.nature='thunderm';break;
							case 'legend':node.node.intro.dataset.nature='metalm';break;
						}
					}
					if(kaibao){
						node.node.avatar.style.display='none';
						node.style.transform='perspective(1200px) rotateY(180deg) translateX(0)';
						if(typeof i=='string'){
							node.listen(event.turnCard2);
						}
						else{
							node.listen(turnCard);
							if(!game.data.character.contains(name)){
								game.data.character.push(name);
								if(game.data.challenge.contains(name)){
									game.data.challenge=game.getLeaderList();
									game.saveData();
								}
								var button=ui.create.button(name,'character');
								button.classList.add('glow2');
								dialog1.content.lastChild.insertBefore(button,dialog1.content.lastChild.firstChild);
								dialog1.buttons.push(button);
								fixButton(button);
								button.area='character';
							}
							else{
								switch(rarity){
									case 'common':game.data.dust+=10;break;
									case 'rare':game.data.dust+=30;break;
									case 'epic':game.data.dust+=150;break;
									case 'legend':game.data.dust+=600;break;
								}
							}
						}
					}
					else{
						node.style.transform='';
					}
					return node;
				};
				event.cardNode=cardNode;
				if(game.data.arena){
					ui.money.style.display='none';
					_status.enterArena=true;
					return;
				}
				var groupSort=function(name){
					if(lib.character[name][1]=='wei') return 0;
					if(lib.character[name][1]=='shu') return 1;
					if(lib.character[name][1]=='wu') return 2;
					if(lib.character[name][1]=='qun') return 3;
				};
				game.data.character.sort(function(a,b){
					var del=groupSort(a)-groupSort(b);
					if(del!=0) return del;
					var aa=a,bb=b;
					if(a.indexOf('_')!=-1){
						a=a.slice(a.indexOf('_')+1);
					}
					if(b.indexOf('_')!=-1){
						b=b.slice(b.indexOf('_')+1);
					}
					if(a!=b){
						return a>b?1:-1;
					}
					return aa>bb?1:-1;
				});
				if(game.data.character.length==0||!game.data.challenge){
					game.data.character=lib.rank.rarity.common.randomGets(3);
					game.data.challenge=game.getLeaderList();
					game.saveData();
				}
				var fixButton=function(button){
					var rarity=game.getRarity(button.link);
					if(rarity!='common'){
						var intro=button.node.intro;
						intro.classList.add('showintro');
						intro.style.fontFamily='huangcao';
						intro.style.fontSize='20px';
						intro.style.top='82px';
						intro.style.left='2px';
						switch(rarity){
							case 'rare':intro.dataset.nature='waterm';break;
							case 'epic':intro.dataset.nature='thunderm';break;
							case 'legend':intro.dataset.nature='metalm';break;
						}
						intro.innerHTML=get.translation(rarity);
					}
				}
				game.leaderLord=['leader_caocao','leader_liubei','leader_sunquan'];
				var dialog1=ui.create.dialog('选择君主','hidden');
				event.dialog1=dialog1;
				dialog1.classList.add('fullheight');
				dialog1.classList.add('halfleft');
				dialog1.classList.add('fixed');
				dialog1.add([game.leaderLord,'character']);
				var i;
				for(i=0;i<dialog1.buttons.length;i++){
					dialog1.buttons[i].area='lord';
				}
				var j=i;
				dialog1.add('选择武将');
				var getCapt=function(str){
					if(str.indexOf('_')==-1){
						return str[0];
					}
					return str[str.indexOf('_')+1];
				}
				var clickCapt=function(e){
					if(_status.dragged) return;
					if(this.classList.contains('thundertext')){
						dialog1.currentcapt=null;
						dialog1.currentcaptnode=null;
						this.classList.remove('thundertext');
						for(var i=0;i<dialog1.buttons.length;i++){
							dialog1.buttons[i].style.display='';
						}
					}
					else{
						if(dialog1.currentcaptnode){
							dialog1.currentcaptnode.classList.remove('thundertext');
						}
						dialog1.currentcapt=this.link;
						dialog1.currentcaptnode=this;
						this.classList.add('thundertext');
						for(var i=0;i<dialog1.buttons.length;i++){
							if(dialog1.buttons[i].area!='character') continue;
							if(getCapt(dialog1.buttons[i].link)!=dialog1.currentcapt){
								dialog1.buttons[i].style.display='none';
							}
							else{
								dialog1.buttons[i].style.display='';
							}
						}
					}
					e.stopPropagation();
				};
				var captnode=ui.create.div('.caption');
				var initcapt=function(){
					var namecapt=[];
					for(var i=0;i<game.data.character.length;i++){
						var ii=game.data.character[i];
						if(namecapt.indexOf(getCapt(ii))==-1){
							namecapt.push(getCapt(ii));
						}
					}
					namecapt.sort(function(a,b){
						return a>b?1:-1;
					});
					captnode.innerHTML='';
					for(i=0;i<namecapt.length;i++){
						var span=document.createElement('span');
						span.innerHTML=' '+namecapt[i].toUpperCase()+' ';
						span.link=namecapt[i];
						span.addEventListener(lib.config.touchscreen?'touchend':'click',clickCapt);
						captnode.appendChild(span);
					}
					if(game.data.character.length<=15){
						captnode.style.display='none';
					}
					else{
						captnode.style.display='';
					}
				};
				initcapt();
				dialog1.captnode=captnode;
				dialog1.add(captnode);
				dialog1.add([game.data.character,'character']);
				for(i=j;i<dialog1.buttons.length;i++){
					dialog1.buttons[i].area='character';
					fixButton(dialog1.buttons[i]);
				}
				dialog1.open();

				var dialog2=ui.create.dialog('战斗难度','hidden');
				event.dialog2=dialog2;
				dialog2.classList.add('fullheight');
				dialog2.classList.add('halfright');
				dialog2.classList.add('fixed');
				dialog2.add([[
					['','','leader_easy'],
					['','','leader_medium'],
					['','','leader_hard']
				],'vcard']);
				for(i=0;i<dialog2.buttons.length;i++){
					dialog2.buttons[i].node.name.style.fontFamily='xinwei';
					dialog2.buttons[i].node.name.style.fontSize='30px';
					dialog2.buttons[i].node.name.style.left='4px';
					dialog2.buttons[i].node.name.dataset.color='unknownm';
					dialog2.buttons[i]._nopup=true;
					dialog2.buttons[i].area='difficulty';
				}
				dialog2.add('敌方人数');
				dialog2.addSmall([[
					['','','leader_2'],
					['','','leader_3'],
					['','','leader_5'],
					['','','leader_8'],
				],'vcard']);
				for(;i<dialog2.buttons.length;i++){
					dialog2.buttons[i].style.background='rgba(0,0,0,0.2)';
					dialog2.buttons[i].style.boxShadow='rgba(0, 0, 0, 0.3) 0 0 0 1px';
					dialog2.buttons[i].node.background.style.fontFamily='xinwei';
					dialog2.buttons[i]._nopup=true;
					dialog2.buttons[i].area='number';
				}
				dialog2.add('挑战武将');
				dialog2.add([game.data.challenge,'character']);
				for(;i<dialog2.buttons.length;i++){
					dialog2.buttons[i].area='challenge';
					fixButton(dialog2.buttons[i])
				}
				dialog2.open();

				var selected={
					lord:[],
					character:[],
					difficulty:[],
					number:[],
					challenge:[]
				}
				var clearSelected=function(){
					for(var i=0;i<dialog1.buttons.length;i++){
						dialog1.buttons[i].classList.remove('unselectable');
						dialog1.buttons[i].classList.remove('selected');
					}
					for(var i=0;i<dialog2.buttons.length;i++){
						dialog2.buttons[i].classList.remove('unselectable');
						dialog2.buttons[i].classList.remove('selected');
					}
					for(var j in selected){
						selected[j].length=0;
					}
				}
				event.enterArena=ui.create.control('竞技场','nozoom',function(){
					if(game.data.money<150&&!game.data._arena) return;
					if(_status.zhaomu||_status.qianfan||_status.kaibao) return;
					if(!game.data._arena) game.changeMoney(-150);
					_status.enterArena=true;
					game.resume();
				});
				var turnCard=function(){
					if(this.turned) return;
					_status.chessclicked=true;
					this.turned=true;
					var node=this;
					node.style.transition='all ease-in 0.3s';
					node.style.transform='perspective(1200px) rotateY(270deg) translateX(150px)';
					var onEnd=function(){
						game.minskin=false;
						node.init(node.name);
						game.minskin=true;
						node.node.avatar.style.display='';
						if(node.rarity){
							node.node.intro.innerHTML=get.translation(node.rarity);
							node.node.intro.classList.add('showintro');
						}
						node.classList.add('playerflip');
						node.style.transform='none';
						node.style.transition='';
						if(lib.config.animation&&!lib.config.low_performance){
							setTimeout(function(){
								switch(game.getRarity(node.name)){
									case 'rare':node.$rare();break;
									case 'epic':node.$epic();break;
									case 'legend':node.$legend();break;
								}
							},150);
						}
					};
					// node.addEventListener('transitionEnd',onEnd);
					node.addEventListener('webkitTransitionEnd',onEnd);
				};
				var zhaomu2=function(){
					if(_status.qianfan||_status.kaibao) return;
					if(game.data.money<100) return;
					_status.chessclicked=true;
					ui.arena.classList.add('leaderhide');
					ui.arena.classList.add('leadercontrol');
					ui.money.hide();
					_status.kaibao=true;
					event.cardnodes=[];
					setTimeout(function(){
						event.cardnodes.push(cardNode(0));
						setTimeout(function(){
							event.cardnodes.push(cardNode(1));
							setTimeout(function(){
								event.cardnodes.push(cardNode(2));
								ui.money.childNodes[1].innerHTML=game.data.dust;
								game.changeMoney(-100);
								if(game.data.character.length>3){
									event.removeCharacter.style.opacity=1;
								}
								if(game.data.money<150&&!game.data._arena){
									event.enterArena.style.opacity=0.5;
								}
								else{
									event.enterArena.style.opacity=1;
								}
								if(game.data.money<100){
									event.addCharacter.style.opacity=0.5;
								}
								else{
									event.addCharacter.style.opacity=1;
								}
								initcapt();
							},200);
						},200);
					},500);
				};
				var zhaomu=function(){
					if(_status.qianfan||_status.kaibao) return;
					if(game.data.money<100) return;
					_status.chessclicked=true;
					_status.zhaomu=true;
					event.removeCharacter.style.opacity=0.5;
					event.fight.style.opacity=0.5;
					clearSelected();
					for(var i=0;i<dialog1.buttons.length;i++){
						dialog1.buttons[i].classList.add('unselectable');
					}
					for(var i=0;i<dialog2.buttons.length;i++){
						dialog2.buttons[i].classList.add('unselectable');
					}
					this.replace('确认招募',zhaomu2);
				};
				event.addCharacter=ui.create.control('招募','nozoom',zhaomu2);
				if(game.data.money<150&&!game.data._arena){
					event.enterArena.style.opacity=0.5;
				}
				if(game.data.money<100){
					event.addCharacter.style.opacity=0.5;
				}
				var qianfan=function(){
					if(_status.zhaomu||_status.kaibao) return;
					if(game.data.character.length<=3) return;
					_status.chessclicked=true;
					_status.qianfan=true;
					event.enterArena.style.opacity=0.5;
					event.addCharacter.style.opacity=0.5;
					event.fight.style.opacity=0.5;
					var current=selected.character.slice(0);
					clearSelected();
					var maxq=game.data.character.length-3;
					if(current.length<=maxq){
						for(var i=0;i<current.length;i++){
							current[i].classList.add('selected');
							selected.character.push(current[i]);
						}
					}
					for(var i=0;i<dialog1.buttons.length;i++){
						if(dialog1.buttons[i].area!='character'||maxq==current.length){
							dialog1.buttons[i].classList.add('unselectable');
						}
					}
					for(var i=0;i<dialog2.buttons.length;i++){
						dialog2.buttons[i].classList.add('unselectable');
					}
					this.replace('确认遣返',function(){
						for(var i=0;i<selected.character.length;i++){
							var node=selected.character[i];
							var rarity=game.getRarity(node.link);
							switch(rarity){
								case 'common':game.changeDust(5);break;
								case 'rare':game.changeDust(20);break;
								case 'epic':game.changeDust(100);break;
								case 'legend':game.changeDust(400);break;
							}
							game.data.character.remove(node.link);
							game.saveData();
							if(game.data.character.length<=3){
								event.removeCharacter.style.opacity=0.5;
							}
							if(game.data.money>=100){
								event.addCharacter.style.opacity=1;
							}
							if(game.data.money>=150){
								event.enterArena.style.opacity=1;
							}
							node.delete();
							dialog1.buttons.remove(node);
						}
						initcapt();
					});
				};
				event.removeCharacter=ui.create.control('遣返','nozoom',qianfan);
				if(game.data.character.length<=3){
					event.removeCharacter.style.opacity=0.5;
				}
				event.fight=ui.create.control('开始战斗','nozoom',function(){
					if(_status.kaibao||_status.zhaomu||_status.qianfan) return;
					_status.enemylist=[];
					_status.mylist=[];
					if(selected.lord.length){
						_status.mylist.push(selected.lord[0].link);
						_status.lord=selected.lord[0].link;
					}
					if(selected.character.length){
						for(var i=0;i<selected.character.length;i++){
							_status.mylist.push(selected.character[i].link);
						}
					}
					else{
						_status.mylist=_status.mylist.concat(game.data.character.randomGets(_status.lord?2:3));
					}
					var difficulty;
					if(selected.challenge.length){
						_status.challenge=selected.challenge[0].link;
						_status.enemylist.push(_status.challenge);
						switch(game.getRarity(_status.challenge)){
							case 'common':_status.challengeMoney=40;break;
							case 'rare':_status.challengeMoney=100;break;
							case 'epic':_status.challengeMoney=400;break;
							case 'legend':_status.challengeMoney=1600;break;
						}
						var rank=get.rank(_status.challenge);
						var total=Math.max(2,_status.mylist.length-1);
						var list;
						switch(rank){
							case 's':list=lib.rank.ap;break;
							case 'ap':list=lib.rank.s.concat(lib.rank.a);break;
							case 'a':list=lib.rank.ap.concat(lib.rank.am);break;
							case 'am':list=lib.rank.a.concat(lib.rank.bp);break;
							case 'bp':list=lib.rank.am.concat(lib.rank.b);break;
							case 'b':list=lib.rank.bp.concat(lib.rank.bm);break;
							case 'bm':list=lib.rank.b.concat(lib.rank.c);break;
							case 'c':list=lib.rank.bm.concat(lib.rank.d);break;
							case 'd':list=lib.rank.c;break;
						}
						for(var i=0;i<total;i++){
							if(Math.random()<0.7){
								_status.enemylist.push(Array.prototype.randomGet.apply(
									lib.rank[rank],_status.enemylist.concat(_status.mylist)));
							}
							else{
								_status.enemylist.push(Array.prototype.randomGet.apply(
									list,_status.enemylist.concat(_status.mylist)));
							}
						}
					}
					else{
						var number,list;
						if(selected.difficulty.length){
							difficulty=selected.difficulty[0].link[2];
						}
						else{
							difficulty='leader_easy';
						}
						_status.difficulty=difficulty;
						if(selected.number.length){
							number=selected.number[0].link[2];
							number=parseInt(number[number.length-1]);
						}
						else{
							number=3;
						}
						switch(difficulty){
							case 'leader_easy':list=lib.rank.d.concat(lib.rank.c).concat(lib.rank.bm);break;
							case 'leader_medium':list=lib.rank.b.concat(lib.rank.bp).concat(lib.rank.am);break;
							case 'leader_hard':list=lib.rank.a.concat(lib.rank.ap).concat(lib.rank.s);break;
						}
						for(var i=0;i<lib.hiddenCharacters.length;i++){
							if(list.length<=number){
								break;
							}
							list.remove(lib.hiddenCharacters[i]);
						}
						for(var i=0;i<_status.mylist.length;i++){
							list.remove(_status.mylist[i]);
						}
						_status.enemylist=list.randomGets(number);
					}
					var numdel=_status.enemylist.length-_status.mylist.length;
					var reward=0;
					for(var i=0;i<_status.enemylist.length;i++){
						switch(get.rank(_status.enemylist[i])){
							case 's':reward+=50;break;
							case 'ap':reward+=40;break;
							case 'a':reward+=32;break;
							case 'am':reward+=25;break;
							case 'bp':reward+=19;break;
							case 'b':reward+=14;break;
							case 'bm':reward+=10;break;
							case 'c':reward+=7;break;
							case 'd':reward+=5;break;
						}
					}
					if(numdel>0){
						switch(difficulty){
							case 'leader_easy':reward+=10*numdel;break;
							case 'leader_medium':reward+=20*numdel;break;
							case 'leader_hard':reward+=40*numdel;break;
						}
					}
					var punish=0;
					for(var i=0;i<_status.mylist.length;i++){
						switch(get.rank(_status.mylist[i])){
							case 's':punish+=25;break;
							case 'ap':punish+=20;break;
							case 'a':punish+=16;break;
							case 'am':punish+=12;break;
							case 'bp':punish+=9;break;
							case 'b':punish+=7;break;
							case 'bm':punish+=5;break;
							case 'c':punish+=3;break;
							case 'd':punish+=2;break;
						}
					}
					if(numdel<0){
						switch(difficulty){
							case 'leader_easy':punish-=5*numdel;break;
							case 'leader_medium':punish-=10*numdel;break;
							case 'leader_hard':punish-=20*numdel;break;
						}
					}
					game.reward=Math.max(3*_status.enemylist.length,reward-punish);
					if(!_status.lord){
						switch(difficulty){
							case 'leader_easy':game.reward+=10;break;
							case 'leader_medium':game.reward+=20;break;
							case 'leader_hard':game.reward+=40;break;
						}
					}
					game.resume();
				});
				event.custom.replace.button=function(button){
					if(_status.kaibao) return;
					if(button.classList.contains('unselectable')&&
						!button.classList.contains('selected')) return;
					_status.chessclicked=true;
					button.classList.toggle('selected');
					if(button.classList.contains('selected')){
						selected[button.area].add(button);
					}
					else{
						selected[button.area].remove(button);
					}
					switch(button.area){
						case 'lord':{
							for(var i=0;i<dialog1.buttons.length;i++){
								if(dialog1.buttons[i].area=='lord'){
									if(selected.lord.length){
										dialog1.buttons[i].classList.add('unselectable');
									}
									else{
										dialog1.buttons[i].classList.remove('unselectable');
									}
								}
							}
							break;
						}
						case 'character':{
							for(var i=0;i<dialog1.buttons.length;i++){
								if(dialog1.buttons[i].area=='character'){
									var maxq=game.data.character.length-3;
									if((!_status.qianfan&&selected.character.length>5)||
										(_status.qianfan&&selected.character.length>=maxq)){
										dialog1.buttons[i].classList.add('unselectable');
									}
									else{
										dialog1.buttons[i].classList.remove('unselectable');
									}
								}
							}
							break;
						}
						case 'difficulty':case 'number':{
							for(var i=0;i<dialog2.buttons.length;i++){
								if(dialog2.buttons[i].area==button.area){
									if(selected[button.area].length){
										dialog2.buttons[i].classList.add('unselectable');
									}
									else{
										dialog2.buttons[i].classList.remove('unselectable');
									}
								}
							}
							break;
						}
						case 'challenge':{
							if(selected.challenge.length){
								for(var i=0;i<dialog2.buttons.length;i++){
									if(dialog2.buttons[i].area=='challenge'){
										dialog2.buttons[i].classList.add('unselectable');
									}
									else{
										dialog2.buttons[i].classList.add('unselectable');
										dialog2.buttons[i].classList.remove('selected');
									}
								}
							}
							else{
								for(var i=0;i<dialog2.buttons.length;i++){
									dialog2.buttons[i].classList.remove('unselectable');
								}
							}
							break;
						}
					}
				};
				event.custom.add.window=function(){
					if(!_status.kaibao){
						var glows=document.querySelectorAll('.button.glow2');
						for(var i=0;i<glows.length;i++){
							glows[i].classList.remove('glow2');
						}
					}
					if(_status.chessclicked){
						_status.chessclicked=false;
						return;
					}
					if(_status.kaibao&&event.cardnodes&&event.cardnodes.length){
						for(var i=0;i<event.cardnodes.length;i++){
							if(!event.cardnodes[i].turned) return;
						}
						for(var i=0;i<event.cardnodes.length;i++){
							event.cardnodes[i].delete();
						}
						ui.arena.classList.remove('leaderhide');
						setTimeout(function(){
							ui.arena.classList.remove('leadercontrol');
						},500);
						ui.money.show();
						delete event.cardnodes;
						_status.kaibao=false;
						return;
					}
					if(_status.qianfan){
						_status.qianfan=false;
						event.removeCharacter.replace('遣返',qianfan);
						if(game.data.money>=100){
							event.addCharacter.style.opacity=1;
						}
						else{
							event.addCharacter.style.opacity=0.5;
						}
						if(game.data.money>=150||game.data._arena){
							event.enterArena.style.opacity=1;
						}
						else{
							event.enterArena.style.opacity=0.5;
						}
						event.fight.style.opacity=1;
					}
					else if(_status.zhaomu){
						_status.zhaomu=false;
						event.addCharacter.replace('招募',zhaomu);
						if(game.data.character.length>3){
							event.removeCharacter.style.opacity=1;
						}
						else{
							event.removeCharacter.style.opacity=0.5;
						}
						event.fight.style.opacity=1;
					}
					clearSelected();
				};
				game.pause();
				'step 2'
				if(!game.data.arena){
					event.dialog1.close();
					event.dialog2.close();
					event.fight.close();
					event.enterArena.close();
					event.addCharacter.close();
					event.removeCharacter.close();
				}
				ui.arena.classList.add('leaderhide');
				ui.money.hide();
				game.delay();
				'step 3'
				ui.arena.classList.remove('leaderhide');
				if(!_status.enterArena){
					ui.wuxie.show();
					ui.auto.show();
					ui.control.style.display='none';
					ui.control.style.top='';
					ui.control.style.transition='';
					event.finish();
				}
				else{
					game.minskin=false;
					event.arenanodes=[];
					event.arenachoice=[];
					event.arenachoicenodes=[];
					event.arrangeNodes=function(){
						var num=event.arenachoicenodes.length;
						var width=num*75+(num-1)*8;
						for(var i=0;i<event.arenachoicenodes.length;i++){
							var left=-width/2+i*83-37.5;
							if(left<0){
								event.arenachoicenodes[i].style.left='calc(50% - '+(-left)+'px)';
							}
							else{
								event.arenachoicenodes[i].style.left='calc(50% + '+left+'px)';
							}
						}
					}
					event.clickNode=function(){
						if(this.classList.contains('removing')) return;
						if(this.isChosen){
							if(_status.chessgiveup) return;
							if(!event.choosefinished) return;
							if(this.classList.contains('unselectable')&&
								!this.classList.contains('selected')) return;
							_status.chessclicked=true;
							this.classList.toggle('selected');
							if(this.classList.contains('selected')){
								this.style.transform='scale(0.85)';
							}
							else{
								this.style.transform='scale(0.8)';
							}
							if(document.querySelectorAll('.player.selected').length>=3){
								for(var i=0;i<event.arenachoicenodes.length;i++){
									if(!event.arenachoicenodes[i].classList.contains('dead')){
										event.arenachoicenodes[i].classList.add('unselectable');
									}
								}
							}
							else{
								for(var i=0;i<event.arenachoicenodes.length;i++){
									event.arenachoicenodes[i].classList.remove('unselectable');
								}
							}
						}
						else{
							while(event.arenanodes.length){
								var node=event.arenanodes.shift();
								if(node==this){
									node.node.hp.hide();
									node.style.transform='scale(0.5)';
									node.style.top='calc(50% + 50px)';
									event.arenachoicenodes.push(node);
									event.arrangeNodes();
								}
								else{
									node.delete();
								}
							}
							this.isChosen=true;
							event.arenachoice.push(this.name);
							game.resume();
						}
					}
				}
				'step 4'
				var choice;
				if(game.data._arena){
					game.data.arena=game.data._arena;
					delete game.data._arena;
				}
				if(game.data.arena&&!_status.arenaLoaded){
					game.data.arena.loaded=true;
					event.arenachoice=game.data.arena.arenachoice;
					for(var i=0;i<event.arenachoice.length;i++){
						var node=event.cardNode(0,event.arenachoice[i],true);
						node.node.hp.style.display='none';
						node.init(node.name);
						node.isChosen=true;
						node.listen(event.clickNode);
						node.style.transform='scale(0.5)';
						node.style.top='calc(50% + 50px)';
						event.arenachoicenodes.push(node);
					}
					event.arrangeNodes();
					for(var i=0;i<event.arenachoicenodes.length;i++){
						var node=event.arenachoicenodes[i];
						if(game.data.arena.choice){
							ui.refresh(node);
							node.style.opacity=1;
						}
					}
					if(game.data.arena.choice){
						choice=game.data.arena.choice;
					}
					else{
						return;
					}
				}
				else{
					switch(event.arenachoice.length){
						case 0:choice=lib.rank.d.randomGets(3);break;
						case 1:choice=lib.rank.c.randomGets(3);break;
						case 2:choice=lib.rank.bm.randomGets(3);break;
						case 3:choice=lib.rank.b.randomGets(3);break;
						case 4:choice=lib.rank.bp.randomGets(3);break;
						case 5:choice=lib.rank.am.randomGets(3);break;
						case 6:choice=lib.rank.a.randomGets(3);break;
						case 7:choice=lib.rank.ap.randomGets(3);break;
						case 8:choice=lib.rank.s.randomGets(3);break;
					}
					game.data.arena={
						win:0,
						dead:[],
						acted:[],
						choice:choice,
						arenachoice:event.arenachoice
					}
					game.saveData();
				}
				_status.arenaLoaded=true;
				var node;
				node=event.cardNode(0,choice[0]);
				node.init(node.name);
				node.listen(event.clickNode);
				event.arenanodes.push(node);
				setTimeout(function(){
					node=event.cardNode(1,choice[1]);
					node.init(node.name);
					node.listen(event.clickNode);
					if(event.choosefinished){
						node.delete();
					}
					else{
						event.arenanodes.push(node);
					}
					setTimeout(function(){
						node=event.cardNode(2,choice[2]);
						node.init(node.name);
						node.listen(event.clickNode);
						if(event.choosefinished){
							node.delete();
						}
						else{
							event.arenanodes.push(node);
						}
					},200);
				},200);
				game.pause();
				'step 5'
				if(event.arenachoice.length<9){
					event.goto(4);
				}
				else{
					if(_status.arenaLoaded){
						game.delay(2);
					}
					game.data.arena.arenachoice=event.arenachoice;
					delete game.data.arena.choice;
					game.saveData();
					event.choosefinished=true;
				}
				'step 6'
				game.minskin=true;
				ui.arena.classList.add('noleft');
				var nodes=event.arenachoicenodes;
				for(var i=0;i<nodes.length;i++){
					nodes[i].style.transform='scale(0.8)';
				}
				if(_status.arenaLoaded){
					setTimeout(function(){
						nodes[0].style.left='calc(50% - 215px)';
						nodes[0].style.top='calc(50% - 260px)';
					},0);
					setTimeout(function(){
						nodes[1].style.left='calc(50% - 75px)';
						nodes[1].style.top='calc(50% - 260px)';
					},50);
					setTimeout(function(){
						nodes[2].style.left='calc(50% + 65px)';
						nodes[2].style.top='calc(50% - 260px)';
					},100);
					setTimeout(function(){
						nodes[3].style.left='calc(50% - 215px)';
						nodes[3].style.top='calc(50% - 90px)';
					},150);
					setTimeout(function(){
						nodes[4].style.left='calc(50% - 75px)';
						nodes[4].style.top='calc(50% - 90px)';
					},200);
					setTimeout(function(){
						nodes[5].style.left='calc(50% + 65px)';
						nodes[5].style.top='calc(50% - 90px)';
					},250);
					setTimeout(function(){
						nodes[6].style.left='calc(50% - 215px)';
						nodes[6].style.top='calc(50% + 80px)';
					},300);
					setTimeout(function(){
						nodes[7].style.left='calc(50% - 75px)';
						nodes[7].style.top='calc(50% + 80px)';
					},350);
					setTimeout(function(){
						nodes[8].style.left='calc(50% + 65px)';
						nodes[8].style.top='calc(50% + 80px)';
					},400);
				}
				else{
					nodes[0].style.left='calc(50% - 215px)';
					nodes[0].style.top='calc(50% - 260px)';
					nodes[1].style.left='calc(50% - 75px)';
					nodes[1].style.top='calc(50% - 260px)';
					nodes[2].style.left='calc(50% + 65px)';
					nodes[2].style.top='calc(50% - 260px)';
					nodes[3].style.left='calc(50% - 215px)';
					nodes[3].style.top='calc(50% - 90px)';
					nodes[4].style.left='calc(50% - 75px)';
					nodes[4].style.top='calc(50% - 90px)';
					nodes[5].style.left='calc(50% + 65px)';
					nodes[5].style.top='calc(50% - 90px)';
					nodes[6].style.left='calc(50% - 215px)';
					nodes[6].style.top='calc(50% + 80px)';
					nodes[7].style.left='calc(50% - 75px)';
					nodes[7].style.top='calc(50% + 80px)';
					nodes[8].style.left='calc(50% + 65px)';
					nodes[8].style.top='calc(50% + 80px)';
					for(var i=0;i<nodes.length;i++){
						ui.refresh(nodes[i]);
						if(game.data.arena.dead.contains(nodes[i].name)){
							nodes[i].classList.add('dead');
							nodes[i].style.opacity=0.3;
						}
						else{
							nodes[i].style.opacity=1;
							if(game.data.arena.acted.contains(nodes[i].name)){
								var acted=nodes[i].node.action;
								acted.style.opacity=1;
								acted.innerHTML='疲劳';
								acted.dataset.nature='soilm';
								acted.classList.add('freecolor');
							}
						}
					}
				}

				var victory=ui.create.div().hide();
				victory.innerHTML='<span>'+game.data.arena.win+'</span>胜';
				victory.style.top='auto';
				victory.style.left='auto';
				victory.style.right='20px';
				victory.style.bottom='15px';
				victory.style.fontSize='30px'
				victory.style.fontFamily='huangcao';
				victory.firstChild.style.marginRight='5px';
				ui.window.appendChild(victory);
				ui.refresh(victory);
				victory.show();

				event.checkPrize=function(){
					// event.kaibao=true;
					event.prize=[];
					event.turnCard2=function(){
						if(this.turned) return;
						_status.chessclicked=true;
						this.turned=true;
						var node=this;
						setTimeout(function(){
							node.turned2=true;
						},1000);
						if(node.name=='chess_coin'||node.name=='chess_dust'){
							node.style.transition='all 0s';
							node.style.transform='none';
							node.style.overflow='visible';
							node.style.background='none';
							node.style.boxShadow='none';
							var div=ui.create.div(node);
							div.style.transition='all 0s';
							if(node.name=='chess_coin'){
								div.innerHTML='<span>㉤</span><span>'+node.num+'</span>';
								div.firstChild.style.color='rgb(255, 230, 0)';
								node.$coin();
							}
							else{
								div.innerHTML='<span>⚑</span><span>'+node.num+'</span>';
								div.firstChild.style.color='rgb(111, 198, 255)';
								div.firstChild.style.marginRight='3px';
								node.$dust();
							}
							div.style.fontFamily='huangcao';
							div.style.fontSize='50px';
							div.style.top='40px';
							div.style.letterSpacing='8px';
							div.style.whiteSpace='nowrap';
							// div.dataset.nature='metal';

							return;
						}
						node.style.transition='all ease-in 0.3s';
						node.style.transform='perspective(1200px) rotateY(270deg) translateX(150px)';
						var onEnd=function(){
							node.init(node.name);
							node.node.avatar.style.display='';
							if(node.rarity){
								node.node.intro.innerHTML=get.translation(node.rarity);
								node.node.intro.classList.add('showintro');
							}
							node.classList.add('playerflip');
							node.style.transform='none';
							node.style.transition='';
							if(lib.config.animation&&!lib.config.low_performance){
								setTimeout(function(){
									switch(game.getRarity(node.name)){
										case 'rare':node.$rare();break;
										case 'epic':node.$epic();break;
										case 'legend':node.$legend();break;
									}
								},150);
							}
						};
						// node.addEventListener('transitionEnd',onEnd);
						node.addEventListener('webkitTransitionEnd',onEnd);
					};
					setTimeout(function(){
						nodes[0].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[1].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[2].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[3].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[4].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[5].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[6].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[7].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						nodes[8].delete();
					},400+Math.random()*300);
					setTimeout(function(){
						var prize=new Array(6);
						var map=[1,2,3,4,5];
						var ccount=3;
						var win=game.data.arena.win;
						var prizeValue;
						switch(win){
							case 0:prizeValue=100;break;
							case 1:prizeValue=120;break;
							case 2:prizeValue=150;break;
							case 3:prizeValue=190;break;
							case 4:prizeValue=240;break;
							case 5:prizeValue=300;break;
							case 6:prizeValue=370;break;
							case 7:prizeValue=450;break;
							case 8:prizeValue=540;break;
							case 9:prizeValue=640;break;
							case 10:prizeValue=750;break;
							case 11:prizeValue=870;break;
							case 12:prizeValue=1000;break;
						}
						if(Math.random()<0.4){
							if(win>=3&&Math.random()<0.5){
								ccount=4;
								prizeValue-=33;
							}
							else{
								ccount=2;
								prizeValue+=33;
							}
						}
						prizeValue-=100;
						while(ccount--){
							prize[map.randomRemove()]=game.getLeaderCharacter();
						}
						if(map.length){
							prizeValue/=map.length;
						}
						while(map.length){
							var val=Math.round((Math.random()*0.4+0.8)*prizeValue);
							if(Math.random()<0.7){
								prize[map.shift()]=['chess_coin',Math.max(Math.ceil(Math.random()*5),val)];
							}
							else{
								val=Math.round(val/3);
								prize[map.shift()]=['chess_dust',Math.max(Math.ceil(Math.random()*3),val)];
							}
						}
						for(var i=1;i<prize.length;i++){
							if(typeof prize[i]=='string'){
								var name=prize[i];
								var rarity=game.getRarity(name);
								if(!game.data.character.contains(name)){
									game.data.character.push(name);
									if(game.data.challenge.contains(name)){
										game.data.challenge=game.getLeaderList();
									}
								}
								else{
									switch(rarity){
										case 'common':game.data.dust+=10;break;
										case 'rare':game.data.dust+=30;break;
										case 'epic':game.data.dust+=150;break;
										case 'legend':game.data.dust+=600;break;
									}
								}
							}
							else if(prize[i][0]=='chess_coin'){
								game.data.money+=prize[i][1];
							}
							else{
								game.data.dust+=prize[i][1];
							}
							setTimeout((function(i){
								return function(){
									var node;
									if(typeof prize[i]=='string'){
										node=event.cardNode('5'+i,prize[i]);
									}
									else{
										node=event.cardNode('5'+i,prize[i][0]);
										node.num=prize[i][1];
									}
									event.prize.push(node);
									if(i==prize.length-1){
										event.kaibao=true;
									}
								};
							}(i)),i*200);
						}
						delete game.data.arena;
						game.saveData();
					},1000);
				}
				if(game.data.arena.dead.length<9&&game.data.arena.win<12){
					event.arenafight=ui.create.control('开始战斗','nozoom',function(){
						if(_status.chessgiveup) return;
						_status.mylist=[];
						var list=[];
						for(var i=0;i<nodes.length;i++){
							if(nodes[i].classList.contains('selected')){
								_status.mylist.push(nodes[i].name);
							}
							else if(!nodes[i].classList.contains('dead')){
								list.push(nodes[i].name);
							}
						}
						if(_status.mylist.length==0){
							_status.mylist=list.randomGets(3);
						}
						if(_status.mylist.length==0) return;
						for(var i=0;i<_status.mylist.length;i++){
							game.data.arena.dead.push(_status.mylist[i]);
						}
						game.saveData();
						switch(game.data.arena.win){
							case 0:list=lib.rank.d.concat(lib.rank.c);break;
							case 1:list=lib.rank.c.concat(lib.rank.bm);break;
							case 2:list=lib.rank.bm.concat(lib.rank.b);break;
							case 3:list=lib.rank.b.concat(lib.rank.bp);break;
							case 4:list=lib.rank.bp.concat(lib.rank.am);break;
							case 5:list=lib.rank.am.concat(lib.rank.a);break;
							case 6:list=lib.rank.a.concat(lib.rank.ap);break;
							default:list=lib.rank.ap.concat(lib.rank.s);
						}
						for(var i=0;i<_status.mylist.length;i++){
							list.remove(_status.mylist[i]);
						}
						_status.enemylist=list.randomGets(3);
						for(var i=0;i<nodes.length;i++){
							nodes[i].delete();
						}
						victory.delete();
						event.arenafight.close();
						event.arenaback.close();
						event.arenagiveup.close();
						game.resume();
					});
					event.arenaback=ui.create.control('返回','nozoom',function(){
						if(_status.chessgiveup) return;
						game.data._arena=game.data.arena;
						delete game.data.arena;
						game.saveData();
						game.reload();
					});
					var giveup=function(){
						_status.chessclicked=true;
						_status.chessgiveup=true;
						event.arenafight.style.opacity=0.5;
						event.arenaback.style.opacity=0.5;
						this.replace('确认放弃',function(){
							_status.chessclicked=true;
							event.arenafight.close();
							event.arenaback.close();
							event.arenagiveup.close();
							event.checkPrize();
						});
					};
					event.arenagiveup=ui.create.control('放弃','nozoom',giveup);
				}
				else{
					event.checkPrize();
				}

				event.custom.add.window=function(){
					if(_status.chessclicked){
						_status.chessclicked=false;
						return;
					}
					if(event.kaibao){
						for(var i=0;i<event.prize.length;i++){
							if(!event.prize[i].turned2){
								return;
							}
						}
						game.reload();
					}
					_status.chessgiveup=false;
					event.arenafight.style.opacity=1;
					event.arenaback.style.opacity=1;
					event.arenagiveup.replace('放弃',giveup);
					for(var i=0;i<nodes.length;i++){
						nodes[i].style.transform='scale(0.8)';
						nodes[i].classList.remove('selected');
						nodes[i].classList.remove('unselectable');
					}
				};
				game.pause();
				'step 7'
				ui.control.style.display='none';
				ui.control.style.top='';
				ui.control.style.transition='';
				ui.arena.classList.remove('leaderhide');
				ui.wuxie.show();
				ui.auto.show();
				game.delay();
			});
		},
		saveData:function(){
			game.save(get.config('chess_leader_save'),game.data);
		},
		getLeaderList:function(){
			var list=lib.rank.all.slice(0);
			for(var i=0;i<game.data.character.length;i++){
				list.remove(game.data.character[i]);
			}
			if(!list.length){
				return ['chess_xingtian'];
			}
			return list.randomGets(6);
		},
		getLeaderCharacter:function(){
			var pleg;
			if(game.data.legend<=20){
				pleg=0.01;
			}
			else{
				pleg=0.01+(game.data.legend-20)*(game.data.legend-20)*0.99/10000;
			}
			if(Math.random()<pleg){
				game.data.legend=0;
				game.saveData();
				return lib.rank.rarity.legend.randomGet();
			}
			game.data.legend++;
			game.saveData();
			if(Math.random()<0.05) return lib.rank.rarity.epic.randomGet();
			if(Math.random()<0.3) return lib.rank.rarity.rare.randomGet();
			return lib.rank.rarity.common.randomGet();
		},
		changeMoney:function(num){
			game.data.money+=num;
			game.saveData();
			ui.money.lastChild.innerHTML=game.data.money;
		},
		changeDust:function(num){
			game.data.dust+=num;
			game.saveData();
			ui.money.childNodes[1].innerHTML=game.data.dust;
		},
		getRarity:function(name){
			var rank=lib.rank.rarity;
			if(rank.legend.contains(name)) return 'legend';
			if(rank.epic.contains(name)) return 'epic';
			if(rank.rare.contains(name)) return 'rare';
			return 'common';
		},
		chooseCharacter:function(){
			var next=game.createEvent('chooseCharacter',false);
			next.showConfig=true;
			next.ai=function(player,list){
				if(get.config('double_character')){
					player.init(list[0],list[1]);
				}
				else{
					player.init(list[0]);
				}
			}
			next.setContent(function(){
				"step 0"
				ui.wuxie.hide();
				var i;
				var list=[];
				var bosslist=[];
				var jiangelist=[];
				event.list=list;
				for(i in lib.character){
					if(lib.character[i][4].contains('chessboss')){
						bosslist.push(i);continue;
					}
					else if(lib.character[i][4].contains('jiangeboss')){
						// if(get.config('chess_jiange')) jiangelist.push(i);
						continue;
					}
					if(i.indexOf('treasure_')==0) continue;
					if(i.indexOf('chess_mech_')==0) continue;
					if(lib.character[i][4].contains('minskin')) continue;
					if(lib.config.forbidchess.contains(i)) continue;
					if(lib.filter.characterDisabled(i)) continue;
					list.push(i);
				}
				list.randomSort();
				var bosses=ui.create.div('.buttons');
				event.bosses=bosses;
				var bossbuttons=ui.create.buttons(bosslist,'character',bosses);
				var addToButton=function(){
					if(ui.cheat2&&ui.cheat2.backup) return;
					_status.event.dialog.content.childNodes[1].innerHTML=
					ui.selected.buttons.length+'/'+_status.event.selectButton();
				};
				var jiange=ui.create.div('.buttons');
				event.jiange=jiange;
				var jiangebuttons=ui.create.buttons(jiangelist,'character',jiange);

				var clickedBoss=false;
				var clickBoss=function(){
					clickedBoss=true;
					var num=bosses.querySelectorAll('.glow').length;
					if(this.classList.contains('glow')){
						this.classList.remove('glow');
						num--;
					}
					else{
						if(num<4){
							this.classList.add('glow');
							num++;
						}
					}
					for(var i=0;i<bosses.childElementCount;i++){
						if(num>=4&&!bosses.childNodes[i].classList.contains('glow')){
							bosses.childNodes[i].classList.add('forbidden');
						}
						else{
							bosses.childNodes[i].classList.remove('forbidden');
						}
					}
					if(num){
						if(!event.asboss){
							event.asboss=ui.create.control('应战',function(){
								_status.boss=true;
								ui.click.ok();
							});
						}
					}
					else{
						if(event.asboss){
							event.asboss.close();
							delete event.asboss;
						}
					}
					addToButton();
				};

				var clickedJiange=false;
				var clickJiange=function(){
					clickedJiange=true;
					if(this.classList.contains('glow2')){
						this.classList.remove('glow2');
					}
					else{
						this.classList.add('glow2');
					}
					addToButton();
				};


				for(var i=0;i<bossbuttons.length;i++){
					bossbuttons[i].classList.add('noclick');
					bossbuttons[i].listen(clickBoss);
				}
				for(var i=0;i<jiangebuttons.length;i++){
					jiangebuttons[i].classList.add('noclick');
					jiangebuttons[i].listen(clickJiange);
				}

				if(get.config('reward')==undefined) game.saveConfig('reward',1,true);
				if(get.config('punish')==undefined) game.saveConfig('punish','无',true);
				if(get.config('battle_number')==undefined) game.saveConfig('battle_number',3,true);
				if(get.config('replace_number')==undefined) game.saveConfig('replace_number',0,true);
				if(get.config('single_control')==undefined) game.saveConfig('single_control',true,true);
				if(get.config('first_less')==undefined) game.saveConfig('first_less',true,true);

				var dialog=ui.create.dialog('选择出场角色','hidden');
				dialog.classList.add('fullwidth');
				dialog.classList.add('fullheight');
				dialog.classList.add('fixed');
				dialog.add('0/0');
				dialog.add([list.slice(0,parseInt(get.config('battle_number'))*4+parseInt(get.config('replace_number'))+5),'character']);
				if(bossbuttons.length){
					dialog.add('挑战魔王');
					dialog.add(bosses);
				}
				if(jiangebuttons.length){
					dialog.add('守卫剑阁');
					dialog.add(jiange);
				}
				event.addConfig=function(dialog){
					dialog.add('选项');
					dialog.choice={};
					dialog.choice.zhu=dialog.add(ui.create.switcher('zhu',get.config('zhu'))).querySelector('.toggle');
					dialog.choice.main_zhu=dialog.add(ui.create.switcher('main_zhu',get.config('main_zhu'))).querySelector('.toggle');
					if(get.config('zhu')){
						dialog.choice.main_zhu.parentNode.classList.remove('disabled');
					}
					else{
						dialog.choice.main_zhu.parentNode.classList.add('disabled');
					}
					dialog.choice.noreplace_end=dialog.add(ui.create.switcher('noreplace_end',get.config('noreplace_end'))).querySelector('.toggle');
					dialog.choice.additional_player=dialog.add(ui.create.switcher('additional_player',get.config('additional_player'))).querySelector('.toggle');
					dialog.choice.single_control=dialog.add(ui.create.switcher('single_control',get.config('single_control'))).querySelector('.toggle');
					dialog.choice.first_less=dialog.add(ui.create.switcher('first_less',get.config('first_less'))).querySelector('.toggle');
					// dialog.attack_move=dialog.add(ui.create.switcher('attack_move',get.config('attack_move'))).querySelector('.toggle');
					// this.dialog.versus_single_control=this.dialog.add(ui.create.switcher('versus_single_control',lib.storage.single_control)).querySelector('.toggle');
					// this.dialog.versus_first_less=this.dialog.add(ui.create.switcher('versus_first_less',lib.storage.first_less)).querySelector('.toggle');
					dialog.choice.reward=dialog.add(ui.create.switcher('reward',[0,1,2,3,4],get.config('reward'))).querySelector('.toggle');
					dialog.choice.punish=dialog.add(ui.create.switcher('punish',['弃牌','无','摸牌'],get.config('punish'))).querySelector('.toggle');
					dialog.choice.seat_order=dialog.add(ui.create.switcher('seat_order',['指定','交替'],get.config('seat_order'))).querySelector('.toggle');
					dialog.choice.battle_number=dialog.add(ui.create.switcher('battle_number',[1,2,3,4,6,8],get.config('battle_number'))).querySelector('.toggle');
					dialog.choice.replace_number=dialog.add(ui.create.switcher('replace_number',[0,1,2,3,5,7,9,17],get.config('replace_number'))).querySelector('.toggle');
					dialog.choice.choice_number=dialog.add(ui.create.switcher('choice_number',[3,6,9],get.config('choice_number'))).querySelector('.toggle');
					if(get.config('additional_player')){
						dialog.choice.noreplace_end.parentNode.classList.add('disabled');
						dialog.choice.replace_number.parentNode.classList.add('disabled');
						dialog.choice.choice_number.parentNode.classList.remove('disabled');
					}
					else{
						dialog.choice.noreplace_end.parentNode.classList.remove('disabled');
						dialog.choice.replace_number.parentNode.classList.remove('disabled');
						dialog.choice.choice_number.parentNode.classList.add('disabled');
					}
				};
				event.addConfig(dialog);
				for(var i=0;i<bosses.childNodes.length;i++){
					bosses.childNodes[i].classList.add('squarebutton');
				}
				for(var i=0;i<jiange.childNodes.length;i++){
					jiange.childNodes[i].classList.add('squarebutton');
				}
				ui.control.style.transition='all 0s';
				if(lib.config.layout=='mobile'||lib.config.layout=='default'){
					ui.control.style.top='calc(100% - 70px)';
				}
				else if(lib.config.layout=='phone'){
					ui.control.style.top='calc(100% - 80px)';
				}
				else{
					ui.control.style.top='calc(100% - 30px)';
				}

				var next=game.me.chooseButton(dialog,true);
				next._triggered=null;
				next.selectButton=function(){
					var bossnum=bosses.querySelectorAll('.glow').length;
					if(bossnum){
						return 3*bossnum;
					}
					if(get.config('additional_player')){
						return parseInt(get.config('battle_number'));
					}
					return parseInt(get.config('battle_number'))+parseInt(get.config('replace_number'));
				};
				next.custom.add.button=addToButton;
				next.custom.add.window=function(clicked){
					if(clicked) return;
					if(clickedBoss){
						clickedBoss=false;
					}
					else{
						for(var i=0;i<bosses.childElementCount;i++){
							bosses.childNodes[i].classList.remove('forbidden');
							bosses.childNodes[i].classList.remove('glow');
						}
						if(event.asboss){
							event.asboss.close();
							delete event.asboss;
						}
					}
					if(clickedJiange){
						clickedJiange=false;
					}
					else{
						for(var i=0;i<jiange.childElementCount;i++){
							jiange.childNodes[i].classList.remove('forbidden');
							jiange.childNodes[i].classList.remove('glow2');
						}
					}
					var dialog=_status.event.dialog;
					if(dialog.choice){
						for(var i in dialog.choice){
							game.saveConfig(i,dialog.choice[i].link,true);
						}
						if(get.config('zhu')){
							dialog.choice.main_zhu.parentNode.classList.remove('disabled');
						}
						else{
							dialog.choice.main_zhu.parentNode.classList.add('disabled');
						}
						if(get.config('additional_player')){
							dialog.choice.noreplace_end.parentNode.classList.add('disabled');
							dialog.choice.replace_number.parentNode.classList.add('disabled');
							dialog.choice.choice_number.parentNode.classList.remove('disabled');
						}
						else{
							dialog.choice.noreplace_end.parentNode.classList.remove('disabled');
							dialog.choice.replace_number.parentNode.classList.remove('disabled');
							dialog.choice.choice_number.parentNode.classList.add('disabled');
						}
						var num=parseInt(get.config('battle_number'))*4+parseInt(get.config('replace_number'))+5;
						if(dialog.buttons.length>num){
							for(var i=num;i<dialog.buttons.length;i++){
								dialog.buttons[i].remove();
							}
							dialog.buttons.splice(num);
						}
						else if(dialog.buttons.length<num){
							for(var i=dialog.buttons.length;i<num;i++){
								dialog.buttons.push(ui.create.button(list[i],'character',dialog.buttons[0].parentNode).animate('zoom'))
							}
							game.check();
						}
					}
					addToButton();
				}
				event.changeDialog=function(){
					if(ui.cheat2&&ui.cheat2.dialog==_status.event.dialog){
						return;
					}
					if(game.changeCoin){
						game.changeCoin(-3);
					}
					list.randomSort();

					var buttons=ui.create.div('.buttons');
					var node=_status.event.dialog.buttons[0].parentNode;
					_status.event.dialog.buttons=ui.create.buttons(list.slice(0,parseInt(get.config('battle_number'))*4+parseInt(get.config('replace_number'))+5),'character',buttons);
					_status.event.dialog.content.insertBefore(buttons,node);
					buttons.animate('start');
					node.remove();

					// _status.event.dialog.close();
					// var dialog=ui.create.dialog('选择出场角色','hidden');
					// _status.event.dialog=dialog;
					// dialog.classList.add('fullwidth');
					// dialog.classList.add('fullheight');
					// dialog.classList.add('fixed');
					// dialog.add('0/'+_status.event.selectButton());
					// dialog.add([list.slice(0,parseInt(get.config('battle_number'))*4+parseInt(get.config('replace_number'))+5),'character']);
					// if(bossbuttons.length){
					// 	dialog.add('挑战魔王');
					// 	dialog.add(bosses);
					// }
					// if(jiangebuttons.length){
					// 	dialog.add('守卫剑阁');
					// 	dialog.add(jiange);
					// }
					// event.addConfig(dialog);
					// dialog.open();
					game.uncheck();
					game.check();
				};
				ui.create.cheat=function(){
					_status.createControl=ui.cheat2;
					ui.cheat=ui.create.control('更换',event.changeDialog);
					delete _status.createControl;
				};
				event.dialogxx=ui.create.characterDialog();
				event.dialogxx.classList.add('fullwidth');
				event.dialogxx.classList.add('fullheight');
				event.dialogxx.classList.add('fixed');
				ui.create.cheat2=function(){
					ui.cheat2=ui.create.control('自由选将',function(){
						if(this.dialog==_status.event.dialog){
							if(game.changeCoin){
								game.changeCoin(50);
							}
							this.dialog.close();
							_status.event.dialog=this.backup;
							this.backup.open();
							delete this.backup;
							game.uncheck();
							game.check();
							if(ui.cheat){
								ui.cheat.style.opacity=1;
							}
						}
						else{
							if(game.changeCoin){
								game.changeCoin(-10);
							}
							this.backup=_status.event.dialog;
							_status.event.dialog.close();
							_status.event.dialog=_status.event.parent.dialogxx;
							this.dialog=_status.event.dialog;
							this.dialog.open();
							game.uncheck();
							game.check();
							if(ui.cheat){
								ui.cheat.style.opacity=0.6;
							}
						}
					});
				}
				if(!ui.cheat&&get.config('change_choice'))
				ui.create.cheat();
				if(!ui.cheat2&&get.config('free_choose'))
				ui.create.cheat2();
				"step 1"
				ui.wuxie.show();
				if(ui.cheat){
					ui.cheat.close();
					delete ui.cheat;
				}
				if(ui.cheat2){
					ui.cheat2.close();
					delete ui.cheat2;
				}
				if(event.asboss){
					event.asboss.close();
					delete ui.asboss;
				}
				ui.control.style.display='none';
				ui.control.style.top='';
				ui.control.style.transition='';

				for(var i=0;i<result.links.length;i++){
					game.addRecentCharacter(result.links[i]);
				}
				if(_status.mode=='combat'){
					_status.mylist=result.links.slice(0,parseInt(get.config('battle_number')));
					_status.replacelist=result.links.slice(parseInt(get.config('battle_number')));
				}
				else{
					_status.mylist=result.links.slice(0);
				}
				if(ui.coin){
					_status.coinCoeff=get.coinCoeff(_status.mylist);
				}
				for(var i=0;i<result.links.length;i++){
					event.list.remove(result.links[i]);
				}
				var glows=event.bosses.querySelectorAll('.glow');
				var glows2=event.jiange.querySelectorAll('.glow2');
				if(glows.length){
					_status.vsboss=true;
					_status.enemylist=[];
					for(var i=0;i<glows.length;i++){
						_status.enemylist.push(glows[i].link);
					}
					if(_status.boss){
						var temp=_status.mylist;
						_status.mylist=_status.enemylist;
						_status.enemylist=temp;
						for(var i=_status.enemylist.length;i<_status.mylist.length*3;i++){
							_status.enemylist.push(event.list.randomRemove());
						}
					}
				}
				else if(glows2.length){
					_status.vsboss=true;
					_status.enemylist=[];
					for(var i=0;i<glows2.length;i++){
						_status.enemylist.push(glows2[i].link);
					}
				}
				else{
					event.list.randomSort();
					_status.enemylist=event.list.splice(0,_status.mylist.length);
					if(_status.mode=='combat'&&_status.replacelist){
						_status.enemyreplacelist=event.list.splice(0,_status.replacelist.length);
					}
				}
				if(_status.mode=='combat'&&get.config('additional_player')){
					_status.additionallist=event.list;
				}
			});
		},
		modeSwapPlayer:function(player){
			var content=[game.me.dataset.position,player.dataset.position];
			game.me.classList.remove('current_action');
			player.classList.add('current_action');
			game.addVideo('chessSwap',null,content);
			game.swapControl(player);
			player.chessFocus();
			ui.create.fakeme();
		}
	},
	skill:{
		chess_mech_weixingxianjing_skill:{
			filter:function(player){
				for(var i=0;i<_status.enemies.length;i++){
					if(!_status.enemies[i].isTurnedOver()&&
						get.chessDistance(player,_status.enemies[i])<=2){
						return true;
					}
				}
				return false;
			},
			content:function(){
				var list=[];
				for(var i=0;i<_status.enemies.length;i++){
					if(!_status.enemies[i].isTurnedOver()&&
						get.chessDistance(player,_status.enemies[i])<=2){
						list.push(_status.enemies[i]);
					}
				}
				if(list.length){
					game.log('小型陷阱发动');
					var target=list.randomGet();
					target.turnOver();
					player.line(target,'green');
				}
			}
		},
		chess_mech_nengliangqiu_skill:{
			filter:function(player){
				for(var i=0;i<_status.friends.length;i++){
					if(get.chessDistance(player,_status.friends[i])<=3){
						return true;
					}
				}
				return false;
			},
			content:function(){
				var list1=[],list2=[];
				for(var i=0;i<_status.friends.length;i++){
					if(get.chessDistance(player,_status.friends[i])<=1){
						list2.push(_status.friends[i]);
					}
					else if(get.chessDistance(player,_status.friends[i])<=3){
						list1.push(_status.friends[i]);
					}
					// else if(get.chessDistance(player,_status.friends[i])<=4){
					// 	list2.push(_status.friends[i]);
					// }
				}
				if(list2.length){
					game.asyncDraw(list2,2);
					player.line(list2,'green');
				}
				if(list1.length){
					game.asyncDraw(list1);
					player.line(list1,'green');
				}
				if(list1.length||list2.length){
					game.log('能量球发动');
				}
			}
		},
		chess_mech_mutong_skill:{
			filter:function(player){
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=3){
						return true;
					}
				}
				return false;
			},
			content:function(){
				var list=[];
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=3){
						list.push(_status.enemies[i]);
					}
				}
				if(list.length){
					game.log('木桶发动');
					var targets=list.randomGets(1);
					player.line(targets,'green');
					for(var i=0;i<targets.length;i++){
						targets[i].damage('nosource');
					}
				}
			}
		},
		chess_mech_guangmingquan_skill:{
			filter:function(player){
				for(var i=0;i<_status.friends.length;i++){
					if(_status.friends[i].hp<_status.friends[i].maxHp&&
						get.chessDistance(player,_status.friends[i])<=2){
						return true;
					}
				}
				return false;
			},
			content:function(){
				var list=[];
				for(var i=0;i<_status.friends.length;i++){
					if(_status.friends[i].hp<_status.friends[i].maxHp&&
						get.chessDistance(player,_status.friends[i])<=2){
						list.push(_status.friends[i]);
					}
				}
				if(list.length){
					game.log('光明泉发动');
					player.line(list,'green');
					while(list.length){
						list.shift().recover();
					}
				}
			}
		},
		chess_mech_jiguanren_skill:{
			filter:function(player){
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=3){
						return true;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var list=[];
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=3){
						list.push(_status.enemies[i]);
					}
				}
				if(list.length){
					game.log('机关人发动');
					player.line(list,'green');
					event.list=list;
				}
				else{
					event.finish();
				}
				'step 1'
				if(event.list.length){
					var target=event.list.shift();
					var he=target.get('he');
					if(he.length){
						target.discard(he.randomGets(Math.ceil(Math.random()*2)));
					}
					event.redo();
				}
			}
		},
		chess_mech_gongchengche_skill:{
			filter:function(player){
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=2){
						return true;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var list=[];
				for(var i=0;i<_status.enemies.length;i++){
					if(get.chessDistance(player,_status.enemies[i])<=2){
						list.push(_status.enemies[i]);
					}
				}
				if(list.length){
					game.log('攻城车发动');
					event.target=list.randomGet();
					player.playerfocus(1000);
					player.line(event.target,'fire');
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				if(event.target){
					event.target.damage('fire','nosource');
					event.target.moveUp();
				}
			}
		},
		_attackmove:{
			trigger:{player:'damageEnd'},
			forced:true,
			popup:false,
			priority:50,
			filter:function(event,player){
				if(!get.config('attack_move')) return false;
				if(!event.source) return false;
				if(get.distance(event.source,player,'pure')>2) return false;
				var xy1=event.source.getXY();
				var xy2=player.getXY();
				var dx=xy2[0]-xy1[0];
				var dy=xy2[1]-xy1[1];
				// if(dx*dy!=0) return false;
				if(dx==0&&Math.abs(dy)==2){
					dy/=2;
				}
				if(dy==0&&Math.abs(dx)==2){
					dx/=2;
				}
				return player.movable(dx,dy);
			},
			content:function(){
				var xy1=trigger.source.getXY();
				var xy2=player.getXY();
				var dx=xy2[0]-xy1[0];
				var dy=xy2[1]-xy1[1];
				if(dx==0&&Math.abs(dy)==2){
					dy/=2;
				}
				if(dy==0&&Math.abs(dx)==2){
					dx/=2;
				}
				if(player.movable(dx,dy)){
					player.move(dx,dy);
				}
			}
		},
		dubiaoxianjing:{
			global:'dubiaoxianjing2'
		},
		dubiaoxianjing2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				if(player.hp<=1) return false;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_dubiaoxianjing'){
						return get.chessDistance(game.treasures[i],player)<=2;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_dubiaoxianjing'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				game.log('毒镖陷阱发动');
				player.damage('nosource');
				player.draw(2);
			}
		},
		jiqishi:{
			global:'jiqishi2'
		},
		jiqishi2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				if(player.hp==player.maxHp) return false;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_jiqishi'){
						return get.chessDistance(game.treasures[i],player)<=2;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_jiqishi'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				game.log('集气石发动');
				player.recover('nosource');
				var he=player.get('he');
				if(he.length){
					player.discard(he.randomGets(2));
				}
			}
		},
		wuyashenxiang:{
			global:'wuyashenxiang2'
		},
		wuyashenxiang2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				if(player.hp>1) return false;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_wuyashenxiang'){
						return get.chessDistance(game.treasures[i],player)<=3;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_wuyashenxiang'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				game.log('乌鸦神像发动');
				player.recover('nosource');
				// player.draw();
				var card=get.cardPile(function(c){
					return get.type(c)=='delay';
				});
				if(card){
					player.addJudge(card);
				}
			}
		},
		shenpanxianjing:{
			global:'shenpanxianjing2'
		},
		shenpanxianjing2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				var nh=player.num('h');
				if(!nh) return false;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shenpanxianjing'){
						for(var j=0;j<game.players.length;j++){
							if(game.players[j].num('h')>nh) return false;
						}
						return true;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shenpanxianjing'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				game.log('审判之刃发动');
				var hs=player.get('h');
				if(hs.length){
					player.discard(hs.randomGet());
				}
			}
		},
		shiyuansu:{
			global:'shiyuansu2'
		},
		shiyuansu2:{
			trigger:{player:'damageAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				if(event.num<2) return false;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shiyuansu'){
						return true;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				game.delayx();
				'step 1'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shiyuansu'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 2'
				game.log('石元素像发动');
				player.changeHujia();
			}
		},
		shenmidiaoxiang:{
			global:'shenmidiaoxiang2'
		},
		shenmidiaoxiang2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			filter:function(event,player){
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shenmidiaoxiang'){
						return player.canMoveTowards(game.treasures[i])&&
							get.chessDistance(game.treasures[i],player)>3;
					}
				}
				return false;
			},
			content:function(){
				'step 0'
				var source=null;
				for(var i=0;i<game.treasures.length;i++){
					if(game.treasures[i].name=='treasure_shenmidiaoxiang'){
						source=game.treasures[i];break;
					}
				}
				if(source){
					event.source=source;
					source.chessFocus();
					source.playerfocus(1000);
					source.line(player,'thunder');
					if(lib.config.animation&&!lib.config.low_performance){
						setTimeout(function(){
							source.$epic2();
						},300);
					}
					game.delay(2);
				}
				else{
					event.finish();
				}
				'step 1'
				game.log('神秘雕像发动');
				player.moveTowards(event.source);
			}
		},
		arenaAdd:{
			enable:'phaseUse',
			usable:1,
			filter:function(event,player){
				return _status.enterArena&&player.side==game.me.side&&game.data.arena.arenachoice.length>game.data.arena.dead.length;
			},
			direct:true,
			delay:0,
			preservecancel:true,
			content:function(){
				"step 0"
				var list=game.data.arena.arenachoice.slice(0);
				for(var i=0;i<game.data.arena.dead.length;i++){
					list.remove(game.data.arena.dead[i]);
				}
				event.dialog=ui.create.dialog('选择一个出场武将',[list,'character']);
				game.pause();
				_status.imchoosing=true;
				event.custom.replace.button=function(button){
					event.choice=button.link;
					game.resume();
				}
				event.custom.replace.confirm=game.resume;
				event.switchToAuto=game.resume;
				"step 1"
				_status.imchoosing=false;
				event.dialog.close();
				if(event.choice){
					var name=event.choice;
					game.addChessPlayer(name);
					game.data.arena.dead.push(name);
					game.saveData();
					if(!_status.arenaAdd){
						_status.arenaAdd=[];
					}
					_status.arenaAdd.push(name);
					game.delay();
				}
				else{
					player.getStat('skill').arenaAdd--;
				}
			},
		},
		leader_zhaoxiang:{
			unique:true,
			enable:'phaseUse',
			usable:1,
			promptfunc:function(event,player){
				var targets=[];
				var skill=lib.skill.leader_zhaoxiang;
				for(var i=0;i<game.players.length;i++){
					if(!game.data.character.contains(game.players[i].name)&&game.players[i].side!=player.side){
						targets.push(game.players[i]);
					}
				}
				var str=lib.translate.leader_zhaoxiang_info;
				if(targets.length){
					str='<p style="text-align:center;line-height:20px;margin-top:0">⚑ '+game.data.dust+
					'</p><p style="text-align:center;line-height:20px;margin-top:8px">'
					for(var i=0;i<targets.length;i++){
						str+='<span style="width:120px;display:inline-block;text-align:right">'+get.translation(targets[i])+
						'：</span><span style="width:120px;display:inline-block;text-align:left">'+
						(skill.chance(targets[i],player)*100).toFixed(2)+'%</span><br>';
					}
					str+='</p>'
				}
				return str;
			},
			chance:function(target,player){
				var chance;
				var renyi=player.hasSkill('leader_renyi');
				switch(target.hp){
					case 1:chance=0.7;break;
					case 2:chance=0.4;break;
					default:chance=0.2;break;
				}
				switch(target.num('he')){
					case 0:break;
					case 1:chance/=1.2;break;
					case 2:chance/=1.4;break;
					case 3:chance/=1.7;break;
					default:chance/=2;break;
				}
				switch(game.getRarity(target.name)){
					case 'common':{
						if(renyi) chance*=2;
						break;
					}
					case 'rare':{
						chance/=2;
						if(renyi) chance*=2;
						break;
					}
					case 'epic':{
						chance/=5;
						if(renyi) chance*=1.5;
						break;
					}
					case 'legend':{
						chance/=15;
						if(renyi) chance*=1.2;
						break;
					}
				}
				return Math.min(1,chance);
			},
			filter:function(){
				return game.data.dust>=10;
			},
			filterTarget:function(card,player,target){
				return game.isChessNeighbour(player,target)&&!game.data.character.contains(target.name);
			},
			content:function(){
				var chance=lib.skill.leader_zhaoxiang.chance(target,player);
				game.changeDust(-10);
				if(Math.random()<chance){
					_status.zhaoxiang=target.name;
					game.data.character.add(target.name);
					game.saveData();
					game.over();
				}
				else{
					game.log('招降',target,'失败')
					player.popup('招降失败');
					player.damage(target);
				}
			}
		},
		leader_xiaoxiong:{
			unique:true,
			forced:true,
			trigger:{source:'damageEnd'},
			filter:function(event,player){
				return event.num>0;
			},
			content:function(){
				switch(_status.difficulty){
					case 'leader_easy':game.reward+=2*trigger.num;break;
					case 'leader_medium':game.reward+=4*trigger.num;break;
					case 'leader_hard':game.reward+=6*trigger.num;break;
				}
			}
		},
		leader_renyi:{
			unique:true,
		},
		leader_mouduan:{
			unique:true,
			global:'leader_mouduan2'
		},
		leader_mouduan2:{
			mod:{
				chessMove:function(player,current){
					if(player.side&&player.name!=_status.lord) return current+1;
				}
			}
		},
		tongshuai:{
			unique:true,
			forbid:['guozhan'],
			init:function(player){
				player.storage.tongshuai={
					list:[],
					owned:{},
					player:player,
					get:function(num){
						if(typeof num!='number') num=1;
						var player=this.player;
						while(num--){
							var name=player.storage.tongshuai.unowned.shift();
							if(!name) return;
							var skills=lib.character[name][3].slice(0);
							for(var i=0;i<skills.length;i++){
								var info=lib.skill[skills[i]];
								if(info.unique&&!info.gainable){
									skills.splice(i--,1);
								}
							}
							player.storage.tongshuai.owned[name]=skills;
							game.addVideo('chess_tongshuai',player,player.storage.tongshuai.owned);
						}
					}
				}
			},
			group:['tongshuai1','tongshuai2','tongshuai3'],
			intro:{
				content:function(storage,player){
					var str='';
					var slist=storage.owned;
					var list=[];
					for(var i in slist){
						list.push(i);
					}
					if(list.length){
						str+=get.translation(list[0]);
						for(var i=1;i<list.length;i++){
							str+='、'+get.translation(list[i]);
						}
					}
					var skill=player.additionalSkills.tongshuai[0];
					if(skill){
						str+='<p>当前技能：'+get.translation(skill);
					}
					return str;
				},
				mark:function(dialog,content,player){
					var slist=content.owned;
					var list=[];
					for(var i in slist){
						list.push(i);
					}
					if(list.length){
						dialog.addSmall([list,'character']);
					}
					var skill=player.additionalSkills.tongshuai[0];
					if(skill){
						dialog.add('<div><div class="skill">【'+get.translation(skill)+
						'】</div><div>'+lib.translate[skill+'_info']+'</div></div>');
					}
				}
			},
			// mark:true
		},
		tongshuai1:{
			trigger:{global:'gameStart'},
			forced:true,
			popup:false,
			priority:10,
			content:function(){
				for(var i=0;i<game.data.character.length;i++){
					var skills=lib.character[game.data.character[i]][3]
					var add=false;
					for(var j=0;j<skills.length;j++){
						var info=lib.skill[skills[j]];
						if(info.gainable||!info.unique){
							add=true;break;
						}
					}
					if(add){
						player.storage.tongshuai.list.push(game.data.character[i]);
					}
				}
				for(var i=0;i<game.players.length;i++){
					player.storage.tongshuai.list.remove([game.players[i].name]);
					player.storage.tongshuai.list.remove([game.players[i].name1]);
					player.storage.tongshuai.list.remove([game.players[i].name2]);
				}
				player.storage.tongshuai.unowned=player.storage.tongshuai.list.slice(0);
				player.storage.tongshuai.unowned.sort(lib.sort.random);
				if(player.storage.tongshuai.unowned.length>1){
					player.storage.tongshuai.get(2);
				}
				else if(player.storage.tongshuai.unowned.length==1){
					player.storage.tongshuai.get();
				}
				else{
					player.removeSkill('tongshuai');
				}
			}
		},
		tongshuai2:{
			audio:2,
			trigger:{player:['phaseBegin','phaseEnd'],global:'gameStart'},
			filter:function(event,player,name){
				if(!player.hasSkill('tongshuai')) return false;
				if(name=='phaseBegin'&&game.phaseNumber==1) return false;
				return true;
			},
			priority:-9,
			forced:true,
			popup:false,
			content:function(){
				var slist=player.storage.tongshuai.owned;
				var list=[];
				for(var i in slist){
					list.push(i);
				}
				if(event.isMine()){
					event.dialog=ui.create.dialog('选择获得一项技能',[list,'character']);
					if(trigger.name=='game'){
						event.control=ui.create.control();
					}
					else{
						event.control=ui.create.control(['cancel']);
					}
					event.clickControl=function(link){
						if(link!='cancel'){
							var currentname=event.dialog.querySelector('.selected.button').link;
							var mark=player.marks.tongshuai;
							if(!mark){
								player.markSkill('tongshuai');
								mark=player.marks.tongshuai;
								if(mark.firstChild){
									mark.firstChild.remove();
								}
							}
							mark.setBackground(currentname,'character');

							player.addAdditionalSkill('tongshuai',link);
							game.addVideo('chess_tongshuai_skill',player,[currentname,link]);
							player.logSkill('tongshuai2');
							game.log(player,'获得技能','【'+get.translation(link)+'】');
							player.popup(link);

							for(var i=0;i<event.dialog.buttons.length;i++){
								if(event.dialog.buttons[i].classList.contains('selected')){
									var name=event.dialog.buttons[i].link;
									player.sex=lib.character[name][0];
									player.group=lib.character[name][1];
									// player.node.identity.style.backgroundColor=get.translation(player.group+'Color');
									break;
								}
							}
						}
						ui.auto.show();
						event.dialog.close();
						event.control.close();
						_status.imchoosing=false;
						game.resume();
					};
					event.control.custom=event.clickControl;
					ui.auto.hide();
					_status.imchoosing=true;
					game.pause();
					for(var i=0;i<event.dialog.buttons.length;i++){
						event.dialog.buttons[i].classList.add('selectable');
					}
					event.custom.replace.button=function(button){
						if(button.classList.contains('selected')){
							button.classList.remove('selected');
							if(trigger.name=='game'){
								event.control.style.opacity=0;
							}
							else{
								event.control.replace(['cancel']);
							}
						}
						else{
							for(var i=0;i<event.dialog.buttons.length;i++){
								event.dialog.buttons[i].classList.remove('selected');
							}
							button.classList.add('selected');
							event.control.replace(slist[button.link]);
							if(trigger.name=='game'&&getComputedStyle(event.control).opacity==0){
								event.control.style.transition='opacity 0.5s';
								ui.refresh(event.control);
								event.control.style.opacity=1;
								event.control.style.transition='';
								ui.refresh(event.control);
							}
							else{
								event.control.style.opacity=1;
							}
						}
						event.control.custom=event.clickControl;
					}
					event.custom.replace.window=function(){
						for(var i=0;i<event.dialog.buttons.length;i++){
							if(event.dialog.buttons[i].classList.contains('selected')){
								event.dialog.buttons[i].classList.remove('selected');
								if(trigger.name=='game'){
									event.control.style.opacity=0;
								}
								else{
									event.control.replace(['cancel']);
								}
								event.control.custom=event.clickControl;
								return;
							}
						}
					}
				}
				else{
					event.finish();
				}
			}
		},
		tongshuai3:{
			unique:true,
			trigger:{player:'phaseBegin'},
			forced:true,
			filter:function(event,player){
				return player.storage.tongshuai&&player.storage.tongshuai.unowned&&player.storage.tongshuai.unowned.length>0;
			},
			content:function(){
				player.storage.tongshuai.get();
			}
		},
		cangming:{
			enable:'phaseUse',
			usable:1,
			unique:true,
			filter:function(event,player){
				if(player.isTurnedOver()) return false;
				var suits=[];
				var hs=player.get('h');
				for(var i=0;i<hs.length;i++){
					suits.add(get.suit(hs[i]));
					if(suits.length>=4) return true;
				}
				return false;
			},
			filterCard:function(card){
				var suit=get.suit(card);
				for(var i=0;i<ui.selected.cards.length;i++){
					if(suit==get.suit(ui.selected.cards[i])) return false;
				}
				return true;
			},
			selectCard:4,
			check:function(card){
				return 10-ai.get.value(card);
			},
			filterTarget:function(card,player,target){
				return player!=target;
			},
			selectTarget:-1,
			content:function(){
				target.goMad();
				if(!player.isTurnedOver()){
					player.turnOver();
				}
				player.addSkill('cangming2');
			},
			ai:{
				order:10,
				effect:{
					player:function(card,player){
						var num=0;
						for(var i=0;i<game.players.length;i++){
							if(ai.get.attitude(player,game.players[i])<0){
								num++;
								if(num>1) break;
							}
						}
						if(num<=1) return;
						if(_status.currentPhase==player&&player.num('h')<player.hp&&player.hp>=6){
							if(typeof card=='string') return;
							if(card.name=='wuzhong') return;
							if(card.name=='shunshou') return;
							if(card.name=='yuanjiao') return;
							if(card.name=='yiyi') return;
							if(!player.hasSkill('cangming2')) return [0,0,0,0];
						}
					}
				},
				result:{
					target:function(player){
						var num=0;
						for(var i=0;i<game.players.length;i++){
							if(ai.get.attitude(player,game.players[i])<0){
								num++;
								if(num>1) break;
							}
						}
						if(num<=1) return 0;
						return -10;
					}
				}
			},
		},
		cangming2:{
			trigger:{player:'phaseBegin'},
			forced:true,
			popup:false,
			content:function(){
				for(var i=0;i<game.players.length;i++){
					game.players[i].unMad();
				}
				player.removeSkill('cangming2');
			}
		},
		boss_moyan:{
			trigger:{player:'phaseEnd'},
			forced:true,
			unique:true,
			content:function(){
				"step 0"
				event.players=get.players(player);
				"step 1"
				if(event.players.length){
					event.players.shift().damage('fire');
					event.redo();
				}
			},
		},
		boss_stonebaolin:{
			inherit:'juece',
		},
		boss_stoneqiangzheng:{
			trigger:{player:'phaseEnd'},
            forced:true,
			unique:true,
            filter:function(event,player){
                for(var i=0;i<game.players.length;i++){
                    if(game.players[i]!=player&&game.players[i].num('h')) return true;
                }
                return false;
            },
            content:function(){
                "step 0"
				var players=get.players(player);
				players.remove(player);
				event.players=players;
				"step 1"
				if(event.players.length){
					var current=event.players.shift();
					var hs=current.get('h')
					if(hs.length){
						player.gain(hs.randomGet());
						current.$give(1,player);
					}
					event.redo();
				}
            }
		},
		guanchuan:{
			trigger:{player:'shaBefore'},
			getTargets:function(player,target){
				var targets=[];
				var pxy=player.getXY();
				var txy=target.getXY();
				var dx=txy[0]-pxy[0];
				var dy=txy[1]-pxy[1];
				for(var i=0;i<game.players.length;i++){
					if(game.players[i]!=player&&game.players[i]!=target){
						var axy=game.players[i].getXY();
						var dx2=axy[0]-pxy[0];
						var dy2=axy[1]-pxy[1];
						if(dx*dx2<0) continue;
						if(dy*dy2<0) continue;
						if(dx==0){
							if(dx2==0){
								targets.push(game.players[i]);
							}
						}
						else if(dx2!=0){
							if(dy2/dx2==dy/dx){
								targets.push(game.players[i]);
							}
						}
					}
				}
				return targets;
			},
			filter:function(event,player){
				if(event.targets.length!=1) return false;
				return lib.skill.guanchuan.getTargets(player,event.targets[0]).length>0;
			},
			check:function(event,player){
				var targets=lib.skill.guanchuan.getTargets(player,event.targets[0]);
				var eff=0;
				for(var i=0;i<targets.length;i++){
					eff+=ai.get.effect(targets[i],event.card,player,player);
				}
				return eff>0;
			},
			content:function(){
				var targets=lib.skill.guanchuan.getTargets(player,trigger.targets[0]);
				for(var i=0;i<targets.length;i++){
					trigger.targets.push(targets[i]);
				}
				player.logSkill('guanchuan',targets);
			}
		},
		sanjiansheji:{
			enable:'phaseUse',
			filter:function(event,player){
				return player.num('h','sha')>1&&lib.filter.filterCard({name:'sha'},player);
			},
			filterCard:{name:'sha'},
			selectCard:2,
			check:function(card){
				var num=0;
				var player=_status.event.player;
				for(var i=0;i<game.players.length;i++){
					if(lib.filter.targetEnabled({name:'sha'},player,game.players[i])&&
					ai.get.effect(game.players[i],{name:'sha'},player)>0){
						num++;
						if(num>1) return 8-ai.get.value(card);
					}
				}
				return 0;
			},
			selectTarget:[1,Infinity],
			discard:false,
			prepare:function(cards,player,targets){
				player.$throw(cards);
				player.line(targets);
			},
			filterTarget:function(card,player,target){
				return lib.filter.targetEnabled({name:'sha'},player,target)&&
				get.distance(player,target,'pure')<=5;
			},
			content:function(){
				targets.sort(lib.sort.seat);
				player.useCard({name:'sha'},cards,targets,'luanjian').animate=false;
			},
			multitarget:true,
			ai:{
				order:function(){
					return lib.card.sha.ai.order+0.1;
				},
				result:{
					target:function(player,target){
						var added=false;
						if(!player.hasSkill('unequip')){
							added=true;
							player.skills.push('unequip');
						}
						var eff=ai.get.effect(target,{name:'sha'},player,target);
						if(added){
							player.skills.remove('unequip');
						}
						return eff;
					}
				},
				effect:{
					player:function(card,player){
						if(_status.currentPhase!=player) return;
						if(card.name=='sha'&&player.num('h','sha')<2&&player.num('h')<=player.hp){
							var num=0;
							var player=_status.event.player;
							for(var i=0;i<game.players.length;i++){
								if(lib.filter.targetEnabled({name:'sha'},player,game.players[i])&&
								ai.get.attitude(player,game.players[i])<0){
									num++;
									if(num>1) return [0,0,0,0];
								}
							}
						}
					}
				},
			}
		},
		zhiming:{
			trigger:{source:'damageBegin'},
			filter:function(event,player){
				return get.distance(event.player,player,'attack')>1&&event.card&&event.card.name=='sha';
			},
			forced:true,
			content:function(){
				trigger.num++;
			}
		},
		lianshe:{
			mod:{
				cardUsable:function(card,player,num){
					if(card.name=='sha'){
						return num+get.cardCount(true,player)-get.cardCount('sha',player);
					}
				},
				attackFrom:function(from,to,distance){
					return distance-1;
				}
			},
		},
		pianyi:{
			trigger:{player:'phaseEnd'},
			direct:true,
			filter:function(event,player){
				return !player.getStat('damage');
			},
			content:function(){
				"step 0"
				player.chooseToMove(2,'是否发动【翩仪】？');
				"step 1"
				if(result.bool){
					player.logSkill('pianyi');
				}
			}
		},
		lingdong:{
			trigger:{player:'phaseEnd'},
			direct:true,
			filter:function(event,player){
				return get.cardCount('sha',player)>0;
			},
			content:function(){
				"step 0"
				player.chooseToMove(get.cardCount('sha',player),'是否发动【移动射击】？');
				"step 1"
				if(result.bool){
					player.logSkill('lingdong');
				}
			}
		},
		_noactpunish:{
			trigger:{player:'useCard'},
			filter:function(event,player){
				return _status.currentPhase==player&&event.targets&&(event.targets.length>1||event.targets[0]!=player);
			},
			forced:true,
			popup:false,
			content:function(){
				player.addTempSkill('noactpunish','phaseAfter');
			}
		},
		noactpunish:{},
		_chess_chuzhang:{
			enable:'phaseUse',
			usable:1,
			direct:true,
			delay:false,
			preservecancel:true,
			filter:function(event,player){
				if(_status.mode=='tafang') return false;
				var num=0;
				var xy=player.getXY();
				if(game.obstacles.contains(player.getNeighbour(-1,0))||xy[0]==0) num++;
				if(game.obstacles.contains(player.getNeighbour(1,0))||xy[0]+1>=ui.chesswidth) num++;
				if(game.obstacles.contains(player.getNeighbour(0,-1))||xy[1]==0) num++;
				if(game.obstacles.contains(player.getNeighbour(0,1))||xy[1]+1>=ui.chessheight) num++;
				return num>=3;
			},
			content:function(){
				'step 0'
				event.obstacles=[];
				var neighbour;
				neighbour=player.getNeighbour(-1,0);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(1,0);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(0,-1);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(0,1);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				if(!event.obstacles.length){
					event.finish();
					return;
				}
				else if(event.obstacles.length==1){
					event.obstacle=event.obstacles[0];
				}
				else if(event.isMine()){
					for(var i=0;i<event.obstacles.length;i++){
						event.obstacles[i].classList.add('glow');
					}
					event.chooseObstacle=true;
					game.pause();
					_status.imchoosing=true;
					event.dialog=ui.create.dialog('选择一个与你相邻的障碍清除之');
					event.dialog.add('<div class="text">'+lib.translate._chess_chuzhang_info+'</div>');
					event.custom.replace.confirm=function(){
						player.getStat().skill._chess_chuzhang--;
						event.cancelled=true;
						game.resume();
					};
				}
				'step 1'
				_status.imchoosing=false;
				if(!event.cancelled){
					if(!event.obstacle){
						event.obstacle=event.obstacles.randomGet();
					}
					game.removeObstacle(event.obstacle.dataset.position);
				}
				for(var i=0;i<event.obstacles.length;i++){
					event.obstacles[i].classList.remove('glow');
				}
				if(event.dialog){
					event.dialog.close();
				}
			},
			ai:{
				result:{
					player:1
				},
				order:7.5
			}
		},
		_phasequeue:{
			trigger:{player:'phaseBegin'},
			forced:true,
			popup:false,
			content:function(){
				var current=ui.chessinfo.querySelector('.glow2');
				if(current){
					current.classList.remove('glow2');
				}
				if(player.instance){
					player.instance.classList.add('glow2');
					ui.chessinfo.scrollTop=player.instance.offsetTop-8;
				}
			}
		},
		_chessmove:{
			enable:'phaseUse',
			usable:1,
			direct:true,
			delay:false,
			preservecancel:true,
			filter:function(event,player){
				if(!player.movable(0,1)&&!player.movable(0,-1)&&
					!player.movable(1,0)&&!player.movable(-1,0)){
					return false;
				}
				var move=2;
				move=game.checkMod(player,move,'chessMove',player.get('s'));
				return move>0;
			},
			content:function(){
				"step 0"
				var move=2;
				move=game.checkMod(player,move,'chessMove',player.get('s'));
				player.chooseToMove(move).phasing=true;
				"step 1"
				if(!result.bool){
					var skill=player.getStat().skill;
					skill._chessmove--;
					if(typeof skill._chessmovetried=='number'){
						skill._chessmovetried++;
					}
					else{
						skill._chessmovetried=1;
					}
				}
			},
			ai:{
				order:5,
				result:{
					playerx:function(player){
						if(_status.mode=='tafang'&&_status.enemies.contains(player)){
							return 1;
						}
						var nh=player.num('h');
						if(!player.num('h','sha')&&
						!player.num('h','shunshou')&&
						!player.num('h','bingliang')){
							if(nh<=Math.min(3,player.hp)) return Math.random()-0.3;
							else if(nh<=Math.min(2,player.hp)) return Math.random()-0.4;
							return Math.random()-0.5;
						}
						var neighbour;
						neighbour=player.getNeighbour(0,1);
						if(neighbour&&game.players.contains(neighbour)&&neighbour.side!=player.side){
							if(get.distance(player,neighbour,'attack')<1) return 1;
							return 0;
						}
						neighbour=player.getNeighbour(0,-1);
						if(neighbour&&game.players.contains(neighbour)&&neighbour.side!=player.side){
							if(get.distance(player,neighbour,'attack')<1) return 1;
							return 0;
						}
						neighbour=player.getNeighbour(1,0);
						if(neighbour&&game.players.contains(neighbour)&&neighbour.side!=player.side){
							if(get.distance(player,neighbour,'attack')<1) return 1;
							return 0;
						}
						neighbour=player.getNeighbour(-1,0);
						if(neighbour&&game.players.contains(neighbour)&&neighbour.side!=player.side){
							if(get.distance(player,neighbour,'attack')<1) return 1;
							return 0;
						}
						return 1;
					},
					player:function(player){
						if(player.getStat().skill._chessmovetried>=10){
							return 0;
						}
						var x=lib.skill._chessmove.ai.result.playerx(player);
						if(player.isMad()) return -x;
						return x;
					}
				}
			}
		},
		_chessswap:{
			trigger:{player:['phaseBegin','chooseToUseBegin','chooseToRespondBegin','chooseToDiscardBegin','chooseToCompareBegin',
			'chooseButtonBegin','chooseCardBegin','chooseTargetBegin','chooseCardTargetBegin','chooseControlBegin',
			'chooseBoolBegin','choosePlayerCardBegin','discardPlayerCardBegin','gainPlayerCardBegin']},
			forced:true,
			priority:100,
			popup:false,
			filter:function(event,player){
				if(event.autochoose&&event.autochoose()) return false;
				if(lib.config.mode=='chess'&&_status.mode=='combat'&&!get.config('single_control')) return false;
				return player.isUnderControl();
			},
			content:function(){
				game.modeSwapPlayer(player);
			},
		},
		_chesscenter:{
			trigger:{player:['phaseBegin','useCardBegin','useSkillBegin','respondBegin','damageBegin','loseHpBegin'],
			target:'useCardToBegin'},
			forced:true,
			priority:100,
			popup:false,
			content:function(){
				player.chessFocus();
			},
		},
		boss_bfengxing:{
			mod:{
				chessMove:function(player,current){
					return current+2;
				},
				attackFrom:function(from,to,current){
					return current-2;
				},
			},
			trigger:{player:'phaseDrawBegin'},
			forced:true,
			content:function(){
				trigger.num+=2;
			}
		},
		boss_chiyu:{
			enable:'phaseUse',
			usable:1,
			filterCard:{color:'red'},
			nodelay:true,
			check:function(card){return 8-ai.get.value(card);},
			filterTarget:function(card,player,target){
				return get.distance(player,target)<=5&&player!=target;
			},
			filter:function(event,player){
				return player.num('h',{color:'red'})>0;
			},
			selectTarget:-1,
			content:function(){
				target.damage('fire');
			},
			line:'fire',
			ai:{
				order:1,
				result:{
					target:function(player,target){
						return ai.get.damageEffect(target,player,target,'fire');
					}
				}
			}
		},
		boss_tenglong:{
			enable:'phaseUse',
			usable:1,
			position:'he',
			filterCard:{type:'equip'},
			init:function(player){
				player.forcemin=true;
			},
			check:function(card){
				var player=_status.currentPhase;
				if(player.num('he',{subtype:get.subtype(card)})>1){
					return 12-ai.get.equipValue(card);
				}
				return 8-ai.get.equipValue(card);
			},
			filter:function(event,player){
				return player.num('he',{type:'equip'});
			},
			filterTarget:function(card,player,target){
				return player!=target&&get.distance(player,target)<=2;
			},
			content:function(){
				target.damage(3,'fire');
			},
			ai:{
				order:9,
				result:{
					target:function(player,target){
						return ai.get.damageEffect(target,player,target,'fire');
					}
				}
			}
		},
		boss_wuying:{
			mod:{
				globalTo:function(from,to,distance){
					return distance+2;
				},
				chessMove:function(player,current){
					return current-1;
				}
			}
		},
		boss_wushang:{
			trigger:{player:'phaseBegin'},
			forced:true,
			filter:function(event,player){
				for(var i=0;i<game.players.length;i++){
					if(game.players[i]!=player&&game.players[i].num('h')&&
						get.distance(player,game.players[i])<=5){
						return true;
					}
				}
				return false;
			},
			content:function(){
				"step 0"
				var players=[];
				for(var i=0;i<game.players.length;i++){
					if(game.players[i]!=player&&game.players[i].num('h')&&
						get.distance(player,game.players[i])<=5){
						players.push(game.players[i]);
					}
				}
				players.sort(lib.sort.seat);
				event.players=players;
				"step 1"
				if(event.players.length){
					event.current=event.players.shift();
					event.current.chooseCard('神天并地：交给'+get.translation(player)+'一张手牌',true);
				}
				else{
					event.finish();
				}
				"step 2"
				if(result.cards.length){
					player.gain(result.cards);
					event.current.$give(1,player);
					event.goto(1);
				}
			}
		}
	},
	translate:{
		zhu_config:'启用主将',
		main_zhu_config:'启用副将',
		noreplace_end_config:'无替补时结束',
		reward_config:'杀敌摸牌',
		punish_config:'杀死队友',
		seat_order_config:'行动顺序',
		battle_number_config:'对战人数',
		replace_number_config:'替补人数',
		first_less_config:'先手少摸牌',
		single_control_config:'单人控制',
		additional_player_config:'无尽模式',
		choice_number_config:'无尽模式候选',

		friend:'友',
		enemy:'敌',
		neutral:'中',
		trueColor:"zhu",
		falseColor:"wei",
		_chessmove:'移动',
		leader:'君主',
		combat:'对阵',
		chessscroll_speed_config:'边缘滚动速度',
		chess_character_config:'战棋武将',
		only_chess_character_config:'只用战棋武将',
		chess_ordered_config:'指定行动顺序',
		chess_mode_config:'游戏模式',
		chess_leader_save_config:'选择历程',
		chess_leader_clear_config:'清除进度',
		save1:'一',
		save2:'二',
		save3:'三',
		save4:'四',
		save5:'五',

		leader_2:' ',
		leader_2_bg:'二',
		leader_3:' ',
		leader_3_bg:'三',
		leader_5:' ',
		leader_5_bg:'五',
		leader_8:' ',
		leader_8_bg:'八',

		leader_easy:'简单',
		leader_medium:'普通',
		leader_hard:'困难',

		chess_caocao:'曹操',
		chess_xunyu:'荀彧',
		chess_simayi:'司马懿',
		chess_xiahoudun:'夏侯惇',
		chess_dianwei:'典韦',
		chess_xuzhu:'许褚',
		chess_zhangliao:'张辽',
		chess_jiaxu:'贾诩',

		chess_liubei:'刘备',
		chess_guanyu:'关羽',
		chess_zhangfei:'张飞',
		chess_zhaoyun:'赵云',
		chess_machao:'马超',
		chess_huangzhong:'黄忠',
		chess_maliang:'马良',
		chess_zhugeliang:'诸葛亮',

		chess_sunquan:'孙权',
		chess_zhouyu:'周瑜',
		chess_lvmeng:'吕蒙',
		chess_huanggai:'黄盖',
		chess_lusu:'鲁肃',
		chess_luxun:'陆逊',
		chess_ganning:'甘宁',
		chess_taishici:'太史慈',

		chess_lvbu:'吕布',
		chess_sunshangxiang:'孙尚香',
		chess_diaochan:'貂蝉',
		chess_huatuo:'华佗',
		chess_zhangjiao:'张辽',
		chess_menghuo:'孟获',

		chess_dongzhuo:'董卓',
		chess_xingtian:'刑天',
		chess_jinchidiao:'金翅雕',
		chess_beimingjukun:'北溟巨鲲',
		chess_wuzhaojinlong:'五爪金龙',

		treasure_dubiaoxianjing:'毒镖陷阱',
		treasure_jiqishi:'集气石',
		treasure_shenmidiaoxiang:'神秘雕像',
		treasure_shenpanxianjing:'审判之刃',
		treasure_shiyuansu:'石元素',
		treasure_wuyashenxiang:'乌鸦神像',

		dubiaoxianjing:'飞刃',
		dubiaoxianjing_info:'距离两格体力值大于1的角色在回合结束后受到一点伤害，然后摸两张牌',
		jiqishi:'集气',
		jiqishi_info:'距离两格以内的已受伤角色在回合结束后回复一点体力，然后弃置两张牌',
		shenmidiaoxiang:'秘咒',
		shenmidiaoxiang_info:'距离三格以外的所有角色在回合结束后强制向此处移动一格',
		shenpanxianjing:'审判',
		shenpanxianjing_info:'在任意一名角色回合结束后，若没有其他角色手牌数比其多，随机弃置其一张手牌',
		shiyuansu:'护体',
		shiyuansu_info:'任意一名角色一次性受到不少于两点伤害后，使其获得一点护甲',
		wuyashenxiang:'厄音',
		wuyashenxiang_info:'距离3格以内的角色在其回合结束后，若体力值不大于1，令其回复一点体力，然后将牌堆中的一张延时锦囊牌置于其判定区',

		leader_caocao:'曹操',
		leader_liubei:'刘备',
		leader_sunquan:'孙权',
		leader_xiaoxiong:'枭雄',
		leader_xiaoxiong_info:'你造成伤害后会得到一定数量的金钱奖励',
		leader_renyi:'仁义',
		leader_renyi_info:'你招降敌将的成功率大幅增加',
		leader_mouduan:'谋断',
		leader_mouduan_info:'其他友方角色回合内的行动范围+1',

		tongshuai:'统率',
		tongshuai_info:'回合开始和结束阶段，你可以选择一名未上场的已方武将的一个技能作为你的技能',
		leader_zhaoxiang:'招降',
		leader_zhaoxiang_info:'出牌阶段限一次，你可以尝试对相邻敌方武将进行招降，若成功，你获得该武将并立即结束本局游戏，若失败，你受到一点伤害。每发动一次消耗10招募令',

		common:'普通',
		rare:'稀有',
		epic:'史诗',
		legend:'传说',

		chess_shezhang:'设置障碍',
		chess_shezhang_info:'在你的一个相邻位置设置障碍，摸一张牌',
		chess_chuzhang:'清除障碍',
		chess_chuzhang_info:'清除一个在你相邻位置的障碍，摸一张牌',

		_chess_chuzhang:'除障',
		_chess_chuzhang_info:'出牌阶段限一次，若你周围四格至少有三个为障碍或在边缘外，你可以选择清除其中一个障碍',

		arenaAdd:'援军',
		arenaAdd_info:'出牌阶段限一次，你可以令一名未出场的已方角色加入战场。战斗结束后，该角色无论是否存活均不能再次出场',

		pianyi:'翩仪',
		pianyi_info:'回合结束阶段，若你没有于本回合内造成伤害，你获得一次移动机会',
		lingdong:'移动射击',
		lingdong_info:'回合结束阶段，你可以移动X个格，X为你回合内出杀的次数',
		lianshe:'连续射击',
		lianshe_info:'你的攻击范围+1；回合内，你回合内，每当你使用一张不是杀的牌，你可以额外使用一张杀',
		zhiming:'致命射击',
		zhiming_info:'锁定技，当你使用杀造成伤害时，若你不在目标的攻击范围内，此伤害+1',
		sanjiansheji:'散箭射击',
		sanjiansheji_info:'你可以将两张杀当杀使用，此杀可以指定距离你5格以内任意名目标',
		guanchuan:'贯穿射击',
		guanchuan_info:'当你使用杀指定惟一的目标后，可将攻击射线内的其他角色也加入目标',

		boss_stoneqiangzheng:'强征',
		boss_stoneqiangzheng_info:'锁定技，回合结束阶段，你获得每个其他角色的一张手牌',
		boss_stonebaolin:'暴凌',
		boss_moyan:'魔焰',
		boss_moyan_info:'锁定技，回合结束阶段，你对场上所有角色造成一点火焰伤害',

		cangming:'颠动沧溟',
		cangming_info:'出牌阶段限一次，你可弃置四张花色不同的手牌并将武将牌翻至背面，然后令所有其他角色进入混乱状态直到你的下一回合开始',
		boss_bfengxing:'风行',
		boss_bfengxing_info:'锁定技，你摸牌阶段摸牌数+2；你的攻击范围+2；你回合内的移动距离+2',
		boss_chiyu:'炽羽',
		boss_chiyu_info:'出牌阶段限一次，你可以弃置一张红色牌对距离5以内的所有其他角色造成一点火焰伤害',
		boss_tenglong:'腾龙八齐',
		boss_tenglong_info:'你没有装备区；出牌阶段限一次，你可以弃置一张装备牌对一名距离你2以内的其他角色造成3点火焰伤害',
		boss_wushang:'神天并地',
		boss_wushang_info:'锁定技，回合开始阶段，距离你5以内的所有其他角色需交给你一张手牌',
		boss_wuying:'无影',
		boss_wuying_info:'锁定技，你回合内的移动距离-1；计算其他角色与你的距离时始终+2',

		mode_tafang_character_config:'战棋模式',
		mode_tafang_card_config:'战棋模式',

		chess_mech_weixingxianjing:'小型陷阱',
		chess_mech_weixingxianjing_skill:'捕猎',
		chess_mech_weixingxianjing_skill_info:'每一轮令距离你2格以内的一名随机敌人翻面',
		chess_mech_mutong:'木桶',
		chess_mech_mutong_skill:'飞滚',
		chess_mech_mutong_skill_info:'每一轮对距离3格以内的一名随机敌人造成一点伤害',
		chess_mech_nengliangqiu:'能量球',
		chess_mech_nengliangqiu_skill:'充能',
		chess_mech_nengliangqiu_skill_info:'每一轮令距离3格以内的所有友方角色摸1张牌，距离1以内改为摸2张',
		chess_mech_jiguanren:'机关人',
		chess_mech_jiguanren_skill:'掠夺',
		chess_mech_jiguanren_skill_info:'每一轮弃置3格以内的所有敌方角色各1~2张牌',
		chess_mech_gongchengche:'攻城车',
		chess_mech_gongchengche_skill:'攻坚',
		chess_mech_gongchengche_skill_info:'每一轮对距离2格以内的一名随机敌方角色造成1点火焰伤害，并将目标击退1格',
		chess_mech_guangmingquan:'光明泉',
		chess_mech_guangmingquan_skill:'圣疗',
		chess_mech_guangmingquan_skill_info:'每一轮令距离2格以内的所有友方角色各回复一点体力',
	},
	ui:{
		create:{
			playergrid:function(player,x,y){
				var pos=player.getDataPos(x,y);
				if(_status.mode=='tafang'){
					if(pos<ui.chesswidth) return false;
					if(pos/ui.chesswidth>=ui.chessheight-1) return false;
				}
				var node=ui.create.div('.player.minskin.playergrid',player.parentNode);
				node.link=player;
				node.dataset.position=pos;
				return node;
			},
			fakeme:function(){
				if(ui.fakeme){
					ui.fakeme.delete();
				}
				ui.fakeme=ui.create.div('.fakeme.avatar',ui.me);
				ui.fakeme.style.backgroundImage=game.me.node.avatar.style.backgroundImage;
			}
		},
		click:{
			chessInfo:function(e){
				if(this.link.isAlive()){
					this.link.chessFocus();
					if(this.link.classList.contains('selectable')||
						this.link.classList.contains('selected')){
						ui.click.target.call(this.link,e);
						ui.click.window.call(ui.window,e);
					}
					e.stopPropagation();
				}
			},
			playergrid:function(){
				if(!_status.paused) return;
				var pos=parseInt(this.dataset.position);
				this.link.moveTo(pos%ui.chesswidth,Math.floor(pos/ui.chesswidth));
				if(ui.movegrids){
					while(ui.movegrids.length){
						ui.movegrids.shift().delete();
					}
				}
				_status.event.result={
					bool:true,
					move:this.link.dataset.position
				};
				game.resume();
			},
			obstacle:function(){
				if(_status.event.chooseObstacle&&_status.paused&&
					_status.event.obstacles&&_status.event.obstacles.contains(this)){
					_status.event.obstacle=this;
					game.resume();
				}
			}
		}
	},
	get:{
		chessDistance:function(from,to){
			var fxy=from.getXY();
			var txy=to.getXY();
			return Math.abs(fxy[0]-txy[0])+Math.abs(fxy[1]-txy[1]);
		},
	},
	ai:{
		get:{
			attitude:function(from,to){
				if(!from||!to) return 0;
				var t=(from.side===to.side?1:-1);
				if(from.isMad()){
					t=-t;
				}
				else if(to.isMad()){
					t=0;
				}
				return 6*t;
			}
		}
	},
	card:{
		chess_shezhang:{
			type:'basic',
			fullskin:true,
			enable:function(card,player){
				if(player.movable(-1,0)) return true;
				if(player.movable(1,0)) return true;
				if(player.movable(0,-1)) return true;
				if(player.movable(0,1)) return true;
				return false;
			},
			filterTarget:function(card,player,target){
				return player==target;
			},
			selectTarget:-1,
			content:function(){
				'step 0'
				var pos=parseInt(player.dataset.position);
				var poses=[];
				if(player.movable(-1,0)){
					poses.push(pos-1);
				}
				if(player.movable(1,0)){
					poses.push(pos+1);
				}
				if(player.movable(0,-1)){
					poses.push(pos-ui.chesswidth);
				}
				if(player.movable(0,1)){
					poses.push(pos+ui.chesswidth);
				}
				event.poses=poses;
				if(poses.length==1){
					event.obstacle=poses[0];
					event.grids=[];
				}
				else if(event.isMine()){
					event.grids=player.createRangeShadow(1,function(){
						event.obstacle=this.dataset.position;
						game.resume();
					})
					game.pause();
					_status.imchoosing=true;
					for(var i=0;i<event.grids.length;i++){
						event.grids[i].animate('start');
					}
					event.dialog=ui.create.dialog('选择一个位置放置障碍');
				}
				else{
					event.grids=[];
				}
				'step 1'
				_status.imchoosing=false;
				if(!event.obstacle){
					event.obstacle=event.poses.randomGet();
				}
				if(event.obstacle){
					game.addObstacle(event.obstacle.toString());
				}
				while(event.grids.length){
					event.grids.shift().delete();
				}
				if(event.dialog){
					event.dialog.close();
				}
				player.draw();
			},
			ai:{
				result:{
					player:1,
				},
				order:1
			}
		},
		chess_chuzhang:{
			type:'basic',
			fullskin:true,
			filterTarget:function(card,player,target){
				return player==target;
			},
			selectTarget:-1,
			enable:function(event,player){
				if(game.obstacles.contains(player.getNeighbour(-1,0))) return true;
				if(game.obstacles.contains(player.getNeighbour(1,0))) return true;
				if(game.obstacles.contains(player.getNeighbour(0,-1))) return true;
				if(game.obstacles.contains(player.getNeighbour(0,1))) return true;
			},
			content:function(){
				'step 0'
				event.obstacles=[];
				var neighbour;
				neighbour=player.getNeighbour(-1,0);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(1,0);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(0,-1);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				neighbour=player.getNeighbour(0,1);
				if(neighbour&&game.obstacles.contains(neighbour)){
					event.obstacles.push(neighbour);
				}
				if(!event.obstacles.length){
					event.finish();
					return;
				}
				else if(event.obstacles.length==1){
					event.obstacle=event.obstacles[0];
				}
				else if(event.isMine()){
					for(var i=0;i<event.obstacles.length;i++){
						event.obstacles[i].classList.add('glow');
					}
					event.chooseObstacle=true;
					game.pause();
					_status.imchoosing=true;
					event.dialog=ui.create.dialog('选择一个与你相邻的障碍清除之');
				}
				'step 1'
				_status.imchoosing=false;
				if(!event.obstacle){
					event.obstacle=event.obstacles.randomGet();
				}
				game.removeObstacle(event.obstacle.dataset.position);
				for(var i=0;i<event.obstacles.length;i++){
					event.obstacles[i].classList.remove('glow');
				}
				if(event.dialog){
					event.dialog.close();
				}
				player.draw();
			},
			ai:{
				result:{
					player:1
				},
				order:7
			}
		},
		leader_2:{
			opacity:1,
			color:'white',
			textShadow:'black 0 0 2px'
		},
		leader_3:{
			opacity:1,
			color:'white',
			textShadow:'black 0 0 2px'
		},
		leader_5:{
			opacity:1,
			color:'white',
			textShadow:'black 0 0 2px'
		},
		leader_8:{
			opacity:1,
			color:'white',
			textShadow:'black 0 0 2px'
		},
		leader_easy:{
			color:'white',
			opacity:1,
			textShadow:'black 0 0 2px',
			image:'mode/chess/leader_easy'
		},
		leader_medium:{
			color:'white',
			opacity:1,
			textShadow:'black 0 0 2px',
			image:'mode/chess/leader_medium'
		},
		leader_hard:{
			color:'white',
			opacity:1,
			textShadow:'black 0 0 2px',
			image:'mode/chess/leader_hard'
		}
	},
	characterPack:{
		mode_tafang:{
			treasure_dubiaoxianjing:['','',0,['dubiaoxianjing'],['boss']],
			treasure_jiqishi:['','',0,['jiqishi'],['boss']],
			treasure_shenmidiaoxiang:['','',0,['shenmidiaoxiang'],['boss']],
			treasure_shenpanxianjing:['','',0,['shenpanxianjing'],['boss']],
			treasure_shiyuansu:['','',0,['shiyuansu'],['boss']],
			treasure_wuyashenxiang:['','',0,['wuyashenxiang'],['boss']],

			chess_mech_guangmingquan:['','',0,['chess_mech_guangmingquan_skill'],['boss']],
			chess_mech_nengliangqiu:['','',0,['chess_mech_nengliangqiu_skill'],['boss']],
			chess_mech_jiguanren:['','',0,['chess_mech_jiguanren_skill'],['boss']],
			chess_mech_weixingxianjing:['','',0,['chess_mech_weixingxianjing_skill'],['boss']],
			chess_mech_mutong:['','',0,['chess_mech_mutong_skill'],['boss']],
			chess_mech_gongchengche:['','',0,['chess_mech_gongchengche_skill'],['boss']],

			leader_caocao:['male','wei',4,['leader_xiaoxiong']],
			leader_liubei:['male','shu',4,['leader_renyi']],
			leader_sunquan:['male','wu',4,['leader_mouduan']],
			// chess_caocao:['male','wei',3,['']],
			// chess_xunyu:['male','wei',3,['']],
			// chess_simayi:['male','wei',3,['']],
			// chess_xiahoudun:['male','wei',3,['']],
			// chess_dianwei:['male','wei',3,['']],
			// chess_xuzhu:['male','wei',3,['']],
			chess_zhangliao:['male','wei',4,['gongji','zhiming']],
			// chess_jiaxu:['male','wei',3,['']],
			//
			// chess_liubei:['male','shu',3,['']],
			// chess_guanyu:['male','shu',3,['']],
			// chess_zhangfei:['male','shu',3,['']],
			// chess_zhaoyun:['male','shu',3,['']],
			// chess_machao:['male','shu',3,['']],
			chess_huangzhong:['male','shu',4,['sanjiansheji','liegong']],
			// chess_maliang:['male','shu',3,['']],
			// chess_zhugeliang:['male','shu',3,['']],
			//
			// chess_sunquan:['male','wu',3,['']],
			// chess_zhouyu:['male','wu',3,['qinyin']],
			// chess_lvmeng:['male','wu',3,['']],
			// chess_huanggai:['male','wu',3,['']],
			// chess_lusu:['male','wu',3,['']],
			// chess_luxun:['male','wu',3,['']],
			// chess_ganning:['male','wu',3,['']],
			chess_taishici:['male','wu',4,['gongji','guanchuan','pojun']],
			//
			// chess_lvbu:['male','qun',3,['']],
			chess_sunshangxiang:['female','wu',3,['lingdong','lianshe','gongji']],
			chess_diaochan:['female','qun',3,['xingzhui','pianyi']],
			// chess_huatuo:['male','qun',3,['zhenjiu','mazui']],
			// chess_zhangjiao:['male','qun',3,['']],
			// chess_menghuo:['male','qun',3,['']],
			//
			chess_jinchidiao:['male','qun',15,['boss_bfengxing','boss_chiyu'],['boss','chessboss']],
			chess_beimingjukun:['male','qun',25,['boss_wuying','cangming'],['boss','chessboss']],
			chess_wuzhaojinlong:['male','qun',30,['boss_tenglong','boss_wushang'],['boss','chessboss']],
			chess_dongzhuo:['male','qun',20,['jiuchi','boss_stoneqiangzheng','boss_stonebaolin'],['boss','chessboss']],
			chess_xingtian:['male','qun',99,['boss_moyan','wushuang'],['boss','chessboss']],
		}
	},
	cardPack:{
		mode_tafang:[]
	},
	chess_cardlist:[],
	chess_obstaclelist:[
		// ['club',3,'chess_shezhang'],
		// ['spade',5,'chess_shezhang'],
		// ['spade',7,'chess_shezhang'],
		// ['diamond',1,'chess_chuzhang'],
		// ['diamond',4,'chess_chuzhang'],
		// ['heart',8,'chess_chuzhang'],
		// // ['diamond',9,'chess_chuzhang'],
	],
	rank:{
		rarity:{
	        legend:[
	            'swd_muyun',
	            'shen_caocao',
	            'swd_zhaoyun',
	            'swd_septem',
	            'hs_sthrall',
	            'hs_malorne',
	            'swd_yuwentuo',
	            'swd_duguningke',
	            'swd_guyue',
	            'swd_yuxiaoxue',
	            'swd_huanglei',
	            'pal_liumengli',
	            'pal_yuntianhe',
	            'swd_xuanyuanjianxian',
	            'diaochan',
	            'gjqt_aruan',
	            'hs_neptulon',
	            'shen_lvbu',
	            'swd_qi',
	            'swd_huzhongxian',
	            'jg_liubei',
	            'hs_medivh',
	            'shen_zhugeliang',
	            'yxs_wuzetian',
	            'sp_pangtong',
	            'swd_murongshi',
	            'shen_lvmeng',
	            'chenlin',
	            'diy_caiwenji',
	            're_luxun',
	            'shen_zhaoyun',
	            'zhangchunhua',
	            'shen_zhouyu',
	            'shen_simayi',
	            'shen_guanyu',
	            'hs_siwangzhiyi',
				'chengyu',
				'yangxiu',
				'hs_yogg',
				'hs_malygos',
				'hs_ysera',
				'hanba',
	        ],
	        epic:[
				'lingju',
				'daxiaoqiao',
				'sunxiu',
				'swd_weida',
				'swd_lilian',
				'yxs_luban',
				'hs_alextrasza',
				'zhugeguo',
				'sp_caiwenji',
				'ow_yuanshi',
	            'xk_fujianhan',
	            'diy_zhenji',
	            'swd_jipeng',
	            'swd_cheyun',
	            'pal_xuanxiao',
	            'old_zhonghui',
	            'swd_tuobayuer',
	            'gjqt_bailitusu',
	            'xunyu',
	            'swd_jiliang',
	            'liuxie',
	            'hs_totemic',
	            'zhangxingcai',
	            'swd_muyue',
	            'pal_zixuan',
	            'hs_bchillmaw',
	            'swd_lanyin',
	            'gjqt_xiayize',
	            'hs_aedwin',
	            'hs_antonidas',
	            'swd_chenjingchou',
	            'yxs_yangyuhuan',
	            'gjqt_fengqingxue',
	            'pal_xuejian',
	            'xunyou',
	            're_daqiao',
	            're_zhouyu',
	            'hs_wvelen',
	            'zhugeke',
	            'jg_xiahouyuan',
	            'swd_kama',
	            'swd_anka',
	            'xk_guyuexuan',
	            'caozhi',
	            'wuguotai',
	            'yxs_aijiyanhou',
	            'swd_zhiyin',
	            're_guanyu',
	            'sp_diaochan',
	            'swd_huanyuanzhi',
	            'swd_kangnalishi',
	            're_huanggai',
	            'hs_alakir',
	            'swd_xiarou',
	            'pal_murongziying',
	            'swd_wangsiyue',
	            'gjqt_fanglansheng',
	            'swd_qiner',
	            'hs_xsylvanas',
				'zhongyao',
				'hs_blingtron',
				'hs_fuding',
				'shixie',
				'hs_lafamu',
				'hs_nozdormu',
				'ow_tianshi',
				'yxs_guiguzi',
				'ow_zhixuzhiguang',
				'hs_jiaziruila',
				'hs_yelise',
				'hs_xuefashi',
				'hs_liadrin',
				'yxs_libai',
	        ],
	        rare:[
				'sunluban',
				'sunluyu',
				'zhangliang',
				'zhangbao',
				'sp_zhangjiao',
				'swd_xiyan',
				'sunluban',
				'ow_falaozhiying',
				'yxs_kaisa',
				'yxs_napolun',
				'hs_nate',
				'yxs_jinke',
				'yxs_yuefei',
				'guyong',
				'hs_anomalus',
				'hs_jinglinglong',
				'jiangqing',
				'mayunlu',
				're_liubei',
				're_lidian',
				'hs_alleria',
				'jsp_huangyueying',
				'hs_lreno',
				'hs_zhouzhuo',
				'cenhun',
				'hs_loatheb',
				'sunziliufang',
				'hs_finley',
				'ow_chanyata',
				'yxs_huamulan',
				'cuiyan',
				'wangji',
				'xin_liru',
				'swd_quxian',
				'caorui',
				'ow_liekong',
				'ow_zhixuzhiguang',
				'lifeng',
				'sundeng',
				'hs_xialikeer',
				'hs_sainaliusi',
				'hs_lrhonin',
	            'yxs_diaochan',
	            'hs_anduin',
	            'swd_hengai',
	            'hs_wuther',
	            'jg_pangtong',
	            'lusu',
	            'bulianshi',
	            'swd_shuijing',
	            'swd_sikongyu',
	            'zhangliao',
	            'liufeng',
	            'diy_yuji',
	            're_zhangliao',
	            'caoang',
				'hs_zhishigushu',
	            'pal_jingtian',
	            'swd_shanxiaoxiao',
	            'yxs_caocao',
	            'jianyong',
	            'manchong',
	            'swd_linyue',
	            'swd_xuanyuanjiantong',
	            'swd_maixing',
	            'diy_xuhuang',
	            'dengai',
	            'hs_jaina',
	            'zhonghui',
	            'gjqt_xiangling',
	            'zhugejin',
	            'swd_jiuyou',
	            'diy_zhouyu',
	            'pal_changqing',
	            'swd_yuchiyanhong',
	            'swd_duopeng',
	            'swd_yuli',
	            'swd_rongshuang',
	            'taishici',
	            'pal_zhaoliner',
	            're_machao',
	            'zhanghe',
	            'zhangzhang',
	            'xin_fazheng',
	            'caochong',
	            'caifuren',
	            'jg_caozhen',
	            'jg_zhanghe',
	            'xin_masu',
	            'swd_situqiang',
	            'hs_malfurion',
	            'yxs_bole',
	            'yj_jushou',
	            'gjqt_yuewuyi',
	            'hs_mijiaojisi',
	            'yxs_mozi',
	            'gjqt_hongyu',
	            'hs_waleera',
	            'zhangsong',
	            'sp_dongzhuo',
	            'jiangwei',
	            'swd_chunyuheng',
	            'hetaihou',
	            'swd_jiangziya',
	            'liushan',
	            'zhugedan',
	            'sp_zhaoyun',
	            're_huatuo',
	            'swd_nicole',
	            'sp_jiangwei',
	            'swd_zhuoshanzhu',
	            'swd_shaowei',
	            'caopi',
	            'jiaxu',
	            'maliang',
	            'lingtong',
	            'wangyi',
	            'chenqun',
	            'mifuren',
	            'pal_linyueru',
	            'jg_simayi',
	            'jg_huangyueying',
	            'jg_zhugeliang',
	            'swd_jialanduo',
	            'sp_machao',
	            'caiwenji',
	            'hs_yngvar',
	            're_xushu',
	            're_huangyueying',
	        ],
	    }
	},
	posmap:{},
	help:{
		'塔防模式':
		'<ul><li>阻上敌人到达最下方的出口，坚持到给定的回合数即获得胜利<li>'+
		'每轮可获得10个行动点，用来布置机关、招募武将，或令武将行动。游戏难度将影响不同操作消耗的行动点数。未用完的行动点将减半并累积到下一轮<li>'+
		'每一轮在最上方的一个随机位置增加一名敌人，若最上方已有角色，则将其下移一格<li>'+
		'战场上最多出现3个相同的机关，每个机关在置入战场3轮后消失。战场上最多招募10名友方角色。<li>'+
		'敌方角色到达底部出口时游戏失败，已方角色到达底部出口，将被移出游戏',
	},
}