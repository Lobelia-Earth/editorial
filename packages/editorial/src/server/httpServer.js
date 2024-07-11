/* eslint-disable no-await-in-loop */

const path = require('path');
const shell = require('shelljs');
const fs = require('fs-extra');
const { clone, set: timmSet, omit, setIn } = require('timm');
const { mainStory, chalk } = require('storyboard');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
const yaml = require('js-yaml');
const fileUpload = require('express-fileupload');
const initMady = require('mady-server').default;
const socketio = require('socket.io');
const crypto = require('crypto');
const validateColor = require('validate-color').default;
const { runScript, loadComponentHelp } = require('./helpers');
const { onUserActivity } = require('./userActivity');

const LARGE_FILE_THRESHOLD = 1e6;
const TIMER_HEARTBEATS = 6 * 3600e3; // [ms]
const SRC = 'editorial';

const EXTRA_FIELDS_SCHEMA = {
  _draft: {
    type: 'boolean',
  },
  _noTranslation: {
    type: 'boolean',
  },
  id: {
    type: 'string',
    isRequired: false,
  },
  rank: {
    type: 'number',
    isRequired: false,
  },
};

// =======================================
// State
// =======================================
let _dataProd = null;
let _dataPreview = null;
let _dataPreviewTime = 0;
let _translationsProd = null;
let _translationsPreview = null;
let _translationsPreviewTime = 0;
let _schema = null;
let _schemaTime = 0;
let _madyDb = null;
let _cmsApiHandler;
let _httpServer;
// Paths
let _dataPath;
let _dataProdPath;
let _translationsProdPath;
let _schemaPath;
let _configPath;
let _filesPath;

// server data
let app;
let _port;

// =======================================
// Main
// =======================================
const init = async ({
  port,
  server,
  uploads,
  largeFiles,
  cmsHelpers,
  otherLocaleDirs,
  version,
  noServer,
}) => {
  const cwd = process.cwd();
  const webName = cwd.split(path.sep).pop();
  const baseDataPath = path.join(cwd, 'data');
  _dataPath = path.join(baseDataPath, 'data.json');
  _dataProdPath = path.join(baseDataPath, 'dataProd.json');
  _translationsProdPath = path.join(baseDataPath, 'translationsProd.json');
  _schemaPath = path.join(baseDataPath, 'schema.yaml');
  _configPath = path.join(baseDataPath, 'config.yaml');
  _filesPath = path.join(cwd, uploads);
  fs.ensureDir(_filesPath);

  _port = port;

  mainStory.info(SRC, `Web name: ${chalk.yellow(webName)}`);
  mainStory.info(SRC, `Data folder: ${chalk.yellow(baseDataPath)}`);
  mainStory.info(SRC, `Uploads folder: ${chalk.yellow(_filesPath)}`);

  // Create Express app, add middlewares
  if (!noServer) {
    app = express();
    _httpServer = http.createServer(app);
    app.use(compression());
    app.use(cookieParser());
    app.use(cors({ origin: '*' }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(fileUpload({ safeFileNames: true, preserveExtension: 50 }));

    // Serve editor public static assets and preview
    app.use('/editorial', express.static(path.join(__dirname, '../public')));
    app.use('/editorial/_file', express.static(_filesPath));
  }

  // Load custom modules: user-provided server, large-file handler, CMS API handler
  let userServer;
  if (!noServer && server) {
    userServer = require(path.join(process.cwd(), server)); // eslint-disable-line
    userServer.init({ expressApp: app });
  }
  let largeFileHandler;
  if (!noServer && largeFiles) {
    try {
      const modulePath = path.join(process.cwd(), largeFiles);
      largeFileHandler = require(modulePath); // eslint-disable-line
      mainStory.info(SRC, `Large files module: ${chalk.yellow(modulePath)}`);
    } catch (err) {
      mainStory.error(SRC, `Error in large files module: ${err.message}`);
      mainStory.warn(SRC, `Large files module: NONE`);
    }
  }
  if (cmsHelpers) {
    try {
      const modulePath = path.join(process.cwd(), cmsHelpers);
      _cmsApiHandler = require(modulePath); // eslint-disable-line
      mainStory.info(SRC, `CMS helpers module: ${chalk.yellow(modulePath)}`);
    } catch (err) {
      mainStory.error(SRC, `Error in CMS helpers module: ${err.message}`);
      mainStory.warn(SRC, `CMS helpers module: NONE`);
    }
  }

  // Add socket.io
  let socketNamespace;
  if (!noServer && process.env.NODE_ENV !== 'test') {
    const curSockets = {};
    const socketServer = socketio(_httpServer);
    socketNamespace = socketServer.of('/editorial');
    socketNamespace.on('connection', (socket) => {
      mainStory.debug(SRC, 'Socket connected');
      onUserActivity();
      socket.on('MY_USERNAME', ({ user }) => {
        curSockets[socket.id] = user;
        reportOnUsers();
      });
      socket.on('disconnect', () => {
        mainStory.debug(SRC, 'Socket disconnected');
        delete curSockets[socket.id];
        reportOnUsers();
      });
    });
    const reportOnUsers = () => {
      const users = {};
      Object.keys(curSockets).forEach((socketId) => {
        users[curSockets[socketId]] = true;
      });
      socketNamespace.emit('CURRENT_USERS', { users: Object.keys(users) });
    };
  }

  // Bind Mady to our HTTP server
  if (!noServer && process.env.NODE_ENV !== 'test') {
    _madyDb = await initMady({
      expressApp: app,
      otherLocaleDirs,
      onChange: () => {
        onUserActivity();
        runScript('onLocaleChange');
      },
      noWatch: true,
      noAutoTranslateNewKeys: true,
    });
  }

  // Make sure PROD files exist
  if (!fs.existsSync(_dataProdPath)) saveDataProd();
  if (!fs.existsSync(_translationsProdPath)) saveTranslationsProd();

  // =======================================
  // Endpoints
  // =======================================
  // Bail out if there is no server!
  if (noServer) return _httpServer;

  // ---------------------------------------
  // Basic data
  // ---------------------------------------
  // Get basic data: webName, config, version
  app.get('/editorial/_basicData', async (req, res) => {
    onUserActivity();
    const config = await loadConfig();
    res.json({ result: 'ok', webName, config, version });
  });

  // ---------------------------------------
  // Data & schema APIs
  // ---------------------------------------
  // Get schema, data, config… -- always on the preview data
  // and *always loading from file*
  app.get('/editorial/_allData', async (req, res) => {
    onUserActivity();
    mainStory.info(SRC, 'Getting data...');
    const data = getData(); // always load most recent from file
    const schema = getSchema();
    res.json({ result: 'ok', data, schema });
  });

  app.get('/editorial/_data', async (req, res) => {
    const { preview } = req.query;
    mainStory.debug(SRC, `REQ: ${req.url}`);
    const data = preview != null ? getDataPreview() : getDataProd();
    res.json(data);
  });

  app.get('/editorial/_data/:itemType', async (req, res) => {
    mainStory.debug(SRC, `REQ: ${req.url}`);
    const { itemType } = req.params;
    const { preview, lang, filter } = req.query;
    const { data, translations } = getDataAndTranslations(preview);
    // Clone itemsForType, since we're going to modify it in place
    let itemsForType = clone(data[itemType] || {});
    if (filter) {
      if (_cmsApiHandler) {
        itemsForType = _cmsApiHandler.filterItemsForType(itemsForType, filter);
      } else mainStory.warn(SRC, 'No filter helper in place');
    }
    if (lang) {
      if (_cmsApiHandler) {
        const schema = getSchema();
        Object.keys(itemsForType).forEach((id) => {
          let item = itemsForType[id];
          item = _cmsApiHandler.translate(
            item,
            itemType,
            schema,
            lang,
            translations
          );
          itemsForType[id] = item;
        });
      } else mainStory.warn(SRC, 'No translation helper in place');
    }
    res.json(itemsForType);
  });

  app.get('/editorial/_data/:itemType/ids', async (req, res) => {
    mainStory.debug(SRC, `REQ: ${req.url}`);
    const { itemType } = req.params;
    const { preview, filter } = req.query;
    const data = preview != null ? getDataPreview() : getDataProd();
    let itemsForType = data[itemType] || {};
    if (filter) {
      if (_cmsApiHandler) {
        itemsForType = _cmsApiHandler.filterItemsForType(itemsForType, filter);
      } else mainStory.warn(SRC, 'No filter helper in place');
    }
    const ids = Object.keys(itemsForType);
    res.json(ids);
  });

  app.get('/editorial/_data/:itemType/:id', async (req, res) => {
    mainStory.debug(SRC, `REQ: ${req.url}`);
    const { itemType, id } = req.params;
    const { preview, lang } = req.query;
    const { data, translations } = getDataAndTranslations(preview);
    const itemsForType = data[itemType] || {};
    let item = itemsForType[id] || null;
    if (item != null && lang) {
      if (_cmsApiHandler) {
        const schema = getSchema();
        item = _cmsApiHandler.translate(
          item,
          itemType,
          schema,
          lang,
          translations
        );
      } else mainStory.warn(SRC, 'No translation helper in place');
    }
    res.json(item);
  });

  app.get('/editorial/_localeCode/:lang', async (req, res) => {
    mainStory.debug(SRC, `REQ: ${req.url}`);
    const { lang } = req.params;
    const { preview } = req.query;
    let localeCode = null;
    if (_cmsApiHandler) {
      const translations =
        preview != null ? getTranslationsPreview() : getTranslationsProd();
      localeCode = _cmsApiHandler.getTranslations(lang, translations) || '';
    } else mainStory.warn(SRC, 'No translation helper in place');
    res.json(localeCode);
  });

  // Update an item of a certain type
  app.post('/editorial/_updateItem', (req, res) => {
    try {
      onUserActivity();
      let data = getData();
      const { itemType, id: originalId, attrs, socketId } = req.body;
      mainStory.info(SRC, `Updating item ${itemType}-${originalId}...`);
      let pathMapChanged = false;
      if (attrs) {
        if (!attrs.id) {
          attrs.id = crypto.randomBytes(16).toString('hex');
        }
        const isValid = validateObjectOverSchema(attrs, itemType);
        if (!isValid.valid) {
          res.status(400).json({ result: isValid.message });
          return;
        }
        const { id } = attrs;
        if (id !== originalId) {
          data = timmSet(
            data,
            itemType,
            omit(data[itemType] || {}, [originalId])
          );
          pathMapChanged = true;
        }
        data = setIn(data, [itemType, id], attrs);
      } else {
        data = timmSet(
          data,
          itemType,
          omit(data[itemType] || {}, [originalId])
        );
        pathMapChanged = true;
      }
      fs.writeFileSync(_dataPath, JSON.stringify(data, null, 2));
      if (pathMapChanged) userServer?.refreshPathMap?.();
      res.json({ result: 'ok' });
      socketNamespace.emit('REFRESH_DATA', { socketId });
      runScript('onDataChange', { res });
      _madyDb?.parseSrcFiles();
    } catch (err) {
      mainStory.error(SRC, 'Error updating item', { attach: err });
      res.json({ result: 'nok', error: err.message });
    }
  });

  // ---------------------------------------
  // Author action: build
  // ---------------------------------------
  // Save current data.json as reference
  // - Prepare build
  // - Build (e.g. next build)
  // - Deploy (e.g. firebase deploy)
  app.post('/editorial/_buildAndDeploy', async (req, res) => {
    onUserActivity();

    // Take a snapshot of data and translations
    saveDataProd();
    saveTranslationsProd();

    // Run the build
    const { user } = req.body;
    mainStory.info(SRC, 'Building (prepareBuild)...');
    if ((await runScript('prepareBuild', { res, user })) < 0) return null;
    mainStory.info(SRC, 'Building (build)...');
    if ((await runScript('build', { res, user })) < 0) return null;
    mainStory.info(SRC, `[${chalk.cyan(user)}] Deploying...`);
    await runScript('deploy', { res, user, respondIfSuccess: true });
  });

  // ---------------------------------------
  // Developer actions
  // ---------------------------------------
  // Pull from repo (e.g. git pull)
  app.post('/editorial/_pullFromRepo', async (req, res) => {
    onUserActivity();
    const { user } = req.body;
    mainStory.info(SRC, `[${chalk.cyan(user)}] Pulling from repo...`);
    await runScript('pull', { res, user, respondIfSuccess: true });
    socketNamespace.emit('REFRESH_DATA');
    socketNamespace.emit('REFRESH_FILES');
  });

  // Push to repo (e.g. git commit & git push)
  app.post('/editorial/_pushToRepo', (req, res) => {
    onUserActivity();
    const { user } = req.body;
    mainStory.info(SRC, `[${chalk.cyan(user)}] Pushing to repo...`);
    runScript('push', { res, user, respondIfSuccess: true });
  });

  // Restart -- just shutdown (PM2 will re-spawn)
  app.post('/editorial/_restart', (req, res) => {
    const { user } = req.body;
    mainStory.info(SRC, `[${chalk.cyan(user)}] Restarting...`);
    res.json({ result: 'ok' });
    process.exit(0);
  });

  // ---------------------------------------
  // Files
  // ---------------------------------------
  // Get a list of files
  let largeFileList = null;
  app.get('/editorial/_fileList', async (req, res) => {
    onUserActivity();
    mainStory.info(SRC, 'Getting the list of files...');
    const result = shell.ls('-R', _filesPath);
    let files = result
      .slice()
      // .filter((name) => {
      //   console.log(`${_filesPath}/${name}`);
      //   return shell.test('-f', `${_filesPath}/${name}`);
      // })
      .filter((name) => name[0] !== '.' && name !== 'index.html')
      .map((name) => ({
        name,
        url: null,
        type: shell.test('-f', `${_filesPath}/${name}`)
          ? 'file'
          : shell.test('-d', `${_filesPath}/${name}`)
          ? 'dir'
          : 'other',
      }));
    if (largeFileList == null && largeFileHandler) {
      largeFileList = await largeFileHandler.list({ webName });
    }
    if (largeFileList)
      files = files.concat(
        largeFileList.map((el) => ({ ...el, type: 'file' }))
      );
    res.json({ result: 'ok', files });
  });

  // Upload a file
  app.post('/editorial/_fileUpload', async (req, res) => {
    onUserActivity();
    largeFileList = null;
    try {
      const basePath = req.body.basePath;
      const uploadedFiles = req.files;
      if (!uploadedFiles) throw new Error('No uploaded files');
      const uploadedFilePaths = {};
      const fileIds = Object.keys(uploadedFiles);
      for (let i = 0; i < fileIds.length; i++) {
        const id = fileIds[i];
        const file = uploadedFiles[id];
        const dstPath = `${_filesPath}/${basePath}${file.name}`;
        let uploadedFilePath = `${basePath}${file.name}`;
        mainStory.info(SRC, `Uploading file ${chalk.yellow(dstPath)}...`);
        await uploadedFiles[id].mv(dstPath);
        if (file.data.length > LARGE_FILE_THRESHOLD) {
          if (largeFileHandler) {
            await largeFileHandler.upload({
              webName: `${webName}/${basePath}`,
              filePath: dstPath,
            });
            fs.removeSync(dstPath);
            uploadedFilePath = `https://files.lobelia.earth/${webName}/${basePath}${file.name}`;
          } else {
            fs.removeSync(dstPath);
            throw new Error('Large file uploaded and no large file handler');
          }
        }
        uploadedFilePaths[file.name] = uploadedFilePath;
        mainStory.info(SRC, `Uploaded file, length: ${file.data.length}`);
      }
      res.json({ result: 'ok', files: uploadedFilePaths });
      socketNamespace.emit('REFRESH_FILES');
      runScript('onFileChange', { res });
    } catch (err) {
      mainStory.error(SRC, 'Error uploading file', { attach: err });
      res.json({ result: 'nok', error: err.message });
    }
  });

  // Create a directory
  app.post('/editorial/_directoryCreate', async (req, res) => {
    onUserActivity();
    largeFileList = null;
    try {
      const basePath = req.body.basePath;
      const name = req.body.name;
      if (!name) throw new Error('Empty directory name');
      if (name.match(/[^a-z0-9_-]/)) throw new Error('Invalid directory name');

      if (shell.test('-e', `${_filesPath}/${basePath}${name}`)) {
        throw new Error('Directory exists');
      }

      shell.mkdir(`${_filesPath}/${basePath}${name}`);
      const error = shell.error();
      if (error) {
        throw new Error(''); // Not appending command stderr, as it potentially gives clues about server itnernals
      }

      res.json({ result: 'ok' });
      socketNamespace.emit('REFRESH_FILES');
      runScript('onFileChange', { res });
    } catch (err) {
      mainStory.error(SRC, 'Error creating dir', { attach: err });
      res.json({ result: 'nok', error: err.message });
    }
  });

  // Delete a directory
  app.post('/editorial/_directoryDelete', async (req, res) => {
    onUserActivity();
    largeFileList = null;
    const { name } = req.body;
    try {
      if (!name) throw new Error('Empty directory name');
      if (name.match(/\./)) throw new Error('Invalid directory name');

      const files = await fs.readdir(`${_filesPath}/${name}`);
      if (files.length > 0) throw new Error('Directory is not empty');

      shell.rm('-r', `${_filesPath}/${name}`);
      const error = shell.error();
      if (error) {
        throw new Error(''); // Not appending command stderr, as it potentially gives clues about server itnernals
      }

      res.json({ result: 'ok' });
      socketNamespace.emit('REFRESH_FILES');
      runScript('onFileChange', { res });
    } catch (err) {
      mainStory.error(SRC, 'Error deleting dir', { attach: err });
      res.json({ result: 'nok', error: err.message });
    }
  });

  // Delete a file
  app.post('/editorial/_fileDelete', async (req, res) => {
    onUserActivity();
    largeFileList = null;
    try {
      const { name, url } = req.body;
      mainStory.info(SRC, `Deleting file ${chalk.yellow(name)}...`);
      let result;
      if (url && largeFileHandler) {
        await largeFileHandler.delete({ webName, fileName: name });
        result = 0;
      } else {
        result = name ? shell.rm('-f', `${_filesPath}/${name}`).code : -1;
      }
      res.json({ result: result === 0 ? 'ok' : 'nok' });
      socketNamespace.emit('REFRESH_FILES');
      runScript('onFileChange', { res });
    } catch (err) {
      mainStory.error(SRC, 'Error deleting file', { attach: err });
      res.json({ result: 'nok', error: err.message });
    }
  });

  // =======================================
  // Serve the Editorial application itself
  // =======================================
  // Always return the main index.html, so react-router renders the route in the client
  app.get('/editorial/*', (req, res) => {
    onUserActivity();
    res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
  });

  return _httpServer;
};

const start = () => {
  // =======================================
  // Listen!
  // =======================================
  // Start heartbeats
  setInterval(sendHeartbeat, TIMER_HEARTBEATS);
  sendHeartbeat();

  // Start listening!
  _httpServer.listen(_port, () =>
    mainStory.info(
      SRC,
      `Editorial is available at http://<host>:${chalk.cyan(_port)}/editorial`
    )
  );
};

const stop = async () => {
  await _httpServer.close();
};

// =======================================
// Helpers
// =======================================
const loadConfig = async () => {
  let config;
  try {
    config = yaml.safeLoad(fs.readFileSync(_configPath));
    config.componentHelp = await loadComponentHelp(config.componentHelp);
  } catch (err) {
    mainStory.error(SRC, 'Error serving data', { attach: err });
    mainStory.warn(SRC, 'No valid config.yaml file found. Using defaults...');
    config = {};
  }
  return config;
};

const getSchema = () => {
  const now = new Date().getTime();
  const age = now - _schemaTime;
  if (!_schema || age > 5e3) {
    _schema = yaml.safeLoad(fs.readFileSync(_schemaPath));
    _schemaTime = now;
  }
  return _schema;
};

const getData = () => JSON.parse(fs.readFileSync(_dataPath));

// Copy current data to dataProd (except drafts)
const saveDataProd = () => {
  const data = getData();
  const dataProd = getDataProd();
  Object.keys(data).forEach((itemType) => {
    const itemsForType = data[itemType];
    Object.keys(itemsForType).forEach((id) => {
      if (itemsForType[id]._draft) {
        if (dataProd[itemType] && dataProd[itemType][id]) {
          itemsForType[id] = dataProd[itemType][id];
        } else {
          delete itemsForType[id];
        }
      }
    });
  });
  fs.writeFileSync(_dataProdPath, JSON.stringify(data, null, 2));
  _dataProd = data;
};

const getDataProd = () => {
  if (!_dataProd) {
    if (fs.existsSync(_dataProdPath)) {
      _dataProd = JSON.parse(fs.readFileSync(_dataProdPath));
    } else {
      _dataProd = {};
    }
  }
  return _dataProd;
};
const getDataPreview = () => {
  const now = new Date().getTime();
  const age = now - _dataPreviewTime;
  if (!_dataPreview || age > 5e3) {
    _dataPreview = getData();
    _dataPreviewTime = now;
  }
  return _dataPreview;
};

const saveTranslationsProd = () => {
  const translations = getTranslations(getDataProd());
  fs.writeFileSync(
    _translationsProdPath,
    JSON.stringify(translations, null, 2)
  );
  _translationsProd = translations;
};
const getTranslationsProd = () => {
  if (!_translationsProd)
    _translationsProd = JSON.parse(fs.readFileSync(_translationsProdPath));
  return _translationsProd;
};
const getTranslationsPreview = () => {
  const now = new Date().getTime();
  const age = now - _translationsPreviewTime;
  if (!_translationsPreview || age > 5e3) {
    _translationsPreview = getTranslations(getDataPreview());
    _translationsPreviewTime = now;
  }
  return _translationsPreview;
};
const getTranslations = (data) =>
  _cmsApiHandler && _cmsApiHandler.getAllTranslations
    ? _cmsApiHandler.getAllTranslations(data)
    : {};

const getDataAndTranslations = (preview) => {
  const isPreview = preview != null;
  const data = isPreview ? getDataPreview() : getDataProd();
  const translations = isPreview
    ? getTranslationsPreview()
    : getTranslationsProd();
  return { data, translations };
};

const validateObjectOverSchema = (object, itemType) => {
  let schema = getSchema();
  schema = schema[itemType];
  schema.fields = {
    ...schema.fields,
    ...EXTRA_FIELDS_SCHEMA,
  };
  if (!schema) {
    return {
      valid: false,
      message: `Item type ${itemType} unknowm in schema`,
    };
  }

  const expectedFields = Object.keys(schema.fields);

  const actualFields = Object.keys(object);
  for (let i = 0; i < actualFields.length; ++i) {
    const field = actualFields[i];
    const idx = expectedFields.indexOf(field);
    if (idx === -1) {
      const msg = `Unknown field "${field}" for items "${itemType}"`;
      mainStory.warn(SRC, msg);
      continue;
    }
    expectedFields.splice(idx, 1);

    const fieldValid = validateFieldOverSchema(
      object[field],
      schema.fields[field]
    );
    if (!fieldValid.valid) {
      mainStory.error(SRC, fieldValid.message);
      return fieldValid;
    }
  }

  for (let i = 0; i < expectedFields.length; ++i) {
    const fieldName = expectedFields[i];
    const field = schema.fields[fieldName];
    if (field.isRequired && !object[fieldName]) {
      const msg = `Field "${fieldName}" missing while it's mandatory`;
      mainStory.error(SRC, msg);
      return {
        valid: false,
        message: msg,
      };
    }
  }
  return { valid: true, message: '' };
};

const validateFieldOverSchema = (item, spec) => {
  if (!item) return { valid: true, message: '' };
  switch (spec.type) {
    case 'string':
    case 'markdown':
      return checkItemType(item, spec.displayName, 'string');
    case 'number':
      return checkItemType(item, spec.displayName, 'number');
    case 'select':
      if (!spec.choicesFixed.includes(item)) {
        return {
          valid: false,
          message: `Value "${item}" invalid for field "${spec.displayName}"`,
        };
      }
      break;
    case 'boolean':
      return checkItemType(item, spec.displayName, 'boolean');
    case 'color':
      if (!validateColor(item)) {
        return {
          valid: false,
          message: `Value "${item}" is not a valid color string`,
        };
      }
      break;
    default:
      return { valid: true, message: '' };
  }
  return { valid: true, message: '' };
};

const checkItemType = (item, name, expected) => {
  const itemType = typeof item;
  if (itemType !== expected) {
    return {
      valid: false,
      message: `Expected "${expected}" for field "${name}" but got "${itemType}"`,
    };
  }
  return {
    valid: true,
    message: '',
  };
};

// =======================================
// More helpers
// =======================================
const sendHeartbeat = () => {
  mainStory.info(
    SRC,
    `Running heartbeat hook every ${TIMER_HEARTBEATS / 3600e3} h`
  );
  runScript('onHeartbeat');
};

// =======================================
// Public
// =======================================
module.exports = { init, start, stop, saveDataProd, saveTranslationsProd };
