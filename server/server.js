import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser"


dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const isBeforeBirthday = (today.getMonth() < birthDate.getMonth()) ||
                           (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  
  if (isBeforeBirthday) {
    age--;
  }

  return age;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', 
  port: 587,
  secure: false, 
  auth: {
    user:  process.env.EMAIL, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});


async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL, 
      to, 
      subject, 
      text,    
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


const otpStore = {};


function generateOtp() {
  return crypto.randomBytes(3).toString('hex'); 
}



app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = generateOtp();
  otpStore[email] = otp;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


app.post('/validate-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedOtp = otpStore[email];
  if (storedOtp && storedOtp === otp) {
    delete otpStore[email]; 
    return res.status(200).json({ valid: true });
  }

  res.status(400).json({ valid: false, error: 'Invalid OTP' });
});
app.post('/send-reset-otp', async (req, res) => {
  const { email, username } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.employee.findFirst({
      where: {
        AND: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'username or email does not exist' });
    }

    const otp = generateOtp();
    otpStore[email] = otp;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/reset-password', async (req, res) => {
  const {email,otp, newPassword, confirmNewPassword } = req.body;
  if (!email|| !otp || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'Email, OTP, new password, and confirm new password are required' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'New password and confirm password do not match' });
  }
  // const storedOtp = otpStore[email];
  // if (storedOtp && storedOtp === otp) {
  //   delete otpStore[email]; 
  //   return res.status(200).json({ valid: true });
  // }

  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await prisma.employee.update({
      where: { email },
      data: { password: hashedPassword },
    });
    delete otpStore[email];
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function createEmployee(data) {
  try {
    const requiredFields = ['firstName', 'lastName', 'dob', 'location', 'phoneNumber', 'email', 'rolename'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (!data.rolename) {
      throw new Error("Role name is required");
    }

    let role = await prisma.role.findFirst({
      where: {
        rolename: data.rolename
      }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          rolename: data.rolename
        }
      });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: {
        email: data.email
      }
    });

    if (existingEmployee) {
      throw new Error(`Employee with email ${data.email} already exists`);
    }
    
    const dob = new Date(data.dob);
    const age = calculateAge(dob);
    const today = new Date();
    
    if (dob > today) {
      throw new Error("Date of birth cannot be in the future");
    }

    if (age < 18) {
      throw new Error("Employee must be at least 18 years old");
    }

    let baseUsername = `${data.firstName.toLowerCase()}_${data.rolename.toLowerCase()}`;
    let username = baseUsername;
    let suffix = 1;
    let password = `${data.firstName.toLowerCase()}_1234`;

    let existingUsername = await prisma.employee.findUnique({
      where: { username },
    });

    while (existingUsername) {
      username = `${baseUsername}_${suffix}`;
      suffix++;
      existingUsername = await prisma.employee.findUnique({
        where: { username },
      });
    }

    data.username = username;
    // data.password= password;
    data.password = bcrypt.hashSync(password, 10);
    const phoneNumberWithCountryCode = `${data.countryCode}-${data.phoneNumber}`;
    const newEmployee = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: dob,
        email: data.email,
        location: data.location,
        phoneNumber:phoneNumberWithCountryCode,
        username: data.username,
        password: data.password,
        roleId: role.id,
      }
    });

    if(newEmployee) {

      const emailText = `Hello ${data.firstName},

      Your account has been created successfully. Here are your credentials:
      
      Username: ${data.username}
      Password: ${data.firstName.toLowerCase()}_1234
      
      Please change your password after your first login.
      
      Best regards,
      Your Company`;
      
            await sendEmail(data.email, 'Your Account Details', emailText);
    }
    return { newEmployee, plainPassword: password };
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

// app.post('/create-employee-with-pass', async (req, res) => {
//   try {
//     const { newEmployee, plainPassword } = await createEmployee(req.body);
//     res.status(201).json({ employee: newEmployee, password: plainPassword });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
app.post('/username', async (req, res) => {
  const { username } = req.body;

  try {
    const user = await prisma.employee.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
  }
});

//Login API
app.post('/login', async(req,res)=>{
  const {username, password} = req.body;

  try{
    const user = await prisma.employee.findUnique({
      where:{
        username:username,
      }
    })
  
    //If user not found
    if(!user){
      return res.status(404).json({message: "User not found!" })
    }
  
    //compare the password
    const passwordMatch = await bcrypt.compare(password, user.password);
  
    if(!passwordMatch){
      return res.status(404).json({message: "Invalid password"})
    }
    const token = jwt.sign({username: user.username}, process.env.TOKEN_KEY, {expiresIn: '1h' });
    res.cookie('token', token, {httpOnly: true});
    return res.status(200).json({ message: "Login successfully..." });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})
// console.log('jwt toke:'.token);


app.post('/create-employee', async (req, res) => {
  try {
    const employee = await createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/create-employee/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEmployee = await prisma.employee.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({ message: 'Employee deleted successfully', deletedEmployee });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(400).json({ error: error.message });
  }
});


app.get('/employee-credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;

   
    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      select: {
        username: true,
        password: true
      }
    });


    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

  
    res.status(200).json({ username: employee.username, password: employee.password });
  } catch (error) {
    console.error('Error retrieving employee credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Fetch user role from MySQL database
app.get('/roles', async(req, res)=>{
  try{
    const roles = await prisma.role.findMany();
    res.status(200).json(roles)
  }catch(error){
    console.error("Error in retrieving roles", error)
    res.status(500).json({message: "Internal server error"})
  }
})
app.get('/email/:username', async (req, res) => {
  try {
    const user = await prisma.employee.findUnique({
      where: {
        username: req.params.username
      }
    });
    if (user) {
      res.status(200).json({ email: user.email });
    } else {
      res.status(404).json({ message: 'Username not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
