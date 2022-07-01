#!/usr/bin/env node

import fs from 'fs';
import { fetchRequest } from './fetchRequest.js';
import { globalOptions } from './bulkapi.js';
let instanceUrl = '', rootPath = '';
async function createQueryJob(query, fileName) {
    let queryRequest = JSON.stringify({
        "operation": "query",
        "query": query,
        "contentType": "CSV",
        "columnDelimiter": "COMMA",
        "lineEnding": "CRLF"
    });
    const uri = instanceUrl + 'jobs/query';
    const createJobResponse = await fetchRequest(uri, '', 'POST', 'JSON', queryRequest);
    if (createJobResponse && createJobResponse.id) {
        const responseObject = await getQueryJobStatus(createJobResponse.id, fileName);
        return responseObject;
    } else {
        const errorMessage = createJobResponse[0] && createJobResponse[0].errorCode ? `${createJobResponse[0].errorCode}\n${createJobResponse[0].message}\nThe query is not correct "${globalOptions.soql}"` : 'Error encountered';
        console.log(errorMessage);
    }
}
async function getQueryJobStatus(queryJobId, fileName) {
    const uri = instanceUrl + 'jobs/query/' + queryJobId;
    rootPath = `${globalOptions.rootPath}${queryJobId}/`;
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
    }
    let jobStatus = await fetchRequest(uri, '', 'GET', 'JSON');
    console.log(`Query job (${queryJobId}) status for ${fileName} is ${jobStatus.state}`);
    const jobStates = ['JobComplete', 'Aborted', 'Failed'];
    if (jobStatus && jobStatus.state && !jobStates.includes(jobStatus.state)) {
        getQueryJobStatus(queryJobId, fileName);
    } else {
        const result = await getQueryResult(queryJobId, fileName);
        return result;
    }
}
async function getQueryResult(queryJobId, fileName) {
    const uri = `${instanceUrl}jobs/query/${queryJobId}/results?maxRecords=5000000`;
    const queryResult = await fetchRequest(uri, { 'Accept': 'test/csv' }, 'GET', 'TEXT');
    const filePath = `${rootPath}${fileName}.csv`;
    fs.writeFileSync(filePath, queryResult);
}


async function getAllFields() {
    const uri = `${globalOptions.bulkApiBaseUrl}sobjects/${globalOptions.objectName}/describe`;
    const allFields = await fetchRequest(uri, '', 'GET', 'JSON');
    let fields = ['Id'], compoundFields = [];
    if (allFields && allFields[0] && allFields[0].errorCode) {
        console.log(`
        Error while getting fields for the ${globalOptions.objectName} sObject
        ${allFields[0].errorCode}
        ${allFields[0].message}
        `);
        process.exit();
    } else if (allFields){
        allFields.fields.sort((a, b) => a.name > b.name ? 1 : -1).forEach(field => {
            if (field.name !== 'Id') {
                fields.push(field.name);
            }
            if (field.compoundFieldName) {
                compoundFields.push(field.compoundFieldName);
            }
        });
        return fields.filter(f => !compoundFields.filter((v, i, a) => a.indexOf(v) === i).includes(f)).join(',');
    }
}

async function queryJob() {
    instanceUrl = globalOptions.bulkApiBaseUrl;
    globalOptions.soql = await getSoql();
    if (globalOptions.displayAllFields) {
        console.log(globalOptions.soql);
    }
    createQueryJob(globalOptions.soql, globalOptions.objectName);
}

async function getSoql() {
    globalOptions.soql = globalOptions.soql.toUpperCase();
    const checkAllFields = globalOptions.soql.substring(
        6,
        globalOptions.soql.indexOf("FROM")
    ).trim().split(',').find(f => f.trim() === 'ALL' || f.trim() === 'ALLFIELDS' || f.trim() === '*')?.trim();
    if (checkAllFields) {
        const allFields = await getAllFields();
        globalOptions.soql = globalOptions.soql.replace(checkAllFields, allFields);
    }
    return globalOptions.soql;
}

export { queryJob };