## Description
This repository contains a sample node.js script to import content in the Nuxeo Platform using a CSV file.

## Important Note

**These features are not part of the Nuxeo Production platform.**

These solutions are provided for inspiration and we encourage customers to use them as code samples and learning resources.

This is a moving project (no API maintenance, no deprecation process, etc.) If any of these solutions are found to be useful for the Nuxeo Platform in general, they will be integrated directly into platform, not maintained here.

## How to build
Building requires the following software:
- git
- node
- npm

```
git clone https://github.com/nuxeo-sandbox/nuxeo-csv-node-importer
cd nuxeo-csv-node-importer
```


## Run

```
node index.js
```

### Parameters

*--username*, the user account to use for the import
*--password*, the password for the user account to use for the import
*--serverUrl*, the target server URL
*--filePath*, the CSV file path
*--concurrency*, the number of concurrent threads
*--skipFileUpload*, create the document without uploading the binary files


## Examples

Run the importer without uploading the binaries
```
node index.js --filePath=input.csv"
```

## Known limitations
This plugin is a work in progress.

## About Nuxeo
Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
