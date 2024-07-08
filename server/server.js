import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

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
    let password = Math.random().toString(36).slice(-8); 

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

    }
    return { newEmployee, plainPassword: password };
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

app.post('/create-employee-with-pass', async (req, res) => {
  try {
    const { newEmployee, plainPassword } = await createEmployee(req.body);
    res.status(201).json({ employee: newEmployee, password: plainPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Login API
app.post('/login', async(req,res)=>{
  const {username, password} = req.body;

  try{
    const user = await prisma.employee.findUnique({
      where:{
        username,
        password,
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});