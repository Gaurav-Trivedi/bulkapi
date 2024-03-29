#!/usr/bin/env node
import { Command } from 'commander';
const program = new Command();

program
    .name('sfdx-bulkapi')
    .description('Connect to SFDC and perform Bulk API operations')
    .version('4.0.1')
    .usage('-q "SELECT Id, LastName, CustomField__c FROM Contact"')
    .option('-p, --production', 'production')
    .option('-u, --user-name <value>', 'salesforce instance user name or alias, if already defined, the Salesforce instance')
    .option('-o, --operation <type>', 'Dml operation, required if operation is other than query, like:\n\t\t\t\t\tInsert, Update, Delete, Upsert, HardDelete')
    .option('-q, --soql <type>', 'SOQL Query, required if operation is query.')
    .option('-so, --object-name <type>', 'API Name of sObject, required if operation is other than query.')
    .option('-l, --line-ending <type>', 'Line Ending of CSV file default is CRLF. Can be changed to LF only.', 'CRLF')
    .option('-f, --file <type>', 'file path like "data/contact.csv", required if operation is update, insert, delete, upsert and harddelete')
    .option('-k, --sort-key <type>', 'Filed API name or column name to sort the data for batch processing')
    .option('-d, --display-all-fields', 'Get SOQL with all fields to be displayed in console. Only available if --soql is defined.')
    .option('-v, --api-version <type>', 'API version of Salesforce.', '55.0');

program.on('--help', function () {
    console.log(`
  Examples:

  To get help:
    $ sfdx-bulkapi --help
    $ sfdx-bulkapi -h

  Login to already authentacted Salesforce instance and using query operation:
    $ sfdx-bulkapi -u sf_instance_alias -q "SELECT Id, LastName, CustomField__c FROM Contact"

  Login to Salesforce production and using query operation:
    $ sfdx-bulkapi -p -q "SELECT Id, LastName, CustomField__c FROM Contact"

  Login to Salesforce sandbox instance:
    $ sfdx-bulkapi -q "SELECT Id, LastName, CustomField__c FROM Contact"

  DML operation in sandbox, id field is required in csv file:
    $ sfdx-bulkapi -o update -f data/contact.csv -so Account
  
  Delete records with soql
    $ sfdx-bulkapi -q "SELECT Id, FirstName, LastName FROM Contact" -o delete
        OR
    $ sfdx-bulkapi -q "SELECT Id, FirstName, LastName FROM Contact" -o hardDelete
`);
});

program.parse(process.argv);
const options = program.opts();

function validateOptions() {
    const operations = ['update', 'insert', 'upsert', 'delete', 'harddelete', 'query'];
    if (options.soql && options.operation && ['delete', 'harddelete'].includes(options.operation.toLowerCase())) {
        options.delete = true;
    } else if (options.soql) {
        options.operation = 'query';
    } else if (!options.operation) {
        console.log(`Please define operation, for more help use\n\t$ sfdx-bulkapi -h`);
        process.exit();
    }
    if (operations.includes(options.operation.toLowerCase()) && !options.delete) {
        options.operation = options.operation.toLowerCase();
        if (options.operation !== 'query' && !options.file) {
            console.log(`The file path is required. Use\n\t$ sfdx-bulkapi -o ${options.operation} -f /data/contact.csv -so Account `);
            process.exit();
        } else if (options.operation !== 'query' && !options.objectName) {
            console.log(`Object API name is required. Use\n\t$ sfdx-bulkapi -o ${options.operation} -f /data/contact.csv -so Account `);
            process.exit();
        } else if (options.operation === 'query' && !options.soql) {
            console.log(`SOQL attribute is required. Use\n\t$ sfdx-bulkapi -o ${options.operation} -q "SELECT Id, Name FROM Account"`);
            process.exit();
        }
    } else if (!options.delete) {
        console.log(`Please use proper operation flag, for more information use\n $ sfdx-bulkapi -h`);
        process.exit();
    }
    if (options.delete || (options.soql && options.operation === 'query' && !options.objectName)) {
        removeSubQuery(options.soql);
        const soql = tempQuery.split(' ');
        soql.forEach((c, i) => {
            if (c.toUpperCase() === 'FROM') {
                options.objectName = soql[i + 1];
            }
        });
    }
    if (options.lineEnding) {
        options.lineEnding = options.lineEnding.toUpperCase();
        if (options.lineEnding !== 'LF' && options.lineEnding !== 'CRLF') {
            console.log(`${options.lineEnding} is not a valid value for CSV file line ending. The only possible options are: \n\t1. CRLF\n\t2. LF`);
            process.exit();
        }
    }
}
let tempQuery = '';
function removeSubQuery(query) {
    let subQuery = query.substring(
        query.indexOf("("),
        query.indexOf(")") + 1
    );
    query = query.replace(subQuery, "");
    if (query.indexOf('(') > -1 || query.indexOf(')') > -1) {
        removeSubQuery(query);
    } else {
        tempQuery = query;
        return query;
    }
}
validateOptions();
export { options };