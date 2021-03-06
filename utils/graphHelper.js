/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

const request = require('superagent');

/**
 * Generates a GET request the user endpoint.
 * @param {string} accessToken The access token to send with the request.
 * @param {Function} callback
 */
function getUserData(accessToken, callback) {
  request
    .get('https://graph.microsoft.com/v1.0/me')
    .set('Authorization', 'Bearer ' + accessToken)
    .end((err, res) => {
      callback(err, res);
    });
}

/**
 * Generates a GET request for the user's profile photo.
 * @param {string} accessToken The access token to send with the request.
 * @param {Function} callback
//  */
function getProfilePhoto(accessToken, callback) {
  // Get the profile photo of the current user (from the user's mailbox on Exchange Online).
  // This operation in version 1.0 supports only work or school mailboxes, not personal mailboxes.
  request
    .get('https://graph.microsoft.com/v1.0/me/photo/$value')
    .set('Authorization', 'Bearer ' + accessToken)
    .end((err, res) => {
      // Returns 200 OK and the photo in the body. If no photo exists, returns 404 Not Found.
      callback(err, res.body);
    });
}

/**
 * Generates a PUT request to upload a file.
 * @param {string} accessToken The access token to send with the request.
 * @param {Function} callback
//  */
function uploadFile(accessToken, file, callback) {
  // This operation only supports files up to 4MB in size.
  // To upload larger files, see `https://developer.microsoft.com/graph/docs/api-reference/v1.0/api/item_createUploadSession`.
  request
    .put('https://graph.microsoft.com/v1.0/me/drive/root/children/mypic.jpg/content')
    .send(file)
    .set('Authorization', 'Bearer ' + accessToken)
    .set('Content-Type', 'image/jpg')
    .end((err, res) => {
      // Returns 200 OK and the file metadata in the body.
      callback(err, res.body);
    });
}

// Get file id in one drive
function getDriveFileList(accessToken, callback) {

  request
    .get('https://graph.microsoft.com/v1.0/me/drive/root:/template:/children')
    .set('Authorization', 'Bearer' + accessToken)
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      callback(err, res.body)
    })
}

const driveRef = {
    "name": "test_" + Math.random().toString(36).slice(18) + ".xlsx",
    "parentReference": {
      "driveId": "b!DaqL0VWpbUevXFrDOUQxDMVDOfO0DENGtgQL1ZSsmK1IR1FBK5k3Qp1pAt03h704"
    }
 }

function copyFileFromDrive(accessToken, fileId, callback) {
  request
    .post('https://graph.microsoft.com/v1.0/me/drive/items/' + fileId  + '/copy')
    .send(driveRef)
    .set('Authorization', 'Bearer ' + accessToken)
    .set('Content-type', 'application/json')
    .end((err, res) => {
      let link = res.headers.location;
        callback (err, getFileId(accessToken, link))
        //   fileId = link.slice(link.indexOf('items/') + 6, link.indexOf('?'))
        //   console.log(res)
        //  callback (err, fileId)
    })
}        

function getFileId (accessToken, link) {
  request
   .get(link)
   .set('Content-type', 'application/json')
   .end((err, res) => {
     if (!err) {
       console.log(res)
     }
   })
}

const data = {
  "values": [["id", "123456"]]
}

function insertDataToExcel(accessToken, fileId, callback) {
  request
   .patch("https://graph.microsoft.com/v1.0/me/drive/items/" +fileId+ "/workbook/worksheets('Sheet1')/range(address='A1:B1')")
   .send(data)
   .set('Authorization', 'Bearer ' + accessToken)
   .set('Content-type', 'application/json')
   .end((err, res) => {
     let msg = "Address: " + res.body.address + " is inserted with values " + res.body.values[0] 
     callback(err, msg)
   })
}

/**
 * Generates a POST request to create a sharing link (if one doesn't already exist).
 * @param {string} accessToken The access token to send with the request.
 * @param {string} id The ID of the file to get or create a sharing link for.
 * @param {Function} callback
//  */
// See https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/item_createlink
function getSharingLink(accessToken, id, callback) {
  request
    .post('https://graph.microsoft.com/v1.0/me/drive/items/' + id + '/createLink')
    .send({ type: 'view' })
    .set('Authorization', 'Bearer ' + accessToken)
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      // Returns 200 OK and the permission with the link in the body.
      callback(err, res.body.link.webUrl);
    });
}

/**
 * Generates a POST request to the SendMail endpoint.
 * @param {string} accessToken The access token to send with the request.
 * @param {string} data The data which will be 'POST'ed.
 * @param {Function} callback
 * Per issue #53 for BadRequest when message uses utf-8 characters:
 * `.set('Content-Length': Buffer.byteLength(mailBody,'utf8'))`
 */
function postSendMail(accessToken, message, callback) {
  request
    .post('https://graph.microsoft.com/v1.0/me/sendMail')
    .send(message)
    .set('Authorization', 'Bearer ' + accessToken)
    .set('Content-Type', 'application/json')
    .set('Content-Length', message.length)
    .end((err, res) => {
      // Returns 202 if successful.
      // Note: If you receive a 500 - Internal Server Error
      // while using a Microsoft account (outlook.com, hotmail.com or live.com),
      // it's possible that your account has not been migrated to support this flow.
      // Check the inner error object for code 'ErrorInternalServerTransientError'.
      // You can try using a newly created Microsoft account or contact support.
      callback(err, res);
    });
}

exports.getUserData = getUserData;
exports.getProfilePhoto = getProfilePhoto;
exports.uploadFile = uploadFile;
exports.getSharingLink = getSharingLink;
exports.postSendMail = postSendMail;
exports.getDriveFileList = getDriveFileList;
exports.copyFileFromDrive = copyFileFromDrive;
exports.insertDataToExcel = insertDataToExcel;