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

        console.log('New Connection');
        console.log('    User:    ' + id + ' connected');
        console.log('    Session: ' + socket.id + ' connected');

        // Updating client's online users list
        io.emit('add_user_to_list', id);
        online_users.push(id);
        socket.emit('online_users', online_users);

        // Alerting them all that a new user entered
        io.emit('chat_message', 'User #' + id + ' connected..');
    
        // Assigning users
        users[id] = {
            id: id,
            socket_id: socket.id,
            socket: socket
        };

        // Inverted index
        sockets[socket] = id;
    });

    // User has disconnected
    socket.on('disconnect', function() {

        // Removing from list
        var user_id = sockets[socket];
        io.emit('remove_user_from_list', user_id);

        // Removing user's references
        users   = users.slice(user_id, 1);
        sockets = sockets.slice(socket, 1);

        for (var i = online_users.length - 1; i >= 0; i--) {
            if (online_users[i] == user_id) {
                online_users = online_users.slice(i, 1);
                break;
            }
        };

        // Alerting that the user has left the conversation
        console.log('user disconnected');
        io.emit('chat_message', 'User #' + user_id + ' left the conversation');
    });

    // Message received
    socket.on('chat_message', function(bundle) {

        console.log('----------------');
        console.log('id:      ' + bundle.id);
        console.log('message: ' + bundle.message);

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
});

/**
 * Listening to port 3000 (nodejs)
 * @param  int Port to listen
 * @return null
 */
http.listen(3000, function(){
    console.log('listening on *:3000');
});