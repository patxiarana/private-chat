import  express  from "express";
import indexRoute from "./src/routes/routes.js"
import { Server as SocketServer} from 'socket.io'
import http from 'http'
import cors from 'cors'
import {dirname, join} from 'path'
import { fileURLToPath } from 'url'
import { pool } from "./src/db.js";


const app = express()
app.use(express.json())
app.use(indexRoute)
app.use(express.static('client'));
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use('/node_modules', express.static(join(__dirname, 'node_modules', )));
console.log(__dirname)
const server = http.createServer(app)
const io = new SocketServer(server, {
    cors: {
        origin: 'http://localhost:3000',
    }
})
///* busco al cliente por el id de socket */
const getSocketByUserId = (userId) =>{
    let socket = '';
    for(let i = 0; i<clientSocketIds.length; i++) {
        if(clientSocketIds[i].userId == userId) {
            socket = clientSocketIds[i].socket;
            break;
        }
    }
   return  socket ;
}
let clientSocketIds = [];
let connectedUsers= [];


/* funcion para buscar si un room ya fue creado */

const searchRoom = (rooms) => {
    
    const Searching = rooms.reduce((acc, room) => {
        acc[room.room_id_room] = ++acc[room.room_id_room] || 0;
        return acc;
      }, {});
      
      const duplicate = rooms.filter( (room) => {
          return Searching[room.room_id_room];
      });
      
      return duplicate ;
}


/* socket function starts */
io.on ('connection', socket => {
    console.log('conected')
   // console.log(socket.id)
    socket.on('disconnect', () => {
        console.log("disconnected")
       connectedUsers = connectedUsers.filter(item => item.socketId != socket.id);
     //  console.log(connectedUsers)
       io.emit('updateUserList', connectedUsers)
    });

    socket.on('loggedin', async function(user) {
        clientSocketIds.push({socket: socket, userId:  user.user_id});
        const [rows] = await pool.query("SELECT * FROM users");
        io.emit('updateUserList', rows)
    }); 



    socket.on('create', async  function(data) {
     console.log(data)
     console.log("create room")
     const [allreadyCreate] = await pool.query("SELECT * FROM room_has_users")
     console.log(allreadyCreate)
     const usersRooms =  allreadyCreate.filter(item => item. users_user_id == data.withUserId  || item.users_user_id == data.userId  )
     const [rooms] = await pool.query("SELECT * FROM room");
     // console.log(rooms)
     const Primarykey = rooms.filter( item => item.id_room == data.room) 

     console.log(usersRooms ,'soy users room')
     const roomSearch = searchRoom(usersRooms)
     if( roomSearch.length > 1 ) {
            data.room = roomSearch[0].room_id_room
     } else if (Primarykey.length == 1){ 
      const Auxid = Math.random() * 1001000 ;    //// me aseguro que el id no se repetia antes de crear el room ---
      await pool.query('INSERT INTO room (id_room) VALUES (?)', [Auxid]) 
      await pool.query('INSERT INTO room_has_users (room_id_room, users_user_id ) VALUES (?, ? )', [Auxid, data.withUserId])  
      await pool.query('INSERT INTO room_has_users (room_id_room, users_user_id ) VALUES (?, ? )', [Auxid, data.userId])  ///////         <---- 
      data.room = Auxid;
    } else {
    await pool.query('INSERT INTO room (id_room) VALUES (?)', [data.room])    
    await pool.query('INSERT INTO room_has_users (room_id_room, users_user_id ) VALUES (?, ? )', [data.room, data.withUserId])
    await pool.query('INSERT INTO room_has_users (room_id_room, users_user_id ) VALUES (?, ? )', [data.room, data.userId])
    }
    socket.emit('roomdb', data.room)
    socket.join(data.room.toString().replace(".","_"));
    let withSocket = getSocketByUserId(data.withUserId);
    socket.broadcast.to(withSocket.id).emit("invite",{room:data})
    //  console.log(data)
    });




    socket.on('joinRoom', function(data) {
     //   console.log(data.room.room)
        socket.join(data.room.room.toString().replace(".","_"));
    });

    socket.on('message', async function(data) {
    let id = Math.ceil(Math.random()*111);
     await pool.query('INSERT INTO messages (id, id_user, id_room, message) VALUES (?,?,?,? )', [id, data.from.user_id, Number(data.room), data.message])
    const [messages] = await pool.query('SELECT * FROM messages WHERE id_user = ? AND id_room = ?', [data.from.user_id, Number(data.room)])
    console.log(messages, 'soy messages')   
    socket.broadcast.to(data.room).emit('message',data);
    })

});
/* socket function ends */

















app.use(cors())

server.listen(3000, function() {
    console.log("server started")
});