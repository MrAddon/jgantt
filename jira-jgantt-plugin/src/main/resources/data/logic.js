(function(){
    var cleanup = function(what) {
		var nodes = document.getElementsByClassName(what);
		while (nodes[0]) {
			nodes[0].parentNode.removeChild(nodes[0]);
		}
	};
	Zepto(function($){

		$('<div class="g4n7t" style="position:absolute;top:0;right:0;bottom:0;left:0;z-index:10;background-color:white">'+                
                  '<form class="gantt_control">'+
                  '<input type="radio" id="scale1" class="gantt_radio" name="scale" value="day">' +
                  '<label for="scale1">Day scale</label>' +
                  '<input type="radio" id="scale2" class="gantt_radio" name="scale" value="week">' +
                  '<label for="scale2">Week scale</label>' +
                  '<input type="radio" id="scale3" class="gantt_radio" name="scale" value="month" checked>' +
                  '<label for="scale3">Month scale</label>' +
                  '<input type="radio" id="scale4" class="gantt_radio" name="scale" value="quarter">' +
                  '<label for="scale4">Quarter scale</label>' +
                  '<input type="radio" id="scale5" class="gantt_radio" name="scale" value="year">' +
                  '<label for="scale5">Year scale</label>' +
                  '</form>' +
                  '<div id="gantt_here" style="position:absolute;top:40px;right:0;bottom:0;left:0"></div>'+
		  '</div>').appendTo('body');

		
		var pad = function(number, length) {
			var str = '' + number;
			while (str.length < length) {
				str = '0' + str;
			}   
			return str;
		}

                //Function to read the cookies
                function readCookie(name) {
                  var nameEQ = name + "=";
                  var ca = document.cookie.split(';');
                  for(var i=0;i < ca.length;i++) {
                      var c = ca[i];
                      while (c.charAt(0)==' ') c = c.substring(1,c.length);
                      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
                  }
                  return null;
                }
                        
		var month = function(name) {
                        
                        var gantt_locale = readCookie("gantt_locale")
                        if ((gantt_locale=="")||(gantt_locale==null)){ //English default
                            return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(name) + 1;
                        }
                        var language = gantt_locale.split("_")
                        if (language[0] == "en")
                            return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(name) + 1;
                        else if (language[0] == "nl")
                            return ['jan','febr','mrt','apr','mei','juni','juli','aug','sep','okt','nov','dec'].indexOf(name.toLowerCase()) + 1;
                        else if (language[0] == "de")
                            return ['Jan','Feb','März','Apr','Mai','Juni','Juli','Aug','Sept','Okt','Nov','Dez'].indexOf(name) + 1;
                        else if (language[0] == "cs")
                            return ['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'].indexOf(name.toLowerCase()) + 1;
                        else if (language[0] == "es")
                            return ['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'].indexOf(name) + 1;
                        else if (language[0] == "fr")
                            return ['janv.','févr.','mars.','avr.','mai.','juin.','juil.','août.','sept.','oct.','nov.','déc.'].indexOf(name) + 1;
                        else if (language[0] == "it")
                            return ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'].indexOf(name) + 1;
                        else if (language[0] == "zh")
                            return ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"].indexOf(name) + 1;
                        else
                            return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(name) + 1;
                        
                        //return new Date(Date.parse(name +" 1, 2012")).getMonth()+1
		}

		var array_equal = function(a1,a2) {
			return (a1.length == a2.length && a1.every(function(v,i) { return v === a2[i]; }));
		}

		Date.prototype.getWeek = function() {
			var determinedate = new Date();
			determinedate.setFullYear(this.getFullYear(), this.getMonth(), this.getDate());
			var D = determinedate.getDay();
			if(D == 0) D = 7;
			determinedate.setDate(determinedate.getDate() + (4 - D));
			var YN = determinedate.getFullYear();
			var ZBDoCY = Math.floor((determinedate.getTime() - new Date(YN, 0, 1, -6)) / 86400000);
			var WN = 1 + Math.floor(ZBDoCY / 7);
			return WN;
		}

		var daysBetween = function(first, second) {
			var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
			var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());
			var millisecondsPerDay = 1000 * 60 * 60 * 24;
			var millisBetween = two.getTime() - one.getTime();
			var days = millisBetween / millisecondsPerDay;
			return Math.floor(days);
		}

		var white = 'white';
		var gray = 'gray';

		var now = new Date();
		var now_time = now.getTime();

		var today = new Date(now);
		today.setHours(0,0,0,0);
		var today_time = today.getTime();

		var yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		var yesterday_time = yesterday.getTime();

		var tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);
		var tomorrow_time = tomorrow.getTime();

		//var tasks = {
		//    data:[
		//        {id:1, text:"Project #1",start_date:"01-04-2013", duration:11,progress: 0.6, open: true}, // , color:"red"
		//        {id:2, text:"Task #1",   start_date:"27-03-2016", duration:5, progress: 1,   open: true, parent:1},
		//    ],
		//    links:[
		//		//{id:1, source:1, target:2, type:"1"},
		//		//{id:2, source:1, target:3, type:"0"},
		//    ]
		//};
		
		var data = [];

		var owners = [];
		$('div.ghx-issue').each(function(){
			var extra = $(this).find('.ghx-extra-field-row');
			var owner = $(extra[0]).text().replace(/FILTER_OUT/,'');
			if (owners.indexOf(owner) == -1) {
				owners.push(owner);
			}
		});

		var owners_added = [];
		//var odd = true;
		$('div.ghx-issue').each(function(){
			var extra = $(this).find('.ghx-extra-field-row');
			if (extra.length < 2) {
				return;
			}
			var color;
			var epic_element = $(this).find('.ghx-highlighted-field span');
			if (epic_element.length > 0) {
				color = $(epic_element[0]).css("background-color");
			}
			var title = $(this).find('.ghx-summary').attr('title');
                        var key = $(this).find('.ghx-key-link-project-key').text() + $(this).find('.ghx-key-link-issue-num').text()
                        if (key == 0 ) {
                                key = $(this).find('.js-key-link').text()
                        }
			var add = false;
			var owner = $(extra[0]).text().replace(/FILTER_OUT/,'');
			var start_date;
			var end_date;
			var duration;
			var progress;
                        //Raul change to accept Date-Time fields
                        var kk = $(extra[1]).text().split(" ");
                        var kk2 = "None".split("x");
                        if ( $(extra[2]).text() != null) {
                            kk2 = $(extra[2]).text().split(" ");
                        }
                        
                        var end_text =""
                        var start_date_time =""
                        var end_date_time =""
                        
                        var gantt_date_format = readCookie("gantt_date_format")
                        if ( (gantt_date_format == "") || (gantt_date_format == null) ) {
                            gantt_date_format = "d/MMM/yy" //Standard Jira format by default
                        }
                        var start_text = kk[0].split('/');
                        if (! array_equal(start_text, ['None']) && start_text.length == 3 ) {
                                if ( (gantt_date_format == "dd/MM/yyyy" || gantt_date_format == "d/MM/yyyy" || gantt_date_format == "dd/M/yyyy" || gantt_date_format == "d/M/yyyy" ) && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], start_text[1], start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(start_text[1],2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "dd/MM/yy" || gantt_date_format == "d/MM/yy" || gantt_date_format == "dd/M/yy" || gantt_date_format == "d/M/yy" ) && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], start_text[1], start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(start_text[1],2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "dd/MMM/yy" || gantt_date_format == "d/MMM/yy" ) && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], month(start_text[1])-1, start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(month(start_text[1]),2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "dd/MMM/yyyy" || gantt_date_format == "d/MMM/yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], month(start_text[1])-1, start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(month(start_text[1]),2)+start_text[2];
                                } else if ( (gantt_date_format == "MM/dd/yyyy" || gantt_date_format == "M/dd/yyyy" || gantt_date_format == "MM/d/yyyy"|| gantt_date_format == "M/d/yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], start_text[0], start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(start_text[0],2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "MM/dd/yy" || gantt_date_format == "M/dd/yy" || gantt_date_format == "MM/d/yy"|| gantt_date_format == "M/d/yy") && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], start_text[0], start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(start_text[0],2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "MMM/dd/yyyy" || gantt_date_format == "MMM/d/yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], month(start_text[0])-1, start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(month(start_text[0]),2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "MMM/dd/yy" || gantt_date_format == "MMM/d/yy") && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], month(start_text[0])-1, start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(month(start_text[0]),2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "yy/MM/dd" || gantt_date_format == "yy/M/d" || gantt_date_format == "yy/MM/d" ||gantt_date_format == "yy/M/dd"  ) && start_text[0].length == 2 ) {
                                    start_date = new Date('20'+start_text[0], start_text[1], start_text[2]);
                                    start_text = pad(start_text[2],2)+'-'+pad(start_text[1],2)+'-20'+start_text[0];
                                } else if ( (gantt_date_format == "yyyy/MM/dd" || gantt_date_format == "yyyy/M/d" || gantt_date_format == "yyyy/MM/d" ||gantt_date_format == "yyyy/M/dd"  ) && start_text[0].length == 4 ) {
                                    start_date = new Date(start_text[0], start_text[1], start_text[2]);
                                    start_text = pad(start_text[2],2)+'-'+pad(start_text[1],2)+'-'+start_text[0];
                                }      
                                end_date = new Date(start_date);
                                end_text = kk2[0].split('/');
                                if (! array_equal(end_text, ['None']) && end_text.length == 3 ) {
                                        if ( (gantt_date_format == "dd/MM/yyyy" || gantt_date_format == "d/MM/yyyy" || gantt_date_format == "dd/M/yyyy" || gantt_date_format == "d/M/yyyy" ) && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], end_text[1], end_text[0]);
                                         } else if ( (gantt_date_format == "dd/MM/yy" || gantt_date_format == "d/MM/yy" || gantt_date_format == "dd/M/yy" || gantt_date_format == "d/M/yy" ) && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], end_text[1], end_text[0]);
                                         } else if ( (gantt_date_format == "dd/MMM/yy" || gantt_date_format == "d/MMM/yy" ) && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], month(end_text[1])-1, end_text[0]); 
                                         } else if ( (gantt_date_format == "dd/MMM/yyyy" || gantt_date_format == "d/MMM/yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], month(end_text[1])-1, end_text[0]);
                                         } else if ( (gantt_date_format == "MM/dd/yyyy" || gantt_date_format == "M/dd/yyyy" || gantt_date_format == "MM/d/yyyy"|| gantt_date_format == "M/d/yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], end_text[0], end_text[1]);
                                         } else if ( (gantt_date_format == "MM/dd/yy" || gantt_date_format == "M/dd/yy" || gantt_date_format == "MM/d/yy"|| gantt_date_format == "M/d/yy") && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], end_text[0], end_text[1]);
                                         } else if ( (gantt_date_format == "MMM/dd/yyyy" || gantt_date_format == "MMM/d/yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], month(end_text[0])-1, end_text[1]);
                                         } else if ( (gantt_date_format == "MMM/dd/yy" || gantt_date_format == "MMM/d/yy") && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], month(end_text[0])-1, end_text[1]);
                                         } else if ( (gantt_date_format == "yy/MM/dd" || gantt_date_format == "yy/M/d" || gantt_date_format == "yy/MM/d" ||gantt_date_format == "yy/M/dd"  ) && end_text[0].length == 2  ) {
                                            end_date =  new Date('20'+end_text[0], end_text[1], end_text[2]);
                                         } else if ( (gantt_date_format == "yyyy/MM/dd" || gantt_date_format == "yyyy/M/d" || gantt_date_format == "yyyy/MM/d" ||gantt_date_format == "yyyy/M/dd"  ) && end_text[0].length == 4  ) {
                                            end_date =  new Date(end_text[0], end_text[1], end_text[2]);
                                         }
                                }
                
				duration = Math.round((end_date - start_date)/(1000*60*60*24));
				if (duration <= 0) {
					duration = 10;
				}
				duration += 1; // magic number :)
				end_date = new Date(start_date);
				end_date.setDate(start_date.getDate() + duration);

				start_date_time = start_date.getTime();
				end_date_time = end_date.getTime();

				//progress = 0;
				if (start_date_time > now_time) {
					progress = 0;
				} else if (start_date_time <= now_time && end_date_time >= now_time) {
				//	console.log(title,start_text, start_date , duration , end_date);
				//}
				//	//progress = 0.5;
					progress = (now_time - start_date_time)/(end_date_time - start_date_time);
				} else {
					progress = 1;
				}

				//if (end_date_time > yesterday_time) {
					add = true;
				//}
			}
                        if (start_text.length < 3) {
                        start_text = kk[0].split('-');
                        if (! array_equal(start_text, ['None']) && start_text.length == 3) {
                                if ( (gantt_date_format == "dd-MM-yyyy" || gantt_date_format == "d-MM-yyyy" || gantt_date_format == "dd-M-yyyy" || gantt_date_format == "d-M-yyyy" ) && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], start_text[1], start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(start_text[1],2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "dd-MM-yy" || gantt_date_format == "d-MM-yy" || gantt_date_format == "dd-M-yy" || gantt_date_format == "d-M-yy" ) && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], start_text[1], start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(start_text[1],2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "dd-MMM-yy" || gantt_date_format == "d-MMM-yy" ) && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], month(start_text[1])-1, start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(month(start_text[1]),2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "dd-MMM-yyyy" || gantt_date_format == "d-MMM-yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], month(start_text[1])-1, start_text[0]);
                                    start_text = pad(start_text[0],2)+'-'+pad(month(start_text[1]),2)+start_text[2];
                                } else if ( (gantt_date_format == "MM-dd-yyyy" || gantt_date_format == "M-dd-yyyy" || gantt_date_format == "MM-d-yyyy"|| gantt_date_format == "M-d-yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], start_text[0], start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(start_text[0],2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "MM-dd-yy" || gantt_date_format == "M-dd-yy" || gantt_date_format == "MM-d-yy"|| gantt_date_format == "M-d-yy") && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], start_text[0], start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(start_text[0],2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "MMM-dd-yyyy" || gantt_date_format == "MMM-d-yyyy") && start_text[2].length == 4 ) {
                                    start_date = new Date(start_text[2], month(start_text[0])-1, start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(month(start_text[0]),2)+'-'+start_text[2];
                                } else if ( (gantt_date_format == "MMM-dd-yy" || gantt_date_format == "MMM-d-yy") && start_text[2].length == 2 ) {
                                    start_date = new Date('20'+start_text[2], month(start_text[0])-1, start_text[1]);
                                    start_text = pad(start_text[1],2)+'-'+pad(month(start_text[0]),2)+'-20'+start_text[2];
                                } else if ( (gantt_date_format == "yy-MM-dd" || gantt_date_format == "yy-M-d" || gantt_date_format == "yy-MM-d" ||gantt_date_format == "yy-M-dd"  ) && start_text[0].length == 2 ) {
                                    start_date = new Date('20'+start_text[0], start_text[1], start_text[2]);
                                    start_text = pad(start_text[2],2)+'-'+pad(start_text[1],2)+'-20'+start_text[0];
                                } else if ( (gantt_date_format == "yyyy-MM-dd" || gantt_date_format == "yyyy-M-d" || gantt_date_format == "yyyy-MM-d" ||gantt_date_format == "yyyy-M-dd"  ) && start_text[0].length == 4 ) {
                                    start_date = new Date(start_text[0], start_text[1], start_text[2]);
                                    start_text = pad(start_text[2],2)+'-'+pad(start_text[1],2)+'-'+start_text[0];
                                }     
                                end_date = new Date(start_date);
                                end_text = kk2[0].split('-');
                                if (! array_equal(end_text, ['None']) && end_text.length == 3 ) {
                                        if ( (gantt_date_format == "dd-MM-yyyy" || gantt_date_format == "d-MM-yyyy" || gantt_date_format == "dd-M-yyyy" || gantt_date_format == "d-M-yyyy" ) && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], end_text[1], end_text[0]);
                                         } else if ( (gantt_date_format == "dd-MM-yy" || gantt_date_format == "d-MM-yy" || gantt_date_format == "dd-M-yy" || gantt_date_format == "d-M-yy" ) && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], end_text[1], end_text[0]);
                                         } else if ( (gantt_date_format == "dd-MMM-yy" || gantt_date_format == "d-MMM-yy" ) && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], month(end_text[1])-1, end_text[0]); 
                                         } else if ( (gantt_date_format == "dd-MMM-yyyy" || gantt_date_format == "d-MMM-yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], month(end_text[1])-1, end_text[0]);
                                         } else if ( (gantt_date_format == "MM-dd-yyyy" || gantt_date_format == "M-dd-yyyy" || gantt_date_format == "MM-d-yyyy"|| gantt_date_format == "M-d-yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], end_text[0], end_text[1]);
                                         } else if ( (gantt_date_format == "MM-dd-yy" || gantt_date_format == "M-dd-yy" || gantt_date_format == "MM-d-yy"|| gantt_date_format == "M-d-yy") && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], end_text[0], end_text[1]);
                                         } else if ( (gantt_date_format == "MMM-dd-yyyy" || gantt_date_format == "MMM-d-yyyy") && end_text[2].length == 4 ) {
                                            end_date =  new Date(end_text[2], month(end_text[0])-1, end_text[1]);
                                         } else if ( (gantt_date_format == "MMM-dd-yy" || gantt_date_format == "MMM-d-yy") && end_text[2].length == 2 ) {
                                            end_date =  new Date('20'+end_text[2], month(end_text[0])-1, end_text[1]);
                                         } else if ( (gantt_date_format == "yy-MM-dd" || gantt_date_format == "yy-M-d" || gantt_date_format == "yy-MM-d" ||gantt_date_format == "yy-M-dd"  ) && end_text[0].length == 2  ) {
                                            end_date =  new Date('20'+end_text[0], end_text[1], end_text[2]);
                                         } else if ( (gantt_date_format == "yyyy-MM-dd" || gantt_date_format == "yyyy-M-d" || gantt_date_format == "yyyy-MM-d" ||gantt_date_format == "yyyy-M-dd"  ) && end_text[0].length == 4  ) {
                                            end_date =  new Date(end_text[0], end_text[1], end_text[2]);
                                         }
                                }
                
				duration = Math.round((end_date - start_date)/(1000*60*60*24));
				if (duration <= 0) {
					duration = 10;
				}
				duration += 1; // magic number :)
				end_date = new Date(start_date);
				end_date.setDate(start_date.getDate() + duration);

				start_date_time = start_date.getTime();
				end_date_time = end_date.getTime();

				//progress = 0;
				if (start_date_time > now_time) {
					progress = 0;
				} else if (start_date_time <= now_time && end_date_time >= now_time) {
				//	console.log(title,start_text, start_date , duration , end_date);
				//}
				//	//progress = 0.5;
					progress = (now_time - start_date_time)/(end_date_time - start_date_time);
				} else {
					progress = 1;
				}

				//if (end_date_time > yesterday_time) {
					add = true;
				//}
			}
                        }
                
			if (add == true) { 
				//console.log(start_text, add, JSON.stringify({text:title, start_date:start_text, duration:duration, open:true, color:color, progress:progress, parent:owner}));
				if (owners_added.indexOf(owner) == -1) {
					//console.log(owner, owners);
					owners_added.push(owner);
					//odd = !odd;
					//data.push({id:owner, text:owner, odd:odd, owner:true, open: true});
					data.push({id:owner, text:owner, owner:true, open: true});
				}
				//data.push({text:title, odd:odd, start_date:start_text, duration:duration, open:true, color:color, progress:progress, parent:owner}); 
				data.push({text:key + " - " + title, start_date:start_text, duration:duration, open:true, color:color, progress:progress, parent:owner}); 
			}
		});

                
		gantt.config.row_height = 30;
		gantt.config.readonly = false;
		gantt.config.drag_links = true;
		gantt.config.drag_move = true;
                gantt.config.drag_progress = false;
                
                // default columns definition
                gantt.config.columns = [
                    {name:"text",       label:"",  width:"*", tree:true ,resize:true },
                    {name:"start_date", label:"Start date", align:"center" ,resize:true },
                    {name:"duration",   label:"Duration",   align:"center" ,resize:true }
                ];
                                
                gantt.attachEvent("onTaskDblClick", function(id, e) {
                    try  {
                    var task = gantt.getTask(id);
                    var text = task.text.split(" ")
                    window.open(AJS.contextPath() + "/browse/"+text[0], "_blank");
                    } catch ( e ) {}
                        
                });
                
                gantt.attachEvent("onAfterTaskDrag", function(id, mode, old_task){
                    var task = gantt.getTask(id);
                    alert(" [ALERT] In this version, the changes are NOT persistent!!");
                    return true;
                });
                
                //https://docs.dhtmlx.com/gantt/api__gantt_onscaleclick_event.html
                              
                var zoomConfig = {
		levels: [
			{
				name:"day",
				scale_height: 27,
				min_column_width:80,
				scales:[
					{unit: "day", step: 1, format: "%d %M"}
				]
			},
			{
				name:"week",
				scale_height: 50,
				min_column_width:50,
				scales:[
					{unit: "week", step: 1, format: function (date) {
						var dateToStr = gantt.date.date_to_str("%d %M");
						var endDate = gantt.date.add(date, -6, "day");
						var weekNum = gantt.date.date_to_str("%W")(date);
						return "#" + weekNum + ", " + dateToStr(date) + " - " + dateToStr(endDate);
					}},
					{unit: "day", step: 1, format: "%j %D"}
				]
			},
			{
				name:"month",
				scale_height: 50,
				min_column_width:120,
				scales:[
					{unit: "month", format: "%F, %Y"},
					{unit: "week", format: "Week #%W"}
				]
			},
			{
				name:"quarter",
				height: 50,
				min_column_width:90,
				scales:[
					{unit: "month", step: 1, format: "%M"},
					{
						unit: "quarter", step: 1, format: function (date) {
							var dateToStr = gantt.date.date_to_str("%M");
							var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
							return dateToStr(date) + " - " + dateToStr(endDate);
						}
					}
				]
			},
			{
				name:"year",
				scale_height: 50,
				min_column_width: 40,
				scales:[
					{unit: "year", format: "%Y"}
				]
			}
		]
                };

                gantt.ext.zoom.init(zoomConfig);
                gantt.ext.zoom.setLevel("month");
                gantt.ext.zoom.attachEvent("onAfterZoom", function(level, config){
                    document.querySelector(".gantt_radio[value='" +config.name+ "']").checked = true;
                })
                
                
		gantt.init('gantt_here'); 
		gantt.parse({data:data});
		$('.g4n77').remove();
		
		gantt.showDate(yesterday);
                
                

                var radios = document.getElementsByName("scale");
                for (var i = 0; i < radios.length; i++) {
		radios[i].onclick = function (event) {
			gantt.ext.zoom.setLevel(event.target.value);
		};
                }

		$('<button style="position:absolute;top:4ex;left:17ex">[NOW]</button>')
			.click(function(){
				gantt.showDate(yesterday);
			})
			.appendTo('div.g4n7t');
                $('<button style="position:absolute;top:4ex;left:25ex">[PRINT]</button>')
			.click(function(){
                                var originalContents = document.body.innerHTML;
                                window.document.getElementById("page").style.visibility = "hidden";
                                window.document.getElementById("ghx-detail-view").style.visibility = "hidden";
                                var divContents = window.document.getElementsByClassName("gantt_container")[0].innerHTML
                                document.innerHTML = divContents;
                                window.print();
                                document.innerHTML = originalContents;
                                window.document.getElementById("page").style.visibility = "visible";
                                window.document.getElementById("ghx-detail-view").style.visibility = "visible";
			})
			.appendTo('div.g4n7t');
                        
                var currFFZoom = 1;
                var currIEZoom = 100;
                $('<button style="position:absolute;top:4ex;left:7ex">[-]</button>')
			.click(function(){
				if (navigator.userAgent.search("Firefox")>-1){
                                    var step = 0.1;
                                    currFFZoom -= step;                 
                                    //$('html').css('-moz-transform','scale(' + currFFZoom + ')');
                                    $('.gantt_container').css('-moz-transform-origin','left top');
                                    $('.gantt_container').css('-moz-transform','scale(' + currFFZoom + ')');
                                } else {
                                    var step = 5;
                                    currIEZoom -= step;
                                    $('html').css('zoom', ' ' + currIEZoom + '%');
                                }
                                $(window).trigger('resize');
			})
			.appendTo('div.g4n7t');
                 $('<button style="position:absolute;top:4ex;left:12ex">[+]</button>')
			.click(function(){
				if (navigator.userAgent.search("Firefox")>-1){
                                    var step = 0.1;
                                    currFFZoom += step; 
                                    //$('html').css('-moz-transform','scale(' + currFFZoom + ')');
                                    $('.gantt_container').css('-moz-transform-origin','left top');
                                    $('.gantt_container').css('-moz-transform','scale(' + currFFZoom + ')');
                                } else {
                                    var step = 5;
                                    currIEZoom += step;
                                    $('html').css('zoom', ' ' + currIEZoom + '%');
                                }
                                $(window).trigger('resize');
			})
			.appendTo('div.g4n7t');
                
		$('<button style="position:absolute;top:4ex;left:1ex">[X]</button>')
			.click(function(){
				cleanup("g4n7t");
                                if (navigator.userAgent.search("Firefox")>-1){
                                    $('html').css('MozTransform','scale(1)');
                                } else {
                                    $('html').css('zoom', '100%');
                                }
                                $(window).trigger('resize');
			})
			.appendTo('div.g4n7t');

	});	
})();
