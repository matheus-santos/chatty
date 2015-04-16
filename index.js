/**
 * @author : Matheus Cesario <mts.cesario@gmail.com>
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/**
 * Requirejs: routing page
 * @param  String uri   Http uri request
 * @param  String req   Requisition from client
 * @param  String res   Response to client
 * @return null
 */
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

/**
 * Socket.io
 * @param  string Event
 * @return null
 */

var users        = [], // Keeping user's sockets references
    sockets      = [], // Inverted list to find users from their sockets
    regex_user   = /\@(.*) /i,
    online_users = [];

io.on('connection', function(socket) {

    // User connected
    socket.on('new_connection', function(id) {

        // Updating client's online users list
        online_users.push(id);
        io.emit('online_users', online_users);

        // Alerting them all that a new user entered
        io.emit('chat_message', 'User #' + id + ' connected..');
    
        // Assigning users
        users[id] = {
            id: id,
            socket_id: socket.id,
            socket: socket
        };

        // Inverted index
        sockets[socket.id] = id;

        // Displaying online users list
        console.log('online_users = ');
        console.log(online_users);
    });

    // User has disconnected
    socket.on('disconnect', function() {

        console.log('Removing ', sockets[socket.id]);

        // Removing from list
        var user_id = sockets[socket.id];
        var index   = online_users.indexOf(user_id);

        // Removing user's references
        users.splice(user_id, 1);
        sockets.splice(socket.id, 1);
        
        if (index > -1) {
            online_users.splice(index, 1);
        }

        // Broadcasting signal indicating to remove user from list
        io.emit('remove_user_from_list', user_id);

        // Alerting that the user has left the conversation
        io.emit('chat_message', 'User #' + user_id + ' left the conversation');

        // Displaying online users list
        console.log('online_users = ');
        console.log(online_users);
    });

    // Message received
    socket.on('chat_message', function(bundle) {

        // Message
        console.log(bundle.id + ' said: ' + bundle.message);

        // Message
        var message = 'User #' + bundle.id + ' said: ' + bundle.message;

        // Built-in commands
        var user = bundle.message.match(regex_user);

        // Emitting private message
        if (user !== null) {
            if (user[1] && typeof users[ user[1] ] !== 'undefined') {
                var user_socket = users[ user[1] ].socket;

                if (typeof user_socket !== 'undefined') {
                    user_socket.emit('private_message', message);
                    return true;
                }
            }
        }

        // io.emit('chat_message', 'User #' + bundle.id + ' said: ' + bundle.message);
        socket.broadcast.emit('chat_message', message);

        return true;
    });

    // User is typping
    socket.on('user_typing', function(is_typing) {

        // Sending to all clients except sender
        socket.broadcast.emit('user_typing', is_typing);
    });
});

/**
 * Listening to port 3000 (nodejs)
 * @param  int Port to listen
 * @return null
 */
http.listen(3000, function(){
    console.log('listening on *:3000');
});