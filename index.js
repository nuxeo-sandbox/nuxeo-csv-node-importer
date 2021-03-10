const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const Nuxeo = require('nuxeo');
const {default: PQueue} = require('p-queue');
const commandLineArgs = require('command-line-args');

function prettyPrintObject(object) {
    return JSON.stringify(object, null, 2);
}

const optionDefinitions = [
    {
        name: 'username',
        type: String,
        defaultValue: "Administrator"
    },
    {
        name: 'password',
        type: String,
        defaultValue: "Administrator"
    },
    {
        name: 'serverUrl',
        type: String,
        defaultValue: "http://localhost:8080/nuxeo"
    },
    {
        name: 'filePath',
        type: String,
        defaultValue: "input.csv"
    },
    {
        name: 'concurrency',
        type: Number,
        defaultValue: 1
    },
    {
        name: 'skipFileUpload',
        type: Boolean
    }
];

const options = commandLineArgs(optionDefinitions);

prettyPrintObject("Parameters: ", options);

const queue = new PQueue({concurrency: options.concurrency});

const nxClient = new Nuxeo({
    baseURL: options.serverUrl,
    auth: {
        method: 'basic',
        username: options.username,
        password: options.password
    }
});

let total = 0;
let imported = 0;

function prettyPrintObject(msg, object) {
    return console.log(msg + JSON.stringify(object, null, 2));
}

fs.createReadStream(path.resolve(__dirname, options.filePath))
    .pipe(csv.parse({headers: true}))
    .on('error', error => console.error(error))
    .on('data', row => {
        queue.add(() => importRow(row));
    })
    .on('end', (rowCount) => {
        total = rowCount;
        console.log(`Parsed ${rowCount} rows`);
    });


function importRow(row) {

    let parentPath;

    const document = {
        'entity-type': 'document',
        properties: {}
    };

    let update = false;

    const promises = [];

    for (const property in row) {
        if (["name", "type"].indexOf(property) >= 0) {
            document[property] = row[property];
        } else if (property === "path") {
            parentPath = row[property];
        } else if ("file:content" === property && row[property] && row[property].length > 0) {
            if (!options.skipFileUpload) {
              const stream = fs.createReadStream(row[property]);
              let blob = new Nuxeo.Blob({
                content: stream,
                name: path.basename(row[property]),
                size: fs.statSync(row[property]).size
              });
                promises.push(nxClient.batchUpload().upload(blob));
            }
        } else {
          if (row[property] && row[property].length > 0) {
            try {
              document.properties[property] = JSON.parse(row[property]);
            } catch(error) {
                //console.log(error);
            }
          }
        }
    }

    //get document if it already exist
    let readPromise = new Promise(function (resolve, reject) {
        nxClient.repository('default').fetch(parentPath + '/' + document.name)
            .then(result => {
                resolve(result);
            }).catch(error => {
            resolve({});
        });
    });

    promises.push(readPromise);

    return Promise.all(promises).then(results => {
        results.forEach(result => {
            if (result.blob) {
                document.properties['file:content'] = {
                    'upload-batch': result.blob['upload-batch'],
                    'upload-fileId': result.blob['upload-fileId']
                }
            } else if (result['entity-type'] === "document") {
                document.path = result.path;
                document.uid = result.uid;
                update = true;
            } else if (result['entity-type'] === "documents") {
                result.entries.forEach(entry => {
                    let property = relations[entry.path];
                    if (!document.properties[property]) {
                        document.properties[property]=[];
                    }
                    document.properties[property].push(entry.uid);
                })
            }
        });
        if (!update) {
            return nxClient.repository('default').create(parentPath, document);
        } else {
            return nxClient.repository('default').update(document);
        }
    }).then(data => {
        console.log(`${update ? "Updated ":"Imported "} ${++imported}/${total}: ${data.path}`);
    });

}
