var builder 	= require('botbuilder');
var restify 	= require('restify');
var sqlite3 	= require('sqlite3').verbose();
var luisdb 	= new sqlite3.Database('./luisAppDb.db','OPEN_READONLY');
var sentiment 	= require('sentiment');
var plotly 	= require('plotly')("ktPankajAcc", "dxLdeNCyIcBI1cBDnYoJ");
var fs 		= require('fs');
var base64Img 	= require('base64-img');

/*var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
*/

var connector = new builder.ChatConnector({
    appId: '8439e283-7b30-4afc-94b7-022441eb8747', 
    appPassword: 'RRvDX4a3j7eieMNBA5yMkKN'
});

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

//server.get(/.*/, restify.serveStatic({
//	'directory': '.',
//	'default': 'index.html'
//}));

//var recognizer = new builder.LuisRecognizer(process.env.MICROSOFT_LUIS_URL);

var recognizer = new builder.LuisRecognizer("https://southeastasia.api.cognitive.microsoft.com/luis/v2.0/apps/dd40fde3-bf03-4a96-862d-b2a40a5e0a67?subscription-key=44832825074a4e4faa3ada71ca3adc33&timezoneOffset=0&verbose=true&q=");

bot.recognizer(recognizer);

var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

bot.dialog('Greet', function (session,args) {
	var s1 = sentiment(session.message.text);
	if(s1.score < 0){
		session.sendTyping();
		setTimeout(function() { 
    			session.endDialog('You are not in mood of talking, please visit later.');
			},3000);
		}
	else{
		console.log(args.intent.score);
		session.sendTyping();
		setTimeout(function() {
			var userGreeted = builder.EntityRecognizer.findEntity(args.intent.entities, 'greetings');
			if (userGreeted != null){ 
				session.endDialog('hello there.');
			}else{
				session.endDialog('Sorry, I did not get it, please try again.');
				}
		},5000);
		}
	}).triggerAction({
    		matches: 'Greet'
});

bot.dialog('FarewellGreet', function (session) {
	var s2 = sentiment(session.message.text);
	if(s2.score < 0){
		session.sendTyping();
		setTimeout(function() {
    			session.endDialog('You are not in mood of talking, please visit later.');
			},3000);
		}
	else{
		session.sendTyping();
		setTimeout(function() {
			session.endDialog('well... i am happy that i meet your expectations.');
			},5000);
		}
	}).triggerAction({
    		matches: 'FarewellGreet'
});

bot.dialog('GreetQuestion', function (session) {
	var s3 = sentiment(session.message.text);
	if(s3.score < 0){
		session.sendTyping();
		setTimeout(function() {
    			session.endDialog('You are not in mood of talking, please visit later.');
			},3000);		
		}
	else{
		session.sendTyping();
		setTimeout(function() {
			session.endDialog('well...everything is going well and ready to assist you');
			},5000);
		}
	}).triggerAction({
    	matches: 'GreetQuestion'
});

bot.dialog('Help', function (session) {
	var s4 = sentiment(session.message.text);
	if(s4.score < 0){
		session.sendTyping();
		setTimeout(function() {
    			session.endDialog('You are not in mood of talking, please visit later.');
			},5000);		
		}
	else{
		session.sendTyping();
		setTimeout(function() {
    			session.endDialog('..Actually i am in learning mode, so be easy on me.Try with these sample queries.  \nget market share data.  \n lists the products we have in brazil.  \n get market share of gi upper in south africa  \n get auto dishwash market share.  \nget market share of great britain  \nget market share graphical view of south africa');
			},10000);			
		}
}).triggerAction({
    matches: 'Help'
});


bot.dialog('MarketShare', [function (session,args){
	var s5 = sentiment(session.message.text);
	if(s5.score < 0){
    		session.endDialog('You are not in mood of talking, please visit later.');
	}else{
		var countryName 	= '';
		var industryName	= '';
		var date 		= '';
		var countryEntity 	= builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.country');
		var industryEntity 	= builder.EntityRecognizer.findEntity(args.intent.entities, 'Product');			
		if(countryEntity && industryEntity){
			//.......industry entity and country entity both detected ..... continuing next step..
			countryName 	= countryEntity.entity;
			var recCntry 	= countryName.toUpperCase();
			var cntryArr = ['NETHERLANDS','RUSSIA','BRAZIL','GREAT BRITAIN','USA','SOUTH AFRICA','INDIA'].includes(recCntry);
			if(cntryArr == true){
				session.sendTyping();
				setTimeout(function() { 
				session.send('looking for this product in given country....');
					}, 3000);        	
						
				productName = industryEntity.entity;
				marketShareQueriesCountryProductWise(countryName,productName,date, function(dbresponse){
					session.sendTyping();
					setTimeout(function() { 
						session.endDialog(dbresponse);
						}, 8000);        		
				});
			}else{
				session.sendTyping();
				setTimeout(function() {
				session.endDialog('Sorry, requested Country Name is not in our list');
				}, 3000);
			}

		}else if(countryEntity){
			// country entity detected.... continuing next step.....
			countryName 	= countryEntity.entity;
			var recCntry 	= countryName.toUpperCase();
			var cntryArr = ['NETHERLANDS','RUSSIA','BRAZIL','GREAT BRITAIN','USA','SOUTH AFRICA','INDIA'].includes(recCntry);
			if(cntryArr == true){
				session.sendTyping();
				setTimeout(function() { 
				session.send('Let me look for this country in our list');
				}, 3000);
	
				marketShareQueriesCountryProductWise(countryName,industryName,date, function(dbresponse){
				session.sendTyping();
        			setTimeout(function() { 
					session.send(dbresponse)
					session.dialogData.country 	= countryName;
					session.sendTyping();
					setTimeout(function() {
						builder.Prompts.text(session,'Provide product name for more details or \'list all\' to get names');
						}, 3000);
					}, 8000);        
				});
			}else{
				session.sendTyping();
				setTimeout(function() {
				session.endDialog('Sorry, requested Country Name is not in our list');
				}, 3000);
			}
			

		}else if(industryEntity){
			// industry entity detected ..... continuing next step..
			session.sendTyping();
			setTimeout(function() { 
				session.send('Let me look for this product in our listed countries');
				}, 3000); 
			productName = industryEntity.entity;
			getCountryNamesFromProductDetails(productName, function(callback){
				session.sendTyping();
				setTimeout(function() { 
					session.endDialog(callback);
				}, 8000);        		
			});
	
		}else{
		// no entry detected, ask user for country.....
			session.sendTyping();
			setTimeout(function() { 
				builder.Prompts.text(session,'Please provide country name for which you are asking market share.');
				}, 5000);
			}
		}
	},	
	function(session,results){
		var s4 = sentiment(session.message.text);
		if(s4.score < 0){
    			session.endDialog('You are not in mood of talking, please visit later.');
		}else{
			if (results.response != true){
				if (session.dialogData.country == null){
					session.dialogData.country 	= results.response;
      					var recCntry 			= session.dialogData.country.toUpperCase();
					var cntryArr = ['NETHERLANDS','RUSSIA','BRAZIL','GREAT BRITAIN','USA','SOUTH AFRICA','INDIA'].includes(recCntry);
					if(cntryArr == true){
						session.sendTyping();
						setTimeout(function() { 
							session.send('looking for this country in our list');
							session.sendTyping();
							setTimeout(function() {
								builder.Prompts.text(session,'Please provide product name, or list all');
							},5000);
						}, 3000);
					}else{
						session.endDialog('Sorry, as per our record there is no data for requested');
						}	
				}else{
					datee = '';
					if(results.response == 'list all' || results.response == 'list them' || results.response == 'get names'){
	 					getProductNamesFromCountryDetails(session.dialogData.country,function(dbresponse){
							session.sendTyping();
							setTimeout(function() {
								session.endDialog(dbresponse);
								},10000);
							});
					}else{					
						marketShareQueriesCountryProductWise(session.dialogData.country,results.response,datee, function(dbresponse){
						session.sendTyping();
						setTimeout(function() {         		
							session.endDialog(dbresponse);
								},5000);
							});
						}
					}
			}else{
				session.endDialog('Sorry, requested data is not valid');
			}
		}
	},
	function(session,results){
		var s4 = sentiment(session.message.text);
		if(s4.score < 0){
    			session.endDialog('You are not in mood of talking, please visit later.');
		}else{
			if (results.response != true){
				var cntryName 	= session.dialogData.country;
				var indusName	= results.response;
				var datee 	= '';
				session.sendTyping();
				if(indusName == 'list all' || indusName == 'all' || indusName == 'get all'){
					indusName = '';
					marketShareQueriesCountryProductWise(cntryName,indusName,datee, function(dbresponse){
						session.sendTyping();
        					setTimeout(function() { 
							session.endDialog(dbresponse);
						}, 8000);
					});
				}else{       
					marketShareQueriesCountryProductWise(cntryName, indusName, datee, function(dbresponse){
					session.sendTyping();
					setTimeout(function() {         		
						session.endDialog(dbresponse);
					},5000);
					});
				}
			}else{
				session.endDialog('Sorry, requested data is not valid');
			}
		}
	}	       
]).triggerAction({
    	matches: 'MarketShare',
	onInterrupted : function(session){
		session.endDialog('Please start from the begining');
	}
});


bot.dialog('ProductList', [function (session,args) {
	var s4 = sentiment(session.message.text);
	if(s4.score < 0){
    		session.endDialog('You are not in mood of talking, please visit later.');
	}else{
		var countryEntity 	= builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.country');
		if(countryEntity){
			countryName 		= countryEntity.entity;
			var recCntry 		= countryName.toUpperCase();
			var cntryArr = ['NETHERLANDS','RUSSIA','BRAZIL','GREAT BRITAIN','USA','SOUTH AFRICA','INDIA'].includes(recCntry);
			if(cntryArr == true){
				session.sendTyping();
				setTimeout(function() {
				session.send('getting the list of products in requested country');
					}, 3000);
				getProductNamesFromCountryDetails(countryName,function(dbresponse){
				session.sendTyping();
				setTimeout(function() {
					session.endDialog(dbresponse);
					},10000);
				});
			}else{
				session.endDialog('Sorry, there is no record for requested country');
				}
		}else{
			session.sendTyping();
			setTimeout(function() { 
				session.endDialog('Kindly provide country name in query, and try again');
				}, 5000);
			}
		}		
	}
]).triggerAction({
    matches: 'ProductList'
});


bot.dialog('shareMarketGraph', [function (session,args) {
	var s2 = sentiment(session.message.text);
	if(s2.score < 0){
		session.sendTyping();
		setTimeout(function() {
    			session.endDialog('You are not in mood of talking, please visit later.');
			},3000);		
		}
	else{
		var countryEntity 	= builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.country');
		if(countryEntity){
		// country entity detected..... continuing next step..
			countryName 		= countryEntity.entity;
			var recCntry 		= countryName.toUpperCase();
			var cntryArr = ['NETHERLANDS','RUSSIA','BRAZIL','GREAT BRITAIN','USA','SOUTH AFRICA','INDIA'].includes(recCntry);
			if(cntryArr == true){
				genMarketShareGraph(countryName);
				session.sendTyping();
				setTimeout(function() { 
					session.send('getting products market share graph for requested country...');
					}, 5000);
				session.sendTyping();
				setTimeout(function() {
					var data	= base64Img.base64Sync('countryMarketShare.png');
					var msg 	= new builder.Message(session);
					msg.attachments([
						new builder.HeroCard(session)
        					.title('Market share Graph')
        					.subtitle("Country : "+ countryName)
        					.text("Product : All Products")
        					.images([builder.CardImage.create(session,data)])
        					.buttons([builder.CardAction.openUrl(session, 'https://google.com', 'Enlarge view')])
						]);
					session.send(msg);

				}, 10000);
			}else{
				session.sendTyping();
				setTimeout(function() { 
				session.endDialog('Provided Country is not in our list.');
				}, 5000);
			}
            	}else{
			session.sendTyping();
			setTimeout(function() { 
				session.endDialog('Kindly provide country name in query, and try again...');
				}, 5000);
			}
		}
	}
]).triggerAction({
    	matches: 'shareMarketGraph'
});


//.....Created DB with table and required schema.......
function createDatabase(){
	luisdb.serialize(function() {
		luisdb.run("CREATE TABLE if not exists company_share (Country TEXT,Date DATE,Category TEXT,Total NUMBER,RB_Market NUMBER,Market_Share NUMBER)");
	});
 	luisdb.close();
}

//.....Function returns market share queries and respected Data......

function marketShareQueriesCountryProductWise(countryName,industryType,date,callback){
	if (countryName != null && industryType == ''){
		//...........only when country name is provied in query.........
		var country = "'"+countryName.toUpperCase()+"'";
luisdb.each("SELECT count(distinct(Category)) AS cat,SUM(Total) as tot,SUM(RB_Market) as rb_mar,round(SUM(Market_Share),3) as mar_sh  FROM company_share WHERE Country = "+country, function(err, row){
		if (err){
			callback(err)
			}
		else{
			var IndustryCount 	= row.cat;
			var Total 		= row.tot;	
			var MarketRevenue 	= row.rb_mar;
			var TotalShare 		= row.mar_sh;
			callback('Found '+IndustryCount+ ' products with market share of '+TotalShare+', Total : '+Total+' and RB_Market : $'+MarketRevenue);
			}
  		});
		}
	else if(countryName != '' && industryType != ''){
		//.......when both country name and product name is provied in query........
		var country = "'"+countryName.toUpperCase()+"'";
		var industry = "'"+industryType.toUpperCase()+"'";
		luisdb.each("SELECT SUM(Total) as tot,SUM(RB_Market) as rb_mar,round(SUM(Market_Share),3) as mar_sh  FROM company_share WHERE Country = "+country+ 'AND Category ='+industry, function(err, row) {
		if (err){
      			callback(err);
			}
		else{
			var Total 		= row.tot;	
			var MarketRevenue 	= row.rb_mar;
			var TotalShare 		= row.mar_sh;
			if (Total == null && MarketRevenue == null){
				callback('Sorry requested product is not in mentioned country.');
			}else{
				callback(industryType+' has market share of '+TotalShare+', Total : '+Total+' and RB_Market : $'+MarketRevenue+' in '+countryName);
			}
			}
  		});
		}
		//luisdb.close();
}

function getProductNamesFromCountryDetails(countryName,callback){
	//.....returns list of products in requested country........
	var country 	= "'"+countryName.toUpperCase()+"'";
	luisdb.all("SELECT distinct(Category) AS cat FROM company_share WHERE Country = "+country, function(err, row){
		if (err){
			callback(err);
		}else{
			var catArr 	= [];
			for (var i = 0; i < row.length; i++){catArr.push(row[i].cat);}
			callback('We have these following products in '+country+'  \n'+catArr);
			}
  	});
}

function getCountryNamesFromProductDetails(productName,callback){
	//.......returns list of country names for requested product name........
	var productName = "'"+productName.toUpperCase()+"'";
	luisdb.all("SELECT distinct(Country) AS con FROM company_share WHERE Category = "+productName, function(err, row){
	if (err){
		callback(err);
	}
	else{
			var cntArr 	= [];
			for (var i = 0; i < row.length; i++){cntArr.push(row[i].con);}
			callback('we have '+productName+' in following countries :  \n'+cntArr);
			}
  		});
}

function genMarketShareGraph(countryName){
	//....generates graph of market share product wise in requested country from plotly service , download and saves file locally........
	var country 	= "'"+countryName.toUpperCase()+"'";
	luisdb.all("select category, sum(Market_Share) as Share from company_share where Country = "+country+" group by category", function(err, row){
	if (err){
		callback(err);
	}else{
		var catArr 	= [];
		var msArr 	= [];
		for (var i = 0; i < row.length; i++){catArr.push(row[i].Category);msArr.push(row[i].Share);}
		var trace 	= {x:catArr,y:msArr,type:'bar'};
		var layout 	= { title: 'Market Share Details' };
		var chart 	= { 'data': [trace], 'layout':layout };
		var pngOptions 	= { format: 'png', width: 1000, height: 500 };
		plotly.getImage(chart, pngOptions, function (err, imageData) {
			if (err) throw err;
			var pngStream = fs.createWriteStream('countryMarketShare.png');
			imageData.pipe(pngStream);
			});
		}
	});
}



				

