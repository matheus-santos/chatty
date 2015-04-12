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

var USER_LEFT    = 'User left the conversation',
    USER_ENTERED = 'User entered into conversation',
    users        = [],
    regex_user   = /\@(.*) /i;

io.on('connection', function(socket) {

    // User connected
    socket.on('new_connection', function(id) {

        console.log('New Connection');
        console.log('    User:    ' + id + ' connected');
        console.log('    Session: ' + socket.id + ' connected');

        io.emit('chat_message', 'User #' + id + ' connected..');
    
        // Assigning users
        users[id] = {
            id: id,
            socket_id: socket.id,
            socket: socket
        };
    });

    // User has disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected');
        io.emit('chat_message', USER_LEFT);
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