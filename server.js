// = Requirements ================================================================
	var express = require('express');
	var app = express();
	var bodyParser = require('body-parser');
	var logger = require('morgan');
	var mongoose = require('mongoose');
	var request = require('request');
	var cheerio = require('cheerio');

	var Port = process.env.port || 3000

// = Middleware (pass everything through the logger first) ================================================
	app.use(logger('dev'));
	app.use(bodyParser.urlencoded({
		extended: false
	}));
	app.use(express.static('public')); // (create a public folder and land there)

// =================== Database configuration ================================================
	mongoose.connect('mongodb://localhost/mongoosescraper');
	var db = mongoose.connection;

	db.on('error', function (err) {
		console.log('Mongoose Error: ', err);
	});
	db.once('open', function () {
		console.log('Mongoose connection successful.');
	});

// =================== Require Schemas ================================================================
	var Note = require('./models/Note.js');
	var Article = require('./models/Article.js');

// =================== Routes ================================================================
	app.get('/', function(req, res) {
	  res.send(index.html); // sending the html file rather than rendering a handlebars file
	});

app.get('/scrape', function(req, res) {
  request('https://www.baltimoresun.com/', function(error, response, html) {
    var $ = cheerio.load(html);
    $('ul.trb_outfit_group_list').each(function(i, element) {

				var result = {};

				result.title = $(this).children('li').children('a').children('img').attr('title');
				result.link = $(this).children('li').children('a').attr('href');
			console.log(result);
				var entry = new Article (result);

				entry.save(function(err, doc) {
				  if (err) {
				    console.log(err);
				  } else {
				    console.log(doc);
				  }
				});


    });
  });
  res.send("Scrape Complete");
});


app.get('/articles', function(req, res){
	//console.log('articles')
	Article.find({}, function(err, doc){
		if (err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});



app.get('/articles/:id', function(req, res){
	Article.findOne({'_id': req.params.id})
	.populate('note')
	.exec(function(err, doc){
		if (err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});


app.post('/article/:id', function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(err, doc){
		if(err){
			console.log(err);
		} else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			.exec(function(err, doc){
				if (err){
					console.log(err);
				} else {
					res.send(doc);
				}
			});

		}
	});
});




//if deployed use database otherwise locoal mongo
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsdb";

mongoose.connect(MONGODB_URI, function (error) {
 if (error) {
   console.log(error);
 } else {
   console.log("mongoose connection success")
 }
});




// app.listen(3008, function() {
//   console.log('App running on port 3008!');
// });
Start the server
app.listen(PORT, function () {
	console.log("App running on port " + PORT + "!");
 });