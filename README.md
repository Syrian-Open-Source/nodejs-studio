[![https://nodei.co/npm/nodejs-studio.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/nodejs-studio.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/nodejs-studio)

Add more files to your project by one instruction
# nodejs-studio
## Dependency
The first step is using npm to install the package and automatically update your package.json file, you can do this by running:
 ```
npm install nodejs-studio
 ```
 * Creat bin folder in root directoty
 
![Screenshot](images/1.PNG)
 
 * Inside bin folder create create-classes file 
 
![Screenshot](images/2.PNG)
 
 * Copy this to create-classes :
 ```
#!/usr/bin/env node

require = require("esm")(module /*, options*/ );
require("nodejs-studio").create(process.argv);
 ```
 * add this to package.json
  ```
   "bin": {
        "create": "bin/create-classes"
    },
    "keyword": [
        "create"
    ]
 ```
 
 ## Features
 * Create a package folder easily and quickly which contains :
   - Controllers
   - UseCases
   - Entities
   - Repositories 
 * Possibility to create a custom file type
  
 
 ## Usage
 * To creat package folder type this in cmd:
 ```
create --type package --name <your-package-name>
 ```
 or
 ```
 create -t package -n <packageName>
 ```
 
Then you can see that the package has been created:
 
 ![Screenshot](images/3.PNG)
 
* To creat controller type this in cmd:
 ```
create --type controller --name <controllerName>  --path <path>
 ```
 or
 ```
create -t c -n <controllerName>  -p <path>
 ```
* To see all commands type this in cmd:
 ```
create --type help
 ```
 ## Security
 If you discover any security related issues, please email them first to "your email", if we do not fix it within a short period of time please open a new issue describing your problem.
 ## Credits
 - https://www.linkedin.com/in/-mohammed-taha
