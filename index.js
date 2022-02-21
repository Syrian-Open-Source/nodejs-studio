import arg from 'arg';
import fs from 'fs';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        '--path': String,
        '--type': String,
        '--name': String,
        '--help': String,
        '-p': '--path',
        '-t': '--type',
        '-n': '--name',
        '-h': '--help',
    }, {
        argv: rawArgs.slice(2),
    });
    return {
        path: args['--path'] || 'null',
        type: args['--type'] || 'post',
        name: args['--name'] || 'test',
        help: args['--help'] || 'null',
    };
}
export async function createPackageFolders(options) {
    if (!fs.existsSync(`./app`)) {
        fs.mkdirSync(`./app`, { recursive: true });
    }
    fs.mkdirSync(`./app/${options.name}`);
    //create controller folder
    fs.mkdirSync(`./app/${options.name}/controllers`);
    //create entities folder
    fs.mkdirSync(`./app/${options.name}/entities`);
    //create models folder
    fs.mkdirSync(`./app/${options.name}/models`);
    //create repositories folder
    fs.mkdirSync(`./app/${options.name}/repositories`);
    //create services folder
    fs.mkdirSync(`./app/${options.name}/services`);
    //create usecases folder
    fs.mkdirSync(`./app/${options.name}/usecases`);
    //create validation folder
    fs.mkdirSync(`./app/${options.name}/validation`);
    //create index.js file
    const indexContent = `
    const Model = require('sequelize').Model ;
    const DataTypes = require('sequelize').DataTypes ;
    const Op = require('sequelize').Op ;
    
    module.exports = (app, Router, db) => {
    
        const bundleRouter = Router();
        app.apiRouter.use('/', bundleRouter);
    
        // ================== load entities ==================
        require('./entities/index')(db, Model, DataTypes);
        // =================== } ==================
    
        // ================== load repositories ==================
        require('./repositories/index')(db, Op);
        // ================== } ==================
    
        // ================== load services ==================
        require('./services/index')(app, db, require('axios'));
        // ================== } ==================
    
        // ================== link controllers ==================
        require('./controllers/index')(app, db, Router, bundleRouter);
        // ================== } ==================
    
        console.log('${options.name} Bundle Was Linked Successfully.');
    }`;
    fs.writeFileSync(`./app/${options.name}/index.js`, indexContent);
}

async function createController(options) {
    console.log('creating controller....');
    if (options.path == 'null') {
        if (!fs.existsSync(`./app/${options.name}`)) {
            console.log('please select a path type help for help info');
            return;
        }
        options.path = options.name;
    }
    const controllerContent = `module.exports = (router, db, services) => {
        const Test = require('../usecases/${options.name}')(db);
        router.get('/test', async(req, res) => {
            const result = await Test(req.user);
            return res.status(result.statusCode).json(result.toResult());
        });
     } `;
    fs.writeFileSync(`./app/${options.path}/controllers/${options.name}Controller.js`, controllerContent);
    if (!fs.existsSync(`./app/${options.path}/controllers/index.js`)) {
        //create index.js for controllers
        const controllersIndexContent = `
    module.exports = (app, db, Router, bundleRouter) => {

        const ${options.name}Router = Router();
    
        // secure the transport router < only logged in users can use this routes >
        ${options.name}Router.use(app.services.SecurityService.secure());
    
    
        bundleRouter.use('/${options.name}', ${options.name}Router);
    
        require('./${options.name}Controller')(${options.name}Router, db, app.services, app.helpers);
    
    }
    `;
        fs.writeFileSync(`./app/${options.path}/controllers/index.js`, controllersIndexContent);
    } else {
        let append = `
        const ${options.name}Router = Router();
    // secure the ${options.name} router < only logged in users can use this routes >
    ${options.name}Router.use(app.services.SecurityService.secure());
    bundleRouter.use('/${options.name}', chatRouter);
    require('./${options.name}Controller')(${options.name}Router, db, app.services, app.helpers);
        `
        let indexFile = await appendToFile(`./app/${options.path}/controllers/index.js`, append, `}`, -1);
        if (indexFile)
            fs.writeFileSync(`./app/${options.path}/controllers/index.js`, indexFile);
    }
    console.log('Controller Created Successfuly....');
}

async function createEntities(options) {
    console.log('creating entity....');
    if (options.path == 'null') {
        if (!fs.existsSync(`./app/${options.name}`)) {
            console.log('please select a path type help for help info');
            return;
        }
        options.path = options.name;
    }
    const entiteContent = `
    
const schema = (sequelize, Model, DataTypes) => {

    class ${options.name} extends Model {
     

    };

    ${options.name}.init({
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},

    }, {
        sequelize,
        modelName: '${options.name}',
        hooks: {
        },
        scopes: {
            all: {}
        },
        defaultScope: {
           
        },
    });

    return ${options.name};
}

module.exports = {
    schema: schema,
}
    `;
    fs.writeFileSync(`./app/${options.path}/entities/${options.name}.js`, entiteContent);
    if (!fs.existsSync(`./app/${options.path}/entities/index.js`)) {
        //create index.js 
        const entiteIndexContent = `
 module.exports = (db, Model, DataTypes) => {
     db.entities.${options.name} = require('./${options.name}').schema(db, Model, DataTypes);
 }
  `;
        fs.writeFileSync(`./app/${options.path}/entities/index.js`, entiteIndexContent);
    } else {
        let append = `
        db.entities.${options.name} = require('./${options.name}').schema(db, Model, DataTypes)
        `
        let indexFile = await appendToFile(`./app/${options.path}/entities/index.js`, append, `}`, -1);
        if (indexFile)
            fs.writeFileSync(`./app/${options.path}/entities/index.js`, indexFile);
    }
    console.log('Entity created successfully....');
}

function createModels(options) {
    const modelResultContent = ` 
class Result {

    constructor(code = 0,  message = 'OK', data = null, errors = null) {
        this.code = code ;
        this.data = data ;
        this.message = message ;
        this.errors = errors ;
    }
}

module.exports = Result ;
        `;
    fs.writeFileSync(`./app/${options.name}/models/Result.js`, modelResultContent);

    const modelUseCaseContent = ` 
    const Result = require('./Result') ;
class UseCaseResult extends Result{

    constructor(statusCode = 200, code = 0, message = 'OK', data = null, errors = null) {
        super(code , message , data, errors) ;
        this.statusCode = statusCode ;
    }

    toResult() {
        return new Result(this.code, this.message, this.data, this.errors);
    }
}

module.exports = UseCaseResult ;
                `;
    fs.writeFileSync(`./app/${options.name}/models/UseCaseResult.js`, modelUseCaseContent);
}

async function createRepositories(options) {
    console.log('creating repository....');
    if (options.path == 'null') {
        if (!fs.existsSync(`./app/${options.name}`)) {
            console.log('please select a path type help for help info');
            return;
        }
        options.path = options.name;
    }
    const repositoryContent = `
    module.exports = (db, Op) => {

        const ${options.name} = db.entities.${options.name};
    
        /**
         * @param 
         * @returns {Promise<${options.name}|Context>}
         */
        async function create${options.name}() {
            const record = ${options.name}.build({
               
            });
            await record.save();
            return record;
        }
        /**
         * @param 
         * @returns {Promise<${options.name}|Context>}
         */
        async function get${options.name}s() {
            return ${options.name}.findAll({
            });
        }
        return {
            create${options.name},
            get${options.name}s,
        }
    }
    `;
    fs.writeFileSync(`./app/${options.path}/repositories/${options.name}Repository.js`, repositoryContent);
    if (!fs.existsSync(`./app/${options.path}/repositories/index.js`)) {
        //create index.js for repositories
        const repositoryIndexContent = `
 module.exports = (db) => {
     db.repositories.${options.name} = require('./${options.name}Repository')(db);
 }
 `;
        fs.writeFileSync(`./app/${options.path}/repositories/index.js`, repositoryIndexContent);
    } else {
        let append = `
        db.repositories.${options.name}Repository = require('./${options.name}Repository')(db, Op);
        `
        let indexFile = await appendToFile(`./app/${options.path}/repositories/index.js`, append, `}`, -1);
        if (indexFile)
            fs.writeFileSync(`./app/${options.path}/repositories/index.js`, indexFile);
    }
    console.log('Repository created successfully....');

}

async function createServices(options) {
    console.log('creating service....');
    if (options.path == 'null') {
        if (!fs.existsSync(`./app/${options.name}`)) {
            console.log('please select a path type help for help info');
            return;
        }
        options.path = options.name;
    }

    const serviceContent = `
    
    module.exports = (db) => {

        /**
         * 
         * @param 
         * @returns {Promise<*|null>}
         */
        async function testFunction(data) {
           
        }
    
        return {
            testFunction
        }
    }
        `;
    fs.writeFileSync(`./app/${options.path}/services/${options.name}Service.js`, serviceContent);

    //create index.js for Services
    const serviceIndexContent = `
 module.exports = (app, db) => { 
}
 `;
    if (!fs.existsSync(`./app/${options.path}/services/index.js`)) {
        fs.writeFileSync(`./app/${options.path}/services/index.js`, serviceIndexContent);
    } else {
        let append = `
        app.services.${options.name}Service = require('./${options.name}Service')(db);
        `
        let indexFile = await appendToFile(`./app/${options.path}/services/index.js`, append, `}`, -1);
        if (indexFile)
            fs.writeFileSync(`./app/${options.path}/services/index.js`, indexFile);
    }
    console.log('Service created successfully....');

}

function createUsecase(options) {
    console.log('creating usecase....');
    if (options.path == 'null') {
        if (!fs.existsSync(`./app/${options.name}`)) {
            console.log('please select a path type help for help info');
            return;
        }
        options.path = options.name;
    }
    const usecaseContent = `
    const UseCaseResult = require('../models/UseCaseResult');
    module.exports = (db) => {
        const ${options.path}Repository = db.repositories.${options.path}Repository;
    
        /**
         * 
         * @param 
         * @returns {Promise<UseCaseResult>}
         */
        return async (user) => {
           
            return new UseCaseResult(200, 0, 'Blog API WORKED', {  }, null);
        }
    
    }
    `;
    fs.writeFileSync(`./app/${options.path}/usecases/${options.name}.js`, usecaseContent);
    console.log('Usecase created successfully....');
}
async function appendToFile(path, dataToAppend, search, increase = 0, file = null) {
    let data = file;
    if (file == null) {
        data = fs.readFileSync(path);
        data = data.toString();
    }

    //split to an array
    let body = data.toString().split(/\r?\n/);

    //remove empty spaces
    body = body.map(line => { return line.replace(/\s\s/g, ''); })
    let line = body.indexOf(search);
    const isExist = body.indexOf(dataToAppend);
    if (line > -1 && isExist == -1) {
        body.splice(line + increase, 0, dataToAppend);
        let output = body.join('\n');
        return output;
    } else {
        return null;
    }
}

async function linkPackageToApp(options) {
    let append = ` require('./${options.name}/index')(app, Router, db);`
    let appFile = await appendToFile('./app/app.js', append, `app.use('/api', app.apiRouter);`, -1);
    if (appFile)
        fs.writeFileSync('./app/app.js', appFile);

}
async function createPackage(options) {
    console.log('Creating Package ' + options.name);
    //create package folders
    await createPackageFolders(options);
    //create controller content
    createController(options);
    //create entities content
    createEntities(options);
    //create models content
    createModels(options);
    //create repositories content
    createRepositories(options);
    //create services content
    createServices(options);
    //create services content
    createUsecase(options);
    //add new package to app.js folder
    //linkPackageToApp(options);
    console.log('Package ' + options.name + ' Created Successfully.');
}

function helpInfo() {
    let helpInfo = `
    ////////////////// WELCOME TO HELP CENTER //////////////////////
    *****************  CRAETE PACKAGE         *****************
    run: create --type package --name <packageName> 
                        OR
    run: create -t package -n <packageName> 
                        OR        
    run: create -t p -n <packageName> 
    ***********************************************************
    *****************  CRAETE CONTROLLER      *****************
    run: create --type controller --name <controllerName>  --path <path>
                        OR
    run: create -t controller -n <controllerName> -p <path>
                        OR        
    run: create -t c -n <controllerName>  -p <path>
    ***********************************************************
    *****************  CRAETE Entities      *******************
    run: create --type entity --name <entityName>  --path <path>
                        OR
    run: create -t entity -n <entityName> -p <path>
                        OR        
    run: create -t e -n <entityName>  -p <path>
    ***********************************************************
    *****************  CRAETE Repositories      ***************
    run: create --type reporsitory --name <reporsitoryName>  --path <path>
                        OR
    run: create -t reporsitory -n <reporsitoryName> -p <path>
                        OR
    run: create -t repo -n <reporsitoryName> -p <path>
                        OR        
    run: create -t r -n <reporsitoryName>  -p <path>
    ***********************************************************
    *****************  CRAETE Usecase      ***************
    run: create --type usecase --name <usecaseName>  --path <path>
                        OR
    run: create -t usecase -n <usecaseName> -p <path>
                        OR        
    run: create -t u -n <usecaseName>  -p <path>
    ***********************************************************
    ///////////////////////////////////////////////////////////////
    `;
    console.log(helpInfo);
}


async function create(args) {
    let options = parseArgumentsIntoOptions(args);
    if (options.help != 'null') {
        helpInfo();
        return;
    }
    switch (options.type) {
        case 'package':
        case 'p':
            createPackage(options);
            break;

        case 'controller':
        case 'c':
            createController(options);
            break;

        case 'entity':
        case 'e':
            createEntities(options);
            break;
        case 'reporsitory':
        case 'repo':
        case 'r':
            createRepositories(options);
            break;
        case 'usecase':
        case 'u':
            createUsecase(options);
            break;
        case 'service':
        case 's':
            createServices(options);
            break;
        case 'help':
        case 'h':
            helpInfo();
            break;

        default:
            console.log('Invalid type...type help for help info');
            break;
    }
}