require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const deleteUsers = prisma.user.deleteMany();
  const deleteWorkouts = prisma.workout.deleteMany();

  // The transaction runs synchronously so deleteFolder must run last.
  await prisma.$transaction([deleteUsers, deleteWorkouts]);

  //   await prisma.user.createMany({
  //     data: [
  //       {
  //         id: 1,
  //         username: '123',
  //         password: '123',
  //       },
  //       {
  //         id: 2,
  //         username: 'aaa',
  //         password: 'aaa',
  //       },
  //       {
  //         id: 3,
  //         username: 'bbb',
  //         password: 'bbb',
  //       },
  //     ],
  //   });

  //   const allUsers = await prisma.user.findMany();
  //   console.log(allUsers);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
