'use strict'
const parser = require('lambda-multipart-parser')
const { simpleParser } = require('mailparser')
const dynamodb = require('serverless-dynamodb-client')
const docClient = dynamodb.doc

const mailTable = process.env.MAIL_TABLE

function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  }
}

function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1
  } else return 1
}

module.exports.parseMail = async (event) => {
  const result = await parser.parse(event)
  await simpleParser(result.email, null, (err, parsed) => {
    if (err) {
      console.log(err)
    } else {
      const parsedMail = {
        MessageId: parsed.messageId,
        createdAt: new Date(parsed.date).toISOString(),
        from: parsed.from,
        to: parsed.to,
        message: parsed.textAsHtml,
        subject: parsed.subject,
        inReplyTo: parsed.inReplyTo ? parsed.inReplyTo : '',
        cc: parsed.cc ? parsed.cc : '',
        bcc: parsed.bcc ? parsed.bcc : '',
      }
      docClient
        .put({
          TableName: mailTable,
          Item: parsedMail,
        })
        .promise()
        .then(() => {
          console.log(parsedMail)
        })
        .catch((err) => console.log(err))
    }
  })
}

// Get all mail
module.exports.getAllMail = (event, context, callback) => {
  return docClient
    .scan({
      TableName: mailTable,
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)))
    })
    .catch((err) => callback(null, response(err.statusCode, err)))
}
