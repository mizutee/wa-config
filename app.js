require('dotenv').config();
const express = require('express');
const app = express()
const whatsappClient = require('./index');
const { db, client } = require('./mongodbConnection');
const cron = require('node-cron');
const { senderNumber, allGameFinished, checkOngoingPlayRoom, checkRoomInfo, bothPlayersInputLife, randomizeNumber, bothPlayersSFL, stillHasLifes, checkUsernameRegister, isAdmin, newDateNow, checkWinner, countWinRate } = require('./helper');
const cors = require('cors');
const { ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

whatsappClient.initialize();

// app.post('/informUpdate', async (req, res) => {
//     try {
//         await whatsappClient.sendMessage('120363305913636485@g.us', `Greetings Player!\nShortly our bot will go under maintenance for approximately ${req.body.minute} minutes for quick update!\nWe will back soon!`);
//         await whatsappClient.sendMessage('120363306085218728@g.us', `Greetings Player!\nShortly our bot will go under maintenance for approximately ${req.body.minute} minutes for quick update!\nWe will back soon!`);
//         return res.status(200).json({ message: `Message has been broadcasted successfully!` });
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/informEmergency', async (req, res) => {
//     try {
//         await whatsappClient.sendMessage('120363305913636485@g.us', `Greetings Player!\nShortly our bot will go under critical maintenance! Please refrain doing transaction during this time!\nThankyou!`);
//         await whatsappClient.sendMessage('120363306085218728@g.us', `Greetings Player!\nShortly our bot will go under critical maintenance! Please refrain doing transaction during this time!\nThankyou!`);
//         return res.status(200).json({ message: `Message has been broadcasted successfully!` });
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/csn', async (req, res) => {
//     try {
//         console.log('masuk ke api csn')
//         const msg = req.body.msg;
//         const sender = senderNumber(msg);
//         let amount = msg.body.split(' ')[1]
//         amount = Number(amount);
//         const user = await db.collection('User').findOne({ participant: sender })
//         if (isNaN(amount) || amount < 1) {
//             return await whatsappClient.sendMessage(msg.from, `${user.username}, You entered invalid amount! Please input valid bet amount!`)
//         }
//         if (user.balance < amount) {
//             return await whatsappClient.sendMessage(msg.from, `${user.username}, You don't have enough balance to play!`)
//         }
//         const findQueue = await db.collection('PlayQueue').findOne({ bet: amount, participant: { $ne: user.participant }, status: 'waiting', game: 'CSN' })
//         const findMyQueue = await db.collection('PlayQueue').findOne({ participant: sender });
//         // console.log(findMyQueue)
//         if (findMyQueue) return await whatsappClient.sendMessage(msg.from, `${user.username}, You can't do this action! You can only queue once!`)
//         const findExistingRoom = await checkOngoingPlayRoom(sender);
//         if (findExistingRoom) return await whatsappClient.sendMessage(msg.from, `${user.username}, You can't do this action! Please complete your previous game!`)
//         const session = client.startSession();
//         if (findQueue) {
//             const botData = await db.collection('PlayRoom').find({ status: { $ne: 'Finished' } }).toArray();
//             let temp = {"6289514031500@c.us": 0, "6282279564609@c.us": 0};
//             botData.forEach(el => {
//                 if (el.bot) {
//                     temp[el.bot] ? temp[el.bot]++ : temp[el.bot] = 1
//                 }
//             });
//             let minValue = Math.min(...Object.values(temp));
//             let lowestBot = Object.keys(temp).find(key => temp[key] === minValue);
//             user.balance -= amount;
//             await session.withTransaction(async () => {
//                 await db.collection('User').updateOne(
//                     { participant: user.participant },
//                     { $set: { balance: user.balance } },
//                     { session }
//                 );
//                 await db.collection('PlayQueue').deleteOne({ _id: new ObjectId(findQueue._id) }, { session });
//                 const newRoom = await db.collection('PlayRoom').insertOne({
//                     participants: [{ username: findQueue.username, participant: findQueue.participant, life: 'notdefined', goStatus: 'no', sfl: 'notdefined' }, { username: user.username, participant: user.participant, life: 'notdefined', goStatus: 'no', sfl: 'notdefined' }],
//                     totalAmount: +findQueue.bet + +amount,
//                     status: 'Setting Up',
//                     lifeStatus: 'Undecided',
//                     game: 'CSN',
//                     spinTemp: [],
//                     rematch: 'no',
//                     rematchInfo: [],
//                     createdAt: newDateNow(),
//                     updatedAt: newDateNow(),
//                     bot: lowestBot
//                 }, { session });

//                 await db.collection('UserTransaction').insertOne({
//                     queueID: findQueue._id,
//                     participant: user.participant,
//                     description: 'Join CSN Queue',
//                     debit: 0,
//                     credit: amount,
//                     playRoomID: newRoom.insertedId
//                 }, { session });

//                 await db.collection('UserTransaction').updateOne(
//                     { queueID: new ObjectId(findQueue._id) },
//                     { $set: { playRoomID: newRoom.insertedId } },
//                     { session }
//                 )
//                 const newRoomInfo = await db.collection('PlayRoom').findOne({ _id: newRoom.insertedId }, { session });
//                 await whatsappClient.sendMessage(msg.from, `${newRoomInfo.participants[0].participant}, ${newRoomInfo.participants[1].participant}, Both of you have been invited to the Play Room, please do not block incoming messages from unknown number, and check your personal messages to start the game!`)
//                 // await whatsappClient.sendMessage(newRoomInfo.participants[0].participant, `You are now up against ${newRoomInfo.participants[1].username}\nPlease do /life and decide your life. For example: /life 3`)
//                 // await whatsappClient.sendMessage(newRoomInfo.participants[1].participant, `You are now up against ${newRoomInfo.participants[0].username}\nPlease do /life and decide your life. For example: /life 3`)
//                 res.status(201).json({newRoomInfo})
//             });
//         } else {
//             await session.withTransaction(async () => {
//                 const playQueueResult = await db.collection('PlayQueue').insertOne({
//                     username: user.username,
//                     participant: user.participant,
//                     bet: amount,
//                     game: 'CSN',
//                     status: 'waiting',
//                     createdAt: newDateNow()
//                 }, { session });

//                 user.balance -= amount;
//                 await db.collection('User').updateOne(
//                     { participant: user.participant },
//                     { $set: { balance: user.balance } },
//                     { session }
//                 );
//                 await db.collection('UserTransaction').insertOne({
//                     queueID: playQueueResult.insertedId,
//                     participant: user.participant,
//                     description: 'Create CSN Queue',
//                     debit: 0,
//                     credit: amount
//                 }, { session })
//             });
//             console.log('diatas return message waitinglist')
//             return await whatsappClient.sendMessage(msg.from, `⏳ Hello ${user.username}, You are now on waiting list ⏳\nThe game 🎯 will start immediately once you found opponent`);
//         }
//         session.endSession();
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/csnlife', async (req, res) => {
//     try {
//         const { msg, ongoingPlayRoom } = req.body;
//         const sender = msg.from
//         let bothPlayerDecide = 0
//         let life = msg.body.split(" ")[1];
//         life = Number(life)
//         let updatedRoomInfo;
//         ongoingPlayRoom.participants.forEach(el => {
//             if (el.life !== 'notdefined') {
//                 bothPlayerDecide++
//             }
//         })
//         if (life === '' || typeof life !== 'number' || !life) {
//             return await whatsappClient.sendMessage(msg.from, 'Please input valid number! For example:\n/life 3')
//         }
//         if (life < 1 || life > 4) {
//             return await whatsappClient.sendMessage(sender, "Invalid life amount! Please choose on a 1-4 range only!")
//         }
//         ongoingPlayRoom.participants.forEach(async (el) => {
//             if (el.participant === sender && el.life === 'notdefined' && !bothPlayerDecide) {
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": life } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 return await whatsappClient.sendMessage(msg.from, 'Your life has been saved ✅ ! Please wait ⌛ for other players to decide theirs.')
//             } else if (el.participant === sender && el.life === 'notdefined' && bothPlayerDecide) {
//                 console.log(`masuk else if prtama`);
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": life } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 if (updatedRoomInfo.participants[0].life === updatedRoomInfo.participants[1].life && bothPlayersInputLife(updatedRoomInfo.participants)) {
//                     console.log('if kedua');
//                     await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { lifeStatus: 'Fixed', status: 'Ongoing' } })
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Life is saved! We will now begin the game shortly! Type /go to start the game!`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Life is saved! We will now begin the game shortly! Type /go to start the game!`)
//                 } else if (bothPlayersInputLife(updatedRoomInfo.participants) && (updatedRoomInfo.participants[0].life !== updatedRoomInfo.participants[1].life)) {
//                     console.log('else if 2');
//                     await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { lifeStatus: "SFL" } })
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Since both players desired different life, 🏁 we will now begin Spin For Life!\n✍🏻 Type /sfl to spin for life!`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Since both players desired different life, 🏁 we will now begin Spin For Life!\n✍🏻 Type /sfl to spin for life!`)
//                 } else if (!bothPlayersInputLife(ongoingPlayRoom.participants)) {
//                     console.log('else if 3');
//                     await whatsappClient.sendMessage(msg.from, `Your life has been saved ✅ ! Please wait ⌛ for other players to decide theirs.`)
//                 }
//             } else if (el.participant === sender && el.life !== 'notdefined') {
//                 console.log('else if trakhir');
//                 return whatsappClient.sendMessage(sender, "You can't change your life again!")
//             }
//         })
//         if (bothPlayerDecide === 2) {
//             console.log('bothplayerdecide');
//             if (ongoingPlayRoom.participants[0].life === ongoingPlayRoom.participants[1].life && bothPlayersInputLife(ongoingPlayRoom.participants)) {
//                 console.log('6');
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { lifeStatus: 'Fixed', status: 'Ongoing' } })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Life is saved! We will now begin the game shortly! Type /go to start the game!`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Life is saved! We will now begin the game shortly! Type /go to start the game!`)
//             } else if (bothPlayersInputLife(ongoingPlayRoom.participants) && (ongoingPlayRoom.participants[0].life !== ongoingPlayRoom.participants[1].life)) {
//                 console.log('7');
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { lifeStatus: "SFL" } })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Since both players desired different life, 🏁 we will now begin Spin For Life!\n✍🏻 Type /sfl to spin for life!`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Since both players desired different life, 🏁 we will now begin Spin For Life!\n✍🏻 Type /sfl to spin for life!`)
//             } else if (!bothPlayersInputLife(ongoingPlayRoom.participants)) {
//                 console.log('8');
//                 await whatsappClient.sendMessage(msg.from, `Your life has been saved ✅ ! Please wait ⌛ for other players to decide theirs.`)
//             }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/csnsfl', async (req, res) => {
//     try {
//         const { msg, ongoingPlayRoom } = req.body;
//         const sender = msg.from;
//         let bothPlayerSpin = false
//         const randomNumber = randomizeNumber()
//         let updatedRoomInfo;
//         ongoingPlayRoom.participants.forEach(el => {
//             if (el.sfl !== 'notdefined' && el.sfl !== 'tie') {
//                 bothPlayerSpin = true
//             }
//         })
//         // console.log(bothPlayerSpin, "<<< udh spin 2-2ny blm nih")
//         ongoingPlayRoom.participants.forEach(async (el) => {
//             if (el.participant === sender && (el.sfl === 'notdefined' || el.sfl === 'tie') && !bothPlayerSpin) {
//                 // console.log('cuma 1 yang baru spin, baru yang ini doang')
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].sfl": randomNumber } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//             } else if (el.participant === sender && (el.sfl === 'notdefined' || el.sfl === 'tie') && bothPlayerSpin) {
//                 // msg.reply(`${sender} has spun the wheel and got ${randomNumber}!🎯`)
//                 req.setTimeout(1500);
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].sfl": randomNumber } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                 if (updatedRoomInfo.participants[0].sfl === 0 || updatedRoomInfo.participants[1].sfl === 0) {
//                     if (updatedRoomInfo.participants[0].sfl === 0 && updatedRoomInfo.participants[1].sfl !== 0) {
//                         const winningLife = updatedRoomInfo.participants[0].life;
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].life": winningLife, status: 'Ongoing', lifeStatus: 'Fixed' } })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${updatedRoomInfo.participants[0].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${updatedRoomInfo.participants[0].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                     } else if (updatedRoomInfo.participants[0].sfl !== 0 && updatedRoomInfo.participants[1].sfl === 0) {
//                         const winningLife = updatedRoomInfo.participants[1].life;
//                         await db.collection('PlayRoom').updateMany({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].life": winningLife, status: 'Ongoing', lifeStatus: 'Fixed' } })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${updatedRoomInfo.participants[1].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${updatedRoomInfo.participants[1].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                     } else if (updatedRoomInfo.participants[0].sfl === 0 && updatedRoomInfo.participants[1].sfl === 0) {
//                         await db.collection('PlayRoom').updateMany({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].sfl": 'tie' } })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Both player tied, please re-spin by type /sfl again!`)
//                     }
//                 }
//                 if (updatedRoomInfo.participants[0].sfl === updatedRoomInfo.participants[1].sfl && bothPlayersSFL(updatedRoomInfo.participants)) {
//                     await db.collection('PlayRoom').updateMany({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].sfl": 'tie' } })
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Both player tied, please re-spin by type /sfl again!`)
//                     return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Both player tied, please re-spin by type /sfl again!`)
//                 } else if (updatedRoomInfo.participants[0].sfl > updatedRoomInfo.participants[1].sfl && bothPlayersSFL(updatedRoomInfo.participants)) {
//                     const winningLife = updatedRoomInfo.participants[0].life;
//                     await db.collection('PlayRoom').updateMany({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].life": winningLife, status: 'Ongoing', lifeStatus: 'Fixed' } })
//                     // await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { status: 'Ongoing', lifeStatus: 'Fixed' } }) // testing
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${updatedRoomInfo.participants[0].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${updatedRoomInfo.participants[0].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                 } else if (updatedRoomInfo.participants[0].sfl < updatedRoomInfo.participants[1].sfl && bothPlayersSFL(updatedRoomInfo.participants)) {
//                     const winningLife = updatedRoomInfo.participants[1].life;
//                     await db.collection('PlayRoom').updateMany({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[].life": winningLife, status: 'Ongoing', lifeStatus: 'Fixed' } })
//                     // await db.collection('PlayRoom').updateOne({ groupId: msg.from }, { $set: { status: 'Ongoing', lifeStatus: 'Fixed' } }) // testing
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${updatedRoomInfo.participants[1].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${updatedRoomInfo.participants[1].username} won the SFL 🎯! life will be set to ${winningLife}🔥\nThe game will be started, please both players type /go to start the game!🎮`)
//                 } else if (!bothPlayersSFL(updatedRoomInfo.participants)) {
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, 'Please do /sfl to spin for life!')
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, 'Please do /sfl to spin for life!')
//                 }
//             } else if (el.participant === sender && (el.sfl !== 'notdefined' || el.sfl !== 'tie')) {
//                 await whatsappClient.sendMessage(msg.from, "You can't spin yet!")
//             }
//         })
//         res.status(201).json({ message: 'SFL has been done successfully!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/csngo', async (req, res) => {
//     try {
//         const { msg, ongoingPlayRoom } = req.body;
//         const sender = msg.from;
//         let bothPlayerReady = false
//         let updatedRoomInfo;
//         ongoingPlayRoom.participants.forEach(el => {
//             if (el.goStatus !== 'no') {
//                 bothPlayerReady = true
//             }
//         })
//         ongoingPlayRoom.participants.forEach(async (el) => {
//             if (el.participant === sender && el.goStatus === 'no' && !bothPlayerReady) {
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].goStatus": 'ready' } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 await whatsappClient.sendMessage(msg.from, `✅ Your status has been set to ready! Please wait for other players ⏳`)
//             } else if (el.participant === sender && el.goStatus === 'no' && bothPlayerReady) {
//                 req.setTimeout(1500);
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].goStatus": 'ready', status: 'Playing' } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//             } else if (el.participant === sender && el.goStatus === 'ready' && !bothPlayerReady) {
//                 await whatsappClient.sendMessage(msg.from, 'Please wait for other player to /go!')
//             }
//         })
//         if (bothPlayerReady) {
//             if (ongoingPlayRoom.participants[0].goStatus === 'ready' && ongoingPlayRoom.participants[1].goStatus === 'ready') {
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Playing' } })
//                 await whatsappClient.sendMessage(ongoingPlayRoom.participants[0].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//                 await whatsappClient.sendMessage(ongoingPlayRoom.participants[1].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//             }
//         }
//         res.status(201).json({ message: 'Status has been changed to playing!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/spin', async (req, res) => {
//     try {
//         const { msg, ongoingRoom, ongoingPlayRoom } = req.body;
//         // console.log(msg)
//         const sender = senderNumber(msg);
//         // console.log(sender);
//         const session = client.startSession();
//         const randomNumber = randomizeNumber();
//         let updatedRoomInfo;
//         await session.withTransaction(async () => {
//             if (ongoingRoom.spinTemp.length === 0) {
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $push: { spinTemp: { participant: sender, number: randomNumber } }, $set: { updatedAt: newDateNow() } }, { returnDocument: 'after', session })
//                 // console.log(updatedRoomInfo, '<<< updetiruminfo')
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                 // if (updatedRoomInfo.spinTemp.length === 2) {
//                 //     if (updatedRoomInfo.spinTemp[0]?.number > updatedRoomInfo.spinTemp[1]?.number) {
//                 //         const loser = updatedRoomInfo.spinTemp[1].participant
//                 //         let updatedLoser;
//                 //         updatedRoomInfo.participants.forEach((el) => {
//                 //             if (el.participant === loser) {
//                 //                 updatedLoser = el
//                 //             }
//                 //         })
//                 //         const loserLife = updatedLoser.life
//                 //         updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] }, updatedAt: newDateNow() }, { arrayFilters: [{ "element.participant": loser }], returnDocument: 'after', session })
//                 //         // await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }) //testing diatas
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //     } else if (updatedRoomInfo.spinTemp[0]?.number < updatedRoomInfo.spinTemp[1]?.number) {
//                 //         const loser = updatedRoomInfo.spinTemp[0].participant
//                 //         let updatedLoser;
//                 //         updatedRoomInfo.participants.forEach((el) => {
//                 //             if (el.participant === loser) {
//                 //                 updatedLoser = el
//                 //             }
//                 //         })
//                 //         const loserLife = updatedLoser.life
//                 //         updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] }, updatedAt: newDateNow() }, { arrayFilters: [{ "element.participant": loser }], returnDocument: 'after', session })
//                 //         // await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }) // testing diatas
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //     } else if (updatedRoomInfo.spinTemp[0]?.number === updatedRoomInfo.spinTemp[1]?.number) {
//                 //         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }, { session })
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Both players tied, please /spin to continue the game`)
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Both players tied, please /spin to continue the game`)
//                 //     }
//                 // }
//             } else if (ongoingRoom.spinTemp.length === 1) {
//                 ongoingRoom.spinTemp.forEach(async (el) => {
//                     if (el.participant === sender) {
//                         return await whatsappClient.sendMessage(msg.from, 'You already spun! Wait for your opponent to spin!')
//                     } else {
//                         updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $push: { spinTemp: { participant: sender, number: randomNumber } }, $set: { updatedAt: newDateNow() } }, { returnDocument: 'after', session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}`)
//                     }
//                 })
//                 // } else if (ongoingRoom.spinTemp.length === 2 && (ongoingRoom.spinTemp[0].participant === ongoingRoom.spinTemp[1].participant)) {
//                 //     let loserLife;
//                 //     ongoingRoom.participants.forEach(el => {
//                 //         if (el.participant === ongoingRoom.spinTemp[0].participant) {
//                 //             loserLife = el.life
//                 //         }
//                 //     })
//                 //     await whatsappClient.sendMessage(ongoingRoom.participants[0].participant, `${ongoingRoom.spinTemp[0].participant} did double! the life will be deducted 1!`)
//                 //     await whatsappClient.sendMessage(ongoingRoom.participants[1].participant, `${ongoingRoom.spinTemp[0].participant} did double! the life will be deducted 1!`)
//                 //     updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] }, updatedAt: newDateNow() }, { arrayFilters: [{ "element.participant": ongoingRoom.spinTemp[0].participant }], returnDocument: 'after', session })
//                 //     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 //     const updatedData = await db.collection('PlayRoom').findOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { session })
//                 //     if (!stillHasLifes(updatedData.participants)) {
//                 //         const result = await checkWinner(updatedData, ongoingPlayRoom, updatedRoomInfo);
//                 //         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(updatedData._id)) }, { $set: { status: 'Finished' }, updatedAt: newDateNow() }, { session })
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//                 //         await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//                 //     }
//                 // }
//             }
//         })
//         return res.status(201).json({ message: 'Spin done!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/validatespin', async (req, res) => {
//     req.setTimeout(1500);
//     try {
//         const { ongoingPlayRoom } = req.body;
//         const session = client.startSession();
//         let updatedRoomInfo = await db.collection('PlayRoom').findOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) })
//         if (updatedRoomInfo.spinTemp.length === 2) {
//             if (updatedRoomInfo.spinTemp[0].number === 0 || updatedRoomInfo.spinTemp[1].number === 0) {
//                 let loserArray = [];
//                 updatedRoomInfo.spinTemp.forEach(el => {
//                     if (el.number !== 0) {
//                         loserArray.push(el);
//                     }
//                 })
//                 if (loserArray.length === 2) {
//                     updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { spinTemp: [] } }, { returnDocument: 'after', session })
//                     // return whatsappClient.sendMessage(msg.from, `Both players tied, please /spin to continue the game`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Both players tied, please /spin to continue the game!`)
//                     return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Both players tied, please /spin to continue the game!`)
//                 } else if (loserArray.length === 1) {
//                     const loser = loserArray[0].participant;
//                     let updatedLoser;
//                     updatedRoomInfo.participants.forEach((el) => {
//                         if (el.participant === loser) {
//                             updatedLoser = el;
//                         }
//                     })
//                     const loserLife = updatedLoser.life;
//                     updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] } }, { arrayFilters: [{ "element.participant": loser }], returnDocument: 'after', session })
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                     await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 }
//             } else if (updatedRoomInfo.spinTemp[0]?.number > updatedRoomInfo.spinTemp[1]?.number) {
//                 const loser = updatedRoomInfo.spinTemp[1].participant
//                 let updatedLoser;
//                 updatedRoomInfo.participants.forEach((el) => {
//                     if (el.participant === loser) {
//                         updatedLoser = el
//                     }
//                 })
//                 const loserLife = updatedLoser.life
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] } }, { arrayFilters: [{ "element.participant": loser }], returnDocument: 'after', session })
//                 // await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }) //testing diatas
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//             } else if (updatedRoomInfo.spinTemp[0]?.number < updatedRoomInfo.spinTemp[1]?.number) {
//                 const loser = updatedRoomInfo.spinTemp[0].participant
//                 let updatedLoser;
//                 updatedRoomInfo.participants.forEach((el) => {
//                     if (el.participant === loser) {
//                         updatedLoser = el
//                     }
//                 })
//                 const loserLife = updatedLoser.life
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] } }, { arrayFilters: [{ "element.participant": loser }], returnDocument: 'after', session })
//                 // await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }) // testing diatas
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//             } else if (updatedRoomInfo.spinTemp[0]?.number === updatedRoomInfo.spinTemp[1]?.number) {
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) }, { $set: { spinTemp: [] } }, { session })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Both players tied, please /spin to continue the game`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Both players tied, please /spin to continue the game`)
//             }
//         } else if (updatedRoomInfo.spinTemp.length === 2 && (updatedRoomInfo.spinTemp[0].participant === updatedRoomInfo.spinTemp[1].participant)) {
//             let loserLife;
//             updatedRoomInfo.participants.forEach(el => {
//                 if (el.participant === updatedRoomInfo.spinTemp[0].participant) {
//                     loserLife = el.life
//                 }
//             })
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `${updatedRoomInfo.spinTemp[0].participant} did double! the life will be deducted 1!`)
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `${updatedRoomInfo.spinTemp[0].participant} did double! the life will be deducted 1!`)
//             updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].life": Number(loserLife) - 1, spinTemp: [] } }, { arrayFilters: [{ "element.participant": updatedRoomInfo.spinTemp[0].participant }], returnDocument: 'after', session })
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `✅Lifes Update:\n${updatedRoomInfo.participants[0].username}: ${updatedRoomInfo.participants[0].life}🔥\n${updatedRoomInfo.participants[1].username}: ${updatedRoomInfo.participants[1].life}🔥`)
//             const updatedData = await db.collection('PlayRoom').findOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { session })
//             if (!stillHasLifes(updatedData.participants)) {
//                 const result = await checkWinner(updatedData, ongoingPlayRoom, updatedRoomInfo);
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(updatedData._id)) }, { $set: { status: 'Finished' } }, { session })
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//                 await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//             }
//         }
//         const updatedData = await db.collection('PlayRoom').findOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { session })
//         if (!stillHasLifes(updatedData.participants)) {
//             const result = await checkWinner(updatedData, ongoingPlayRoom, updatedRoomInfo);
//             await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(updatedData._id)) }, { $set: { status: 'Finished' } }, { session })
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${result.username}! Your balance has been updated!\nYou can play again by type /csn <amount>, and wait until you found your opponent!`)
//             return res.status(200).json({ message: 'Spin has been validated' })
//         } else if (updatedRoomInfo.spinTemp.length < 0 && updatedRoomInfo.spinTemp.length > 2) {
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Error occured! Please contact admin!`)
//             await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Error occured! Please contact admin!`)
//             await db.collection('RoomProblem').updateOne(
//                 { _id: new ObjectId(String(updatedRoomInfo._id)) },
//                 {
//                     $setOnInsert: {
//                         roomId: updatedRoomInfo._id,
//                         description: `SpinTemp less than 0 or more than 2`
//                     },
//                     $set: {
//                         updatedAt: newDateNow()
//                     }
//                 },
//                 {
//                     upsert: true
//                 }
//             )
//             return res.status(400).json({ message: 'Error occured!' })
//         }
//         return res.status(200).json({ message: 'No Error Found! Good to go!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/reme', async (req, res) => {
//     try {
//         const { msg } = req.body;
//         const sender = senderNumber(msg);
//         let amount = msg.body.split(" ")[1];
//         amount = Number(amount);
//         if (isNaN(amount) || amount < 1) return await whatsappClient.sendMessage(msg.from, `Please input valid number, for example: /reme 100`, { mentions: [sender] })
//         const user = await db.collection('User').findOne({ participant: sender })
//         if (user.balance < amount) {
//             return await whatsappClient.sendMessage(sender, "You don't have enough balance to play!")
//         }
//         if (user.role === 'hoster') return await whatsappClient.sendMessage(msg.from, `You can't play REME because you are still hoster! Please wait until the role wears off!`, { mentions: [sender] })
//         const session = client.startSession();
//         await session.withTransaction(async () => {
//             const playQueueResult = await db.collection('PlayQueue').insertOne({
//                 username: user.username,
//                 participant: user.participant,
//                 bet: amount,
//                 game: 'REME',
//                 status: 'waiting',
//                 createdAt: newDateNow()
//             }, { session })
//             user.balance -= amount;
//             await db.collection('User').updateOne(
//                 { participant: user.participant },
//                 { $set: { balance: user.balance } },
//                 { session }
//             );

//             await db.collection('UserTransaction').insertOne({
//                 queueID: playQueueResult.insertedId,
//                 participant: user.participant,
//                 description: 'Create REME Queue',
//                 debit: 0,
//                 credit: amount
//             }, { session })
//         });
//         session.endSession();
//         await whatsappClient.sendMessage(msg.from, '⏳ You are now on waiting list ⏳\nThe game 🎯 will start immediately once someone hosted you.', { mentions: [sender] });
//         return res.status(201).json({ message: 'PlayQueue has been created!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/remego', async (req, res) => {
//     try {
//         const { msg, ongoingPlayRoom } = req.body;
//         const sender = msg.from;
//         let bothPlayerReady = false
//         let updatedRoomInfo;
//         ongoingPlayRoom.participants.forEach(el => {
//             if (el.goStatus !== 'no') {
//                 bothPlayerReady = true
//             }
//         })
//         ongoingPlayRoom.participants.forEach(async (el) => {
//             if (el.participant === sender && el.goStatus === 'no' && !bothPlayerReady) {
//                 // console.log('baru prtama x, belum ada yang ready')
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].goStatus": 'ready' } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//                 await whatsappClient.sendMessage(msg.from, `✅ Your status has been set to ready! Please wait for other players ⏳`)
//             } else if (el.participant === sender && el.goStatus === 'no' && bothPlayerReady) {
//                 // console.log('udah ada yang ready kok')
//                 updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { "participants.$[element].goStatus": 'ready' } }, { arrayFilters: [{ "element.participant": sender }], returnDocument: 'after' })
//             } else if (el.participant === sender && el.goStatus === 'ready' && !bothPlayerReady) {
//                 // console.log('yang ngirim saama brjit')
//                 await whatsappClient.sendMessage(msg.from, 'Please wait for other player to /go!')
//             }
//         })
//         res.status(201).json({ message: 'Status has been updated!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/validateremego', async (req, res) => {
//     req.setTimeout(1500)
//     try {
//         let { ongoingPlayRoom } = req.body;
//         ongoingPlayRoom = await db.collection('PlayRoom').findOne({ _id: new ObjectId(String(ongoingPlayRoom._id)) });
//         let bothPlayerReady = true
//         ongoingPlayRoom.participants.forEach(el => {
//             if (el.goStatus !== 'ready') {
//                 bothPlayerReady = false
//             }
//         })
//         console.log('masuk validate', bothPlayerReady)
//         if (bothPlayerReady) {
//             if (ongoingPlayRoom.participants[0].goStatus === 'ready' && ongoingPlayRoom.participants[1].goStatus === 'ready') {
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Playing' } })
//                 await whatsappClient.sendMessage(ongoingPlayRoom.participants[0].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//                 await whatsappClient.sendMessage(ongoingPlayRoom.participants[1].participant, `🏁 Now we will start the game. To spin 🎯, ✍🏻 type /spin!`)
//             }
//         }
//         res.status(201).json({ message: 'Room info has been updated to playing!' })
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/spinreme', async (req, res) => {
//     try {
//         const { msg, ongoingPlayRoom, ongoingRoom } = req.body;
//         const sender = msg.from;
//         let randomNumber = randomizeNumber();
//         let updatedRoomInfo;
//         let resultNumber;
//         if (randomNumber >= 10) {
//             resultNumber = String(randomNumber);
//             resultNumber = parseInt(resultNumber[0]) + parseInt(resultNumber[1])
//             if (resultNumber >= 10) {
//                 resultNumber = String(resultNumber);
//                 resultNumber = parseInt(resultNumber[1])
//             }
//         } else {
//             resultNumber = randomNumber;
//         }
//         const session = client.startSession();
//         const user = await db.collection('User').findOne({ participant: sender });
//         await session.withTransaction(async () => {
//             if (ongoingRoom.spinTemp.length === 0) {
//                 await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $push: { spinTemp: { participant: sender, number: randomNumber, remeNumber: resultNumber, role: user.role, username: user.username } } }, { session });
//                 await whatsappClient.sendMessage(ongoingRoom.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}!🎯`)
//                 await whatsappClient.sendMessage(ongoingRoom.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}!🎯`)
//             } else if (ongoingRoom.spinTemp.length === 1) {
//                 ongoingRoom.spinTemp.forEach(async (el) => {
//                     if (el.participant === sender) {
//                         return await whatsappClient.sendMessage(sender, 'You already spun! Wait for your opponent to spin!')
//                     } else {
//                         updatedRoomInfo = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $push: { spinTemp: { participant: sender, number: randomNumber, role: user.role, remeNumber: resultNumber, username: user.username } } }, { returnDocument: 'after', session })
//                         await whatsappClient.sendMessage(ongoingRoom.participants[1].participant, `${sender} has spun the wheel and got ${randomNumber}!🎯`)
//                         await whatsappClient.sendMessage(ongoingRoom.participants[0].participant, `${sender} has spun the wheel and got ${randomNumber}!🎯`)
//                     }
//                 })
//             }
//         })
//         res.status(201).json({ message: 'Spin has been pushed to database!' });
//     } catch (error) {
//         console.log(error);
//     }
// })

// app.post('/validateremespin', async (req, res) => {
//     try {
//         const { msg, ongoingRoom, ongoingPlayRoom } = req.body;
//         const updatedRoomInfo = await checkOngoingPlayRoom(msg.from);
//         const winningPrizeAdmin = parseInt(ongoingRoom.totalAmount) + parseInt(ongoingRoom.hosterHold); //
//         const winningPrizePlayer = parseInt(ongoingRoom.totalAmount)
//         const refundAdmin = parseInt(ongoingRoom.totalAmount) / 2
//         const session = client.startSession();
//         if (updatedRoomInfo.spinTemp.length === 2) {
//             await session.withTransaction(async () => {
//                 if (updatedRoomInfo.spinTemp[0].remeNumber === 0 || updatedRoomInfo.spinTemp[1].remeNumber === 0) {
//                     let bothZero = true;
//                     updatedRoomInfo.spinTemp.forEach(el => {
//                         if (el.remeNumber !== 0) {
//                             bothZero = false;
//                         }
//                     })
//                     if (bothZero) {
//                         let winnerUser;
//                         updatedRoomInfo.spinTemp.forEach(el => {
//                             if (el.role === 'hoster') {
//                                 winnerUser = el;
//                             }
//                         });
//                         await db.collection('User').updateOne({ participant: winnerUser.participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session });
//                         await whatsappClient.sendMessage(ongoingPlayRoom.participants[0].participant, `Congratulations Hoster! Your balance has been updated!`)
//                         return await whatsappClient.sendMessage(ongoingPlayRoom.participants[1].participant, `Congratulations Hoster! Your balance has been updated!`)
//                     } else {
//                         if (updatedRoomInfo.spinTemp[0].remeNumber === 0) {
//                             console.log('participant pertama pasti 0 gk sieh?')
//                             await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[0].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                             await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session });
//                             await whatsappClient.sendMessage(ongoingPlayRoom.participants[0].participant, `Congratulations ${updatedRoomInfo.spinTemp[0].username}! Your balance has been updated!`)
//                             return await whatsappClient.sendMessage(ongoingPlayRoom.participants[1].participant, `Congratulations ${updatedRoomInfo.spinTemp[0].username}! Your balance has been updated!`)
//                         } else if (updatedRoomInfo.spinTemp[1].remeNumber === 0) {
//                             await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[1].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                             await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session });
//                             await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${updatedRoomInfo.spinTemp[1].username}! Your balance has been updated!`)
//                             return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${updatedRoomInfo.spinTemp[1].username}! Your balance has been updated!`)
//                         }
//                     }
//                 } else if (updatedRoomInfo.spinTemp[0].remeNumber > updatedRoomInfo.spinTemp[1].remeNumber) {
//                     if (updatedRoomInfo.spinTemp[0].role === 'hoster') {
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[0].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[0].participant,
//                             description: 'Winner REME',
//                             debit: winningPrizeAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations Hoster! Your balance has been updated!`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations Hoster! Your balance has been updated!`)
//                     } else {
//                         // const user = await db.collection('User').findOne({participant: updatedRoomInfo.spinTemp[0].participant})
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[0].participant }, { $inc: { balance: winningPrizePlayer } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[0].participant,
//                             description: 'Winner REME',
//                             debit: winningPrizePlayer,
//                             credit: 0
//                         }, { session })
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[1].participant }, { $inc: { balance: refundAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[1].participant,
//                             description: `Refund hoster's WLS (REME)`,
//                             debit: refundAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${updatedRoomInfo.spinTemp[0].username}! Your balance has been updated!`);
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${updatedRoomInfo.spinTemp[0].username}! Your balance has been updated!`);
//                     }
//                 } else if (updatedRoomInfo.spinTemp[0].remeNumber < updatedRoomInfo.spinTemp[1].remeNumber) {
//                     if (updatedRoomInfo.spinTemp[1].role === 'hoster') {
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[1].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[1].participant,
//                             description: 'Winner REME',
//                             debit: winningPrizeAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations Hoster! Your balance has been updated!`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations Hoster! Your balance has been updated!`)
//                     } else {
//                         // const user = await db.collection('User').findOne({participant: updatedRoomInfo.spinTemp[1].participant})
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[1].participant }, { $inc: { balance: winningPrizePlayer } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[1].participant,
//                             description: 'Winner REME',
//                             debit: winningPrizePlayer,
//                             credit: 0
//                         }, { session })
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[0].participant }, { $inc: { balance: refundAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[0].participant,
//                             description: `Refund hoster's WLS (REME)`,
//                             debit: refundAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations ${updatedRoomInfo.spinTemp[1].username}! Your balance has been updated!`);
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations ${updatedRoomInfo.spinTemp[1].username}! Your balance has been updated!`);
//                     }
//                 } else if (updatedRoomInfo.spinTemp[0].remeNumber === updatedRoomInfo.spinTemp[1].remeNumber) {
//                     if (updatedRoomInfo.spinTemp[1].role === 'hoster') {
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[1].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[1].participant,
//                             description: `Winner REME`,
//                             debit: winningPrizeAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations Hoster! Your balance has been updated!`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations Hoster! Your balance has been updated!`)
//                     } else if (updatedRoomInfo.spinTemp[0].role === 'hoster') {
//                         await db.collection('User').updateOne({ participant: updatedRoomInfo.spinTemp[0].participant }, { $inc: { balance: winningPrizeAdmin } }, { session });
//                         await db.collection('UserTransaction').insertOne({
//                             playRoomID: updatedRoomInfo._id,
//                             participant: updatedRoomInfo.spinTemp[0].participant,
//                             description: `Winner REME`,
//                             debit: winningPrizeAdmin,
//                             credit: 0
//                         }, { session })
//                         await db.collection('PlayRoom').updateOne({ _id: new ObjectId(String(ongoingPlayRoom._id)), status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
//                         await whatsappClient.sendMessage(updatedRoomInfo.participants[0].participant, `Congratulations Hoster! Your balance has been updated!`)
//                         return await whatsappClient.sendMessage(updatedRoomInfo.participants[1].participant, `Congratulations Hoster! Your balance has been updated!`)
//                     }
//                 }
//             })
//         }
//         res.status(201).json({ message: 'Game has been validated successfully!' });
//     } catch (error) {
//         console.log(error);
//     }
// })

app.get('/queue', async (req, res) => {
    try {
        const fetchList = db.collection('PlayQueue').find()
        let queueList = "Here is the queue's lists: "
        for await (const doc of fetchList) {
            if (doc.status === 'waiting') {
                queueList += `\n\nusername: ${doc.username}\ngame: ${doc.game}\nbet amount: ${doc.bet}`
            }
        }
        await whatsappClient.sendMessage(msg.from, queueList)
        res.status(200).json({message: 'The message has been sent successfully'})
    } catch (error) {
        console.log(error);
    }
})

app.post('/cancel', async (req, res) => {
    const {sender, msg} = req.body
    const session = client.startSession();
    session.startTransaction();
    try {
        const fetchList = db.collection('PlayQueue').find({ participant: sender, status: 'waiting' });
        const playerQueueList = await fetchList.toArray();
        if (playerQueueList.length === 0) return await whatsappClient.sendMessage(msg.from, `+${sender.split("@")[0]}, You do not have any queues!`)
        let totalRefund = 0;

        for (const el of playerQueueList) {
            totalRefund += +el.bet;
        }

        await Promise.all(playerQueueList.map((el) => db.collection('PlayQueue').deleteOne({ _id: el._id }, { session })));
        await db.collection('User').updateOne({ participant: sender }, { $inc: { balance: totalRefund } }, { session });
        await db.collection('UserTransaction').insertOne({
            participant: sender,
            description: 'Cancel Queues',
            debit: totalRefund,
            credit: 0,
            cancelledQueueList: playerQueueList
        }, { session })
        await session.commitTransaction();
        await whatsappClient.sendMessage(msg.from, `All of +${sender.split("@")[0]}'s queues has been deleted! Please check your balance!`)
        res.status(201).json({message: 'All of the queues has been deleted!'})
    } catch (err) {
        await session.abortTransaction();
        console.error(err);
    } finally {
        session.endSession();
    }
})

app.get('/testing', async (req, res) => {
    await whatsappClient.sendMessage('6281372390237@c.us', 'ini testing')
    res.status(200).json({ message: 'The message has been delivered successfully!' })
})

cron.schedule('*/1 * * * *', async () => {
    await checkHoster();
    // await checkNoSpin();
})

app.listen(process.env.PORT, () => {
    console.log(`ExpressJS connected to port ${process.env.PORT}`);
})