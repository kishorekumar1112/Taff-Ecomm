import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt'

const prisma = new PrismaClient();

const app = express()
app.use(bodyParser.json())
dotenv.config();

app.post('/login', async(req,res)=> {
    const {username, password} = req.body;
    const user  = await prisma.user.findUnique({
        where:{
            username:username
        }
    })
    if (user &&bcrypt.compareSync(password,user.password)){
        res.status(200).json({message: "Login successfully"})
    }else{
        res.status(401).json({message: "Invalid credentials!"})
    }
})

app.get('/admin/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const admin = await prisma.admin.findUnique({
            where: { id: parseInt(id) },
            select: {
                username: true,
            },
        });

        if (admin) {
            res.status(200).json(admin);
        } else {
            res.status(404).json({ message: "Admin not found" });
        }
    } catch (error) {
        console.error("Error fetching admin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


const PORT = process.env.PORT || 8001;
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})