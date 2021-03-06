// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	app.get('/', function(req, res){

		// Render views/home.html
		res.render('home');
	});

	app.get('/create', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/'+id);
	});

	app.get('/chat/:id', function(req,res){

		// Render the chant.html view
		res.render('chat');
	});

	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {

		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room

		socket.on('load',function(data){

			var room = findClientsSocket(io,data.room_id);
			if(room.length === 0 ) {

				socket.emit('peopleinchat', {number: 0});
			}
			else if(room.length === 1) {

				socket.emit('peopleinchat', {
					number: 1,
					user: room[0].username,
					id: data.room_id
				});
			}
			else if(room.length >= 2) {

				chat.emit('tooMany', {boolean: true});
			}
			
			console.log("conectado. room_id:"+data.room_id);
		});

		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.room_id);
			// Only two people per room are allowed
			if (room.length < 2) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object

				socket.username = data.user;
				socket.room = data.room_id;

				// Tell the person what he should use for an avatar
				//socket.emit('img', socket.avatar);


				// Add the client to the room
				socket.join(data.room_id);
				console.log("Login:"+data.user);

				if (room.length == 1) {

					var usernames = [],
						avatars = [];

					usernames.push(room[0].username);
					usernames.push(socket.username);


					// Send the startChat event to all the people in the
					// room, along with a list of people that are in it.

					chat.in(data.room_id).emit('startChat', {
						boolean: true,
						room_id: data.room_id,
						users: usernames
					});
					
					chat.in(data.room_id).emit('startGame', {
						first_player_id: true,
						room_id: data.room_id,
						jogador_1_nome: room[0].username,
						jogador_2_nome: socket.username
					});
				}
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			// Notify the other person in the chat room
			// that his partner has left

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username,
				avatar: this.avatar
			});

			// leave the room
			socket.leave(socket.room);
			
			
			
			console.log("User "+this.username+" Saiu.");
		});


		// Handle the sending of messages
		socket.on('msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(data.room_id).emit('msg', {texto: data.texto});
			console.log(data.room_id+" "+data.texto);
		});
		
		
		socket.on('escrevendo_msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(data.room_id).emit('escrevendo_msg', {texto: ""});
			//console.log(data.room_id+" "+data.texto);
		});
		
		
		
		socket.on('destribuir_pedras_oponente', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(data.room_id).emit('destribuir_pedras_oponente', {cova: data.cova});
			//console.log(data.room_id+" Room destribuir pedras");
		});
		
		
		socket.on('enviar_retirar_opositor_cova_dados', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(data.room_id).emit('receber_retirar_opositor_cova_dados', {cova: data.cova});
		});
		
		
		//
		socket.on('enviar_jogada', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receber_jogada', {cova: data.cova, jogador_id: data.jogador_id});
		});
		
	
		
		

        socket.on('iniciar_jogo', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('iniciar_jogo', {cova: ''});
		});		
		
		
		socket.on('novo_jogo', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('solicitacao_de_novo_jogo', {jogador_id: data.jogador_id});
		});
		
		
		socket.on('novo_jogo_aceite', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('novo_jogo_aceite', {cova: ''});
		});		
		
		
		
		
		
	});
};

function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}


