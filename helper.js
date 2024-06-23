require('dotenv').config();
const { db, client } = require('./mongodbConnection');
const whatsappClient = require('./index');
const { default: axios } = require('axios');

async function checkOngoingPlayRoom(playerId) {
    // console.log(playerId, "<< ini playerID")
    const playRoom = await db.collection('PlayRoom').find({ status: { $ne: 'Finished' } }).toArray();
    // console.log(playRoom);
    let flag = false
    let data;
    playRoom.forEach(async (el) => {
        el.participants.forEach(el2 => {
            if (el2.participant === playerId) {
                // console.log('masuk gak kesini')
                flag = true
                return data = el;
            }
        })
    })
    // console.log(data);
    return data
}

function senderNumber(message) {
    if (!message.id.participant) {
        return message.from
    } else {
        return message.id.participant
    }
}

async function allGameFinished(roomId) {
    let flag = true;
    const playRoom = await db.collection('PlayRoom').find({ groupId: roomId }).toArray();
    playRoom.forEach(el => {
        if (el.status !== 'Finished') {
            flag = false
        }
    })
    return flag
}

async function checkRoomInfo(playerId) {
    const roomInfo = await db.collection('PlayRoom').findOne({ "participants.participant": playerId, status: { $ne: 'Finished' } })
    // console.log(roomInfo, "<<< ini roomInfo helper")
    return roomInfo
}

function bothPlayersInputLife(participants) {
    let flag = true
    participants.forEach(el => {
        if (el.life === "notdefined") {
            flag = false
        }
    })
    return flag
}

function bothPlayersSFL(participants) {
    let flag = true
    participants.forEach(el => {
        if (el.sfl === 'notdefined') {
            flag = false
        }
        if (el.sfl === 'tie') {
            flag = false
        }
    })
    return flag
}

function stillHasLifes(participants) {
    let flag = true
    participants.forEach(el => {
        if (el.life === 0 || el.life < 1) {
            flag = false
        }
    })
    return flag
}

function randomizeNumber() {
    const randomNumber = Math.floor(Math.random() * 37);
    return randomNumber
}

function checkUsernameRegister(username) {
    const flaggedSymbol = `~!@#$%^&*()-_=+{}[]|;:'"<,>.?/`
    let flag = true
    if (username.length < 8) {
        flag = false
    }
    for (let i = 0; i < username.length; i++) {
        for (let j = 0; j < flaggedSymbol.length; j++) {
            if (username[i] === flaggedSymbol[j]) {
                flag = false
            }
        }
    }
    return flag;
}

function isAdmin(adminList, participant) {
    let flag = false;
    adminList.forEach(el => {
        if ((participant === el.participant) && el.isAdmin) {
            flag = true
        }
    })
    return flag;
}

function newDateNow() {
    const result = new Date(new Date().getTime() + (1000 * 60 * 60 * 7))
    return result;
}

async function checkHoster() {
    const userList = await db.collection('User').find().toArray();
    for (const user of userList) {
        if (user.role === 'hoster') {
            if (user.expiredDate < newDateNow()) {
                await db.collection('User').updateOne({ participant: user.participant }, { $set: { role: 'player' } })
            }
        }
    }
}

async function checkNoSpin() {
    const activeRoom = await db.collection('PlayRoom').find({ status: { $ne: 'Finished' } }).toArray();
    activeRoom.forEach(async (el) => {
        const difference = newDateNow() - el.updatedAt;
        const session = client.startSession();
        if (difference >= 60000) {
            await session.withTransaction(async () => {
                if (el.spinTemp.length === 0) {
                    await whatsappClient.sendMessage(el.participants[0].participant, `You have unfinished game! Please /spin to continue the game!\nOr if you have any problem, contact your nearby Admins!`)
                    await whatsappClient.sendMessage(el.participants[1].participant, `You have unfinished game! Please /spin to continue the game!\nOr if you have any problem, contact your nearby Admins!`)
                } else if (el.spinTemp.length === 1) {
                    el.participants.forEach(async (el2) => {
                        if (el2.participant !== el.spinTemp[0].participant) {
                            const randomNumber = randomizeNumber();
                            const ongoingPlayRoom = await db.collection('PlayRoom').findOneAndUpdate({ _id: new ObjectId(String(el._id)) }, { $push: { spinTemp: { participant: el2.participant, number: randomNumber } } }, { session, returnDocument: 'after' });
                            await whatsappClient.sendMessage(el2.participant, `You didn't do /spin for 1 minute! You got spun by system and got ${randomNumber}`);
                            await axios({
                                method: 'post',
                                url: `http://localhost:${process.env.PORT}/validatespin`,
                                data: {
                                    ongoingPlayRoom
                                }
                            })
                        }
                    })
                }
            })
        }
        session.endSession();
    })
}

async function checkWinner(updatedData, ongoingPlayRoom, updatedRoomInfo) {
    const session = client.startSession();
    let winner;
    updatedData.participants.forEach(el => {
        if (el.life > 0) {
            winner = el
        }
    })
    let res;
    // session.startTransaction();
    await session.withTransaction(async () => {
        const winningData = await db.collection('User').findOne({ participant: winner.participant }, { session })
        res = winningData;
        let winningAmount = Math.floor(updatedData.totalAmount * 95 / 100);
        // console.log(winningAmount, "<<< ini hasil menang")
        await db.collection('User').updateOne({ participant: winner.participant }, { $set: { balance: winningAmount + winningData.balance } }, { session })
        await db.collection('UserTransaction').insertOne({
            playRoomID: updatedRoomInfo._id,
            participant: winner.participant,
            description: 'Winner CSN',
            debit: parseInt(winningAmount),
            credit: 0
        }, { session })
        await db.collection('PlayRoom').updateOne({ _id: ongoingPlayRoom._id, status: { $ne: 'Finished' } }, { $set: { status: 'Finished', finishedTime: newDateNow() } }, { session })
        await db.collection('IncomeTeam').insertOne({
            playRoomID: updatedRoomInfo._id,
            debit: updatedData.totalAmount - winningAmount,
            credit: 0,
            createdAt: newDateNow()
        }, { session })
    })
    return res;
}

async function countWinRate(participant) {
    const data = await db.collection('PlayRoom').find().toArray();
    let temp = [];
    let winCount = 0;
    let winrate;

    data.forEach(el => {
        if (el.status === 'Finished') {
            el.participants.forEach(el2 => {
                if (el2.participant === participant) {
                    temp.push(el2)
                }
            })
        }
    });
    temp.forEach(el => {
        if (el.life > 0) {
            winCount++
        }
    })
    winrate = (winCount / temp.length) * 100;

    return {
        winrate: `${winrate}%`,
        totalGame: temp.length
    }
}

const data = async () => {
    const data2 = await db.collection('IncomeTeam').find().toArray();
    const dateten = new Date(newDateNow().getTime() - (60 * 1000 * 60 * 3));
    let totalAmount = 0;
    data2.forEach(el => {
        if (el.createdAt > dateten) {
            totalAmount += el.debit
        } 
    })
    console.log(totalAmount)
}

data();

// console.log(newDateNow() > dateten)

module.exports = { checkNoSpin, countWinRate, checkWinner, allGameFinished, checkOngoingPlayRoom, checkRoomInfo, bothPlayersInputLife, randomizeNumber, bothPlayersSFL, stillHasLifes, checkUsernameRegister, isAdmin, newDateNow, checkHoster, senderNumber }