## Salesforce Bulk API 2.0 
This is a small utility to get the data from Salesforce and also used to perform DML operations using Bulk API 2.0

### Install
```
npm install -g sfdx-bulkapi
```
### Usage
```
sfdx-bulkapi -q "SELECT Id, LastName, CustomField__c FROM Contact"
OR
sfdx-bulkapi -q "SELECT * FROM Contact"
```

### Options
```
  -V, --version              output the version number
  -p, --production           production
  -u, --user-name <value>    salesforce instance user name or alias, if already defined, the Salesforce instance
  -o, --operation <type>     Dml operation, required if operation is other than query, like:
                                        Insert, Update, Delete, Upsert, HardDelete
  -q, --soql <type>          SOQL Query, required if operation is query.
  -so, --object-name <type>  API Name of sObject, required if operation is other than query.
  -l, --line-ending <type>   Line Ending of CSV file default is CRLF. Can be changed to LF only. (default: "CRLF")
  -f, --file <type>          file path like "data/contact.csv", required if operation is update, insert, delete, upsert and
                             harddelete
  -k, --sort-key <type>      Filed API name or column name to sort the data for batch processing
  -d, --display-all-fields   Get SOQL with all fields to be displayed in console. Only available if --soql is defined.
  -v, --api-version <type>   API version of Salesforce. (default: "55.0")
  -h, --help                 display help for command
```

### Examples
```
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
```