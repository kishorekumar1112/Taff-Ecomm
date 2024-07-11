import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
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
// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Replace with your SMTP host
  port: 587, // Replace with your SMTP port
  secure: false, // true for 465, false for other ports
  auth: {
    user:  process.env.EMAIL, // Replace with your SMTP username
    pass: process.env.EMAIL_PASSWORD, // Replace with your SMTP password
  },
});

//Function to send email
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL, // Replace with your "from" address
      to, // List of receivers
      subject, 
      text, // Plain text body   
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// In-memory store for OTPs
const otpStore = {};

// Generate a random OTP
function generateOtp() {
  return crypto.randomBytes(3).toString('hex'); // Generates a 6-character hex string
}

// Send OTP route
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = generateOtp();
  otpStore[email] = { otp, expiresAt: Date.now() + 15 * 60 * 1000 };

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

// Validate OTP route
app.post('/validate-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedOtp = otpStore[email];
  if (storedOtp && storedOtp === otp) {
    delete otpStore[email]; // Remove OTP after validation
    return res.status(200).json({ valid: true });
  }

  res.status(400).json({ valid: false, error: 'Invalid OTP' });
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

    const newEmployee = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: dob,
        email: data.email,
        location: data.location,
        phoneNumber: data.phoneNumber,
        username: data.username,
        password: data.password,
        roleId: role.id,
      }
    });

    if(newEmployee) {
       // Send email with username and password
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

    res.status(200).json({ message: "Login successfully..." });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.post('/create-employee', async (req, res) => {
  try {
    const employee = await createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/create-employee', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error retrieving employees:", error);
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

// Get employee credentials by ID (username and password only)
app.get('/employee-credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid number
    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find the employee by ID
    const employee = await prisma.employee.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      select: {
        username: true,
        password: true
      }
    });

    // If employee not found
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Return the username and hashed password
    res.status(200).json({ username: employee.username, password: employee.password });
  } catch (error) {
    console.error('Error retrieving employee credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});