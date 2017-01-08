// modules
var express = require('express');
var http = require('http');
var morgan = require('morgan');
var fs = require('fs');
var https = require('https');
var Promise = require('bluebird');
var stream = require('stream');
var streamBuffers = require('stream-buffers');

var fc_api_key = process.env.FC_API_KEY, 
    fc_api_secret = process.env.FC_API_SECRET;

var port = process.env.PORT;

var unirest = require('unirest');

function up(bufferStream){
	return new Promise(function(resolve,reject){
		//var b = new streamBuffers.ReadableStreamBuffer({frequency: 1000,chunkSize: 2048 * 100});
		//b.put(bufferStream);
		resolve(bufferStream);
	        //console.log(bufferStream.toString('base64'));
		/*
		unirest.post(`https://face.p.mashape.com/faces/detect?api_key=${fc_api_key}&api_secret=${fc_api_secret}`)
		.header("X-Mashape-Key", "irfv2VV3RlmshLPBR359Rm7bN7gsp1qo0jejsnBy7k9gHVoQ6c")
		.field("attributes", "all")
		.field("detector", "Aggressive")
		.attach("files", rb(bufferStream))
		.end(resolve);
		*/
		//.error(reject);
	});
}

var privateKey  = fs.readFileSync('/etc/ssl/private/new.ssl.key', 'utf8');
var certificate = fs.readFileSync('/etc/ssl/certs/new.ssl.cert', 'utf8');

var credentials = {key: privateKey, cert: certificate};

// app parameters
var app = express();
app.use(express.static(__dirname + '/client'));
app.use(morgan('dev'));

// HTTP server
//var server = http.createServer(app);
//server.listen(port, function () {
//  console.log('HTTP server listening on port ' + port);
//});

// HTTPS server
var https_port = process.env.HTTPS_PORT || 443;
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(https_port, function(){
	console.log('HTTPS server listening on port ' + https_port );
});

// WebSocket server
var io = require('socket.io')(httpsServer);

//io.listen(httpsServer);

io.on('connection', function(socket) {
	console.log("connected");
	socket.on('frame', function(socket){
		console.log('emit frame');
	});
	socket.on('blob:video', function(data){
		fs.writeFileSync('client/temp.webm', data);
		console.log("webm saved");				
	});
	socket.on('image', function(data){
		var t = new Buffer(data, 'base64');
		//var bufferStream = new stream.PassThrough();
		//bufferStream.end(new Buffer(data, 'base64'));
		//fs.writeFile('client/temp.jpg', t);
		up(t).then(function(result){
			//socket.emit('result', result.body);
			socket.emit('backward', result.toString('base64'));
		});
		console.log("webp saved");
	});
	socket.on('message', function(data){
		console.log(data);
	});
});
