import { pool } from "../db.js";


export const login = async (req, res) =>{
    try {
 //   console.log(req.body)
 const [rows] = await pool.query("SELECT user_id, user_name, user_image from users WHERE user_name = ? AND user_password = ?", [req.body.username, req.body.password]  )
 //console.log(rows) 
 if(rows.length === 1) {
            res.send({status:true, data: rows[0]})
        } else {
            res.send({status:false})
        } 
    } catch (error) {
        console.log(error)
      }
    }

    /*

    export const GetUsers = async (req, res) => {
        try {
           const {id} = req.params 
           console.log(id)
           const [rows] = await pool.query("SELECT * FROM users");
           res.json(rows);
         } catch (error) {
          // return res.status(500).json({ message: "Something goes wrong" });
          console.log(error)
     }
    } */