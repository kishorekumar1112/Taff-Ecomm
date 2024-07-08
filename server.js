import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

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
    const requiredFields = ['firstName', 'lastName', 'dob', 'doj', 'location', 'phoneNumber', 'email', 'rolename'];
    
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
    const doj = new Date(data.doj || Date.now());
    const age = calculateAge(dob);
    const today = new Date();
    
    // Check if DOB is in the future
    if (dob > today) {
      throw new Error("Date of birth cannot be in the future");
    }

  
    if (age < 18) {
      throw new Error("Employee must be at least 18 years old");
    }

    let baseUsername = `${data.firstName.toLowerCase()}_${data.rolename.toLowerCase()}`;
    let username = baseUsername;
    let suffix = 1;

    // Check if the generated username already exists and generate a unique one if necessary
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

    // Add the generated username to employee data
    data.username = username;
   

  

    const newEmployee = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: dob,
        email: data.email,
        location: data.location,
        doj: doj,
        phoneNumber: data.phoneNumber,
        username:data.username,
        roleId: role.id,
      //   username: "placeholder_username", 
      //   password: "placeholder_password" 
      }
    });

    return newEmployee;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

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