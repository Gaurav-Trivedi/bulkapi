#!/usr/bin/env node

import { exec } from 'child_process';
import { options } from "./commands.js";
import { queryJob } from './query.js';
import { dmlJob } from './dml.js';
const os = new os_func();
let globalOptions = {};

function os_func() {
    this.execCommand = function (cmd, callback) {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${JSON.parse(stdout).message}`);
                return;
            }
            callback(stdout);
        });
    }
}
function initiateProcess() {
    let command = "sfdx auth:web:login -r https://test.salesforce.com --json";
    if (options.userName) {
        command = `sfdx force:org:display --json -u ${options.userName}`
    } else if (options.production) {
        command = "sfdx auth:web:login -r https://login.salesforce.com --json";
    }
    os.execCommand(command, function (shellResponse) {
        const loginResult = JSON.parse(shellResponse).result;
        options.bulkApiBaseUrl = `${loginResult.instanceUrl}/services/data/v54.0/`;
        options.instanceName = loginResult.instanceUrl.substring(
            loginResult.instanceUrl.indexOf("/") + 1,
            loginResult.instanceUrl.indexOf(".")
        ).replace("/", "");
        options.rootPath = `${process.cwd()}/bulkApi-output/${options.instanceName}/`;
        globalOptions = { ...options, ...loginResult };
        const operations = ['update', 'insert', 'upsert', 'delete', 'harddelete'];
        if (options.soql) {
            queryJob();
        } else if (operations.includes(options.operation.toLowerCase())) {
            dmlJob();
        }
    });
}
initiateProcess();

export { globalOptions };