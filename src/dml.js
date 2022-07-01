#!/usr/bin/env node

import fs from 'fs';
import { fetchRequest } from './fetchRequest.js';
import { globalOptions } from './bulkapi.js';
let instanceUrl = '', rootPath = '';

async function createDMLJob(object, operation, filePath, lineEnding = 'CRLF') {
    let dmlJobBody = JSON.stringify({
        "operation": operation,
        "object": object,
        "lineEnding" : lineEnding
    });
    const uri = instanceUrl + 'jobs/ingest';
    const createJobResponse = await fetchRequest(uri, '', 'POST', 'JSON', dmlJobBody);
    if (createJobResponse && createJobResponse.id) {
        await uploadFile(createJobResponse.id, filePath);
    } else {
        console.log('Create DML Job failed ', createJobResponse);
    }
}

async function uploadFile(dmlJobId, filePath) {
    rootPath = `${globalOptions.rootPath}${dmlJobId}/`;
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
    }
    const fileData = fs.readFileSync(filePath, "utf8");

    const uri = `${instanceUrl}jobs/ingest/${dmlJobId}/batches`;
    const uploadFileResponse = await fetchRequest(uri, { 'Content-Type': 'text/csv' }, 'PUT', 'OBJECT', fileData);
    if (uploadFileResponse.status === 201) {
        await closeJob(dmlJobId);
    } else {
        console.log('Upload file call failed.', uploadFileResponse);
    }
}

async function closeJob(dmlJobId) {
    const closeJobUri = `${instanceUrl}jobs/ingest/${dmlJobId}`;
    const closeJobResponse = await fetchRequest(closeJobUri, { 'Accept': 'application/json' }, 'PATCH', 'OBJECT', JSON.stringify({
        "state": "UploadComplete"
    }));
    if (closeJobResponse.status === 200) {
        await dmlJobStatus(dmlJobId);
    } else {
        console.error('Closed api call failed.', closeJobResponse);
    }
}

async function dmlJobStatus(dmlJobId) {
    const uri = `${instanceUrl}jobs/ingest/${dmlJobId}`;
    let jobStatus = await fetchRequest(uri, '', 'GET');
    console.log(`DML Job (${dmlJobId}) Status is ${jobStatus.state}`);
    const jobStates = ['JobComplete', 'Aborted', 'Failed'];
    if (jobStatus && jobStatus.state && !jobStates.includes(jobStatus.state)) {
        dmlJobStatus(dmlJobId);
    } else {
        await getDmlResult(dmlJobId);
    }
}
async function getDmlResult(dmlJobId) {
    const successfulUri = `${instanceUrl}jobs/ingest/${dmlJobId}/successfulResults`;
    const successfuldata = await fetchRequest(successfulUri, { 'Accept': 'test/csv' }, 'GET', 'TEXT');
    const successfulResultsFilePath = `${rootPath}${globalOptions.objectName}-successfulResults.csv`;
    const failedUri = `${instanceUrl}jobs/ingest/${dmlJobId}/failedResults`;
    const faileddata = await fetchRequest(failedUri, { 'Accept': 'test/csv' }, 'GET', 'TEXT');
    const failedResultsFilePath = `${rootPath}${globalOptions.objectName}-failedResults.csv`;
    const unprocessedUri = `${instanceUrl}jobs/ingest/${dmlJobId}/unprocessedrecords`;
    const unprocesseddata = await fetchRequest(unprocessedUri, { 'Accept': 'test/csv' }, 'GET', 'TEXT');
    const unprocessedResultsFilePath = `${rootPath}${globalOptions.objectName}-unprocessedResults.csv`;
    console.log(`Please check the result under ${rootPath} folder.`);
    fs.writeFileSync(successfulResultsFilePath, successfuldata);
    fs.writeFileSync(failedResultsFilePath, faileddata);
    fs.writeFileSync(unprocessedResultsFilePath, unprocesseddata);
}

function dmlJob() {
    instanceUrl = globalOptions.bulkApiBaseUrl;
    createDMLJob(globalOptions.objectName, globalOptions.operation, globalOptions.file, globalOptions.lineEnding);
}
export { dmlJob };