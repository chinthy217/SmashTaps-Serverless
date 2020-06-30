/* eslint-disable no-undef */
'use strict'
const dynamodb = require('serverless-dynamodb-client')
const docClient = dynamodb.doc

const { v4: uuidv4 } = require('uuid')

const postsTable = process.env.POSTS_TABLE

// Create a response
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

// Create a post
module.exports.createPost = (event, context, callback) => {
  const reqBody = JSON.parse(event.body)

  if (
    !reqBody.title ||
    reqBody.title.trim() === '' ||
    !reqBody.body ||
    reqBody.body.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Post must have a title and body and they must not be empty',
      })
    )
  }

  const post = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    userId: 1,
    title: reqBody.title,
    body: reqBody.body,
  }

  return docClient
    .put({
      TableName: postsTable,
      Item: post,
    })
    .promise()
    .then(() => {
      callback(null, response(201, post))
    })
    .catch((err) => response(null, response(err.statusCode, err)))
}

// Get all posts
module.exports.getAllPosts = (event, context, callback) => {
  return docClient
    .scan({
      TableName: postsTable,
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)))
    })
    .catch((err) => callback(null, response(err.statusCode, err)))
}
