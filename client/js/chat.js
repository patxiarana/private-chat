const login = () => {
    let username = $('#login_name').val();
    let password = $('#login_pass').val();
    $.ajax({
        type: "POST",
        url: "http://localhost:3000/login",
        data: JSON.stringify( {"username": username, "password": password} ),
        success: function(resp) {
            if(resp.status) {
                $('#login').hide();
                $('#after-login').show();
                sessionStorage.setItem("user", JSON.stringify(resp.data));
                $('#me').html(`
                        <div class="me">
                            <img src="./img/jack.jpg" />
                            ${resp.data.user_name}
                         </div>
                         `);
                         socket.emit('loggedin', resp.data);
            }
        },
        dataType: "json",
        contentType: "application/json"
      });
}

const sendMyMessage = (chatWidowId, fromUser, message) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let meClass = loggedInUser.user_id == fromUser.user_id ? 'me' : '';

    $('#after-login').find(`#${chatWidowId} .body`).append(`
        <div class="chat-text ${meClass}">
            <div class="userPhoto">
                <img src="" />
            </div>
            <div>
                <span class="message">${message}<span>
            </div>
        </div>
    `);
}


const sendMessage = (room) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let message = $('#'+room).find('.messageText').val();
    $('#'+room).find('.messageText').val('');
    socket.emit('message', {room: room, message:message, from: loggedInUser});
    sendMyMessage(room, loggedInUser, message)
}
const openChatWindow = (room) => {
    if($(`#${room}`).length === 0 ) {
        $('#after-login').append(`
        <div class="chat-window" id="${room}">
            <div class="body"></div>
            <div class="footer">
                <input type="text" class="messageText"/><button onclick="sendMessage('${room}')">GO</button>
            </div>
        </div>
        `)
    }
}
const createRoom = (id) => {              ///// crea la sala mandando la informacion al socket del backend con el id del que hace la invitacion 
    console.log(id)
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'));
  //  let room = Math.ceil(Math.random()*31);
  let room = Date.now() + Math.random();
  room = room.toString().replace(".","_");
    socket.emit('create', {room: room, userId:loggedInUser.userId, withUserId:id});
    openChatWindow(room); /// manddo a open chat window el room con la informacion 'random'

}
socket.on('updateUserList', function(userList) {     //// Muestro la lista de usuarios con los que puedo armar un room 
    console.log(userList) 
    let loggedInUser = JSON.parse(sessionStorage.getItem('user')); 
    $('#user-list').html('<ul></ul>');
    userList.forEach(item => {
        if(loggedInUser.user_id != item.user_id){
            $('#user-list ul').append(`<li data-id="${item.user_id}" onclick="createRoom('${item.user_id}')">${item.user_name}</li>`)  
        }
    });

});

socket.on('invite', function(data) {
    socket.emit("joinRoom",data)
  //  console.log(data)
});
socket.on('message', function(msg) {
    //If chat window not opened with this roomId, open it
    if(!$('#after-login').find(`#${msg.room}`).length) {
        openChatWindow(msg.room)
    }
    console.log(msg)
    sendMyMessage(msg.room, msg.from, msg.message)
});