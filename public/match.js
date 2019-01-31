// GAME
var board,
  game = new Chess(),
  statusEl = $('#status'),
  fenEl = $('#fen'),
  pgnEl = $('#pgn');




// SOCKET
var socket;
const user = document.getElementById("navbarDropdownMenuLink").text
const room = new URL(document.location).searchParams.get('code')

// io(NOTHING) => Intenta connectar-se al host de la pàgina
$(function () {
  socket = io();

  $('#message_form').submit((e) => {
    e.preventDefault(); // prevents page reloading

    const message = {
      user: user,
      text: $('#text').val()
    }

    socket.emit('chat message', message);
    $('#text').val('');
    return false;
  });

  socket.on('chat message', (msg) => {
    const message = '<li><b>' + '(' + 
                    (((new Date().getUTCHours() + 1) <= 9) ? ('0' + (new Date().getUTCHours() + 1)) : (new Date().getUTCHours() + 1)) +
                    ':' + ((new Date().getUTCMinutes() <= 9) ? ('0' + (new Date().getUTCMinutes())) : (new Date().getUTCMinutes())) + 
                    ':' + ((new Date().getUTCSeconds() <= 9) ? ('0' + (new Date().getUTCSeconds())) : (new Date().getUTCSeconds())) + 
                    ') ' + msg.user + ": " + '</b>' + msg.text
    
    var $last = $('#messages').append(message);
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
  });

  socket.on('handshaking', (msg) => {
    const message = {
      user: user,
      id: 'undefined',
      room: room,
      white: 'undefined',
      game_state: 'undefined',
      spectator: 'undefined'
    };

    socket.client_info = message;

    // ID inside socket.client_info
    socket.emit('my id?', message.user)


  });

  socket.on('your id', (id) => {
    socket.client_info.id = id

    // SPECTATOR/WHITE/BLACK
    socket.emit('what am I', { room: socket.client_info.room, user_id: socket.client_info.id })
  })

  socket.on('you are white', () => {
    console.log('you are white')
    socket.client_info.white = true
    socket.client_info.spectator = false

    socket.emit('handshaking', socket.client_info);
  })

  socket.on('you are black', () => {
    console.log('you are black')
    socket.client_info.white = false
    socket.client_info.spectator = false

    socket.emit('handshaking', socket.client_info);
  })

  socket.on('you are spectator', () => {
    console.log('you are spectator')
    socket.client_info.white = "whatever"
    socket.client_info.spectator = true

    socket.emit('handshaking', socket.client_info);
  })

  socket.on('handshaking fen', (game_state) => {
    var cfg = {
      draggable: true,
      position: game_state,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    };

    board = ChessBoard('board', cfg);

    socket.client_info.game_state = game_state

    game.load(game_state)
    board.position(game.fen())
  })

  /*socket.on('disconnect', (msg) => {
    if (msg == socket.client_info.room) {
      // Guardar estat de la partida
      socket.emit('disconnect game state', game.fen());
    }
  });*/

  socket.on('move', (msg) => {
    if (msg.room == socket.client_info.room) {
      console.log("Msg: " + msg.game_state)
      game.load(msg.game_state);
      console.log("Game: " + game.fen())
      board.position(game.fen())
    }
  });

  // GAME

  // do not pick up pieces if the game is over
  // only pick up pieces for the side to move
  var onDragStart = function (source, piece, position, orientation) {
    if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
      (game.turn() === 'w' && !socket.client_info.white) ||
      (game.turn() === 'b' && socket.client_info.white) ||
      (socket.client_info.spectator)) {
      return false;
    }
  };

  var onDrop = function (source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    updateStatus();

    // SOCKET
    socket.client_info.game_state = game.fen()
    socket.emit('move', game.fen())
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function () {
    board.position(game.fen());
  };

  var updateStatus = function () {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
      moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
      status = 'Game over, drawn position';
    }

    // game still on
    else {
      status = moveColor + ' to move';

      // check?
      if (game.in_check() === true) {
        status += ', ' + moveColor + ' is in check';
      }
    }

    statusEl.html(status);
    fenEl.html(game.fen());
    pgnEl.html(game.pgn());
  };

  updateStatus();
});
