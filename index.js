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

const getSocketByUserId = (userId) =>{
    let socket = '';
    for(let i = 0; i<clientSocketIds.length; i++) {
        if(clientSocketIds[i].userId == userId) {
            socket = clientSocketIds[i].socket;
            break;
        }
    }
    return socket;
}
let clientSocketIds = [];
let connectedUsers= [];
/* socket function starts */
io.on ('connection', socket => {
    console.log('conected')
    console.log(socket.id)
    socket.on('disconnect', () => {
        console.log("disconnected")
       connectedUsers = connectedUsers.filter(item => item.socketId != socket.id);
       console.log(connectedUsers)
       io.emit('updateUserList', connectedUsers)
    });

    socket.on('loggedin', async function(user) {
        clientSocketIds.push({socket: socket, userId:  user.user_id});
        const [rows] = await pool.query("SELECT * FROM users");
        io.emit('updateUserList', rows)
    }); 

    socket.on('create', async  function(data) {
        console.log("create room")
  //   const [rows] = await pool.query('INSERT INTO room (id_room) VALUES (?)', [data.room])
        console.log(data)
        socket.join(data.room);
        let withSocket = getSocketByUserId(data.withUserId);
        socket.broadcast.to(withSocket.id).emit("invite",{room:data})
    });
    socket.on('joinRoom', function(data) {
        console.log(data.room.room)
        socket.join(data.room.room);
    });

    socket.on('message', function(data) {
       // console.log(data.message, data.from.user_name)
        socket.broadcast.to(data.room).emit('message', data);
    })
});
/* socket function ends */

















app.use(cors())

server.listen(3000, function() {
    console.log("server started")
});