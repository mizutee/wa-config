const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { db, client } = require('./mongodbConnection');
const { senderNumber, allGameFinished, checkOngoingPlayRoom, checkRoomInfo, bothPlayersInputLife, randomizeNumber, bothPlayersSFL, stillHasLifes, checkUsernameRegister, isAdmin, newDateNow, checkWinner } = require('./helper');
const { ObjectId } = require('mongodb');
const { default: axios } = require('axios');

const whatsappClient = new Client({
    authStrategy: new LocalAuth,
    webVersion: "2.2412.54",
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

whatsappClient.on('qr', (qr) => {
    qrcode.generate(qr, { type: 'image' });
});

whatsappClient.on('ready', async () => {
    // await whatsappClient.sendMessage('120363305913636485@g.us', `Hello!\nWe're now online!`)
    // await whatsappClient.sendMessage('120363306085218728@g.us', `Hello!\nWe're now online!`)
    console.log('client is ready!');
});

// whatsappClient.on('message', async (msg) => {
//     try {
//         if (msg.from !== 'status@broadcast') {
//             // console.log(msg);
//             const contact = await msg.getContact();
//             // console.log(msg)
//             const sender = senderNumber(msg);
//             const msgBotNumber = '6281372390472'
//             const url = `http://localhost:${process.env.PORT}/spin?botnumber=${msgBotNumber}`
//             const command = msg.body.split(" ")[0].toLowerCase()
//             const chat = await whatsappClient.getChatById(msg.from);
//             const ongoingPlayRoom = await checkOngoingPlayRoom(sender);
//             const finishedPlayRoom = await allGameFinished(msg.from);
//             // console.log(ongoingPlayRoom)
//             let adminList = [];
//             chat.participants?.forEach(el => {
//                 if (el.isAdmin || el.isSuperAdmin) {
//                     adminList.push({
//                         participant: el.id._serialized,
//                         isAdmin: true
//                     })
//                 }
//             });
//             // if (ongoingPlayRoom && ongoingPlayRoom.game === 'CSN' && !msg.id.participant) {
//             //     const roomInfo = ongoingPlayRoom;
//             //     // const ongoingRoom = await db.collection('PlayRoom').findOne({ "participants.participant": sender, status: { $ne: 'Finished' } })
//             //     const ongoingRoom = roomInfo;
//             //     if (!roomInfo) {
//             //         return whatsappClient.sendMessage(msg.from, 'The game is no longer valid or finished!')
//             //     }
//             //     if (command === '/mygame' && ongoingRoom !== null) {
//             //         return await whatsappClient.sendMessage(msg.from, `${ongoingRoom.participants[0].participant} vs ${ongoingRoom.participants[1].participant}\nGame ID: ${ongoingRoom._id}\nSend this id to admins or info group if you got problem!`)
//             //     }
//             //     if (ongoingRoom.lifeStatus === "Undecided") {
//             //         if (command === '/life') {
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/csnlife`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //         }
//             //     }
//             //     if (ongoingRoom.lifeStatus === "SFL") {
//             //         if (command === '/sfl') {
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/csnsfl`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //         }
//             //     }
//             //     if (ongoingRoom.status === 'Ongoing') {
//             //         if (command === '/go') {
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/csngo`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //         }
//             //     }
//             //     if (ongoingRoom.status === 'Playing') {
//             //         if (command === '/spin') {
//             //             try {
//             //                 await axios({
//             //                     method: 'post',
//             //                     url: `http://localhost:${process.env.PORT}/spin`,
//             //                     data: {
//             //                         msg,
//             //                         ongoingRoom,
//             //                         ongoingPlayRoom
//             //                     },
//             //                 })
//             //                 await axios({
//             //                     method: 'post',
//             //                     url: `http://localhost:${process.env.PORT}/validatespin`,
//             //                     data: {
//             //                         ongoingPlayRoom
//             //                     },
//             //                 })
//             //             } catch (error) {
//             //                 console.log(error);
//             //             }
//             //         }
//             //     }
//             // };

//             // if (ongoingPlayRoom && ongoingPlayRoom.game === 'REME' && !msg.id.participant) {
//             //     const ongoingRoom = ongoingPlayRoom;
//             //     if (ongoingRoom.status === 'Ongoing') {
//             //         if (command === '/go') {
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/remego`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingPlayRoom
//             //                 }
//             //             });
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/validateremego`,
//             //                 data: {
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //         }
//             //     }

//             //     if (ongoingRoom.status === 'Playing') {
//             //         if (command === '/spin') {
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/spinreme`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingRoom,
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //             await axios({
//             //                 method: 'post',
//             //                 url: `http://localhost:${process.env.PORT}/validateremespin`,
//             //                 data: {
//             //                     msg,
//             //                     ongoingRoom,
//             //                     ongoingPlayRoom
//             //                 }
//             //             })
//             //         }
//             //     }
//             // }

//             if (msg.from === '120363306085218728@g.us') {
//                 if (command === '/csn') {
//                     let result = await axios({
//                         method: 'post',
//                         url: `http://localhost:${process.env.PORT}/csn`,
//                         data: {
//                             msg
//                         }
//                     })
//                     const {newRoomInfo} = result.data;
//                     if (newRoomInfo) {
//                         await axios({
//                             method: 'post',
//                             url: `http://localhost:${process.env.PORT}/sendconfirmationmessage?wanumber=${newRoomInfo.bot}`,
//                             data: {
//                                 newRoomInfo
//                             }
//                         })
//                     }
//                 }

//                 // if (command === '/reme') {
//                 //     await axios({
//                 //         method: 'post',
//                 //         url: `http://localhost:${process.env.PORT}/reme`,
//                 //         data: {
//                 //             msg
//                 //         }
//                 //     })
//                 // }

//                 // if (command === '/host') {
//                 //     let amount = msg.body.split(" ")[1];
//                 //     amount = Number(amount);

//                 //     if (isNaN(amount) || amount < 1) {
//                 //         return msg.reply(`Invalid Amount! Please input valid amount!`)
//                 //     };
//                 //     const user = await db.collection('User').findOne({ participant: sender });
//                 //     if (user.role !== 'hoster') return msg.reply(`You are not allowed to do this action!`);
//                 //     if (user.balance < (amount * 2)) return msg.reply(`You don't have enough balance to host the game!`)
//                 //     const findQueue = await db.collection('PlayQueue').findOne({
//                 //         bet: amount, participant: { $ne: user.participant }, status: 'waiting', game: 'REME'
//                 //     })
//                 //     const session = client.startSession();
//                 //     try {
//                 //         if (findQueue) {
//                 //             user.balance -= (amount * 2);
//                 //             await session.withTransaction(async () => {
//                 //                 await db.collection('User').updateOne(
//                 //                     { participant: user.participant },
//                 //                     { $set: { balance: user.balance } },
//                 //                     { session }
//                 //                 );
//                 //                 await db.collection('PlayQueue').deleteOne({ _id: new ObjectId(findQueue._id) }, { session });
//                 //                 const newRoom = await db.collection('PlayRoom').insertOne({
//                 //                     participants: [
//                 //                         {
//                 //                             username: findQueue.username,
//                 //                             participant: findQueue.participant,
//                 //                             life: 1,
//                 //                             goStatus: 'no'
//                 //                         },
//                 //                         {
//                 //                             username: user.username,
//                 //                             participant: user.participant,
//                 //                             life: 1,
//                 //                             goStatus: 'no',
//                 //                             role: 'hoster'
//                 //                         }
//                 //                     ],
//                 //                     totalAmount: +findQueue.bet * 2,
//                 //                     hosterHold: +findQueue.bet,
//                 //                     status: 'Ongoing',
//                 //                     game: 'REME',
//                 //                     spinTemp: [],
//                 //                     rematch: 'no',
//                 //                     rematchInfo: [],
//                 //                     createdAt: newDateNow()
//                 //                 }, { session });
//                 //                 await db.collection('UserTransaction').insertOne({
//                 //                     participant: user.participant,
//                 //                     description: 'Host REME Queue',
//                 //                     queueID: findQueue._id,
//                 //                     playRoomID: newRoom.insertedId,
//                 //                     debit: 0,
//                 //                     credit: (amount * 2)
//                 //                 }, { session })
//                 //                 await db.collection('UserTransaction').updateOne(
//                 //                     { queueID: new ObjectId(findQueue._id) },
//                 //                     { $set: { playRoomID: newRoom.insertedId } },
//                 //                     { session }
//                 //                 );
//                 //                 await whatsappClient.sendMessage(msg.from, `${user.participant}, ${findQueue.participant}, You have been invited to the Play Room, if you disabled invitation from unknown number, please check your WhatsApp message for invitation links!`)
//                 //                 await whatsappClient.sendMessage(user.participant, `You are now up against ${findQueue.participant}\nPlease do /go to start the game!`)
//                 //                 await whatsappClient.sendMessage(findQueue.participant, `You are now up against ${user.participant}\nPlease do /go to start the game!`)
//                 //             })
//                 //         }
//                 //         session.endSession();
//                 //     } catch (error) {
//                 //         console.log(error);
//                 //         await session.abortTransaction();
//                 //         session.endSession();
//                 //         msg.reply(`Error while creating game: ${error}`)
//                 //     }
//                 // }

//                 if (command === '/queue') {
//                     // const fetchList = db.collection('PlayQueue').find()
//                     // let queueList = "Here is the queue's lists: "
//                     // for await (const doc of fetchList) {
//                     //     if (doc.status === 'waiting') {
//                     //         queueList += `\n\nusername: ${doc.username}\ngame: ${doc.game}\nbet amount: ${doc.bet}`
//                     //     }
//                     // }
//                     // return msg.reply(queueList)
//                     await axios({
//                         method: 'get',
//                         url: `http://localhost:${process.env.PORT}/queue`,
//                         data: {
//                             msg
//                         }
//                     })
//                 }

//                 if (command === '/cancel') {
//                     // const session = client.startSession();
//                     // session.startTransaction();
//                     // try {
//                     //     const fetchList = db.collection('PlayQueue').find({ participant: sender, status: 'waiting' });
//                     //     const playerQueueList = await fetchList.toArray();
//                     //     if (playerQueueList.length === 0) return msg.reply('You do not have any queues!')
//                     //     let totalRefund = 0;

//                     //     for (const el of playerQueueList) {
//                     //         totalRefund += +el.bet;
//                     //     }

//                     //     await Promise.all(playerQueueList.map((el) => db.collection('PlayQueue').deleteOne({ _id: el._id }, { session })));
//                     //     await db.collection('User').updateOne({ participant: sender }, { $inc: { balance: totalRefund } }, { session });
//                     //     await db.collection('UserTransaction').insertOne({
//                     //         participant: sender,
//                     //         description: 'Cancel Queues',
//                     //         debit: totalRefund,
//                     //         credit: 0,
//                     //         cancelledQueueList: playerQueueList
//                     //     }, { session })
//                     //     await session.commitTransaction();
//                     //     msg.reply(`All of your queues has been deleted! Please check your balance!`)
//                     // } catch (err) {
//                     //     await session.abortTransaction();
//                     //     console.error(err);
//                     // } finally {
//                     //     session.endSession();
//                     // }
//                     await axios({
//                         method: 'post',
//                         url: `http://localhost:${process.env.PORT}/cancel`,
//                         body: {
//                             sender,
//                             msg
//                         }
//                     })
//                 }

//                 if (command === '/giveaccess') {
//                     const session = client.startSession();
//                     const senderIsAdmin = isAdmin(adminList, sender)
//                     if (!senderIsAdmin) return msg.reply(`You can't do this action!`)
//                     const username = msg.body.split(" ")[1];
//                     const time = parseInt(msg.body.split(" ")[2]);
//                     if (!time) return msg.reply(`Please input valid time!`)
//                     const userInfo = await db.collection('User').findOne({ username: username });
//                     if (!userInfo) return msg.reply(`Username not found! Please check again!`)
//                     const dateNow = newDateNow();
//                     await session.withTransaction(async () => {
//                         if (userInfo.expiredDate) {
//                             let newExpire;
//                             if (userInfo.expiredDate < dateNow) {
//                                 newExpire = new Date(dateNow.getTime() + (1000 * 60 * 60 * time));
//                                 await db.collection('User').updateOne({ username: username }, { $set: { expiredDate: newExpire, role: 'hoster' } }, { session });
//                                 return msg.reply(`User with nickname ${username} has given 'hoster' role for ${time} Hours!`)
//                             } else if (userInfo.expiredDate > dateNow) {
//                                 newExpire = new Date(userInfo.expiredDate.getTime() + (1000 * 60 * 60 * time));
//                                 await db.collection('User').updateOne({ username: username }, { $set: { expiredDate: newExpire, role: 'hoster' } }, { session });
//                                 return msg.reply(`User with nickname ${username} has given 'hoster' role for ${time} Hours!`)
//                             }
//                         } else {
//                             newExpire = new Date(dateNow.getTime() + (1000 * 60 * 60 * time));
//                             await db.collection('User').updateOne({ username: username }, { $set: { expiredDate: newExpire, role: 'hoster' } }, { session });
//                             return msg.reply(`User with nickname ${username} has given 'hoster' role for ${time} Hours!`)
//                         }
//                     })
//                     await session.endSession();
//                 }
//             }

//             // if (msg.from === '120363310970299021@g.us') {
//             //     if (command === '/wd') {
//             //         const session = client.startSession();
//             //         let amount = msg.body.split(" ")[1];
//             //         if (!amount) return msg.reply(`Please input valid amount to withdraw!\nFor example: /wd 500 MYWORLD`)
//             //         amount = parseInt(amount);
//             //         if (amount < 100 || !amount) return msg.reply(`The minimum amount to withdraw is 100 World Locks!`)
//             //         const worldName = msg.body.split(" ")[2];
//             //         if (!worldName || worldName === "") return msg.reply(`Please input valid world name!\nFor example: /wd 500 MYWORLD`)
//             //         const userInfo = await db.collection('User').findOne({ participant: sender });
//             //         if (userInfo.balance < amount || isNaN(userInfo.balance)) {
//             //             return msg.reply(`You do not have enough balance!`)
//             //         }
//             //         await session.withTransaction(async () => {
//             //             await db.collection('User').updateOne({ participant: userInfo.participant }, { $inc: { balance: -amount } }, { session });
//             //             await db.collection('Withdrawal').insertOne({
//             //                 participant: userInfo.participant,
//             //                 amount: amount,
//             //                 worldName: worldName,
//             //                 status: 'active',
//             //                 createdAt: newDateNow(),
//             //                 updatedAt: newDateNow()
//             //             }, { session });
//             //             msg.reply('Your withdrawal is accepted! We will process it shortly!');
//             //         });
//             //     };
//             // }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// })

module.exports = whatsappClient;
